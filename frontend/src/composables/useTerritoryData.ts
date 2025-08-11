/// <reference types="vite/client" />
import { ref, computed, watch, onUnmounted } from 'vue';
import type { TerritorySnapshot } from '@/types/territory';
import type { Continent, WorldID, RegionID } from '@/types/common';
import { useCensusData } from '@/composables/useCensusData';
import { useAppState } from '@/composables/useAppState';
import { useMapDisplaySettings } from '@/composables/useMapDisplaySettings';

// Singleton state - shared across all component instances
const territorySnapshot = ref<TerritorySnapshot | null>(null);
const isLoading = ref(false);
const isRefreshing = ref(false);
const error = ref<string | null>(null);

// Auto-refresh state
const autoRefreshTimer = ref<NodeJS.Timeout | null>(null);
const isAutoRefreshActive = ref(true);

/**
 * Composable for managing territory control data with Vue reactivity
 *
 * This composable provides reactive state management for territory data,
 * delegating data fetching and transformation to the MapStateService
 * while maintaining Vue-specific concerns like loading states and computed properties.
 *
 * Uses singleton pattern to ensure all components share the same reactive state.
 */
export function useTerritoryData() {
  // Dependencies
  const { dataService } = useCensusData();
  const { selectedWorld, selectedContinent } = useAppState();
  const { autoRefreshEnabled, autoRefreshInterval } = useMapDisplaySettings();

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
      territorySnapshot.value = await dataService.getCurrentTerritorySnapshot(
        continent,
        world
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
   * Refresh territory data using current app state
   * Uses separate loading state to distinguish from initial loading
   */
  const refreshTerritoryData = async (): Promise<void> => {
    if (!selectedWorld.value || !selectedContinent.value) {
      console.warn(
        'Cannot refresh territory data: world or continent not selected'
      );
      return;
    }

    isRefreshing.value = true;
    error.value = null;

    try {
      // Delegate to service for data fetching and transformation
      territorySnapshot.value = await dataService.getCurrentTerritorySnapshot(
        selectedContinent.value,
        selectedWorld.value
      );
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to refresh territory data';
      console.error('Territory data refresh error:', err);
    } finally {
      isRefreshing.value = false;
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
    if (!territorySnapshot.value || !territorySnapshot.value?.timestamp)
      return null;
    return Math.floor(Date.now() / 1000) - territorySnapshot.value.timestamp;
  });

  // Auto-refresh timer management
  watch(
    [autoRefreshEnabled, autoRefreshInterval, selectedWorld, selectedContinent],
    () => {
      // Clear existing timer
      if (autoRefreshTimer.value) {
        clearInterval(autoRefreshTimer.value);
        autoRefreshTimer.value = null;
        isAutoRefreshActive.value = false;
      }

      // Start new timer if enabled and we have valid world/continent
      if (
        autoRefreshEnabled.value &&
        selectedWorld.value &&
        selectedContinent.value
      ) {
        const intervalMs = autoRefreshInterval.value * 1000;
        autoRefreshTimer.value = setInterval(async () => {
          // Skip if already loading/refreshing
          if (isLoading.value || isRefreshing.value) return;

          try {
            await refreshTerritoryData();
          } catch (err) {
            console.warn('Auto-refresh failed:', err);
          }
        }, intervalMs);
        isAutoRefreshActive.value = true;
      }
    },
    { immediate: true }
  );

  // Cleanup on unmount
  onUnmounted(() => {
    if (autoRefreshTimer.value) {
      clearInterval(autoRefreshTimer.value);
      autoRefreshTimer.value = null;
    }
  });

  return {
    // Reactive state
    territorySnapshot,
    isLoading,
    isRefreshing,
    error,
    isAutoRefreshActive,

    // Actions
    fetchTerritoryData,
    refreshTerritoryData,

    // Computed helpers
    getRegionOwner,
    factionTerritoryCount,
    hasValidData,
    dataAge,
  };
}
