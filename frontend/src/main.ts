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
export const game_to_latLng = function (coords: GameCoordinates): L.LatLng {
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
export const latLng_to_game = function (latLng: L.LatLng): GameCoordinates {
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
 * @param leafletMap Map to add lattice to
 * @return {void} This function does not return a value, but it draws polylines on the map.
 */
function drawLattice(zone: Zone, leafletMap: L.Map): void {
    let facility_coords = extractFacilityCoordinates(zone);
    for (const link of zone["links"]) {
        let loc_a = facility_coords[link["facility_id_a"]]
        let loc_b = facility_coords[link["facility_id_b"]]
        const translatedCoordsA = game_to_latLng(loc_a);
        const translatedCoordsB = game_to_latLng(loc_b);
        L.polyline([translatedCoordsA, translatedCoordsB], {color: 'red'}).addTo(leafletMap);
    }
}

/**
 * Given q and r hex coordinates, return the center of the hex in game coordinates
 * Adapted from https://github.com/voidwell/Voidwell.ClientUI/blob/master/src/src/app/planetside/shared/ps2-zone-map/ps2-zone-map.component.ts#L328
 * @param q - Hex coordinate q
 * @param r - Hex coordinate r
 * @param innerDiameter - Inner diameter of the hexagon
 * @returns GameCoordinates object with x and z values
 */
function hexCoordsToWorld(q: number, r: number, innerDiameter: number): GameCoordinates {
    const hexScale = 1.0; // 1./32.
    const hexSize = hexScale * innerDiameter;
    const innerRadius = hexSize / 2;
    const outerRadius = hexSize / Math.sqrt(3);

    let x: number;
    if (r % 2 === 1) {
        const t = Math.floor(r / 2);
        x = outerRadius * t + 2 * outerRadius * (t + 1) + outerRadius / 2;
    } else {
        x = (3 * outerRadius * r) / 2 + outerRadius;
    }

    const z = (2 * q + r) * innerRadius;

    return { x, z };
}

function drawHexagon(map: L.Map, center: L.LatLng, radius: number, angleOffset: number, options?: L.PolylineOptions) {
    const hexagonPoints: L.LatLng[] = [];

    // Generate 6 points for the hexagon
    for (let i = 0; i < 6; i++) {
        const angle = (i * 60) * Math.PI / 180 + angleOffset; // 60 degrees between each point
        const x = center.lng + radius * Math.cos(angle);
        const y = center.lat + radius * Math.sin(angle);
        hexagonPoints.push(L.latLng(y, x));
    }

    // Create and add the hexagon to the map
    const hexagon = L.polygon(hexagonPoints, {
        color: 'blue',
        fillColor: 'lightblue',
        fillOpacity: 0.5,
        weight: 2,
        ...options
    }).addTo(map);

    return hexagon;
}

function drawHexagonFromGameCoords(map: L.Map, gameCenter: GameCoordinates, innerDiameter: number, options?: L.PolylineOptions) {
    const hexagonGamePoints: GameCoordinates[] = [];
    const radius = innerDiameter / Math.sqrt(3.0) * 2;
    // Generate 6 points for pointy-top hexagon (no rotation needed)
    for (let i = 0; i < 6; i++) {
        const angle = (i * 60) * Math.PI / 180; // No additional rotation for pointy-top
        const x = gameCenter.x + radius * Math.cos(angle);
        const z = gameCenter.z + radius * Math.sin(angle);
        hexagonGamePoints.push({x, z});
    }

    // Convert to LatLng and create polygon
    const hexagonLatLngPoints = hexagonGamePoints.map(coord => game_to_latLng(coord));

    return L.polygon(hexagonLatLngPoints, {
        color: 'green',
        fillColor: 'lightgreen',
        fillOpacity: 0.3,
        weight: 2,
        ...options
    }).addTo(map);
}

interface HexCoordinate {
    q: number; // column
    r: number; // row
}

/**
 * Draws a grid of hexagons at specified hexagonal coordinates using correct PS2 hex coordinate conversion
 * @param map - The Leaflet map to draw on
 * @param hexCoordinates - Array of hexagonal coordinates to draw
 * @param innerDiameter - Inner diameter of each hexagon
 * @param gameOffset - Optional offset to apply to all hexagon positions
 * @param options - Optional styling options for the hexagons
 */
function drawHexagonGrid(
    map: L.Map,
    hexCoordinates: HexCoordinate[],
    innerDiameter: number,
    gameOffset: GameCoordinates = { x: 0, z: 0 },
    options?: L.PolylineOptions
): L.Polygon[] {

    const hexagons: L.Polygon[] = [];
    const hexRadius = innerDiameter / 2; // For drawing the hexagon shape

    for (const hexCoord of hexCoordinates) {
        // Use the correct hex coordinate conversion
        const hexCenter = hexCoordsToWorld(hexCoord.q, hexCoord.r, innerDiameter);

        // Apply offset if provided
        const finalCenter: GameCoordinates = {
            x: hexCenter.x + gameOffset.x,
            z: hexCenter.z + gameOffset.z
        };

        // Create hexagon at this position
        const hexagon = drawHexagonFromGameCoords(map, finalCenter, hexRadius, {
            color: 'blue',
            fillColor: 'lightblue',
            fillOpacity: 0.3,
            weight: 1,
            ...options
        });

        // Optional: Add coordinate labels
        const centerLatLng = game_to_latLng(finalCenter);
        L.marker(centerLatLng, {
            icon: L.divIcon({
                html: `${hexCoord.q},${hexCoord.r}`,
                className: 'hex-label',
                iconSize: [30, 20],
                iconAnchor: [15, 10]
            })
        }).addTo(map);

        hexagons.push(hexagon);
    }

    return hexagons;
}

/**
 * Generates a 5x5 grid of hexagonal coordinates
 * @returns Array of hexagonal coordinates forming a 5x5 grid
 */
function generate5x5HexGrid(): HexCoordinate[] {
    const coordinates: HexCoordinate[] = [];

    // Generate a 5x5 grid centered around (0,0)
    for (let r = -2; r <= 2; r++) {
        for (let q = -2; q <= 2; q++) {
            coordinates.push({ q, r });
        }
    }

    return coordinates;
}

/**
 * Alternative: Generate a more compact hexagonal pattern (actual hexagon shape)
 * @returns Array of hexagonal coordinates forming a hexagonal pattern
 */
function generateHexagonalPattern(): HexCoordinate[] {
    const coordinates: HexCoordinate[] = [];
    const radius = 2;

    for (let q = -radius; q <= radius; q++) {
        const r1 = Math.max(-radius, -q - radius);
        const r2 = Math.min(radius, -q + radius);
        for (let r = r1; r <= r2; r++) {
            coordinates.push({ q, r });
        }
    }

    return coordinates;
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
drawLattice(zone, map);

// Example 3: Custom styling
drawHexagon(map, L.latLng(1000, -1000), 200, Math.PI / 2, {
    color: 'red',
    fillColor: 'yellow',
    fillOpacity: 0.7,
    weight: 3
});

// Method 1: Draw a 5x5 rectangular grid of hexagons
const gridCoordinates = generate5x5HexGrid();
const gridCenter: GameCoordinates = { x: 0, z: 0 };

drawHexagonGrid(map, gridCoordinates, 200, gridCenter, {
    color: 'green',
    fillColor: 'lightgreen',
    fillOpacity: 0.4,
    weight: 2
});

// Method 2: Draw a hexagonal pattern (more natural for hex grids)
const hexPattern = generateHexagonalPattern();
const patternCenter: GameCoordinates = { x: 2000, z: 2000 };

drawHexagonGrid(map, hexPattern, 200, patternCenter, {
    color: 'red',
    fillColor: 'pink',
    fillOpacity: 0.3,
    weight: 1
});
