import { Continent, Faction, RegionID, WorldID } from '@/types/common';

// API response types
export interface RegionStateResponse {
  map_region_id: RegionID;
  owning_faction_id: Faction;
  last_updated: number;
}

export interface MapStateResponse {
  map_state_list: RegionStateResponse[];
}

// Use the raw response directly in MapState
export interface MapState {
  worldId: WorldID;
  zoneId: Continent;
  regionStates: Map<RegionID, RegionStateResponse>;
}

// HTTP Service Class
export class MapStateService {
  private baseUrl = 'https://census.lithafalcon.cc';

  /**
   * Fetches map state data and returns a MapState object
   */
  async fetchMapState(worldId: WorldID, zoneId: Continent): Promise<MapState> {
    const url = `${this.baseUrl}/get/ps2/map_state?world_id=${worldId}&zone_id=${zoneId}&c:censusJSON=false`;

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

      const data: MapStateResponse = await response.json();

      // Build the Map directly from the response
      const regionStates = new Map<RegionID, RegionStateResponse>();
      data.map_state_list.forEach((region) => {
        regionStates.set(region.map_region_id, region);
      });

      return {
        worldId,
        zoneId,
        regionStates,
      };
    } catch (error) {
      console.error('Error fetching map state:', error);
      throw error;
    }
  }
}
