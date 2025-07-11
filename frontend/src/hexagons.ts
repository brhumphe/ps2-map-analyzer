import {WorldCoordinate} from "./types/zone_types";

type VertexCoordinate = WorldCoordinate

/**
 * Represents an edge between two vertices of a hexagon.
 * An edge is defined by two vertex coordinates that form a line segment.
 */
export interface HexEdge {
  readonly start: VertexCoordinate;
  readonly end: VertexCoordinate;
}

/**
 * Converts a VertexCoordinate to a canonical string representation.
 * Values are rounded to 2 decimal places for consistent formatting.
 * 
 * @param vertex - The vertex coordinate to convert
 * @returns A string in the format "(x,z)" with values rounded to 2 decimal places
 */
export function vertexToString(vertex: VertexCoordinate): string {
  const roundedX = vertex.x.toFixed(2);
  const roundedZ = vertex.z.toFixed(2);
  return `(${roundedX},${roundedZ})`;
}

/**
 * Creates a canonical string representation of an edge.
 * Ensures consistent ordering for bidirectional edges by placing the lexicographically smaller vertex first.
 * 
 * @param edge - The edge to convert to string
 * @returns A string representation in the format "vertex1-vertex2"
 */
export function edgeToString(edge: HexEdge): string {
  const startString = vertexToString(edge.start);
  const endString = vertexToString(edge.end);
  
  // Ensure consistent ordering by placing the lexicographically smaller vertex first
  if (startString <= endString) {
    return `${startString}-${endString}`;
  } else {
    return `${endString}-${startString}`;
  }
}

const HexDirection = {
  E: [1, 0],
  NE: [0, 1],
  NW: [-1, 1],
  W: [-1, 0],
  SW: [0, -1],
  SE: [1, -1]
} as const;

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
export interface HexCoordinate {
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
export interface CubeCoordinate {
  readonly q: number;
  readonly r: number;
  readonly s: number;
}

function hexInDirection(coord: HexCoordinate, dir: keyof typeof HexDirection): HexCoordinate {
  const [dx, dy] = HexDirection[dir];
  return {
    x: coord.x + dx,
    y: coord.y + dy
  };
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
export function hexToCubeCoords(coord: HexCoordinate): CubeCoordinate {
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
export function cubeToHexCoords(cord: CubeCoordinate): HexCoordinate {
  return {x: -cord.s, y: -cord.r};
}

/**
 * Given x and y hex coordinates, return the center of the hex in world coordinates.
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
 * @returns WorldCoordinate locating the center of the hex.
 */
export function hexCoordsToWorld(coords: HexCoordinate, innerDiameter: number): WorldCoordinate {
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

export class HexGeometry {
  private readonly innerDiameter: number;
  private readonly radius: number;

  constructor(innerDiameter: number) {
    this.innerDiameter = innerDiameter;
    this.radius = this.innerDiameter / Math.sqrt(3.0);
  }

  hexCoordsToWorld(coords: HexCoordinate): WorldCoordinate {
    return hexCoordsToWorld(coords, this.innerDiameter);
  }

  private readonly rotationAngle: number = Math.PI / 3;

  hexVertices(coords: HexCoordinate): VertexCoordinate[] {
    const hexVertices: VertexCoordinate[] = [];
    let worldCenter = hexCoordsToWorld(coords, this.innerDiameter);
    // Generate 6 points for pointy-top hexagon
    for (let i = 0; i < 6; i++) {
      const angle = i * this.rotationAngle;
      const x = worldCenter.x + this.radius * Math.cos(angle);
        const z = worldCenter.z + this.radius * Math.sin(angle);
        hexVertices.push({x, z});
    }
    return hexVertices;
  }

  /**
   * Returns all edges for a hexagon at the given coordinates.
   * Each edge connects two adjacent vertices of the hexagon.
   * 
   * @param coords - The hexagonal coordinate to get edges for
   * @returns An array of 6 edges, each representing a side of the hexagon
   */
  hexEdges(coords: HexCoordinate): HexEdge[] {
    const vertices = this.hexVertices(coords);
    const edges: HexEdge[] = [];
    
    // Connect each vertex to the next one, with the last vertex connecting back to the first
    for (let i = 0; i < vertices.length; i++) {
      const start = vertices[i];
      const end = vertices[(i + 1) % vertices.length];
      edges.push({ start, end });
    }
    
    return edges;
  }
}
