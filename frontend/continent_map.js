/**
 * Converts game world coordinates (x, z) to latitude and longitude coordinates.
 *
 * Note that PS2 uses Y-axis up 3D coordinates, so discard y for 2D map purposes.
 *
 * @param {number} x - The X coordinate in the game world.
 * @param {number} z - The Z coordinate in the game world.
 * @returns {L.LatLng} A Leaflet LatLng object representing the corresponding latitude and longitude.
 */
const game_to_latLng = function (x, z) {
    const rotationAngle = 90 * Math.PI / 180;
    let newX = x * Math.cos(rotationAngle) - z * Math.sin(rotationAngle);
    let newY = x * Math.sin(rotationAngle) + z * Math.cos(rotationAngle) - 256;
    return L.latLng(newY, newX);
}

/**
 * Converts latitude and longitude coordinates to game world coordinates.
 *
 * Note that PS2 uses Y-axis up 3D coordinates, so this returns (x, z) instead of (x, y)
 *
 * @function
 * @param {L.LatLng} latLng - An object representing the latitude and longitude coordinates.
 * @param {number} latLng.lat - The latitude of the geographic location.
 * @param {number} latLng.lng - The longitude of the geographic location.
 * @returns {number[]} An array representing the transformed coordinates in PS2 (x, z) coordinates.
 */
const latLng_to_game = function (latLng) {
    const rotationAngle = -90 * Math.PI / 180;
    return [latLng.lng * Math.cos(rotationAngle) - latLng.lat * Math.sin(rotationAngle) + 256, latLng.lng * Math.sin(rotationAngle) + latLng.lat * Math.cos(rotationAngle)];
}

// Add cursor coordinates in a popup that follows the mouse for debugging
L.CursorHandler = L.Handler.extend({

    addHooks: function () {
        this._popup = new L.Popup();
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
            .setContent(`[${coords[0].toFixed(0)}, ${coords[1].toFixed(0)}]`);
    }


});

L.Map.addInitHook('addHandler', 'cursor', L.CursorHandler);


// Map creation
const map = L.map('map_div', {
    crs: L.CRS.Simple, center: [0, 0], cursor: true,
}).setView([0, 0], 0);

// Create custom tile layer
const customTileLayer = L.tileLayer('', {
    zoomSnap: 1,
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
    const tileY = -coords.y * 4;

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
const west_wg = game_to_latLng(-2276.637, 2486.449)
const east_wg = game_to_latLng(-2435.838, -2764.692)
const north_wg = game_to_latLng(2750.148, -95.01959)
L.marker(west_wg).addTo(map).bindPopup("West Gate [-2276.637, 2486.449]")
L.marker(east_wg).addTo(map).bindPopup("East Gate [-2435.838, -2764.692]")
L.marker(north_wg).addTo(map).bindPopup("North Gate [2750.148, -95.01959]")