import { extractCensusMapState } from '../src/services/parsers';
import { Continent, RegionID, World } from '../src/types/common';

describe('services', () => {
  test('Can parse census formatted map state', () => {
    const data = {
      map_list: [
        {
          ZoneId: '2',
          Regions: {
            IsList: '1',
            Row: [
              {
                RowData: {
                  RegionId: '2101',
                  FactionId: '1',
                },
              },
              {
                RowData: {
                  RegionId: '2421',
                  FactionId: '3',
                },
              },
            ],
          },
        },
      ],
      returned: 1,
    };
    const result = extractCensusMapState(data, Continent.INDAR, World.Osprey);

    expect(result.timestamp).toEqual(expect.any(Number));
    expect(result.continent).toBe(Continent.INDAR);
    expect(result.world).toBe(World.Osprey);
    expect(result.region_ownership).toBeInstanceOf(Map);
    expect(result.region_ownership.get(2101 as RegionID)).toBe(1);
    expect(result.region_ownership.get(2421 as RegionID)).toBe(3);
    expect(result.region_ownership.size).toBe(2);
  });
});
