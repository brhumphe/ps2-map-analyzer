import type { RegionID, Faction } from '@/types/common';
import type { TerritorySnapshot } from '@/types/territory';
import type { Zone } from '@/types/zone_types';

/**
 * Strategic state of a region based on territory control analysis
 * 
 * This represents the result of analyzing region ownership and can be used
 * as input for various display modes and styling calculations.
 */
export type RegionState =
  | 'VS'        // Controlled by Vanu Sovereignty  
  | 'NC'        // Controlled by New Conglomerate
  | 'TR'        // Controlled by Terran Republic
  | 'NSO'       // Controlled by Nanite Systems Operatives
  | 'none'      // No faction control or territory data unavailable
  | 'unknown';  // Territory data incomplete or unavailable

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
   * @returns Map of region IDs to their strategic states
   */
  analyzeRegionStates(territory: TerritorySnapshot, zone: Zone): Map<RegionID, RegionState>;
}
