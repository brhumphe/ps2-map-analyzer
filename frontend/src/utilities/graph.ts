import {
  type Continent,
  type FacilityID,
  FacilityType,
  Faction,
  type RegionID,
} from '@/types/common';
import type { WorldCoordinate, Zone } from '@/types/zone_types';
import type { TerritorySnapshot } from '@/types/territory';

////////////////////////////
// Generic Graph Types
////////////////////////////
export interface Edge<TNodeID> {
  from: TNodeID;
  to: TNodeID;
  weight?: number;
}

export type EdgeFilter<TEdge, TGraph> = (edge: TEdge, graph: TGraph) => boolean;

export type Graph<TNodeID, TNodeData, TEdgeID, TEdge> = {
  nodes: Map<TNodeID, TNodeData>;
  neighbors: Map<TNodeID, Set<TNodeID>>;
  edges: Map<TEdgeID, TEdge>;
};

////////////////////////////////////
// Domain-specific graph types
////////////////////////////////////
export interface RegionNodeData {
  facility_id: FacilityID;
  facility_name: string;
  facility_type_id: FacilityType;
  map_region_id: RegionID;
  location: WorldCoordinate;
  zone_id: Continent;
  owning_faction: Faction;
}

export type RegionEdgeKey = `${number}-${number}` & {
  readonly __brand: 'RegionEdgeKey';
};

export type RegionEdge = Edge<RegionID>;

namespace RegionEdge {
  export function makeKey(edge: RegionEdge): RegionEdgeKey {
    const [lower, higher] =
      edge.from < edge.to ? [edge.from, edge.to] : [edge.to, edge.from];
    return `${lower}-${higher}` as RegionEdgeKey;
  }
}

export type PS2Graph = Graph<
  RegionID,
  RegionNodeData,
  RegionEdgeKey,
  Edge<RegionID>
> & {
  facility_to_region_map: Map<FacilityID, RegionID>;
  facility_type_to_region_map: Map<FacilityType, RegionID[]>;
};

export namespace PS2Graph {
  export function build(zone: Zone, snapshot: TerritorySnapshot): PS2Graph {
    const nodes = new Map<RegionID, RegionNodeData>();
    const facility_to_region_map = zone.facility_to_region_map;
    const facility_type_to_region_map = zone.facility_type_to_region_map;

    for (const [regionId, region] of zone.regions) {
      const node: RegionNodeData = {
        facility_id: region.facility_id,
        facility_name: region.facility_name,
        facility_type_id: region.facility_type_id,
        map_region_id: region.map_region_id,
        location: region.location,
        zone_id: region.zone_id,
        owning_faction:
          snapshot.region_ownership.get(region.map_region_id) ?? Faction.NONE,
      };
      nodes.set(regionId, node);
    }

    const edges = new Map<RegionEdgeKey, RegionEdge>();
    for (const link of zone.links.values()) {
      const regionA = zone.facility_to_region_map.get(link.facility_id_a);
      const regionB = zone.facility_to_region_map.get(link.facility_id_b);
      if (!regionA || !regionB) {
        console.warn(
          `Link ${link.facility_id_a} -> ${link.facility_id_b} has missing region IDs.`
        );
        continue;
      }
      const new_edge = { from: regionA, to: regionB };
      edges.set(RegionEdge.makeKey(new_edge), new_edge);
    }

    return {
      neighbors: zone.neighbors,
      edges,
      nodes,
      facility_to_region_map,
      facility_type_to_region_map,
    };
  }
}

/**
 * Represents an item in a node queue with a unique region identifier and associated visit arguments.
 *
 * This generic type is used to store metadata and data required for visiting a particular node.
 *
 * @template TVisitArgs - The type of the visit arguments associated with the node.
 * @property {RegionID} id - The unique identifier for the region associated with the node.
 * @property {TVisitArgs} args - Arguments or parameters associated with the node visit operation.
 */
export type NodeQueueItem<TVisitArgs> = { id: RegionID; args: TVisitArgs };

/**
 * Performs a multi-source breadth-first search (BFS) on the given graph.
 *
 * @template TNodeResult - The type of the result returned for each visited node.
 * @template TVisitArgs - The type of the arguments associated with each node visit operation.
 * @param {PS2Graph} graph - The graph on which the BFS is performed.
 * @param {NodeQueueItem<TVisitArgs>[]} start - An array of starting nodes, each with its associated visit arguments.
 * @param {(node: RegionID, args: TVisitArgs, graph: PS2Graph, results: ReadonlyMap<RegionID, TNodeResult>, visited: Set<RegionID>) => { result: TNodeResult; visitNext: NodeQueueItem<TVisitArgs>[] }} visitNode - A callback function that processes a node during the BFS. It returns an object containing the result for the current node and an array of nodes to visit next.
 * @return {Map<RegionID, TNodeResult>} A map where each key is a node ID and the corresponding value is the result of visiting that node.
 */
export function multisourceBfs<TNodeResult, TVisitArgs>(
  graph: PS2Graph,
  start: NodeQueueItem<TVisitArgs>[],
  visitNode: (
    node: RegionID,
    args: TVisitArgs,
    graph: PS2Graph,
    results: ReadonlyMap<RegionID, TNodeResult>,
    visited: Set<RegionID>
  ) => { result: TNodeResult; visitNext: NodeQueueItem<TVisitArgs>[] }
): Map<RegionID, TNodeResult> {
  const results = new Map<RegionID, TNodeResult>();
  const visited = new Set<RegionID>();
  for (const node of start) {
    visited.add(node.id);
  }
  const queue: NodeQueueItem<TVisitArgs>[] = [...start];
  while (queue.length > 0) {
    const current = queue.shift()!;

    let { result, visitNext } = visitNode(
      current.id,
      current.args,
      graph,
      results,
      visited
    );
    results.set(current.id, result);
    for (const neighbor of visitNext) {
      if (visited.has(neighbor.id)) {
        continue;
      }
      visited.add(neighbor.id);
      queue.push(neighbor);
    }
  }

  return results;
}

// TNodeResult
export type NodeDistanceResult = { distance: number; path: RegionID[] };
// TVisitArgs
type VisitDistanceArgs = {
  /** Distance of the node currently being visited */
  distance: number;
  /** Faction of the node previously visited. Should be the same as the current node's faction. */
  faction: Faction;
  /** Path of the node currently being visited in order of discovery. This will be
   * the nearest of the set of starting nodes, or if multiple starting nodes are the same distance,
   * the first one encountered. Not necessarily deterministic which path is returned in the case of ties.*/
  path: RegionID[];
};

/**
 * Given a list of regions, find all regions by following links to friendly regions.
 * Uses the faction ID of the starting regions to determine which links to follow.
 * Distances are in number of hops from the starting regions.
 *
 * If multiple starting regions belong to the same faction, the distance
 * will be the minimum distance from any of the starting regions.
 *
 * @param startingRegions
 * @param graph
 * @private
 */
export function findConnectedFriendlyRegions(
  startingRegions: RegionID[],
  graph: PS2Graph
): Map<RegionID, NodeDistanceResult> {
  const start: NodeQueueItem<VisitDistanceArgs>[] = [];
  // Collect all starting nodes.
  for (const regionID of startingRegions) {
    const regionInfo = graph.nodes.get(regionID);
    const faction = regionInfo?.owning_faction;
    if (!faction) {
      // Can't follow links if we don't know the faction of the region.
      continue;
    }
    start.push({
      id: regionID,
      args: { distance: 0, faction: faction, path: [regionID] },
    });
  }

  function visitNode(
    node: RegionID,
    args: VisitDistanceArgs,
    graph: PS2Graph,
    _results: ReadonlyMap<RegionID, NodeDistanceResult>,
    _visited: Set<RegionID>
  ): {
    result: { distance: number; path: RegionID[] };
    visitNext: NodeQueueItem<VisitDistanceArgs>[];
  } {
    const regionInfo = graph.nodes.get(node);
    const faction = regionInfo?.owning_faction;
    // Follow links to friendly regions
    const visitNext: NodeQueueItem<VisitDistanceArgs>[] = [];
    for (const neighborID of graph.neighbors.get(node) ?? []) {
      const neighborFaction = graph.nodes.get(neighborID)?.owning_faction;
      if (neighborFaction != undefined && neighborFaction === faction) {
        // Follow the link.
        // DFS should guarantee that the first time a node is visited will
        // be the one with the shortest distance of all starting nodes.
        visitNext.push({
          id: neighborID,
          args: {
            distance: args.distance + 1,
            faction: faction,
            path: [...args.path, neighborID],
          },
        });
      }
    }

    return {
      result: { distance: args.distance, path: args.path },
      visitNext: visitNext,
    };
  }

  return multisourceBfs<NodeDistanceResult, VisitDistanceArgs>(
    graph,
    start,
    visitNode
  );
}

export function findWarpgateConnectedRegions(
  graph: PS2Graph
): Map<RegionID, number> {
  const warpgateRegions = graph.facility_type_to_region_map.get(
    FacilityType.WARPGATE
  );
  if (!warpgateRegions) {
    // No warpgate regions found. This should never happen, but just in case.
    console.warn('No warpgate regions found in the graph.');
    return new Map<RegionID, number>();
  }
  const wgDistances = new Map<RegionID, number>();
  const results: Map<RegionID, NodeDistanceResult> =
    findConnectedFriendlyRegions(warpgateRegions, graph);
  for (const [regionID, result] of results) {
    wgDistances.set(regionID, result.distance);
  }
  return wgDistances;
}

export function findFrontlineRegions(
  graph: PS2Graph
): Map<Faction, Set<RegionID>> {
  const byFaction = new Map<Faction, Set<RegionID>>();
  for (const [_, edge] of graph.edges) {
    const factionA = graph.nodes.get(edge.from)?.owning_faction;
    const factionB = graph.nodes.get(edge.to)?.owning_faction;
    if (
      factionA != undefined &&
      factionB != undefined &&
      factionA != Faction.NONE &&
      factionB != Faction.NONE &&
      factionA !== factionB
    ) {
      byFaction.set(
        factionA,
        (byFaction.get(factionA) ?? new Set()).add(edge.from)
      );
      byFaction.set(
        factionB,
        (byFaction.get(factionB) ?? new Set()).add(edge.to)
      );
    }
  }
  return byFaction;
}

export function findDistancesFromFrontline(
  graph: PS2Graph
): Map<RegionID, NodeDistanceResult> {
  const frontlineRegions = findFrontlineRegions(graph);
  const frontlineDistances = new Map<RegionID, NodeDistanceResult>();
  const results: Map<RegionID, NodeDistanceResult> =
    findConnectedFriendlyRegions(
      [...frontlineRegions.values()].flatMap((regions) => [
        ...regions.values(),
      ]),
      graph
    );
  for (const [regionID, result] of results) {
    frontlineDistances.set(regionID, result);
  }
  return frontlineDistances;
}
