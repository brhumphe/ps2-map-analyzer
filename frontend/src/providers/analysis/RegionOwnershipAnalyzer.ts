import { Faction, type RegionID } from '@/types/common';
import type { TerritorySnapshot } from '@/types/territory';
import type { Zone } from '@/types/zone_types';
import type {
  RegionAnalysisProvider,
  RegionState,
} from '@/types/region_analysis';
import { zoneUtils } from '@/utilities/zone_utils';

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
   * @param playerFaction
   * @returns Map of region IDs to their ownership states
   */
  analyzeRegionStates(
    territory: TerritorySnapshot,
    zone: Zone,
    playerFaction: Faction
  ): Map<RegionID, RegionState> {
    const regionStates = new Map<RegionID, RegionState>();
    // Collect the factions of the neighboring regions
    const adjacentRegions = zoneUtils.getRegionNeighborsMap(zone);

    // Set faction ownership
    zone.regions.forEach((region) => {
      const regionId = region.map_region_id;
      const factionId = territory.region_ownership[regionId];
      const neighbors = adjacentRegions.get(regionId) ?? new Set<RegionID>();
      const neighbor_ownership = new Set<Faction>();

      for (const neighbor of neighbors) {
        const faction = territory.region_ownership[neighbor];
        neighbor_ownership.add(faction);
      }
      // Can be stolen if both opposing factions have a connection to the base
      const hostile_neighbors = new Set(neighbor_ownership);
      hostile_neighbors.delete(factionId);
      hostile_neighbors.delete(Faction.NONE);
      const can_capture =
        hostile_neighbors.size > 0 && factionId != Faction.NONE;
      const can_steal = can_capture && hostile_neighbors.size > 1;
      let relevant = this.isRegionRelevantForPlayer(
        playerFaction,
        factionId,
        can_capture,
        neighbor_ownership
      );

      const state: RegionState = {
        owning_faction_id: factionId,
        region_id: regionId,
        adjacent_faction_ids: neighbor_ownership,
        can_steal: can_steal,
        can_capture: can_capture,
        is_active: factionId != Faction.NONE,
        relevant_to_player: relevant,
      };

      regionStates.set(regionId, state);
    });

    return regionStates;
  }

  private isRegionRelevantForPlayer(
    playerFaction: Faction,
    factionId: Faction,
    can_capture: boolean,
    neighbor_ownership: Set<Faction>
  ) {
    // Neutral regions are never relevant
    if (factionId === Faction.NONE) {
      return false;
    }

    let relevant = false;
    // If there hasn't been an explicit choice, treat everything as relevant
    if (playerFaction === Faction.NONE) {
      relevant = true;
    }

    // Regions the player needs to defend
    if (playerFaction === factionId && can_capture) {
      relevant = true;
    }
    // Regions the player can attack
    if (playerFaction != factionId && neighbor_ownership.has(playerFaction)) {
      relevant = true;
    }

    return relevant;
  }
}
