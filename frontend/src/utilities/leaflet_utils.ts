import * as L from 'leaflet';
import { latLng_to_world, world_to_latLng } from '@/utilities/coordinates';
import type { WorldCoordinate, Zone } from '@/types/zone_types';
import type { RegionID } from '@/types/common';
import { Polygon } from 'leaflet';
import { type HexCoordinate, HexGeometry } from '@/utilities/hexagons';
import { zoneUtils } from '@/utilities/zone_utils';

/**
 * Configures and adds a custom tile layer to a Leaflet map.
 * @param {L.Map} map - The Leaflet map instance to which the custom tile layer will be added.
 * @param zoneCode - Lowercase zone name to use for tile layer URL.
 * @return {void}
 */
export function configureMapTileLayer(map: L.Map, zoneCode: string): void {
  // Create custom tile layer
  const customTileLayer = L.tileLayer(
    `https://wt.honu.pw/img/zones/${zoneCode}/zoom{z}/${zoneCode}_{z}_{x}_{y}.jpg`,
    {
      minZoom: 1,
      maxZoom: 32,
      minNativeZoom: 1,
      maxNativeZoom: 5,
      noWrap: true,
      attribution: 'Map images copyright Daybreak Games',
      bounds: L.latLngBounds(L.latLng(-128, -128), L.latLng(128, 128)),
    }
  );

  // Add to map
  customTileLayer.addTo(map);
}

export function drawRegion(
  zone: Zone,
  regionId: RegionID,
  leafletMap: L.Map,
  options?: L.PolylineOptions
): Polygon | undefined {
  const geometry = new HexGeometry(zone.hex_size);
  const hexCoordinates = zoneUtils.extractRegionHexCoords(zone, regionId);
  try {
    const vertices = geometry.getBoundaryVertices(hexCoordinates);
    const hexagonLatLngPoints = vertices.map((coord) => world_to_latLng(coord));
    return L.polygon(hexagonLatLngPoints, {
      color: 'white',
      fillColor: 'purple',
      fillOpacity: 0.3,
      weight: 2,
      ...options,
    }).addTo(leafletMap);
  } catch (e) {
    console.log(e, {
      zoneID: zone.zone_id,
      regionID: regionId,
      hexCoordinates: hexCoordinates,
    });
    return undefined;
  }
}

declare module 'leaflet' {
  interface Map {
    cursor: Handler;
  }
}

export function initMouseCoordinatesPopup(map: L.Map) {
  // Add cursor coordinates in a popup that follows the mouse for debugging
  const CursorHandler = L.Handler.extend({
    initialize: function (map: L.Map) {
      this._map = map;
      this._popup = null;
    },

    addHooks: function () {
      this._popup = new L.Popup({ autoPan: false });
      this._map.on('mouseover', this._open, this);
      this._map.on('mousemove', this._update, this);
      this._map.on('mouseout', this._close, this);
    },

    removeHooks: function () {
      this._map.off('mouseover', this._open, this);
      this._map.off('mousemove', this._update, this);
      this._map.off('mouseout', this._close, this);
      this._popup = null;
    },

    _open: function (e: L.LeafletMouseEvent) {
      this._update(e);
      this._popup.openOn(this._map);
    },

    _close: function () {
      if (this._popup) {
        this._map.closePopup(this._popup);
      }
    },

    _update: function (e: L.LeafletMouseEvent) {
      if (!this._popup) return;
      const coords = latLng_to_world(e.latlng);
      this._popup
        .setLatLng(e.latlng)
        .setContent(`[x,z]=[${coords.x.toFixed(0)}, ${coords.z.toFixed(0)}]`);
    },
  });

  // Create and enable the handler instance directly
  // @ts-ignore
  const handler = new CursorHandler(map);
  handler.enable();
}

function drawHexagonAtCoords(
  map: L.Map,
  coordinate: HexCoordinate,
  innerDiameter: number,
  options?: L.PolylineOptions
) {
  const geometry = new HexGeometry(innerDiameter);
  const hexVertices: WorldCoordinate[] = geometry.hexVertices(coordinate);

  // Convert to LatLng and create polygon
  const hexagonLatLngPoints = hexVertices.map((coord) =>
    world_to_latLng(coord)
  );

  return L.polygon(hexagonLatLngPoints, {
    color: 'green',
    fillColor: 'lightgreen',
    fillOpacity: 0.3,
    weight: 2,
    ...options,
  }).addTo(map);
}

/**
 * Draws a grid of hexagons at specified hexagonal coordinates using correct PS2 hex coordinate conversion
 * @param map - The Leaflet map to draw on
 * @param hexCoordinates - Array of hexagonal coordinates to draw
 * @param innerDiameter - Inner diameter of each hexagon
 * @param options - Optional styling options for the hexagons
 */
export function drawHexagonsAtCoords(
  map: L.Map,
  hexCoordinates: HexCoordinate[],
  innerDiameter: number,
  options?: L.PolylineOptions
): L.Polygon[] {
  const hexagons: L.Polygon[] = [];
  const geometry = new HexGeometry(innerDiameter);

  for (const hexCoord of hexCoordinates) {
    // Create a hexagon at this position
    const hexagon = drawHexagonAtCoords(map, hexCoord, innerDiameter, {
      color: 'blue',
      fillColor: 'lightblue',
      fillOpacity: 0.3,
      weight: 1,
      ...options,
    });

    // Optional: Add coordinate labels
    const centerLatLng = world_to_latLng(geometry.hexCoordsToWorld(hexCoord));
    L.marker(centerLatLng, {
      icon: L.divIcon({
        html: `${hexCoord.x},${hexCoord.y}`,
        className: 'hex-label',
        iconSize: [30, 20],
        iconAnchor: [15, 10],
      }),
    }).addTo(map);

    hexagons.push(hexagon);
  }

  return hexagons;
}

/**
 * Places markers on a map for each region in the provided zone object.
 * Each marker is positioned based on the region's coordinates and includes an informational popup.
 */
export function placeRegionMarkers(zone: Zone, map: L.Map) {
  for (const region of Object.values(zone['regions'])) {
    if (
      region['location_x'] === undefined ||
      region['location_z'] === undefined
    )
      continue;
    const locationX = region['location_x'];
    const locationZ = region['location_z'];
    const position = world_to_latLng({ x: locationX, z: locationZ });
    L.marker(position)
      .addTo(map)
      .bindPopup(
        `Region ${region['facility_name']} regionID:${region.map_region_id} @ ${locationX}, ${locationZ}`
      );
  }
}

/**
 * Draws a lattice structure by connecting facilities within a given zone using polylines.
 *
 * @param {Zone} zone - The zone object containing facility and link information.
 * @param leafletMap Map to add the lattice to
 * @param options Override the polyline options for the lattice lines
 * @return {void} This function does not return a value, but it draws polylines on the map.
 */
export function drawLattice(
  zone: Zone,
  leafletMap: L.Map,
  options?: L.PolylineOptions
): void {
  let facility_coords = zoneUtils.extractFacilityCoordinates(zone);
  for (const link of zone.links.values()) {
    let loc_a = facility_coords[link.facility_id_a];
    let loc_b = facility_coords[link.facility_id_b];
    const translatedCoordsA = world_to_latLng(loc_a);
    const translatedCoordsB = world_to_latLng(loc_b);
    L.polyline([translatedCoordsA, translatedCoordsB], {
      color: 'yellow',
      ...options,
    }).addTo(leafletMap);
  }
}

export enum RegionPane {
  INACTIVE = 'inactiveRegions',
  BASE = 'baseRegions',
  CONTESTED = 'contestedRegions',
  PRIORITY = 'priorityRegions',
  FRONTLINE = 'frontlineRegions',
}

export enum LatticePane {
  BASE = 'latticeBase',
  FRONTLINE = 'latticeFrontline',
}

export function createCustomPanes(map: L.Map) {
  // Create panes with specific z-index values
  map.createPane(RegionPane.INACTIVE).style.zIndex = '410'; // Just above overlayPane
  map.createPane(RegionPane.BASE).style.zIndex = '415'; // Above inactive but de-emphasized
  map.createPane(RegionPane.CONTESTED).style.zIndex = '420'; // Above base regions
  map.createPane(RegionPane.FRONTLINE).style.zIndex = '425'; // Between contested and priority
  map.createPane(RegionPane.PRIORITY).style.zIndex = '430'; // Highest priority
  // Keep lattice above regions
  map.createPane(LatticePane.BASE).style.zIndex = '500';
  map.createPane(LatticePane.FRONTLINE).style.zIndex = '550';
}
