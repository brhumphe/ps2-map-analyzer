/// <reference types="vite/client" />
import { ref, computed } from 'vue';
import { MapStateService } from '@/services/map_service';
import type { TerritorySnapshot } from '@/types/territory';
import { Continent, WorldID, RegionID } from '@/types/common';

/**
 * Composable for managing territory control data with Vue reactivity
 *
 * This composable provides reactive state management for territory data,
 * delegating data fetching and transformation to the MapStateService
 * while maintaining Vue-specific concerns like loading states and computed properties.
 */
export function useTerritoryData() {
  // Reactive state
  const territorySnapshot = ref<TerritorySnapshot | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Service instance
  const mapStateService = new MapStateService();

  /**
   * Fetch territory data using the service layer
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
      // Delegate to service for data fetching and transformation
      territorySnapshot.value = await mapStateService.fetchTerritorySnapshot(
        world,
        continent
      );
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
