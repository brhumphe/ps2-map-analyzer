import type {
  Continent,
  FacilityID,
  FacilityType,
  RegionID,
} from '@/types/common';

/**
 * Represents coordinates in the game world coordinate system.
 * Note that PS2 uses Y-axis vertical 3D coordinates, so discard y for 2D map purposes.
 */
export interface WorldCoordinate {
  x: number;
  z: number;
}

export interface RegionHex {
  x: number;
  y: number;
  // hex_type: number; // Currently unused
  // type_name: string; // Currently unused
}

/**
 * Represents a facility/region in the game world
 */
export interface Region {
  facility_id: FacilityID;
  facility_name: string;
  facility_type_id: FacilityType;
  map_region_id: RegionID;
  location: WorldCoordinate;
  zone_id: Continent;
  hexes: RegionHex[];
}

/**
 * Represents a link between two facilities in the lattice system
 */
export interface FacilityLink {
  facility_id_a: FacilityID;
  facility_id_b: FacilityID;
  zone_id: Continent;
}

export type FacilityLinkKey = `${number}-${number}` & {
  readonly __brand: 'FacilityLinkKey';
};
export type RegionKey = `region_${number}` & { readonly __brand: 'RegionKey' };

/**
 * Represents a zone (continent) with all its regions and facility links.
 * This is static data that should not change unless developers revise maps.
 */
export interface Zone {
  /** The continent identifier (e.g., Indar, Amerish, Hossin, Esamir) */
  zone_id: Continent;

  /** Short code for the zone (e.g., "indar", "amerish") */
  code: string;

  /** Human-readable zone name (e.g., "Indar", "Amerish") */
  name: string;

  /** Size of hexagonal grid cells (inner diameter) */
  hex_size: number;

  /** Map of all regions/facilities in this zone, keyed by region ID */
  regions: Map<RegionID, Region>;

  /** Map of all lattice links between facilities, keyed by facility link key */
  links: Map<FacilityLinkKey, FacilityLink>;

  // Computed properties

  /** Map of each region to its adjacent regions */
  neighbors: Map<RegionID, Set<RegionID>>;

  /** Reverse lookup map from facility ID to the region that contains it */
  facility_to_region_map: Map<FacilityID, RegionID>;
}
