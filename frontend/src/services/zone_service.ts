import { Zone, Region, FacilityLink } from '@/types/zone_types';
import { Continent } from '@/types/common';

// API response types (matching the raw API structure)
export interface ZoneResponse {
  zone_id: Continent;
  code: string;
  name: string;
  hex_size: number;
  regions: Region[];
  links: FacilityLink[];
}

export interface ZoneDataResponse {
  zone_list: ZoneResponse[];
}

// HTTP Service Class
export class ZoneService {
  private baseUrl = 'https://census.lithafalcon.cc';

  /**
   * Fetches zone data and returns a Zone object
   */
  async fetchZone(zoneId: Continent): Promise<Zone> {
    const url = `${this.baseUrl}/get/ps2/zone?zone_id=${zoneId}&c:join=facility_link^on:zone_id^to:zone_id^list:1^inject_at:links^hide:description'zone_id,map_region^list:1^inject_at:regions^hide:zone_id'localized_facility_name(map_hex^list:1^inject_at:hexes^hide:zone_id'map_region_id)&c:lang=en&c:hide=name,description&c:censusJSON=false`;

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
      throw new Error(`No zone data found for zone_id: ${zoneId}`);
    }

    return data.zone_list[0];
  }
}
