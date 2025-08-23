import {
  type Continent,
  type FacilityID,
  type FacilityType,
  Faction,
  type RegionID,
} from '@/types/common.ts';
import type { WorldCoordinate, Zone } from '@/types/zone_types.ts';
import type { TerritorySnapshot } from '@/types/territory.ts';

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
};

export namespace PS2Graph {
  export function build(zone: Zone, snapshot: TerritorySnapshot): PS2Graph {
    const nodes = new Map<RegionID, RegionNodeData>();
    const facility_to_region_map = zone.facility_to_region_map;

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
      const new_edge = { from: regionA!, to: regionB! };
      edges.set(RegionEdge.makeKey(new_edge), new_edge);
    }

    return { neighbors: zone.neighbors, edges, nodes, facility_to_region_map };
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
type NodeQueueItem<TVisitArgs> = { id: RegionID; args: TVisitArgs };

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
