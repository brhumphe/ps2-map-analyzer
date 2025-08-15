import { computed, type Ref } from 'vue';
import { RegionOwnershipAnalyzer } from '@/providers/analysis/RegionOwnershipAnalyzer';
import { RegionStyleCalculator } from '@/providers/styling/RegionStyleCalculator';
import type { TerritorySnapshot } from '@/types/territory';
import type { Zone, RegionKey } from '@/types/zone_types';
import type { RegionState } from '@/types/region_analysis';
import type { RegionID } from '@/types/common';
import { zoneUtils } from '@/utilities/zone_utils';
import type L from 'leaflet';
import { useAppState } from '@/composables/useAppState.ts';

/**
 * Composable for region analysis and styling coordination
 *
 * This composable implements the reactive pipeline from territory data
 * through analysis to visual styling, following the architecture pattern:
 * Territory Data → Analysis → Style Calculation → Components
 */
export function useRegionAnalysis(
  territorySnapshot: Ref<TerritorySnapshot | null>,
  currentZone: Ref<Zone | null>
) {
  // Analysis and styling services
  const regionAnalyzer = new RegionOwnershipAnalyzer();
  const styleCalculator = new RegionStyleCalculator();

  // State that style depends on
  const { playerFaction } = useAppState();

  /**
   * Computed region states based on territory analysis
   *
   * Automatically recalculates when territory data or zone changes
   */
  const regionStates = computed<Map<RegionID, RegionState>>(() => {
    if (!territorySnapshot.value || !currentZone.value) {
      return new Map();
    }

    return regionAnalyzer.analyzeRegionStates(
      territorySnapshot.value,
      currentZone.value,
      playerFaction.value
    );
  });

  /**
   * Computed region styles based on analysis results
   *
   * Automatically recalculates when region states change
   */
  const regionStyles = computed<Map<RegionKey, Partial<L.PolylineOptions>>>(
    () => {
      if (regionStates.value.size === 0) {
        return new Map();
      }

      const styles = new Map<RegionKey, Partial<L.PolylineOptions>>();

      regionStates.value.forEach((state, regionId) => {
        const style = styleCalculator.calculateRegionStyle(
          state,
          playerFaction.value
        );
        const regionKey = zoneUtils.getRegionKey(regionId);
        styles.set(regionKey, style);
      });

      return styles;
    }
  );

  /**
   * Get style for a specific region
   *
   * @param regionKey The region key to get styling for
   * @returns Leaflet styling options or null if not found
   */
  const getRegionStyle = computed(() => {
    return (regionKey: RegionKey) => {
      return regionStyles.value.get(regionKey) || null;
    };
  });

  /**
   * Get analysis state for a specific region
   *
   * @param regionId The region to get state for
   * @returns Region state or null if not found
   */
  const getRegionState = computed(() => {
    return (regionId: RegionID) => {
      return regionStates.value.get(regionId) || null;
    };
  });

  /**
   * Check if analysis data is available
   */
  const hasAnalysisData = computed(() => {
    return regionStates.value.size > 0;
  });

  return {
    // Computed analysis results
    regionStates,
    regionStyles,

    // Helper functions
    getRegionStyle,
    getRegionState,
    hasAnalysisData,
  };
}
