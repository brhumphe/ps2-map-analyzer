import { describe, it, expect } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Continent, World } from '../src/types/common';
import {
  extractCensusMapState,
  parseZoneFromZoneResponse,
  type MapListResponse,
  ZoneDataResponse,
} from '../src/services/parsers';

describe('Census Parsers', () => {
  describe('extractCensusMapState', () => {
    it('should parse real Esamir map data from census', () => {
      // Read the test data file
      const testDataPath = join(__dirname, './data/esamir-map-census.json');
      const fileContents = readFileSync(testDataPath, 'utf8');
      const censusMapData: MapListResponse = JSON.parse(fileContents);

      // Call the parsing function
      const result = extractCensusMapState(
        censusMapData,
        Continent.ESAMIR,
        World.Osprey
      );

      // Basic structure assertions to start with
      expect(result).toBeDefined();
      expect(result.continent).toBe(Continent.ESAMIR);
      expect(result.world).toBe(World.Osprey);
      expect(result.region_ownership).toBeDefined();
      expect(typeof result.timestamp).toBe('number');
    });
  });

  describe('parseZoneFromZoneResponse', () => {
    it('should parse real Esamir zone data', () => {
      // Read the test data file
      const testDataPath = join(__dirname, './data/esamir-zone.json');
      const fileContents = readFileSync(testDataPath, 'utf8');
      const zoneData: ZoneDataResponse = JSON.parse(fileContents);

      // Call the parsing function
      const result = parseZoneFromZoneResponse(zoneData.zone_list[0]);

      // Basic structure assertions to start with
      expect(result).toBeDefined();
      expect(result.zone_id).toBe(Continent.ESAMIR);
      expect(result.code).toBeDefined();
      expect(result.hex_size).toBeGreaterThan(0);
      expect(result.regions).toBeInstanceOf(Map);
      expect(result.links).toBeInstanceOf(Map);
      expect(result.neighbors).toBeInstanceOf(Map);
      expect(result.facility_to_region_map).toBeInstanceOf(Map);
      expect(result.links.size).toBe(76);

      expect(result.facility_to_region_map.size).toBe(49);
      // There are two regions without facilities
      expect(result.regions.size).toBe(51);
    });
  });
});
