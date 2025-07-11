import {
  hexToCubeCoords,
  cubeToHexCoords,
  hexCoordsToWorld,
  HexCoordinate,
  CubeCoordinate,
  HexGeometry,
  HexEdge,
  vertexToString,
  edgeToString,
  getNonSharedEdges,
  parseEdgeString,
  orderEdges, getOrderedVertices
} from '../src/hexagons';
import {WorldCoordinate} from "../src/types/zone_types";

describe('hexToCubeCoords', () => {
  test('converts origin hex coordinates to cube coordinates', () => {
    const hexCoord: HexCoordinate = { x: 0, y: 0 };
    const result = hexToCubeCoords(hexCoord);
    // Use Object.is with Math.abs to handle -0 vs 0
    expect(Math.abs(result.q)).toBe(0);
    expect(Math.abs(result.r)).toBe(0);
    expect(Math.abs(result.s)).toBe(0);
  });

  test('converts positive hex coordinates to cube coordinates', () => {
    const hexCoord: HexCoordinate = { x: 5, y: -5 };
    const expected: CubeCoordinate = { q: 0, r: 5, s: -5 };
    expect(hexToCubeCoords(hexCoord)).toEqual(expected);
  });

  test('converts negative hex coordinates to cube coordinates', () => {
    const hexCoord: HexCoordinate = { x: -2, y: -3 };
    const expected: CubeCoordinate = { q: -5, r: 3, s: 2 };
    expect(hexToCubeCoords(hexCoord)).toEqual(expected);
  });

  test('converts mixed sign hex coordinates to cube coordinates', () => {
    const hexCoord: HexCoordinate = { x: -1, y: 2 };
    const expected: CubeCoordinate = { q: 1, r: -2, s: 1 };
    expect(hexToCubeCoords(hexCoord)).toEqual(expected);
  });

  test('verifies cube coordinate constraint q + r + s = 0', () => {
    const testCases: HexCoordinate[] = [
      { x: 0, y: 0 },
      { x: 5, y: 10 },
      { x: -3, y: -7 },
      { x: 2, y: -4 },
      { x: -8, y: 3 }
    ];

    testCases.forEach(hexCoord => {
      const cube = hexToCubeCoords(hexCoord);
      expect(cube.q + cube.r + cube.s).toBeCloseTo(0, 10); // Using toBeCloseTo for floating point precision
    });
  });
});

describe('cubeToHexCoords', () => {
  test('converts origin cube coordinates to hex coordinates', () => {
    const cubeCoord: CubeCoordinate = { q: 0, r: 0, s: 0 };
    const result = cubeToHexCoords(cubeCoord);
    // Use Math.abs to handle -0 vs 0
    expect(Math.abs(result.x)).toBe(0);
    expect(Math.abs(result.y)).toBe(0);
  });

  test('converts positive cube coordinates to hex coordinates', () => {
    const cubeCoord: CubeCoordinate = { q: 5, r: -2, s: -3 };
    const expected: HexCoordinate = { x: 3, y: 2 };
    expect(cubeToHexCoords(cubeCoord)).toEqual(expected);
  });

  test('converts negative cube coordinates to hex coordinates', () => {
    const cubeCoord: CubeCoordinate = { q: -5, r: 3, s: 2 };
    const expected: HexCoordinate = { x: -2, y: -3 };
    expect(cubeToHexCoords(cubeCoord)).toEqual(expected);
  });

  test('converts mixed sign cube coordinates to hex coordinates', () => {
    const cubeCoord: CubeCoordinate = { q: 1, r: -2, s: 1 };
    const expected: HexCoordinate = { x: -1, y: 2 };
    expect(cubeToHexCoords(cubeCoord)).toEqual(expected);
  });

  test('verifies round-trip conversion', () => {
    const testCases: HexCoordinate[] = [
      { x: 0, y: 0 },
      { x: 5, y: 10 },
      { x: -3, y: -7 },
      { x: 2, y: -4 },
      { x: -8, y: 3 }
    ];

    testCases.forEach(original => {
      const cube = hexToCubeCoords(original);
      const roundTrip = cubeToHexCoords(cube);
      expect(roundTrip).toEqual(original);
    });
  });
});

describe("hex <-> cube coordinates round-trip", () => {
  test("cube <-> hex roundtrip", () => {
    const hexCoord: HexCoordinate = { x: 5, y: -5 };
    const cube = hexToCubeCoords(hexCoord);
    const roundTrip = cubeToHexCoords(cube);
    expect(roundTrip).toEqual(hexCoord);
  });
})

describe('hexCoordsToWorld', () => {
  test('converts origin hex coordinates to world coordinates with default inner diameter', () => {
    const hexCoord: HexCoordinate = { x: 0, y: 0 };
    const innerDiameter = 200; // Example inner diameter
    const result = hexCoordsToWorld(hexCoord, innerDiameter);

    // Expected values calculated based on the algorithm in hexCoordsToWorld
    expect(result.x).toBeCloseTo(115.47, 2); // outerRadius = 200 / sqrt(3) ≈ 115.47
    expect(result.z).toBeCloseTo(0, 2);
  });

  test('converts hex coordinates with even y to world coordinates', () => {
    const hexCoord: HexCoordinate = { x: 2, y: 4 };
    const innerDiameter = 200;
    const result = hexCoordsToWorld(hexCoord, innerDiameter);

    // For even y (y=4), x = (3 * outerRadius * y) / 2 + outerRadius
    // outerRadius = 200 / sqrt(3) ≈ 115.47
    // x = (3 * 115.47 * 4) / 2 + 115.47 ≈ 808.29
    // z = (2 * x + y) * innerRadius = (2 * 2 + 4) * 100 = 800
    expect(result.x).toBeCloseTo(808.29, 2);
    expect(result.z).toBeCloseTo(800, 2);
  });

  test('converts hex coordinates with odd y to world coordinates', () => {
    const hexCoord: HexCoordinate = { x: 3, y: 5 };
    const innerDiameter = 200;
    const result = hexCoordsToWorld(hexCoord, innerDiameter);

    // For odd y (y=5), x = outerRadius * t + 2 * outerRadius * (t + 1) + outerRadius / 2
    // where t = floor(y / 2) = 2
    // outerRadius = 200 / sqrt(3) ≈ 115.47
    // x = 115.47 * 2 + 2 * 115.47 * (2 + 1) + 115.47 / 2 ≈ 981.50
    // z = (2 * x + y) * innerRadius = (2 * 3 + 5) * 100 = 1100
    expect(result.x).toBeCloseTo(981.50, 2);
    expect(result.z).toBeCloseTo(1100, 2);
  });

  test('converts negative hex coordinates to world coordinates', () => {
    const hexCoord: HexCoordinate = { x: -2, y: -3 };
    const innerDiameter = 200;
    const result = hexCoordsToWorld(hexCoord, innerDiameter);

    // For odd y (y=-3), x = outerRadius * t + 2 * outerRadius * (t + 1) + outerRadius / 2
    // where t = floor(-3 / 2) = -2
    // outerRadius = 200 / sqrt(3) ≈ 115.47
    // x = 115.47 * (-2) + 2 * 115.47 * (-2 + 1) + 115.47 / 2 ≈ -404.15
    // z = (2 * x + y) * innerRadius = (2 * (-2) + (-3)) * 100 = -700
    expect(result.x).toBeCloseTo(-404.15, 2);
    expect(result.z).toBeCloseTo(-700, 2);
  });

  test('scales correctly with different inner diameters', () => {
    const hexCoord: HexCoordinate = { x: 1, y: 1 };
    const smallDiameter = 100;
    const largeDiameter = 400;

    const smallResult = hexCoordsToWorld(hexCoord, smallDiameter);
    const largeResult = hexCoordsToWorld(hexCoord, largeDiameter);

    // The results should scale proportionally with the inner diameter
    expect(largeResult.x / smallResult.x).toBeCloseTo(4, 2);
    // z calculation doesn't depend on the inner diameter in the same way
    expect(largeResult.z / smallResult.z).toBeCloseTo(4, 2);
  });
});

describe('getNonSharedEdges', () => {
  const innerDiameter = 200; // Use a consistent inner diameter for all tests
  const geometry = new HexGeometry(innerDiameter);

  test('returns empty array for empty input', () => {
    const result = getNonSharedEdges([], geometry);
    expect(result).toEqual([]);
  });

  test('returns all edges for a single hexagon', () => {
    const hexCoord: HexCoordinate = { x: 0, y: 0 };
    const result = getNonSharedEdges([hexCoord], geometry);

    // A single hexagon should have 6 non-shared edges
    expect(result.length).toBe(6);

    // Verify each edge is valid by parsing it
    result.forEach(edgeStr => {
      const edge = parseEdgeString(edgeStr);
      expect(edge).toHaveProperty('start');
      expect(edge).toHaveProperty('end');
    });
  });

  test('returns correct edges for two adjacent hexagons', () => {
    // Create two adjacent hexagons
    const hex1: HexCoordinate = { x: 0, y: 0 };
    const hex2: HexCoordinate = { x: 1, y: 0 }; // East of hex1

    const result = getNonSharedEdges([hex1, hex2], geometry);

    // Two adjacent hexagons should have 10 non-shared edges (12 total - 2 shared)
    expect(result.length).toBe(10);

    // Get all edges for each hexagon
    const hex1Edges = geometry.hexEdges(hex1).map(edge => edgeToString(edge));
    const hex2Edges = geometry.hexEdges(hex2).map(edge => edgeToString(edge));

    // Verify that each returned edge belongs to exactly one of the hexagons
    result.forEach(edgeStr => {
      const inHex1 = hex1Edges.includes(edgeStr);
      const inHex2 = hex2Edges.includes(edgeStr);

      // Each edge should be in exactly one hexagon
      expect(inHex1 || inHex2).toBe(true);
      expect(inHex1 && inHex2).toBe(false);
    });
  });

  test('returns correct edges for a triangle of hexagons', () => {
    // Create a triangle of three hexagons
    const hex1: HexCoordinate = { x: 0, y: 0 };
    const hex2: HexCoordinate = { x: 1, y: 0 }; // East of hex1
    const hex3: HexCoordinate = { x: 0, y: 1 }; // Northeast of hex1

    const result = getNonSharedEdges([hex1, hex2, hex3], geometry);

    // Calculate expected number of non-shared edges:
    // 3 hexagons × 6 edges each = 18 total edges
    // 3 shared edges (one between each pair of hexagons)
    // 18 - 6 = 12 non-shared edges
    expect(result.length).toBe(12);

    // Get all edges for each hexagon
    const hex1Edges = geometry.hexEdges(hex1).map(edge => edgeToString(edge));
    const hex2Edges = geometry.hexEdges(hex2).map(edge => edgeToString(edge));
    const hex3Edges = geometry.hexEdges(hex3).map(edge => edgeToString(edge));

    // Count how many hexagons each edge belongs to
    result.forEach(edgeStr => {
      let count = 0;
      if (hex1Edges.includes(edgeStr)) count++;
      if (hex2Edges.includes(edgeStr)) count++;
      if (hex3Edges.includes(edgeStr)) count++;

      // Each non-shared edge should belong to exactly one hexagon
      expect(count).toBe(1);
    });
  });

  test('handles hexagons with non-integer coordinates', () => {
    // Create hexagons with non-integer coordinates
    const hex1: HexCoordinate = { x: 0.5, y: 0.5 };
    const hex2: HexCoordinate = { x: 1.5, y: 0.5 };

    const result = getNonSharedEdges([hex1, hex2], geometry);

    // Two adjacent hexagons should have 10 non-shared edges
    expect(result.length).toBe(10);

    // Verify each edge is valid
    result.forEach(edgeStr => {
      const edge = parseEdgeString(edgeStr);
      expect(edge).toHaveProperty('start');
      expect(edge).toHaveProperty('end');
    });
  });
});

describe('orderEdges', () => {
  test('returns empty array for empty input', () => {
    const result = orderEdges([]);
    expect(result).toEqual([]);
  });

  test('returns same edge for single edge input', () => {
    const edge = '(0.00,0.00)|(1.00,0.00)';
    const result = orderEdges([edge]);
    expect(result).toEqual([edge]);
  });

  // Helper function to validate that edges form a proper closed path
  function validateClosedPath(orderedEdges: string[]): boolean {
    if (orderedEdges.length === 0) return true;
    if (orderedEdges.length === 1) return false; // Single edge can't form closed loop

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
        return false; // Edge doesn't connect
      }
    }

    return startVertex === currentVertex;
  }

  test('orders edges to form a connected path', () => {
    // Create a square with vertices at (0,0), (1,0), (1,1), (0,1)
    const edges = [
      '(0.00,0.00)|(1.00,0.00)', // bottom edge
      '(1.00,0.00)|(1.00,1.00)', // right edge
      '(1.00,1.00)|(0.00,1.00)', // top edge
      '(0.00,1.00)|(0.00,0.00)'  // left edge
    ];

    const result = orderEdges(edges);

    // Verify we have the correct number of edges
    expect(result.length).toBe(4);

    // Verify the result forms a proper closed path
    expect(validateClosedPath(result)).toBe(true);

    // Verify all original edges are present
    expect(new Set(result)).toEqual(new Set(edges));
  });

  test('orders edges regardless of input order', () => {
    // Create a triangle with vertices at (0,0), (1,0), (0,1)
    const edges = [
      '(0.00,0.00)|(1.00,0.00)', // bottom edge
      '(1.00,0.00)|(0.00,1.00)', // diagonal edge
      '(0.00,1.00)|(0.00,0.00)'  // left edge
    ];

    // Create different permutations of the edges
    const permutation1 = [edges[0], edges[1], edges[2]];
    const permutation2 = [edges[1], edges[2], edges[0]];
    const permutation3 = [edges[2], edges[0], edges[1]];

    const result1 = orderEdges(permutation1);
    const result2 = orderEdges(permutation2);
    const result3 = orderEdges(permutation3);

    // All results should have the same number of edges
    expect(result1.length).toBe(3);
    expect(result2.length).toBe(3);
    expect(result3.length).toBe(3);

    // Verify all results form valid closed paths
    expect(validateClosedPath(result1)).toBe(true);
    expect(validateClosedPath(result2)).toBe(true);
    expect(validateClosedPath(result3)).toBe(true);

    // All should contain the same edges
    expect(new Set(result1)).toEqual(new Set(edges));
    expect(new Set(result2)).toEqual(new Set(edges));
    expect(new Set(result3)).toEqual(new Set(edges));
  });

  test('throws error for edges that do not form a continuous boundary', () => {
    // Create disconnected edges
    const edges = [
      '(0.00,0.00)|(1.00,0.00)',
      '(2.00,2.00)|(3.00,2.00)' // This edge doesn't connect to the first one
    ];

    expect(() => orderEdges(edges)).toThrow('Edges do not form a continuous boundary');
  });

  test('throws error for edges that do not form a closed loop', () => {
    // Create edges that form a path but not a closed loop
    const edges = [
      '(0.00,0.00)|(1.00,0.00)',
      '(1.00,0.00)|(1.00,1.00)',
      '(1.00,1.00)|(0.00,1.00)'
      // Missing the edge from (0.00,1.00) to (0.00,0.00) to close the loop
    ];

    expect(() => orderEdges(edges)).toThrow('Edges do not form a closed loop');
  });

  it('should correctly order the boundary edges of a hexagon', () => {
    // Create a HexGeometry instance
    const hexGeometry = new HexGeometry(100); // inner diameter of 100

    // Get the edges of a hexagon at origin
    const hexCoord = { x: 0, y: 0 };
    const hexEdges = hexGeometry.hexEdges(hexCoord);

    // Convert edges to canonical string form (this will be unordered)
    const canonicalEdges = hexEdges.map(edge => edgeToString(edge));

    // Shuffle the edges to simulate them being in random order (deterministic)
    const shuffledEdges = [
      canonicalEdges[2],
      canonicalEdges[5],
      canonicalEdges[1],
      canonicalEdges[4],
      canonicalEdges[0],
      canonicalEdges[3]
    ];

    // Order the edges
    const orderedEdges = orderEdges(shuffledEdges);

    // Basic validation: should have 6 edges (same as input)
    expect(orderedEdges).toHaveLength(6);

    // All original edges should be present
    expect(new Set(orderedEdges)).toEqual(new Set(canonicalEdges));

    // Verify the result forms a proper closed path
    expect(validateClosedPath(orderedEdges)).toBe(true);
  });

  it('should handle a simple triangle of edges', () => {
    // Create a simple triangle with known vertices in canonical form
    // Triangle vertices: (0,0), (1,0), (0.5,0.87)
    const triangleEdges = [
      "(0.00,0.00)|(1.00,0.00)", // bottom edge
      "(0.50,0.87)|(1.00,0.00)", // right edge (canonical form: smaller vertex first)
      "(0.00,0.00)|(0.50,0.87)"  // left edge
    ];

    const orderedEdges = orderEdges(triangleEdges);

    expect(orderedEdges).toHaveLength(3);

    // All original edges should be present
    expect(new Set(orderedEdges)).toEqual(new Set(triangleEdges));

    // Verify the result forms a proper closed path
    expect(validateClosedPath(orderedEdges)).toBe(true);
  });

  it('should handle edge cases', () => {
    // Empty array
    expect(orderEdges([])).toEqual([]);

    // Single edge
    const singleEdge = ["(0.00,0.00)|(1.00,0.00)"];
    expect(orderEdges(singleEdge)).toEqual(singleEdge);
  });

  it('should throw error for disconnected edges', () => {
    // Two separate edges that don't connect
    const disconnectedEdges = [
      "(0.00,0.00)|(1.00,0.00)",
      "(2.00,0.00)|(3.00,0.00)"
    ];

    expect(() => orderEdges(disconnectedEdges)).toThrow('Edges do not form a continuous boundary');
  });

  it('should throw error for edges that don\'t form a closed loop', () => {
    // Three edges that form a path but not a loop
    const openPathEdges = [
      "(0.00,0.00)|(1.00,0.00)",
      "(1.00,0.00)|(2.00,0.00)",
      "(2.00,0.00)|(3.00,0.00)"
    ];

    expect(() => orderEdges(openPathEdges)).toThrow('Edges do not form a closed loop');
  });

  it('should produce consistent ordering regardless of input order', () => {
    // Create a simple square
    const squareEdges = [
      "(0.00,0.00)|(1.00,0.00)",
      "(1.00,0.00)|(1.00,1.00)",
      "(0.00,1.00)|(1.00,1.00)",
      "(0.00,0.00)|(0.00,1.00)"
    ];

    // Try different permutations of the same edges
    const permutation1 = [squareEdges[0], squareEdges[2], squareEdges[1], squareEdges[3]];
    const permutation2 = [squareEdges[3], squareEdges[1], squareEdges[0], squareEdges[2]];

    const ordered1 = orderEdges(permutation1);
    const ordered2 = orderEdges(permutation2);

    // Both should produce valid orderings
    expect(ordered1).toHaveLength(4);
    expect(ordered2).toHaveLength(4);

    // Both should contain all the same edges
    expect(new Set(ordered1)).toEqual(new Set(ordered2));

    // Both should form valid closed paths
    expect(validateClosedPath(ordered1)).toBe(true);
    expect(validateClosedPath(ordered2)).toBe(true);
  });
});

describe('getOrderedVertices', () => {
  it('should correctly order vertices of a square', () => {
    // Define a square with vertices at (0,0), (1,0), (1,1), (0,1)
    // Edges in canonical form (lexicographically smaller vertex first):
    const squareEdges = [
      "(0.00,0.00)|(1.00,0.00)", // bottom edge
      "(1.00,0.00)|(1.00,1.00)", // right edge
      "(0.00,1.00)|(1.00,1.00)", // top edge (reordered to canonical form)
      "(0.00,0.00)|(0.00,1.00)"  // left edge
    ];

    const orderedVertices = getOrderedVertices(squareEdges);

    // Should return exactly 4 vertices
    expect(orderedVertices).toHaveLength(4);

    // All expected vertices should be present
    const expectedVertices = [
      "(0.00,0.00)", "(1.00,0.00)", "(1.00,1.00)", "(0.00,1.00)"
    ];

    for (const vertex of expectedVertices) {
      expect(orderedVertices).toContain(vertex);
    }

    // Verify the vertices form a connected path
    // Each consecutive pair should share a vertex when parsed as edges
    for (let i = 0; i < orderedVertices.length; i++) {
      const currentVertex = orderedVertices[i];
      const nextVertex = orderedVertices[(i + 1) % orderedVertices.length];

      // Check that there's an edge connecting these vertices in our input
      const edgeExists = squareEdges.some(edge => {
        const [start, end] = edge.split('|');
        return (start === currentVertex && end === nextVertex) ||
               (start === nextVertex && end === currentVertex);
      });

      expect(edgeExists).toBe(true);
    }
  });

  it('should handle empty edge array', () => {
    const result = getOrderedVertices([]);
    expect(result).toEqual([]);
  });

  it('should handle single edge', () => {
    const singleEdge = ["(0.00,0.00)|(1.00,0.00)"];
    const result = getOrderedVertices(singleEdge);
    expect(result).toEqual(["(0.00,0.00)", "(1.00,0.00)"]);
  });
});

describe('HexGeometry.getBoundaryVertices', () => {
  let hexGeometry: HexGeometry;

  beforeEach(() => {
    // Use a simple inner diameter for testing
    hexGeometry = new HexGeometry(100);
  });

  it('should return boundary vertices for a single hex', () => {
    const singleHex: HexCoordinate[] = [{ x: 0, y: 0 }];

    const boundaryVertices = hexGeometry.getBoundaryVertices(singleHex);

    // A single hex should have 6 boundary vertices (all its vertices are on the boundary)
    expect(boundaryVertices).toHaveLength(6);

    // All vertices should be WorldCoordinate objects with x and z properties
    boundaryVertices.forEach(vertex => {
      expect(vertex).toHaveProperty('x');
      expect(vertex).toHaveProperty('z');
      expect(typeof vertex.x).toBe('number');
      expect(typeof vertex.z).toBe('number');
    });
  });

  it('should return boundary vertices for two adjacent hexes', () => {
    const adjacentHexes: HexCoordinate[] = [
      { x: 0, y: 0 },
      { x: 1, y: 0 }
    ];

    const boundaryVertices = hexGeometry.getBoundaryVertices(adjacentHexes);

    // Two adjacent hexes should have fewer boundary vertices than 12 (6+6)
    // since they share some vertices
    expect(boundaryVertices.length).toBeLessThan(12);
    expect(boundaryVertices.length).toBeGreaterThan(6);

    // Verify all vertices are valid WorldCoordinates
    boundaryVertices.forEach(vertex => {
      expect(vertex).toHaveProperty('x');
      expect(vertex).toHaveProperty('z');
      expect(typeof vertex.x).toBe('number');
      expect(typeof vertex.z).toBe('number');
    });
  });

  it('should return boundary vertices for a triangle of three hexes', () => {
    const triangleHexes: HexCoordinate[] = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 }
    ];

    const boundaryVertices = hexGeometry.getBoundaryVertices(triangleHexes);

    // Three hexes in a triangle should have a reasonable number of boundary vertices
    expect(boundaryVertices.length).toBeGreaterThan(6);
    expect(boundaryVertices.length).toBeLessThan(18); // Less than 3*6

    // Verify all vertices are valid WorldCoordinates
    boundaryVertices.forEach(vertex => {
      expect(vertex).toHaveProperty('x');
      expect(vertex).toHaveProperty('z');
      expect(typeof vertex.x).toBe('number');
      expect(typeof vertex.z).toBe('number');
    });
  });

  it('should return boundary vertices for a line of hexes', () => {
    const lineHexes: HexCoordinate[] = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 }
    ];

    const boundaryVertices = hexGeometry.getBoundaryVertices(lineHexes);

    // A line of three hexes should have boundary vertices
    expect(boundaryVertices.length).toBeGreaterThan(6);

    // All vertices should be WorldCoordinate objects
    boundaryVertices.forEach(vertex => {
      expect(vertex).toHaveProperty('x');
      expect(vertex).toHaveProperty('z');
      expect(typeof vertex.x).toBe('number');
      expect(typeof vertex.z).toBe('number');
    });
  });

  it('should handle empty hex array', () => {
    const emptyHexes: HexCoordinate[] = [];

    const boundaryVertices = hexGeometry.getBoundaryVertices(emptyHexes);

    // Empty input should return empty boundary
    expect(boundaryVertices).toHaveLength(0);
  });

  it('should return vertices in a connected order', () => {
    const hexes: HexCoordinate[] = [
      { x: 0, y: 0 },
      { x: 1, y: 0 }
    ];

    const boundaryVertices = hexGeometry.getBoundaryVertices(hexes);

    // With at least 3 vertices, we can check basic connectivity
    if (boundaryVertices.length >= 3) {
      // Calculate distances between consecutive vertices
      const distances: number[] = [];
      for (let i = 0; i < boundaryVertices.length; i++) {
        const current = boundaryVertices[i];
        const next = boundaryVertices[(i + 1) % boundaryVertices.length];
        const distance = Math.sqrt(
          Math.pow(next.x - current.x, 2) + Math.pow(next.z - current.z, 2)
        );
        distances.push(distance);
      }

      // All consecutive vertices should be reasonably close (they're edges of hexagons)
      // The exact distance depends on the hex size, but should be consistent
      const maxDistance = Math.max(...distances);
      const minDistance = Math.min(...distances);

      // Distances shouldn't vary too wildly if vertices are properly ordered
      expect(maxDistance / minDistance).toBeLessThan(2);
    }
  });

  it('should produce different results for different hex arrangements', () => {
    const arrangement1: HexCoordinate[] = [
      { x: 0, y: 0 },
      { x: 1, y: 0 }
    ];

    const arrangement2: HexCoordinate[] = [
      { x: 0, y: 0 },
      { x: 0, y: 1 }
    ];

    const boundary1 = hexGeometry.getBoundaryVertices(arrangement1);
    const boundary2 = hexGeometry.getBoundaryVertices(arrangement2);

    // Different arrangements should produce different boundary shapes
    // (This is a basic sanity check - the exact comparison depends on the geometry)
    expect(boundary1.length).toBeGreaterThan(0);
    expect(boundary2.length).toBeGreaterThan(0);

    // At least some vertices should be different
    const vertices1Set = new Set(boundary1.map(v => `${v.x.toFixed(2)},${v.z.toFixed(2)}`));
    const vertices2Set = new Set(boundary2.map(v => `${v.x.toFixed(2)},${v.z.toFixed(2)}`));

    expect(vertices1Set).not.toEqual(vertices2Set);
  });
});
