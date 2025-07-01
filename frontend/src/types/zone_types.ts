import {Continent, FacilityID, RegionID} from "./common";

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
  facility_id: FacilityID;
  facility_name: string;
  facility_type_id: number;
  map_region_id: RegionID;
  location_x?: number;
  location_y?: number;
  location_z?: number;
  zone_id: Continent;
}

/**
 * Represents a link between two facilities in the lattice system
 */
export interface FacilityLink {
  facility_id_a: FacilityID;
  facility_id_b: FacilityID;
  zone_id: Continent;
}

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
