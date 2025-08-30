import {
  Continent,
  type FacilityID,
  FacilityType,
  Faction,
  type RegionID,
  World,
} from '@/types/common';
import type {
  FacilityLink,
  FacilityLinkKey,
  Region,
  Zone,
} from '@/types/zone_types';
import type { TerritorySnapshot } from '@/types/territory';
import { zoneUtils } from '@/utilities/zone_utils';

// API response types (matching the raw API structure)
export interface RegionResponse {
  map_region_id: RegionID;
  location_x: number;
  location_z: number;
  facility_id: FacilityID;
  facility_type_id: FacilityType;
  facility_name: string;
  hexes: {
    x: number;
    y: number;
  }[];
}

export interface ZoneResponse {
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
export interface MapListResponse {
  map_list: MapStateResponse[];
  returned: number;
}

/**
 * Parses a zone response from the Census API into a Zone object
 * @param response - The raw zone response from the API
 * @returns A parsed Zone object with processed regions, links, and neighbors
 */
export function parseZoneFromZoneResponse(response: ZoneResponse): Zone {
  // Convert region array to a Map with region_id as key
  const regions = new Map<RegionID, Region>();
  for (const region of response.regions) {
    regions.set(region.map_region_id, {
      map_region_id: region.map_region_id,
      facility_id: region.facility_id,
      facility_type_id: region.facility_type_id,
      facility_name: region.facility_name,
      location: {
        x: region.location_x,
        z: region.location_z,
      },
      zone_id: response.zone_id,
      hexes: region.hexes,
    });
  }

  // Convert FacilityLink array to map keyed by link identifier
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

    if (regionA && regionB && regionA.map_region_id !== regionB.map_region_id) {
      // Add bidirectional neighbor relationship
      neighbors.get(regionA.map_region_id)?.add(regionB.map_region_id);
      neighbors.get(regionB.map_region_id)?.add(regionA.map_region_id);
    }
  });

  const facility_to_region_map = new Map<FacilityID, RegionID>();
  response.regions.forEach((region) => {
    if (region.facility_id) {
      facility_to_region_map.set(region.facility_id, region.map_region_id);
    }
  });

  const facility_type_to_region_map = new Map<FacilityType, RegionID[]>();
  response.regions.forEach((region) => {
    if (region.facility_type_id) {
      const region_ids =
        facility_type_to_region_map.get(region.facility_type_id) ?? [];
      region_ids.push(region.map_region_id);
      facility_type_to_region_map.set(region.facility_type_id, region_ids);
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
    facility_type_to_region_map,
  };
}

/**
 * Extracts territory ownership data from Census map state response
 * @param data - The raw map list response from Census API
 * @param continent - The continent this data represents
 * @param world - The world/server this data represents
 * @returns A TerritorySnapshot with parsed ownership data
 */
export function extractCensusMapState(
  data: MapListResponse,
  continent: Continent,
  world: World
): TerritorySnapshot {
  // Transform API response format to TerritorySnapshot
  const regionOwnership = new Map<RegionID, Faction>();

  for (const map of data.map_list) {
    for (const row of map.Regions.Row) {
      const regionId = parseInt(row.RowData.RegionId) as RegionID;
      const factionId = parseInt(row.RowData.FactionId) as Faction;
      regionOwnership.set(regionId, factionId);
    }
  }

  return {
    timestamp: Math.floor(Date.now() / 1000),
    continent: continent,
    world: world,
    region_ownership: regionOwnership,
  };
}
