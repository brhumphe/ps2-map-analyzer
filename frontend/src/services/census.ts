import { Continent, World } from '@/types/common';
import type { Zone } from '@/types/zone_types';
import type { TerritorySnapshot } from '@/types/territory';
import type { PS2DataService } from '@/types/services';
import {
  parseZoneFromZoneResponse,
  extractCensusMapState,
  type ZoneResponse,
  type MapListResponse,
} from '@/services/parsers.ts';

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

      const data: ZoneResponse = await response.json();
      return parseZoneFromZoneResponse(data);
    } catch (error) {
      console.error('Error fetching zone data:', error);
      throw error;
    }
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
    console.debug(`Loaded territory control from Census`, data, url);
    return extractCensusMapState(data as MapListResponse, continent, world);
  }
}
