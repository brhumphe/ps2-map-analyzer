import {GameCoordinates} from "./types/zone_types";

/**
 * Coordinates of a map hex as given by Census. It needs to be converted to a more conventional
 * cube coordinate to be used with conventional hex grid example code.
 *
 * Note that PS2 hex coordinates are axial coordinates, but the cube is oriented differently
 * from most common examples of hex coordinates as seen on RedBlobGames https://www.redblobgames.com/grids/hexagons/
 *
 * The conversion from PS2 hex units to more common cubic coordinates as seen in the RedBlobGames tutorial:
 * q=x+y
 * r=-y
 * s=-x
 * size = hex_size/sqrt(3) # hex_size from Census (inner diameter) to size used in RBG formulas (outer radius)
 *
 */
interface HexCoordinate {
    readonly x: number;
    readonly y: number;
}

/**
 * Represents a coordinate in a cube coordinate system for hexagonal grids.
 *
 * Cube coordinates are used for hexagonal grid systems. This representation
 * works with hex operation examples such as from RedBlobGames: https://www.redblobgames.com/grids/hexagons/
 *
 * Properties:
 * - `q`: The first coordinate axis.
 * - `r`: The second coordinate axis.
 * - `s`: The third coordinate axis (calculated as -q-r).
 *
 * All properties are immutable and should never be modified directly.
 */
interface CubeCoordinate {
  readonly q: number;
  readonly r: number;
  readonly s: number;
}

/**
 * Converts a hexagonal grid coordinate to a cube coordinate system.
 *
 * Note that PS2 hex coordinates are axial coordinates, but the cube is oriented differently
 * from most common examples of hex coordinates as seen on RedBlobGames https://www.redblobgames.com/grids/hexagons/
 *
 * The conversion from PS2 hex units to more common cubic coordinates as seen in the RedBlobGames tutorial:
 * q=x+y
 * r=-y
 * s=-x
 * size = hex_size/sqrt(3) # hex_size from Census (inner diameter) to size used in RBG formulas (outer radius)
 *
 * Adapted from https://github.com/voidwell/Voidwell.ClientUI/blob/master/src/src/app/planetside/shared/ps2-zone-map/ps2-zone-map.component.ts#L328
 *
 * @param {HexCoordinate} coord - The hexagonal grid coordinate with properties `x` and `y`.
 * @return {CubeCoordinate} The equivalent cube coordinate with properties `q`, `r`, and `s`.
 */
function hexToCubeCoords(coord: HexCoordinate): CubeCoordinate {
  const q = coord.x+coord.y;
  const r = -coord.y;
  const s = -coord.x;
  return {q, r, s};
}

/**
 * Converts cube coordinates to hexagonal coordinates.
 *
 * @param {CubeCoordinate} cord - The cube coordinate object with `r`, `s`, and `t` attributes.
 * @return {HexCoordinate} Returns a hexagonal coordinate object with `x` and `y` attributes.
 */
function cubeToHexCoords(cord: CubeCoordinate): HexCoordinate {
  return {x: -cord.s, y: -cord.r};
}

/**
 * Given x and y hex coordinates, return the center of the hex in game coordinates.
 * Note that PS2 hex coordinates are axial coordinates, but the cube is oriented differently
 * from most common examples of hex coordinates as seen on RedBlobGames https://www.redblobgames.com/grids/hexagons/
 *
 * The conversion from PS2 hex units to more common cubic coordinates as seen in the RedBlobGames tutorial:
 * q=x+y
 * r=-y
 * s=-x
 * size = hex_size/sqrt(3) # hex_size from Census (inner diameter) to size used in RBG formulas (outer radius)
 *
 * Adapted from https://github.com/voidwell/Voidwell.ClientUI/blob/master/src/src/app/planetside/shared/ps2-zone-map/ps2-zone-map.component.ts#L328
 * @param coords - Hex coordinate to convert.
 * @param innerDiameter - Inner diameter of the hexagon
 * @returns GameCoordinates object with x and z values locating the center of the hex.
 */
function hexCoordsToWorld(coords: HexCoordinate, innerDiameter: number): GameCoordinates {
    const hexScale = 1.0; // 1./32.
    const hexSize = hexScale * innerDiameter;
    const innerRadius = hexSize / 2;
    const outerRadius = hexSize / Math.sqrt(3);

    let x: number;
    if (coords.y % 2 === 1) {
        const t = Math.floor(coords.y / 2);
        x = outerRadius * t + 2 * outerRadius * (t + 1) + outerRadius / 2;
    } else {
        x = (3 * outerRadius * coords.y) / 2 + outerRadius;
    }

    const z = (2 * coords.x + coords.y) * innerRadius;

    return { x, z };
}



export {hexCoordsToWorld, HexCoordinate, hexToCubeCoords, cubeToHexCoords, CubeCoordinate};
