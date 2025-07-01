/**
 * Represents coordinates in the game world coordinate system.
 * Uses (x, z) coordinates where Y-axis is up in 3D space but discarded for 2D mapping.
 */
export interface GameCoordinates {
  x: number;
  z: number;
}

/**
 * Represents a facility/region in the game world
 */
export interface Region {
  facility_id: number;
  facility_name: string;
  facility_type_id: number;
  map_region_id: number;
  location_x?: number;
  location_y?: number;
  location_z?: number;
  zone_id: number;
}

/**
 * Represents a link between two facilities in the lattice system
 */
export interface FacilityLink {
  facility_id_a: number;
  facility_id_b: number;
  zone_id: number;
}

/**
 * Represents a zone (continent) with all its regions and facility links
 */
export interface Zone {
  zone_id: number;
  code: string;
  name: string;
  hex_size: number;
  regions: Region[];
  links: FacilityLink[];
}
