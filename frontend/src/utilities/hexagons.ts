import type { WorldCoordinate } from '@/types/zone_types';

type VertexCoordinate = WorldCoordinate;

/**
 * Represents an edge between two vertices of a hexagon.
 * An edge is defined by two vertex coordinates that form a line segment.
 */
export interface HexEdge {
  readonly start: VertexCoordinate;
  readonly end: VertexCoordinate;
}

function snapToGrid(value: number, gridSize: number = 1): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Converts a VertexCoordinate to a canonical string representation.
 * Nearby vertices are merged by snapping to a grid
 *
 * @param vertex - The vertex coordinate to convert
 * @returns A string in the format "(x,z)" with values snapped to a grid
 */
export function vertexToString(vertex: VertexCoordinate): string {
  // Use grid size of 5 for snapping vertices - this was determined empirically
  // based on hexagon geometry with an inner diameter of 200 units.
  // This prevents floating-point imprecision from creating duplicate edges
  // while being small enough to maintain distinct vertices

  const gridSize = 5;
  const snappedX = snapToGrid(vertex.x, gridSize);
  const snappedZ = snapToGrid(vertex.z, gridSize);
  return `(${snappedX},${snappedZ})`;
}

/**
 * Parses a string representation of a vertex coordinate back into a VertexCoordinate object.
 * Expects input in the format "(x,z)" where x and z are decimal numbers.
 *
 * @param str - The string representation to parse, e.g. "(1.23,4.56)"
 * @returns A VertexCoordinate object with the parsed x and z values
 * @throws Error if the string format is invalid
 */
export function parseVertexString(str: string): VertexCoordinate {
  // Validate basic format using regex
  const matches = str.match(/^\((-?\d*\.?\d+),(-?\d*\.?\d+)\)$/);
  if (!matches) {
    throw new Error(
      'Invalid vertex string format. Expected "(x,z)" where x and z are numbers'
    );
  }

  const x = parseFloat(matches[1]);
  const z = parseFloat(matches[2]);

  if (isNaN(x) || isNaN(z)) {
    throw new Error('Invalid numbers in vertex string');
  }

  return { x, z };
}

/**
 * Creates a canonical string representation of an edge.
 * Ensures consistent ordering for bidirectional edges by placing the lexicographically smaller vertex first.
 *
 * @param edge - The edge to convert to string
 * @returns A string representation in the format "vertex1|vertex2"
 */
export function edgeToString(edge: HexEdge): string {
  const startString = vertexToString(edge.start);
  const endString = vertexToString(edge.end);

  // Ensure consistent ordering by placing the lexicographically smaller vertex first
  if (startString <= endString) {
    return `${startString}|${endString}`;
  } else {
    return `${endString}|${startString}`;
  }
}

/**
 * Parses a canonical string representation of an edge back into a HexEdge object.
 * Expects input in the format "vertex1|vertex2" where each vertex is in "(x,z)" format.
 *
 * @param str - The string representation to parse, e.g. "(1.23,4.56)|(7.89,0.12)"
 * @returns A HexEdge object with the parsed start and end vertices
 * @throws Error if the string format is invalid
 */
export function parseEdgeString(str: string): HexEdge {
  // Split the string on the hyphen
  const parts = str.split('|');
  if (parts.length !== 2) {
    throw new Error('Invalid edge string format. Expected "vertex1|vertex2"');
  }

  try {
    const vertex1 = parseVertexString(parts[0]);
    const vertex2 = parseVertexString(parts[1]);

    // Create the edge with vertices in the same order as they appear in the string
    // (since edgeToString already handles canonical ordering)
    return {
      start: vertex1,
      end: vertex2,
    };
  } catch (error) {
    throw new Error(
      `Invalid edge string format: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

const HexDirection = {
  E: [1, 0],
  NE: [0, 1],
  NW: [-1, 1],
  W: [-1, 0],
  SW: [0, -1],
  SE: [1, -1],
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

export function hexInDirection(
  coord: HexCoordinate,
  dir: keyof typeof HexDirection
): HexCoordinate {
  const [dx, dy] = HexDirection[dir];
  return {
    x: coord.x + dx,
    y: coord.y + dy,
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
  const q = coord.x + coord.y;
  const r = -coord.y;
  const s = -coord.x;
  return { q, r, s };
}

/**
 * Converts cube coordinates to hexagonal coordinates.
 *
 * @param {CubeCoordinate} cord - The cube coordinate object with `r`, `s`, and `t` attributes.
 * @return {HexCoordinate} Returns a hexagonal coordinate object with `x` and `y` attributes.
 */
export function cubeToHexCoords(cord: CubeCoordinate): HexCoordinate {
  return { x: -cord.s, y: -cord.r };
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
export function hexCoordsToWorld(
  coords: HexCoordinate,
  innerDiameter: number
): WorldCoordinate {
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

/**
 * Returns all non-shared (boundary) edges for a group of hexagons in canonical form.
 * A non-shared edge is one that belongs to only one hexagon in the group.
 *
 * @param hexCoords - Array of hex coordinates representing a group of hexagons
 * @param geometry - HexGeometry instance to use for edge calculations
 * @returns Array of canonical string representations of non-shared edges
 */
export function getNonSharedEdges(
  hexCoords: HexCoordinate[],
  geometry: HexGeometry
): string[] {
  // Map to store edge counts, using canonical edge string as the key
  const edgeCounts = new Map<string, number>();

  // Count occurrences of each edge
  for (const coord of hexCoords) {
    const edges = geometry.hexEdges(coord);
    for (const edge of edges) {
      const canonicalEdge = edgeToString(edge);
      edgeCounts.set(canonicalEdge, (edgeCounts.get(canonicalEdge) || 0) + 1);
    }
  }

  // Filter for edges that appear exactly once (non-shared edges)
  return Array.from(edgeCounts.entries())
    .filter(([_, count]) => count === 1)
    .map(([edge, _]) => edge);
}

/**
 * Reorders a list of canonical edge strings so that each edge connects to the next one.
 * Assumes the edges form a continuous boundary (each vertex connects to exactly two edges).
 *
 * Expects edges in canonical form where:
 * - Each edge is two canonical vertices joined by a '|'
 * - Each vertex is in the format "(x,z)" with numbers rounded to 2 decimal places
 * - In each edge, the lexicographically smaller vertex comes first
 *
 * @param edges - Array of canonical edge strings
 * @returns Array of reordered edge strings forming a connected path
 * @throws Error if edges don't form a valid continuous boundary
 */
export function orderEdges(edges: string[]): string[] {
  if (edges.length === 0) return [];
  if (edges.length === 1) return edges;

  const orderedEdges: string[] = [];
  const remainingEdges = new Set(edges);

  // Start with the first edge
  let currentEdge = edges[0];
  orderedEdges.push(currentEdge);
  remainingEdges.delete(currentEdge);

  // Get the end vertex of the first edge (after the '|')
  let nextVertex = currentEdge.split('|')[1];

  while (remainingEdges.size > 0) {
    // Find an edge that connects to our current endpoint
    const nextEdge = Array.from(remainingEdges).find((edge) => {
      const [start, end] = edge.split('|');
      return start === nextVertex || end === nextVertex;
    });

    if (!nextEdge) {
      throw new Error('Edges do not form a continuous boundary');
    }

    // Add the edge to our ordered list
    orderedEdges.push(nextEdge);
    remainingEdges.delete(nextEdge);

    // Update the next vertex we need to connect to
    const [start, end] = nextEdge.split('|');
    nextVertex = start === nextVertex ? end : start;
  }

  // FIXED: Properly verify the path forms a closed loop
  // We need to trace through the actual path to find the real final vertex
  const startVertex = orderedEdges[0].split('|')[0];
  let currentVertex = startVertex;

  // Trace through each edge to find where we actually end up
  for (const edge of orderedEdges) {
    const [start, end] = edge.split('|');

    if (start === currentVertex) {
      currentVertex = end;
    } else if (end === currentVertex) {
      currentVertex = start;
    } else {
      // This should never happen if our algorithm is correct
      throw new Error('Internal error: edges are not properly connected');
    }
  }

  // Check if we end up back at the starting vertex
  if (startVertex !== currentVertex) {
    throw new Error('Edges do not form a closed loop');
  }

  return orderedEdges;
}

/**
 * Extracts vertices in order from a list of ordered canonical edges.
 *
 * Expects edges to be:
 * - In order (each edge connects to the next one)
 * - In canonical form where each edge is two vertices joined by '|'
 * - Each vertex is in the format "(x,z)"
 *
 * @param orderedEdges - Array of canonical edge strings in connected order
 * @returns Array of vertex strings in order, without duplicates
 */
export function getOrderedVertices(orderedEdges: string[]): string[] {
  if (orderedEdges.length === 0) {
    return [];
  }

  if (orderedEdges.length === 1) {
    // For a single edge, return both vertices
    return orderedEdges[0].split('|');
  }

  const vertices: string[] = [];
  let previousVertex: string | null = null;

  for (const edge of orderedEdges) {
    const [start, end] = edge.split('|');

    if (previousVertex === null) {
      // First edge: add both vertices
      vertices.push(start, end);
    } else {
      // Add only the vertex we haven't seen yet
      vertices.push(start === previousVertex ? end : start);
    }

    previousVertex = vertices[vertices.length - 1];
  }

  // Remove the duplicate closing vertex if we have a closed loop
  if (vertices.length > 1 && vertices[0] === vertices[vertices.length - 1]) {
    vertices.pop();
  }

  return vertices;
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
      hexVertices.push({ x, z });
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

  getBoundaryVertices(hexCoords: HexCoordinate[]): WorldCoordinate[] {
    // Get non-shared edges
    const boundaryEdges = getNonSharedEdges(hexCoords, this);

    // Order the edges to form a continuous path
    const orderedEdges = orderEdges(boundaryEdges);

    // Get vertices in order
    const orderedVertexStrings = getOrderedVertices(orderedEdges);

    // Convert canonical vertex strings back to WorldCoordinate
    return orderedVertexStrings.map((vertexString) => {
      // Remove parentheses and split by comma
      const [x, z] = vertexString
        .substring(1, vertexString.length - 1)
        .split(',')
        .map(Number);
      return { x, z };
    });
  }

  getClusterCenter(hexCoords: HexCoordinate[]): WorldCoordinate {
    const boundaryVertices = hexCoords.map((location) =>
      this.hexCoordsToWorld(location)
    );
    const x =
      boundaryVertices.reduce((acc, vertex) => acc + vertex.x, 0) /
      boundaryVertices.length;
    const z =
      boundaryVertices.reduce((acc, vertex) => acc + vertex.z, 0) /
      boundaryVertices.length;
    return { x, z };
  }
}
