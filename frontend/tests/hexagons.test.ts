import { 
  hexToCubeCoords, 
  cubeToHexCoords, 
  hexCoordsToWorld, 
  HexCoordinate, 
  CubeCoordinate 
} from '../src/hexagons';

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
