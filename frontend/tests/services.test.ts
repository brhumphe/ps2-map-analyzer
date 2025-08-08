import { extractCensusMapState } from '../src/services/parsers';
import { Continent, World } from '../src/types/common';

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
    expect(result).toEqual({
      timestamp: expect.any(Number),
      continent: Continent.INDAR,
      world: World.Osprey,
      region_ownership: {
        2101: 1,
        2421: 3,
      },
    });
  });
});
