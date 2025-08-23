import {
  type Continent,
  type FacilityID,
  type FacilityType,
  Faction,
  type RegionID,
} from '@/types/common.ts';
import type {
  FacilityLink,
  WorldCoordinate,
  Zone,
} from '@/types/zone_types.ts';
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
  function build(zone: Zone, snapshot: TerritorySnapshot): PS2Graph {
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
          snapshot.region_ownership.get(region.map_region_id) ?? 0,
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
