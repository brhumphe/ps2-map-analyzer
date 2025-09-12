// types/territory.ts

import { Continent, Faction, type RegionID, World } from '@/types/common';
import type { FacilityLinkKey, Zone } from '@/types/zone_types';
import type { NodeDistanceResult } from '@/utilities/graph';

/**
 * Strategic classification of lattice links based on connected region ownership
 *
 * This type represents the tactical significance of a lattice connection
 * and is used as input for various display modes and styling calculations.
 */
export type LinkState =
  | { status: 'inactive' } // Link is not operational (bases offline/inaccessible)
  | { status: 'safe'; faction: Faction } // Both ends are controlled by the same faction (no tactical opportunity)
  | { status: 'contestable'; factionA: Faction; factionB: Faction } // Connected bases have different faction ownership (tactical opportunity)
  | { status: 'unknown' }; // Territory data incomplete or unavailable

/**
 * Raw territory data containing region ownership information
 *
 * This format provides efficient lookups for region ownership while being
 * compatible with both client-side analysis and backend API responses.
 */
export interface TerritorySnapshot {
  /** Unix timestamp when this snapshot was captured */
  timestamp: number | undefined;

  /** Continent/zone identifier (2=Indar, 6=Amerish, etc.) */
  continent: Continent;

  /** World/server identifier where this territory state applies */
  world: World;

  /**
   * Mapping of region ID to controlling faction ID
   * - Key: Region ID (map_region_id from zone data)
   * - Value: Faction ID (1=VS, 2=NC, 3=TR, 4=NSO)
   */
  region_ownership: Map<RegionID, Faction>;
}

/**
 * Per-link analysis interface that converts territory data into link states
 */
export interface LinkAnalysisProvider {
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
  adjacent_faction_ids: Set<Faction>;
  /** If the region can be stolen by any faction (last-minute intervention in 3-way fight) */
  can_steal: boolean;
  /** Whether any faction can capture this region */
  can_capture: boolean;
  /** Whether this region is enabled for faction control */
  is_active: boolean;
  /** Regions that are important right now (can be attacked or defended) */
  relevant_to_player: boolean;
  /** Distance to warpgate in number of lattice links. -1 if there is no valid path to the faction warpgate. */
  distance_to_wg: number;
  /** Hops to frontline of lattice links. -1 if there is no valid path to a contested region. */
  distance_to_front: number;
}

/**
 * Region analysis provider interface that converts territory data into region states
 */
export interface RegionAnalysisProvider {
  /**
   * Per-region analysis based on territory control
   *
   * @param territory Current territory snapshot with region ownership
   * @param zone Zone data containing region information
   * @param playerFaction Faction of the user (for strategic analysis)
   * @param warpgateConnectedRegions Distances to warpgate, if connected.
   * @param distancesToFrontline Distances to the nearest frontline region.
   * @returns Map of region IDs to their strategic states
   */
  analyzeRegionStates(
    territory: TerritorySnapshot,
    zone: Zone,
    playerFaction: Faction,
    warpgateConnectedRegions: Map<RegionID, number> | null,
    distancesToFrontline: Map<RegionID, NodeDistanceResult> | null
  ): Map<RegionID, RegionState>;
}
