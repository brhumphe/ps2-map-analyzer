import { describe, it, expect, beforeAll } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  extractCensusMapState,
  parseZoneFromZoneResponse,
  ZoneDataResponse,
} from '../src/services/parsers';
import type { Zone } from '../src/types/zone_types';
import type { TerritorySnapshot } from '../src/types/territory';
import { World, Continent } from '../src/types/common';
import { RegionOwnershipAnalyzer } from '../src/providers/analysis/RegionOwnershipAnalyzer';

describe('Census Parsers', () => {
  let esamirZone: Zone;
  let esamirMapState: TerritorySnapshot;

  beforeAll(() => {
    // Fixture: Create Esamir Zone object from sample data
    const testDataPath = join(__dirname, './data/esamir-zone.json');
    const zoneFileContents = readFileSync(testDataPath, 'utf8');
    const zoneData: ZoneDataResponse = JSON.parse(zoneFileContents);
    esamirZone = parseZoneFromZoneResponse(zoneData.zone_list[0]);

    const esamirMapFileContents = readFileSync(
      join(__dirname, './data/esamir-map-census.json'),
      'utf8'
    );
    const esamirMapData = JSON.parse(esamirMapFileContents);
    esamirMapState = extractCensusMapState(
      esamirMapData,
      Continent.ESAMIR,
      World.Osprey
    );
  });

  test('Region ownership analysis', () => {
    const analyser = new RegionOwnershipAnalyzer();
    const analysis = analyser.analyzeRegionStates(esamirMapState, esamirZone);
    // 18005 was a region being incorrectly flagged as capturable
    expect(analysis.get(18005)).toStrictEqual({
      owning_faction_id: 0,
      region_id: 18005,
      adjacent_faction_ids: new Set([0, 1, 3]),
      can_steal: false,
      can_capture: false,
    });
    console.log(analysis.get(18005));
  });
});
