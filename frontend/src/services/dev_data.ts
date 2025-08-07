import { Continent, ContinentName, World } from '@/types/common';
import type { Zone } from '@/types/zone_types';
import type { TerritorySnapshot } from '@/types/territory';
import {
  CensusDataService,
  extractCensusMapState,
  type ZoneDataResponse,
} from '@/services/census';

export class DevelopmentDataService extends CensusDataService {
  constructor(serviceId: string = 'dev') {
    super(serviceId);
  }

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

    return this.parseZoneFromZoneResponse(data.zone_list[0]);
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
