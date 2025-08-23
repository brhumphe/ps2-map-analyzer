import { computed, type Ref } from 'vue';
import type { TerritorySnapshot } from '@/types/territory';
import type { Zone } from '@/types/zone_types';

// Type exports for components
export type FactionTerritoryCount = {
  VS: number;
  NC: number;
  TR: number;
  NSO: number;
  None: number;
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
    if (!territorySnapshot.value || !currentZone.value) {
      return { VS: 0, NC: 0, TR: 0, NSO: 0, None: 0 };
    }

    const counts = { VS: 0, NC: 0, TR: 0, NSO: 0, None: 0 };

    // Count all regions that exist in the zone
    currentZone.value.regions.forEach((region) => {
      const regionId = region.map_region_id;
      const faction = territorySnapshot.value!.region_ownership.get(regionId);

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
        default:
          // null, undefined, or any other value means no faction controls it
          counts.None++;
          break;
      }
    });

    return counts;
  });

  const factionTerritoryPercentage = computed(() => {
    if (!territorySnapshot.value || !currentZone.value) {
      return { VS: 0, NC: 0, TR: 0 };
    }
    const counts = factionTerritoryCount.value;
    const active = counts.VS + counts.NC + counts.TR;
    return {
      VS: (counts.VS / active) * 100,
      NC: (counts.NC / active) * 100,
      TR: (counts.TR / active) * 100,
    };
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

    // Exclude "None" from dominant faction calculation
    const factionEntries = Object.entries(counts).filter(
      ([faction]) => faction !== 'None'
    ) as [keyof Omit<typeof counts, 'None'>, number][];

    if (factionEntries.length === 0) return null;

    const [dominantFaction] = factionEntries.reduce((max, current) =>
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
    factionTerritoryPercentage,
    totalRegions,
    trackedRegions,

    // Analysis metrics
    dominantFaction,

    // Meta information
    hasAnalysisData,
    dataAge,
  };
}
