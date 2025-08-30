import { computed, type Ref } from 'vue';
import { ContestableLinksAnalyzer } from '@/providers/analysis/ContestableLinksAnalyzer';
import { LinkStyleCalculator } from '@/providers/styling/LinkStyleCalculator';
import type { TerritorySnapshot, LinkState } from '@/types/territory';
import type { Zone, FacilityLinkKey } from '@/types/zone_types';
import { zoneUtils } from '@/utilities/zone_utils';
import type L from 'leaflet';
import { useAppState } from '@/composables/useAppState';

/**
 * Composable for lattice link analysis and styling coordination
 *
 * This composable implements the reactive pipeline for lattice links:
 * Territory Data → Analysis → Style Calculation → Components
 */
export function useLinkAnalysis(
  territorySnapshot: Ref<TerritorySnapshot | null>,
  currentZone: Ref<Zone | null>
) {
  // Analysis and styling services
  const linkAnalyzer = new ContestableLinksAnalyzer();
  const styleCalculator = new LinkStyleCalculator();

  // State that style depends on
  const { playerFaction } = useAppState();

  /**
   * Computed link states based on territory analysis
   *
   * Automatically recalculates when territory data or zone changes
   */
  const linkStates = computed<Map<FacilityLinkKey, LinkState>>(() => {
    if (!territorySnapshot.value || !currentZone.value) {
      return new Map();
    }

    return linkAnalyzer.analyzeLinkStates(
      territorySnapshot.value,
      currentZone.value
    );
  });

  /**
   * Computed link styles based on analysis results
   *
   * Automatically recalculates when link states change
   */
  const linkStyles = computed<Map<FacilityLinkKey, Partial<L.PolylineOptions>>>(
    () => {
      if (linkStates.value.size === 0) {
        return new Map();
      }

      const styles = new Map<FacilityLinkKey, Partial<L.PolylineOptions>>();

      linkStates.value.forEach((state, linkKey) => {
        const style = styleCalculator.calculateLinkStyle(
          state,
          playerFaction.value
        );
        styles.set(linkKey, style);
      });

      return styles;
    }
  );

  /**
   * Get style for a specific link
   *
   * @param linkKey The link to get styling for
   * @returns Leaflet styling options or null if not found
   */
  const getLinkStyle = computed(() => {
    return (linkKey: FacilityLinkKey) => {
      return linkStyles.value.get(linkKey) || null;
    };
  });

  /**
   * Get analysis state for a specific link
   *
   * @param linkKey The link to get state for
   * @returns Link state or null if not found
   */
  const getLinkState = computed(() => {
    return (linkKey: FacilityLinkKey) => {
      return linkStates.value.get(linkKey) || null;
    };
  });

  /**
   * Check if link analysis data is available
   */
  const hasAnalysisData = computed(() => {
    return linkStates.value.size > 0;
  });

  return {
    // Computed analysis results
    linkStates,
    linkStyles,

    // Helper functions
    getLinkStyle,
    getLinkState,
    hasAnalysisData,
  };
}
