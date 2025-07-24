import { computed, type Ref } from 'vue';
import { ContestableLinksAnalyzer } from '@/services/analysis/ContestableLinksAnalyzer';
import { LinkStyleCalculator } from '@/services/styling/LinkStyleCalculator';
import type { TerritorySnapshot, LinkState } from '@/types/territory';
import type { Zone, FacilityLinkKey } from '@/types/zone_types';
import { zoneUtils } from '@/utilities/zone_utils';
import type L from 'leaflet';

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
  
  /**
   * Computed link states based on territory analysis
   * 
   * Automatically recalculates when territory data or zone changes
   */
  const linkStates = computed<Map<FacilityLinkKey, LinkState>>(() => {
    if (!territorySnapshot.value || !currentZone.value) {
      console.log('useLinkAnalysis: No territory or zone data available');
      return new Map();
    }
    
    return linkAnalyzer.analyzeLinkStates(territorySnapshot.value, currentZone.value);
  });
  
  /**
   * Computed link styles based on analysis results
   * 
   * Automatically recalculates when link states change
   */
  const linkStyles = computed<Map<FacilityLinkKey, Partial<L.PolylineOptions>>>(() => {
    if (linkStates.value.size === 0) {
      console.log('useLinkAnalysis: No link states available');
      return new Map();
    }
    
    const styles = new Map<FacilityLinkKey, Partial<L.PolylineOptions>>();
    
    linkStates.value.forEach((state, linkKey) => {
      const style = styleCalculator.calculateLinkStyle(state);
      styles.set(linkKey, style);
    });
    
    console.log(`useLinkAnalysis: Generated ${styles.size} link styles`);
    return styles;
  });
  
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