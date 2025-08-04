// types/territory.ts

import { Continent, Faction, RegionID, WorldID } from '@/types/common';
import type { FacilityLinkKey, Zone } from '@/types/zone_types';

/**
 * Strategic classification of lattice links based on connected region ownership
 *
 * This type represents the tactical significance of a lattice connection
 * and is used as input for various display modes and styling calculations.
 */
export type LinkState =
  | 'inactive' // Link is not operational (bases offline/inaccessible)
  | 'NC' // Both connected bases controlled by New Conglomerate
  | 'TR' // Both connected bases controlled by Terran Republic
  | 'VS' // Both connected bases controlled by Vanu Sovereignty
  | 'NSO' // Both connected bases controlled by Nanite Systems Operatives
  | 'contestable' // Connected bases have different faction ownership (tactical opportunity)
  | 'unknown'; // Territory data incomplete or unavailable

/**
 * Normalized territory control snapshot optimized for frontend consumption
 *
 * This format provides efficient lookups for region ownership while being
 * compatible with both client-side analysis and backend API responses.
 * The region map only includes regions with known ownership - missing
 * regions should be treated as contested or unknown.
 */
export interface TerritorySnapshot {
  /** Unix timestamp when this snapshot was captured */
  timestamp: number | undefined;

  /** Continent/zone identifier (2=Indar, 6=Amerish, etc.) */
  continent: Continent;

  /** World/server identifier where this territory state applies */
  world: WorldID;

  /**
   * Mapping of region ID to controlling faction ID
   * - Key: Region ID (map_region_id from zone data)
   * - Value: Faction ID (1=VS, 2=NC, 3=TR, 4=NSO)
   */
  region_ownership: Record<RegionID, Faction>;
}

/**
 * Core analysis provider interface that converts territory data into link states
 *
 * This interface enables swappable analysis strategies for different tactical
 * perspectives (e.g., contestable links, faction control analysis, etc.)
 */
export interface TerritoryAnalysisProvider {
  /**
   * Analyze lattice links based on current territory control
   *
   * @param territory Current territory snapshot with region ownership
   * @param zone Zone data containing lattice links and facility information
   * @returns Map of facility link keys to their strategic states
   */
  analyzeLinkStates(
    territory: TerritorySnapshot,
    zone: Zone
  ): Map<FacilityLinkKey, LinkState>;
}
