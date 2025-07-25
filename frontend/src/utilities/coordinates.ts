import { WorldCoordinate } from '@/types/zone_types.js';
import * as L from 'leaflet';

// This scale factor is just how the math works out to get leaflet to request
// the correct tiles from Honu. There's nothing deeper to it then that.
const SCALE = 32;

/**
 * Converts game world coordinates to latitude and longitude coordinates.
 *
 * Note that PS2 uses Y-axis up 3D coordinates, so discard y for 2D map purposes.
 *
 * @param {WorldCoordinate} coords - The coordinates in the game world.
 * @returns {L.LatLng} A Leaflet LatLng object representing the corresponding latitude and longitude.
 */
export const world_to_latLng = function (coords: WorldCoordinate): L.LatLng {
  const rotationAngle = (90 * Math.PI) / 180;
  let newX =
    coords.x * Math.cos(rotationAngle) + coords.z * Math.sin(rotationAngle);
  let newY =
    coords.x * Math.sin(rotationAngle) - coords.z * Math.cos(rotationAngle);
  return L.latLng(newY / SCALE, newX / SCALE);
};

/**
 * Converts latitude and longitude coordinates to world coordinates.
 */
export const latLng_to_world = function (latLng: L.LatLng): WorldCoordinate {
  const rotationAngle = (-90 * Math.PI) / 180;
  return {
    x:
      latLng.lng * Math.cos(rotationAngle) -
      latLng.lat * Math.sin(rotationAngle) * SCALE,
    z: -(
      latLng.lng * Math.sin(rotationAngle) +
      latLng.lat * Math.cos(rotationAngle) * SCALE
    ),
  };
};
