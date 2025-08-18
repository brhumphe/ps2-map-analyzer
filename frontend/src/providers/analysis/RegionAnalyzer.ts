import { Faction, type RegionID } from '@/types/common';
import type {
  RegionAnalysisProvider,
  RegionState,
  TerritorySnapshot,
} from '@/types/territory';
import type { Zone } from '@/types/zone_types';

/**
 * Per-region analysis
 */
export class RegionAnalyzer implements RegionAnalysisProvider {
  /**
   * Analyze regions by converting faction ownership to region states
   *
   * @param territory Current territory snapshot with region ownership
   * @param zone Zone data containing region information
   * @param playerFaction Player's selected faction
   * @returns Map of region IDs to their ownership states
   */
  analyzeRegionStates(
    territory: TerritorySnapshot,
    zone: Zone,
    playerFaction: Faction
  ): Map<RegionID, RegionState> {
    const regionStates = new Map<RegionID, RegionState>();

    for (const region of zone.regions.values()) {
      const regionState = this.analyzeRegion(
        region.map_region_id,
        territory,
        zone.neighbors,
        playerFaction
      );
      regionStates.set(region.map_region_id, regionState);
    }

    return regionStates;
  }

  /**
   * Analyze a single region to determine its tactical state
   */
  private analyzeRegion(
    regionId: RegionID,
    territory: TerritorySnapshot,
    neighborMap: Map<RegionID, Set<RegionID>>,
    playerFaction: Faction
  ): RegionState {
    const owningFaction = territory.region_ownership[regionId];
    const neighbors = neighborMap.get(regionId) ?? new Set<RegionID>();

    const neighborFactions = this.getNeighborFactions(neighbors, territory);
    const tacticalInfo = this.calculateTacticalOpportunities(
      owningFaction,
      neighborFactions,
      playerFaction
    );

    return {
      owning_faction_id: owningFaction,
      region_id: regionId,
      adjacent_faction_ids: neighborFactions,
      can_steal: tacticalInfo.canSteal,
      can_capture: tacticalInfo.canCapture,
      is_active: owningFaction !== Faction.NONE,
      relevant_to_player: this.isRegionRelevantForPlayer(
        playerFaction,
        owningFaction,
        tacticalInfo.canCapture,
        neighborFactions
      ),
    };
  }

  /**
   * Get all factions that control neighboring regions
   */
  private getNeighborFactions(
    neighbors: Set<RegionID>,
    territory: TerritorySnapshot
  ): Set<Faction> {
    const neighborFactions = new Set<Faction>();

    for (const neighborId of neighbors) {
      const faction = territory.region_ownership[neighborId];
      neighborFactions.add(faction);
    }

    return neighborFactions;
  }

  /**
   * Calculate tactical capture and steal opportunities for a region
   */
  private calculateTacticalOpportunities(
    owningFaction: Faction,
    neighborFactions: Set<Faction>,
    playerFaction: Faction
  ): { canCapture: boolean; canSteal: boolean } {
    // Can't capture or steal neutral regions
    if (owningFaction === Faction.NONE) {
      return { canCapture: false, canSteal: false };
    }

    // Find enemy factions adjacent to this region
    const enemyNeighbors = new Set(neighborFactions);
    enemyNeighbors.delete(owningFaction);
    enemyNeighbors.delete(Faction.NONE);

    // Can capture if any enemy faction is adjacent
    const canCapture = enemyNeighbors.size > 0;

    // Can steal if an enemy base is a 3-way fight
    const canSteal =
      owningFaction != playerFaction && canCapture && enemyNeighbors.size > 1;

    return { canCapture, canSteal };
  }

  /**
   * Determine if a region is strategically relevant to the player
   */
  private isRegionRelevantForPlayer(
    playerFaction: Faction,
    owningFaction: Faction,
    canCapture: boolean,
    neighborFactions: Set<Faction>
  ): boolean {
    // Neutral regions are never relevant
    if (owningFaction === Faction.NONE) {
      return false;
    }

    // If no faction selected, treat all active regions as relevant
    if (playerFaction === Faction.NONE) {
      return true;
    }

    // Player's regions under threat are relevant
    if (playerFaction === owningFaction && canCapture) {
      return true;
    }

    // Enemy regions the player can attack are relevant
    return (
      playerFaction !== owningFaction && neighborFactions.has(playerFaction)
    );
  }
}
