import { Continent, Faction, RegionID, World } from '@/types/common';
import { Zone } from '@/types/zone_types';
import { TerritorySnapshot } from '@/types/territory';
import { PS2DataService } from '@/types/services';

// The map collection in Census has a very weird format.
interface RowDataResponse {
  FactionId: string;
  RegionId: string;
}
interface RowResponse {
  RowData: RowDataResponse;
}
interface RowListResponse {
  IsList: string;
  Row: RowResponse[];
}
interface MapStateResponse {
  ZoneId: string;
  Regions: RowListResponse;
}
interface MapListResponse {
  map_list: MapStateResponse[];
  returned: number;
}

export function extractCensusMapState(
  data: MapListResponse,
  continent: Continent,
  world: World
): TerritorySnapshot {
  // Transform API response format to TerritorySnapshot
  const regionOwnership: Record<RegionID, Faction> = {};

  for (const map of data.map_list) {
    for (const row of map.Regions.Row) {
      const regionId = parseInt(row.RowData.RegionId);
      const factionId = parseInt(row.RowData.FactionId);
      regionOwnership[regionId] = factionId;
    }
  }

  return {
    timestamp: Math.floor(Date.now() / 1000),
    continent: continent,
    world: world,
    region_ownership: regionOwnership,
  };
}

export class CensusDataService implements PS2DataService {
  serviceID: string;

  constructor(serviceID: string = 'example') {
    this.serviceID = serviceID;
  }

  getZoneData(continent: Continent): Promise<Zone> {
    return new Promise((resolve, reject) => {
      reject('Not implemented');
    });
  }

  getCurrentTerritorySnapshot(
    continent: Continent,
    world: World
  ): Promise<TerritorySnapshot> {
    return new Promise((resolve, reject) => {
      reject('Not implemented');
    });
  }
}
