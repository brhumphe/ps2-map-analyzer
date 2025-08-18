import type { RegionID, Faction } from '@/types/common';
import type { TerritorySnapshot } from '@/types/territory';
import type { Zone } from '@/types/zone_types';

/**
 * Strategic state of a region based on territory control analysis
 *
 * This represents the result of analyzing region ownership and can be used
 * as input for various display modes and styling calculations.
 */
export interface RegionState {
  owning_faction_id: Faction;
  // Mostly for debugging purposes
  region_id: RegionID;
  /** Factions who control adjacent regions. Used to determine capturability */
  adjacent_faction_ids?: Set<Faction>;
  /** If the region can be stolen by any faction (last-minute intervention in 3-way fight) */
  can_steal?: boolean;
  /** Whether any faction can capture this region */
  can_capture?: boolean;
  /** Whether this region is enabled for faction control */
  is_active?: boolean;
  /** Regions that are important right now (can be attacked or defended) */
  relevant_to_player?: boolean;
}

/**
 * Region analysis provider interface that converts territory data into region states
 *
 * This interface enables different analysis strategies for region control
 * (e.g., simple ownership passthrough, contested detection, strategic value analysis)
 */
export interface RegionAnalysisProvider {
  /**
   * Analyze regions based on current territory control
   *
   * @param territory Current territory snapshot with region ownership
   * @param zone Zone data containing region information
   * @param playerFaction Faction of the user (for strategic analysis)
   * @returns Map of region IDs to their strategic states
   */
  analyzeRegionStates(
    territory: TerritorySnapshot,
    zone: Zone,
    playerFaction: Faction
  ): Map<RegionID, RegionState>;
}
