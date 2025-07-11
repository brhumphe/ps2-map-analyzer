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
  orderEdges
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

  test('orders edges to form a connected path', () => {
    // Create a square with vertices at (0,0), (1,0), (1,1), (0,1)
    // Ensure edges form a closed loop by making sure they connect properly
    const edges = [
      '(0.00,0.00)|(1.00,0.00)', // bottom edge
      '(1.00,0.00)|(1.00,1.00)', // right edge
      '(1.00,1.00)|(0.00,1.00)', // top edge
      '(0.00,1.00)|(0.00,0.00)'  // left edge
    ];

    const result = orderEdges(edges);

    // Verify the result forms a connected path
    for (let i = 0; i < result.length - 1; i++) {
      const currentEnd = result[i].split('|')[1];
      const nextStart = result[i + 1].split('|')[0];

      // The next edge should start with the end of the current edge
      expect(nextStart).toBe(currentEnd);
    }

    // Verify the path forms a closed loop
    const firstVertex = result[0].split('|')[0];
    const lastVertex = result[result.length - 1].split('|')[1];
    expect(firstVertex).toBe(lastVertex);

    // Verify we have the correct number of edges
    expect(result.length).toBe(4);
  });

  test('orders edges regardless of input order', () => {
    // Create a triangle with vertices at (0,0), (1,0), (0,1)
    // Ensure edges form a closed loop by making sure they connect properly
    const edges = [
      '(0.00,0.00)|(1.00,0.00)', // bottom edge
      '(1.00,0.00)|(0.00,1.00)', // right edge
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

    // Verify all results form connected paths
    for (const result of [result1, result2, result3]) {
      for (let i = 0; i < result.length - 1; i++) {
        const currentEnd = result[i].split('|')[1];
        const nextStart = result[i + 1].split('|')[0];

        // The next edge should start with the end of the current edge
        expect(nextStart).toBe(currentEnd);
      }

      // Verify the path forms a closed loop
      const firstVertex = result[0].split('|')[0];
      const lastVertex = result[result.length - 1].split('|')[1];
      expect(firstVertex).toBe(lastVertex);
    }
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
});
