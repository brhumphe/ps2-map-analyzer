import {
  Continent,
  Faction,
  RegionID,
  WorldID,
  ContinentName,
} from '@/types/common';
import type { TerritorySnapshot } from '@/types/territory';

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

  /**
   * Load territory data from local development file
   *
   * @param world World/server ID (e.g., 1 for Osprey)
   * @param continent Continent ID (e.g., 2 for Indar)
   */
  private async loadDevelopmentData(
    world: WorldID,
    continent: Continent
  ): Promise<TerritorySnapshot> {
    try {
      // Load local JSON file from public directory
      const response = await fetch(
        `/${ContinentName.get(continent)?.toLowerCase()}-map_state.json`
      );
      if (!response.ok) {
        throw new Error(`Failed to load development data: ${response.status}`);
      }

      const data = await response.json();

      // Transform API response format to TerritorySnapshot
      const regionOwnership: Record<RegionID, Faction> = {};

      if (data.map_state_list) {
        data.map_state_list.forEach((region: any) => {
          regionOwnership[region.map_region_id] = region.owning_faction_id;
        });
      }

      return {
        timestamp: Math.floor(Date.now() / 1000),
        continent: continent,
        world: world,
        region_ownership: regionOwnership,
      };
    } catch (err) {
      throw new Error(
        `Development data load failed: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Fetch territory data and transform it into TerritorySnapshot format
   * Automatically handles development vs production data sources
   *
   * @param world World/server ID (e.g., 1 for Connery)
   * @param continent Continent ID (e.g., 2 for Indar)
   */
  async fetchTerritorySnapshot(
    world: WorldID,
    continent: Continent
  ): Promise<TerritorySnapshot> {
    // Check if running in development mode
    const isDevelopment =
      import.meta.env.DEV || import.meta.env.VITE_USE_MOCK_DATA === 'true';

    if (isDevelopment) {
      console.log('Using development territory data from local file');
      return await this.loadDevelopmentData(world, continent);
    } else {
      // Fetch live data and transform to TerritorySnapshot format
      const mapState = await this.fetchMapState(world, continent);

      // Transform to TerritorySnapshot format
      const regionOwnership: Record<RegionID, Faction> = {};

      mapState.regionStates.forEach((regionState, regionId) => {
        regionOwnership[regionId] = regionState.owning_faction_id;
      });

      // Create normalized snapshot
      return {
        timestamp: Math.floor(Date.now() / 1000), // Current timestamp in seconds
        continent: continent,
        world: world,
        region_ownership: regionOwnership,
      };
    }
  }
}
