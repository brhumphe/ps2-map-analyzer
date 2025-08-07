import { Continent, Faction, type RegionID, World } from '@/types/common';
import type {
  FacilityLink,
  FacilityLinkKey,
  Region,
  Zone,
} from '@/types/zone_types';
import type { TerritorySnapshot } from '@/types/territory';
import type { PS2DataService } from '@/types/services';
import { zoneUtils } from '@/utilities/zone_utils';

// API response types (matching the raw API structure)
interface RegionResponse {
  map_region_id: RegionID;
  location_x: number;
  location_z: number;
  facility_id: number;
  facility_type_id: number;
  localized_facility_name: string;
  hexes: {
    x: number;
    y: number;
  }[];
}
interface ZoneResponse {
  zone_id: Continent;
  code: string;
  name: string;
  hex_size: number;
  regions: RegionResponse[];
  links: FacilityLink[];
}

export interface ZoneDataResponse {
  zone_list: ZoneResponse[];
}

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
  baseUrl: string;
  constructor(serviceID: string) {
    this.baseUrl = `https://census.daybreakgames.com/s:${serviceID}/get/ps2:v2`;
  }

  async getZoneData(continent: Continent): Promise<Zone> {
    // Always use sanctuary for this to avoid literally thousands of calls to parseInt
    const baseUrl = 'https://census.lithafalcon.cc/get/ps2/zone';
    const url = `${baseUrl}?zone_id=${continent}&c:join=facility_link^on:zone_id^to:zone_id^list:1^inject_at:links^hide:description'zone_id,map_region^list:1^inject_at:regions^hide:zone_id'localized_facility_name(map_hex^list:1^inject_at:hexes^hide:zone_id'map_region_id)&c:lang=en&c:hide=name,description&c:censusJSON=false`;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(
          `HTTP Error: ${response.status} - ${response.statusText}`
        );
      }

      const data = await response.json();
      return this.parseZoneFromZoneResponse(data);
    } catch (error) {
      console.error('Error fetching zone data:', error);
      throw error;
    }
  }

  protected parseZoneFromZoneResponse(response: ZoneResponse): Zone {
    // Convert region array to a Map with region_id as key
    const regions = new Map<RegionID, Region>();
    for (const region of response.regions) {
      regions.set(region.map_region_id, {
        map_region_id: region.map_region_id,
        facility_id: region.facility_id,
        facility_type_id: region.facility_type_id,
        facility_name: region.localized_facility_name,
        location: {
          x: region.location_x,
          z: region.location_z,
        },
        zone_id: response.zone_id,
        hexes: region.hexes,
      });
    }

    const links = new Map<FacilityLinkKey, FacilityLink>();
    response.links.forEach((link) => {
      links.set(zoneUtils.getLinkKey(link), link);
    });

    // Calculate neighbors based on facility connections
    const neighbors = new Map<RegionID, Set<RegionID>>();

    // Initialize empty sets for all regions
    response.regions.forEach((region) => {
      neighbors.set(region.map_region_id, new Set<RegionID>());
    });

    // Build neighbor relationships from facility links
    response.links.forEach((link) => {
      // Find which regions contain these facilities
      const regionA = response.regions.find(
        (r) => r.facility_id === link.facility_id_a
      );
      const regionB = response.regions.find(
        (r) => r.facility_id === link.facility_id_b
      );

      if (
        regionA &&
        regionB &&
        regionA.map_region_id !== regionB.map_region_id
      ) {
        // Add bidirectional neighbor relationship
        neighbors.get(regionA.map_region_id)?.add(regionB.map_region_id);
        neighbors.get(regionB.map_region_id)?.add(regionA.map_region_id);
      }
    });

    const facility_to_region_map = new Map<number, RegionID>();
    response.regions.forEach((region) => {
      if (region.facility_id) {
        facility_to_region_map.set(region.facility_id, region.map_region_id);
      }
    });

    return {
      zone_id: response.zone_id,
      code: response.code,
      name: response.name,
      hex_size: response.hex_size,
      regions,
      links,
      neighbors,
      facility_to_region_map,
    };
  }

  async getCurrentTerritorySnapshot(
    continent: Continent,
    world: World
  ): Promise<TerritorySnapshot> {
    return await this.getCensusMapState(continent, world);
  }

  private async getCensusMapState(
    continent: Continent = Continent.INDAR,
    world: World = World.Osprey
  ) {
    const url = `${this.baseUrl}/map?world_id=${world}&zone_ids=${continent}`;
    // Load local JSON file from public directory
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to load territory control from Census: ${response.status}`
      );
    }

    const data = await response.json();
    if (data.error) {
      console.error(`Territories data load failed:`, data, url);
      throw new Error(data.error);
    }
    console.debug(`Loaded territory control from Census`, data, url);
    return extractCensusMapState(data, continent, world);
  }
}
