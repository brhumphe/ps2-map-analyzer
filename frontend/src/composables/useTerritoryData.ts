// composables/useTerritoryData.ts
import { ref, computed, watch, onUnmounted } from 'vue';
import type { TerritorySnapshot } from '@/types/territory';
import { type Continent, type RegionID, World } from '@/types/common';
import { useCensusData } from '@/composables/useCensusData';
import { useAppState } from '@/composables/useAppState';
import { useMapDisplaySettings } from '@/composables/useMapDisplaySettings';

// Configuration
const REQUEST_TIMEOUT_MS = 10000; // 10 seconds
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff

// Singleton state - shared across all component instances
const territorySnapshot = ref<TerritorySnapshot | null>(null);
const isLoading = ref(false);
const isRefreshing = ref(false);
const error = ref<string | null>(null);
const lastSuccessfulFetch = ref<number | null>(null);

// Auto-refresh state
const autoRefreshTimer = ref<NodeJS.Timeout | null>(null);
const isAutoRefreshActive = ref(true);

// Track active requests for cleanup
const activeRequests = new Set<AbortController>();

/**
 * Fetch with timeout and retry logic
 */
async function fetchWithRetry<T>(
  fetchFn: (signal: AbortSignal) => Promise<T>,
  options: {
    timeoutMs?: number;
    maxAttempts?: number;
    retryDelays?: number[];
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const {
    timeoutMs = REQUEST_TIMEOUT_MS,
    maxAttempts = MAX_RETRY_ATTEMPTS,
    retryDelays = RETRY_DELAYS,
    onRetry,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const controller = new AbortController();
    activeRequests.add(controller);

    // Set up timeout
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      const result = await fetchFn(controller.signal);
      clearTimeout(timeoutId);
      activeRequests.delete(controller);
      return result;
    } catch (err) {
      clearTimeout(timeoutId);
      activeRequests.delete(controller);

      lastError = err instanceof Error ? err : new Error(String(err));

      // Check if this was an abort (timeout)
      if (controller.signal.aborted) {
        lastError = new Error(`Request timed out after ${timeoutMs}ms`);
      }

      // Don't retry on the last attempt
      if (attempt < maxAttempts - 1) {
        const delay =
          retryDelays[attempt] || retryDelays[retryDelays.length - 1];

        if (onRetry) {
          onRetry(attempt + 1, lastError);
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Request failed after all retry attempts');
}

export function useTerritoryData() {
  // Dependencies
  const { dataService } = useCensusData();
  const { selectedWorld, selectedContinent, useDevData } = useAppState();
  const { autoRefreshEnabled, autoRefreshInterval } = useMapDisplaySettings();

  /**
   * Cancel all active requests
   */
  const cancelActiveRequests = () => {
    activeRequests.forEach((controller) => controller.abort());
    activeRequests.clear();
  };

  /**
   * Fetch territory data with timeout and retry
   */
  const fetchTerritoryData = async (
    world: World,
    continent: Continent,
    isAutoRefresh = false
  ): Promise<void> => {
    // Don't set loading state for auto-refresh to avoid UI flicker
    if (!isAutoRefresh) {
      isLoading.value = true;
    }
    error.value = null;

    try {
      const snapshot = await fetchWithRetry(
        async (signal) => {
          // Create a wrapper that respects abort signal
          const promise = dataService.getCurrentTerritorySnapshot(
            continent,
            world
          );

          // Check if promise was aborted
          return Promise.race([
            promise,
            new Promise<never>((_, reject) => {
              signal.addEventListener('abort', () => {
                reject(new Error('Request aborted'));
              });
            }),
          ]);
        },
        {
          onRetry: (attempt, err) => {
            console.warn(
              `Territory data fetch attempt ${attempt} failed:`,
              err.message
            );
          },
        }
      );

      territorySnapshot.value = snapshot;
      lastSuccessfulFetch.value = Date.now();
      error.value = null;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch territory data';
      error.value = errorMessage;
      console.error('Territory data fetch error after retries:', err);

      // If this was an auto-refresh, don't clear existing data
      if (isAutoRefresh && territorySnapshot.value) {
        console.log(
          'Keeping existing territory data after auto-refresh failure'
        );
      }
    } finally {
      if (!isAutoRefresh) {
        isLoading.value = false;
      }
    }
  };

  /**
   * Refresh territory data using current app state
   * This is for manual refresh - uses separate loading state
   */
  const refreshTerritoryData = async (): Promise<void> => {
    if (!selectedWorld.value || !selectedContinent.value) {
      console.warn(
        'Cannot refresh territory data: world or continent not selected'
      );
      return;
    }

    // Cancel any pending requests before starting new one
    cancelActiveRequests();

    isRefreshing.value = true;
    error.value = null;

    try {
      await fetchTerritoryData(
        selectedWorld.value,
        selectedContinent.value,
        false
      );
    } finally {
      // Always clear refreshing state, even if request failed
      isRefreshing.value = false;
    }
  };

  /**
   * Auto-refresh handler (doesn't set loading states to avoid UI flicker)
   */
  const autoRefresh = async (): Promise<void> => {
    if (!selectedWorld.value || !selectedContinent.value) {
      return;
    }

    // Skip if already manually loading or refreshing
    if (isLoading.value || isRefreshing.value) {
      console.debug('Skipping auto-refresh: manual operation in progress');
      return;
    }

    await fetchTerritoryData(
      selectedWorld.value,
      selectedContinent.value,
      true // isAutoRefresh flag
    );
  };

  /**
   * Get the faction that owns a specific region
   */
  const getRegionOwner = computed(() => {
    return (regionId: RegionID) => {
      return territorySnapshot.value?.region_ownership.get(regionId) ?? null;
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

  /**
   * Check if data is stale (older than 2x refresh interval)
   */
  const isDataStale = computed(() => {
    if (!dataAge.value) return false;
    return dataAge.value > autoRefreshInterval.value * 2;
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
        autoRefreshTimer.value = setInterval(autoRefresh, intervalMs);
        isAutoRefreshActive.value = true;

        // Do an immediate refresh if we don't have data or it's stale
        if (!hasValidData.value || isDataStale.value) {
          autoRefresh();
        }
      }
    },
    { immediate: true }
  );

  // Watch for dev data toggle changes and refresh
  watch(useDevData, () => {
    // Only refresh if we have valid world/continent selection
    if (selectedWorld.value && selectedContinent.value) {
      console.log(
        `Data source changed to: ${useDevData.value ? 'development' : 'live'}`
      );
      refreshTerritoryData();
    }
  });

  // Cleanup on unmount
  onUnmounted(() => {
    if (autoRefreshTimer.value) {
      clearInterval(autoRefreshTimer.value);
      autoRefreshTimer.value = null;
    }
    cancelActiveRequests();
  });

  return {
    // Reactive state
    territorySnapshot,
    isLoading,
    isRefreshing,
    error,
    isAutoRefreshActive,
    lastSuccessfulFetch,

    // Actions
    fetchTerritoryData,
    refreshTerritoryData,
    cancelActiveRequests,

    // Computed helpers
    getRegionOwner,
    factionTerritoryCount,
    hasValidData,
    dataAge,
    isDataStale,
  };
}
