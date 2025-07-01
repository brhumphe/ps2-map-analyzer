import * as L from 'leaflet';
import {GameCoordinates, Zone} from "./types/zone_types.js";
import {ZoneService} from "./services/zone_service.js";
import {Continent} from "./types/common.js";

/**
 * Converts game world coordinates to latitude and longitude coordinates.
 *
 * Note that PS2 uses Y-axis up 3D coordinates, so discard y for 2D map purposes.
 *
 * @param {GameCoordinates} coords - The coordinates in the game world.
 * @returns {L.LatLng} A Leaflet LatLng object representing the corresponding latitude and longitude.
 */
const game_to_latLng = function (coords: GameCoordinates): L.LatLng {
    const rotationAngle = 90 * Math.PI / 180;
    let newX = coords.x * Math.cos(rotationAngle) + coords.z * Math.sin(rotationAngle);
    let newY = coords.x * Math.sin(rotationAngle) - coords.z * Math.cos(rotationAngle);
    return L.latLng(newY, newX);
}

/**
 * Converts latitude and longitude coordinates to game world coordinates.
 *
 * Note that PS2 uses Y-axis up 3D coordinates, so this returns GameCoordinates object
 */
const latLng_to_game = function (latLng: L.LatLng): GameCoordinates {
    const rotationAngle = -90 * Math.PI / 180;
    return {
        x: latLng.lng * Math.cos(rotationAngle) - latLng.lat * Math.sin(rotationAngle),
        z: latLng.lng * Math.sin(rotationAngle) + latLng.lat * Math.cos(rotationAngle)
    };
}

function initMouseCoordinatesPopup() {
// Add cursor coordinates in a popup that follows the mouse for debugging
    const CursorHandler = L.Handler.extend({

        addHooks: function () {
            this._popup = new L.Popup({autoPan: false});
            this._map.on('mouseover', this._open, this);
            this._map.on('mousemove', this._update, this);
            this._map.on('mouseout', this._close, this);
        },

        removeHooks: function () {
            this._map.off('mouseover', this._open, this);
            this._map.off('mousemove', this._update, this);
            this._map.off('mouseout', this._close, this);
        },

        _open: function (e) {
            this._update(e);
            this._popup.openOn(this._map);
        },

        _close: function () {
            this._map.closePopup(this._popup);
        },

        _update: function (e) {
            const coords = latLng_to_game(e.latlng);
            this._popup.setLatLng(e.latlng)
                .setContent(`[${coords.x.toFixed(0)}, ${coords.z.toFixed(0)}]`);
        }
    });

    L.Map.addInitHook('addHandler', 'cursor', (L as any).CursorHandler);
}


/**
 * Configures and adds a custom tile layer to a Leaflet map.
 * @param {L.Map} map - The Leaflet map instance to which the custom tile layer will be added.
 * @return {void}
 */
function configureMapTileLayer(map: L.Map): void {
// Create custom tile layer
    const customTileLayer = L.tileLayer('', {
        minZoom: -50,
        maxZoom: 2,
        tileSize: 256,
        minNativeZoom: 0,
        maxNativeZoom: 0,
        noWrap: true,
        attribution: 'Indar Map',
        bounds: [[-4096, -4096], [4096, 4096]],
    });

// Override the tile URL creation
    customTileLayer.getTileUrl = function (coords) {
        const z = coords.z;
        // Transform Leaflet coordinates to tile names
        // Leaflet gives 0,1,2,3... but need 0,4,8,12... (increment by 4)
        const tileX = coords.x * 4;
        // -4 to offset which row is being requested to match the names.
        const tileY = -coords.y * 4 - 4;

        // Format as 3-digit zero-padded strings
        let xStr = Math.abs(tileX).toString().padStart(3, '0');
        let yStr = Math.abs(tileY).toString().padStart(3, '0');

        // Negative coordinates are padded less to account for the inclusion of the negative sign.
        if (tileX < 0) xStr = '-' + Math.abs(tileX).toString().padStart(2, '0');
        if (tileY < 0) yStr = '-' + Math.abs(tileY).toString().padStart(2, '0');

        return `tiles/indar/Indar_Tile_${xStr}_${yStr}_LOD${z}.png`;
    };

// Add to map
    customTileLayer.addTo(map);
}


/**
 * Places markers on a map for each region in the provided zone object.
 * Each marker is positioned based on the region's coordinates and includes an informational popup.
 */
function placeRegionMarkers(zone: Zone, map: L.Map) {
    for (const region of Object.values(zone["regions"])) {
        if (region["location_x"] === undefined || region["location_z"] === undefined) continue;
        const locationX = region["location_x"];
        const locationZ = region["location_z"];
        const position = game_to_latLng({x: locationX, z: locationZ})
        L.marker(position).addTo(map).bindPopup(
            `Region ${region["facility_name"]} @ ${locationX}, ${locationZ}`
        )
    }
}

/**
 * Extracts the facility coordinates from a given zone object.
 * Iterates through the regions of the zone and retrieves the coordinates for each facility.
 */
function extractFacilityCoordinates(zone: Zone):Record<number, GameCoordinates>
 {
    const facility_coords = {};
    for (const obj of zone["regions"]) {
        if (obj["location_x"] !== undefined && obj["location_z"] !== undefined) {
            facility_coords[obj["facility_id"]] = {x: obj["location_x"], z:obj["location_z"]};
        }
    }
    return facility_coords;
}

/**
 * Draws a lattice structure by connecting facilities within a given zone using polylines.
 *
 * @param {Zone} zone - The zone object containing facility and link information.
 *                        `zone.links` should be an array of objects, where each object represents a connection
 *                        between two facilities. Each object must have `facility_id_a` and `facility_id_b` properties.
 * @return {void} This function does not return a value, but it draws polylines on the map.
 */
function drawLattice(zone: Zone): void {
    let facility_coords = extractFacilityCoordinates(zone);
    for (const link of zone["links"]) {
        let loc_a = facility_coords[link["facility_id_a"]]
        let loc_b = facility_coords[link["facility_id_b"]]
        const translatedCoordsA = game_to_latLng(loc_a);
        const translatedCoordsB = game_to_latLng(loc_b);
        L.polyline([translatedCoordsA, translatedCoordsB], {color: 'red'}).addTo(map);
    }
}


initMouseCoordinatesPopup();

// Map creation
const map = L.map('map_div', {
    crs: L.CRS.Simple, center: [0, 0],
}).setView([0, 0], 0);

configureMapTileLayer(map);

// Fetch map data
const zoneService = new ZoneService();
const zone = await zoneService.fetchZone(Continent.INDAR);
placeRegionMarkers(zone, map);
drawLattice(zone);
