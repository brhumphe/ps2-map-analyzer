/// <reference types="vite/client" />
import { ref, computed } from 'vue';
import { MapStateService } from '@/services/map_service';
import type { TerritorySnapshot } from '@/types/territory';
import {
  Continent,
  WorldID,
  RegionID,
  Faction,
  ContinentName,
} from '@/types/common';

/**
 * Composable for managing territory control data with Vue reactivity
 *
 * This composable bridges the imperative MapStateService with Vue's reactive system,
 * transforming raw API responses into the normalized TerritorySnapshot format
 * optimized for frontend analysis and visualization.
 */
export function useTerritoryData() {
  // Reactive state
  const territorySnapshot = ref<TerritorySnapshot | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Service instance
  const mapStateService = new MapStateService();

  /**
   * Load territory data from local development file
   *
   * @param world World/server ID (e.g., 1 for Connery)
   * @param continent Continent ID (e.g., 2 for Indar)
   */
  const loadDevelopmentData = async (
    world: WorldID,
    continent: Continent
  ): Promise<void> => {
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

      territorySnapshot.value = {
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
  };

  /**
   * Fetch territory data and transform it into TerritorySnapshot format
   *
   * @param world World/server ID (e.g., 1 for Connery)
   * @param continent Continent ID (e.g., 2 for Indar)
   */
  const fetchTerritoryData = async (
    world: WorldID,
    continent: Continent
  ): Promise<void> => {
    isLoading.value = true;
    error.value = null;

    try {
      // Check if running in development mode
      const isDevelopment =
        import.meta.env.DEV || import.meta.env.VITE_USE_MOCK_DATA === 'true';

      if (isDevelopment) {
        console.log('Using development territory data from local file');
        await loadDevelopmentData(world, continent);
      } else {
        // Fetch raw map state from service
        const mapState = await mapStateService.fetchMapState(world, continent);

        // Transform to TerritorySnapshot format
        const regionOwnership: Record<RegionID, Faction> = {};

        mapState.regionStates.forEach((regionState, regionId) => {
          regionOwnership[regionId] = regionState.owning_faction_id;
        });

        // Create normalized snapshot
        territorySnapshot.value = {
          timestamp: Math.floor(Date.now() / 1000), // Current timestamp in seconds
          continent: continent,
          world: world,
          region_ownership: regionOwnership,
        };
      }
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to fetch territory data';
      console.error('Territory data fetch error:', err);
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Get the faction that owns a specific region
   *
   * @param regionId The region to check
   * @returns Faction ID (1=VS, 2=NC, 3=TR, 4=NSO) or null if unknown/contested
   */
  const getRegionOwner = computed(() => {
    return (regionId: RegionID) => {
      return territorySnapshot.value?.region_ownership[regionId] || null;
    };
  });

  /**
   * Get count of regions controlled by each faction
   */
  const factionTerritoryCount = computed(() => {
    if (!territorySnapshot.value) {
      return { VS: 0, NC: 0, TR: 0, NSO: 0 };
    }

    const counts = { VS: 0, NC: 0, TR: 0, NSO: 0 };

    Object.values(territorySnapshot.value.region_ownership).forEach(
      (faction) => {
        switch (faction) {
          case 1:
            counts.VS++;
            break;
          case 2:
            counts.NC++;
            break;
          case 3:
            counts.TR++;
            break;
          case 4:
            counts.NSO++;
            break;
        }
      }
    );

    return counts;
  });

  /**
   * Check if territory data is available and current
   */
  const hasValidData = computed(() => {
    return (
      territorySnapshot.value !== null &&
      Object.keys(territorySnapshot.value.region_ownership).length > 0
    );
  });

  /**
   * Get age of current territory data in seconds
   */
  const dataAge = computed(() => {
    if (!territorySnapshot.value) return null;
    return Math.floor(Date.now() / 1000) - territorySnapshot.value.timestamp;
  });

  return {
    // Reactive state
    territorySnapshot,
    isLoading,
    error,

    // Actions
    fetchTerritoryData,

    // Computed helpers
    getRegionOwner,
    factionTerritoryCount,
    hasValidData,
    dataAge,
  };
}
