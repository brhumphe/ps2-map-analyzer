import type { RegionID } from '@/types/common';
import type { TerritorySnapshot } from '@/types/territory';
import type { Zone } from '@/types/zone_types';
import type {
  RegionAnalysisProvider,
  RegionState,
} from '@/types/region_analysis';

/**
 * Simple region ownership analyzer that passes through territory control data
 *
 * This analyzer provides a minimal transformation from faction IDs to region states,
 * serving as the foundation for the region analysis pipeline. It performs no
 * strategic analysis beyond basic ownership classification.
 */
export class RegionOwnershipAnalyzer implements RegionAnalysisProvider {
  /**
   * Analyze regions by converting faction ownership to region states
   *
   * This is a simple passthrough, creating a new mapping
   *
   * @param territory Current territory snapshot with region ownership
   * @param zone Zone data containing region information (not used in this simple analysis)
   * @returns Map of region IDs to their ownership states
   */
  analyzeRegionStates(
    territory: TerritorySnapshot,
    zone: Zone
  ): Map<RegionID, RegionState> {
    const regionStates = new Map<RegionID, RegionState>();

    // Get all regions from zone data to ensure we cover all regions
    zone.regions.forEach((region) => {
      const regionId = region.map_region_id;
      const factionId = territory.region_ownership[regionId];
      const state: RegionState = {
        owning_faction_id: factionId,
        region_id: regionId,
      };

      regionStates.set(regionId, state);
    });

    return regionStates;
  }
}
