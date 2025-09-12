import { describe, it, expect, beforeAll } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  findDistancesFromFrontline,
  findWarpgateConnectedRegions,
  PS2Graph,
} from '../src/utilities/graph';
import {
  extractCensusMapState,
  parseZoneFromZoneResponse,
  type MapListResponse,
  type ZoneDataResponse,
} from '../src/services/parsers';
import type { Zone } from '../src/types/zone_types';
import type { TerritorySnapshot } from '../src/types/territory';
import { Continent, RegionID, World } from '../src/types/common';

describe('Graph Algorithms', () => {
  let zone: Zone;
  let snapshot: TerritorySnapshot;

  // Fixture: load Esamir zone + map snapshot from sample data
  beforeAll(() => {
    const zonePath = join(__dirname, './data/esamir-zone.json');
    const zoneJson = readFileSync(zonePath, 'utf8');
    const zoneData: ZoneDataResponse = JSON.parse(zoneJson);
    zone = parseZoneFromZoneResponse(zoneData.zone_list[0]);

    const mapPath = join(__dirname, './data/esamir-map-census.json');
    const mapJson = readFileSync(mapPath, 'utf8');
    const mapData: MapListResponse = JSON.parse(mapJson);
    snapshot = extractCensusMapState(mapData, Continent.ESAMIR, World.Osprey);
  });

  it('Find WG connected regions and their distances', () => {
    // Testing findConnectedRegions indirectly through findWarpgateConnectedRegions
    const graph = PS2Graph.build(zone, snapshot);
    expect(graph.nodes.size).toBe(51);
    const connectedRegions = findWarpgateConnectedRegions(graph);
    expect(connectedRegions.size).toBe(23); // 23 regions have a valid path to a warp-gate out of 51 total
    // Warp-gates should be distance 0 from themselves
    expect(connectedRegions.get(18029 as RegionID)).toBe(0);
    expect(connectedRegions.get(18062 as RegionID)).toBe(0);
    expect(connectedRegions.get(18030 as RegionID)).toBe(0);

    // Cut-off regions will not be in the connected set
    expect(connectedRegions.get(18210 as RegionID)).toBeUndefined();
    expect(connectedRegions.get(18067 as RegionID)).toBeUndefined();
    // First circle at distance 1
    expect(connectedRegions.get(18011 as RegionID)).toBe(1);
    expect(connectedRegions.get(18007 as RegionID)).toBe(1);
    expect(connectedRegions.get(18001 as RegionID)).toBe(1);
    // Regions next to a warp-gate that are not controlled by that faction are not connected
    expect(connectedRegions.get(18037 as RegionID)).toBeUndefined();
    expect(connectedRegions.get(18249 as RegionID)).toBeUndefined();
    // When there are multiple valid paths, the shortest one is chosen
    expect(connectedRegions.get(18032 as RegionID)).toBe(4); // Echo Valley
  });

  it('should find distances from frontline', () => {
    const graph = PS2Graph.build(zone, snapshot);
    const frontlineDistances = findDistancesFromFrontline(graph);
    expect(frontlineDistances.size).toBe(25); // 25 regions are on the frontline, including cut-off regions
    expect(frontlineDistances.get(18030 as RegionID)?.distance).toBe(4);
    expect(frontlineDistances.get(18250 as RegionID)?.distance).toBe(1);
    expect(frontlineDistances.get(18062 as RegionID)?.distance).toBe(3);
    expect(frontlineDistances.get(18013 as RegionID)?.distance).toBe(4);
    expect(frontlineDistances.get(18015 as RegionID)?.distance).toBe(4);
    expect(frontlineDistances.get(18067 as RegionID)?.distance).toBe(0);
    expect(frontlineDistances.get(18025 as RegionID)?.distance).toBe(0);
    expect(frontlineDistances.get(18261 as RegionID)?.distance).toBeUndefined();
  });
});
