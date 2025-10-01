import { Continent, ContinentName, World } from '@/types/common';
import type { Zone } from '@/types/zone_types';
import type { TerritorySnapshot } from '@/types/territory';
import type { PS2DataService } from '@/types/services';
import {
  parseZoneFromZoneResponse,
  extractCensusMapState,
  type MapListResponse,
  type ZoneDataResponse,
} from '@/services/parsers';

export class CensusDataService implements PS2DataService {
  baseUrl: string;
  constructor(serviceID: string) {
    this.baseUrl = `https://census.daybreakgames.com/s:${serviceID}/get/ps2:v2`;
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
    console.debug(`Loaded zone data from development`, data, url);
    return parseZoneFromZoneResponse(data.zone_list[0]);
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
  ): Promise<TerritorySnapshot> {
    const url = `${this.baseUrl}/map?world_id=${world}&zone_ids=${continent}`;
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
    console.debug(`Loaded territory control from Census`);
    return extractCensusMapState(data as MapListResponse, continent, world);
  }
}
