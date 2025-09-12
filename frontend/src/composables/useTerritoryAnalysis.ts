import { computed, type Ref } from 'vue';
import type { TerritorySnapshot } from '@/types/territory';
import type { Zone } from '@/types/zone_types';
import {
  findDistancesFromFrontline,
  findFrontlineRegions,
  findWarpgateConnectedRegions,
  type NodeDistanceResult,
  PS2Graph,
} from '@/utilities/graph';
import { Faction, type RegionID } from '@/types/common';

export function useTerritoryAnalysis(
  territorySnapshot: Ref<TerritorySnapshot | null>,
  currentZone: Ref<Zone | null>
) {
  const graph = computed<PS2Graph | null>(() => {
    if (territorySnapshot.value && currentZone.value) {
      return PS2Graph.build(currentZone.value, territorySnapshot.value);
    } else {
      return null;
    }
  });

  const warpgateConnectedRegions = computed<Map<RegionID, number> | null>(
    () => {
      if (graph.value) {
        return findWarpgateConnectedRegions(graph.value);
      } else {
        return null;
      }
    }
  );

  const frontlineRegions = computed<Map<Faction, Set<RegionID>> | null>(() => {
    if (graph.value) {
      return findFrontlineRegions(graph.value);
    } else {
      return null;
    }
  });

  const distancesToFrontline = computed<Map<
    RegionID,
    NodeDistanceResult
  > | null>(() => {
    if (graph.value) {
      return findDistancesFromFrontline(graph.value);
    } else {
      return null;
    }
  });

  return {
    graph,
    warpgateConnectedRegions,
    frontlineRegions,
    distancesToFrontline,
  };
}
