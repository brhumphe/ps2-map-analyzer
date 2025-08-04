import { Continent, ContinentName, World } from '@/types/common';
import { FacilityLink, Region, Zone } from '@/types/zone_types';
import { TerritorySnapshot } from '@/types/territory';
import { CensusDataService, extractCensusMapState } from '@/services/census';

// API response types (matching the raw API structure)
interface ZoneResponse {
  zone_id: Continent;
  code: string;
  name: string;
  hex_size: number;
  regions: Region[];
  links: FacilityLink[];
}

interface ZoneDataResponse {
  zone_list: ZoneResponse[];
}

export class DevelopmentDataService extends CensusDataService {
  async getZoneData(continent: Continent): Promise<Zone> {
    const url = `/public/${ContinentName.get(continent)?.toLowerCase()}-zone.json`;
    let data: ZoneDataResponse;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // noinspection ExceptionCaughtLocallyJS
        throw new Error(
          `HTTP Error: ${response.status} - ${response.statusText}`
        );
      }
      data = await response.json();
    } catch (error) {
      console.error('Error fetching zone data:', error);
      throw error;
    }

    if (!data.zone_list || data.zone_list.length === 0) {
      throw new Error(`No zone data found for zone_id: ${continent}`);
    }

    return data.zone_list[0];
  }

  async getCurrentTerritorySnapshot(
    continent: Continent,
    world: World
  ): Promise<TerritorySnapshot> {
    const url = `/${ContinentName.get(continent)?.toLowerCase()}-map-census.json`;
    try {
      // Load local JSON file from public directory
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load development data: ${response.status}`);
      }

      const data = await response.json();
      return extractCensusMapState(data, continent, world);
    } catch (err) {
      throw new Error(
        `Development data load failed: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
  }
}
