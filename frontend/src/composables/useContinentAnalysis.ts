import { computed, type Ref } from 'vue';
import type { TerritorySnapshot } from '@/types/territory';
import type { Zone } from '@/types/zone_types';

// Type exports for components
export type FactionTerritoryCount = {
  VS: number;
  NC: number;
  TR: number;
  NSO: number;
};
export type DominantFaction = keyof FactionTerritoryCount | null;

/**
 * Composable for continent-wide analysis and statistics
 *
 * This composable provides computed statistics about the entire continent
 * based on current territory data, following the same reactive architecture
 * pattern as region and link analysis composables.
 */
export function useContinentAnalysis(
  territorySnapshot: Ref<TerritorySnapshot | null>,
  currentZone: Ref<Zone | null>
) {
  /**
   * Count of regions controlled by each faction
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
   * Total number of regions on the continent
   */
  const totalRegions = computed(() => {
    if (!currentZone.value) return 0;
    return currentZone.value.regions.size;
  });

  /**
   * Number of regions with territory data
   */
  const trackedRegions = computed(() => {
    if (!territorySnapshot.value) return 0;
    return Object.keys(territorySnapshot.value.region_ownership).length;
  });

  /**
   * Dominant faction (faction with most territory)
   */
  const dominantFaction = computed(() => {
    const counts = factionTerritoryCount.value;

    if (trackedRegions.value === 0) return null;

    const entries = Object.entries(counts) as [keyof typeof counts, number][];
    const [dominantFaction] = entries.reduce((max, current) =>
      current[1] > max[1] ? current : max
    );

    return dominantFaction;
  });

  /**
   * Check if continent analysis data is available
   */
  const hasAnalysisData = computed(() => {
    return territorySnapshot.value !== null && currentZone.value !== null;
  });

  /**
   * Data freshness information
   */
  const dataAge = computed(() => {
    if (!territorySnapshot.value?.timestamp) return null;
    return Math.floor(Date.now() / 1000) - territorySnapshot.value.timestamp;
  });

  return {
    // Territory counts
    factionTerritoryCount,
    totalRegions,
    trackedRegions,

    // Analysis metrics
    dominantFaction,

    // Meta information
    hasAnalysisData,
    dataAge,
  };
}
