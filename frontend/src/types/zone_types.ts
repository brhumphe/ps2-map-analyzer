import { Continent, FacilityID, RegionID } from '@/types/common';

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
  hex_type: number;
  type_name: string;
}

/**
 * Represents a facility/region in the game world
 */
export interface Region {
  facility_id: FacilityID;
  facility_name: string;
  facility_type_id: number;
  map_region_id: RegionID;
  location_x?: number;
  location_y?: number;
  location_z?: number;
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
 * Represents a zone (continent) with all its regions and facility links
 */
export interface Zone {
  zone_id: Continent;
  code: string;
  name: string;
  hex_size: number;
  regions: Region[];
  links: FacilityLink[];
}
