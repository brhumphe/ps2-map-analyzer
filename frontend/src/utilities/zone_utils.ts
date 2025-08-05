// Create a new file: src/utils/zone_utils.ts

import {
  Zone,
  RegionHex,
  Region,
  WorldCoordinate,
  FacilityLink,
  FacilityLinkKey,
  type RegionKey,
} from '@/types/zone_types';
import { FacilityID, RegionID } from '@/types/common';
import { HexCoordinate } from '@/utilities/hexagons';

/**
 * Utility functions for working with Zone data
 */
export const zoneUtils = {
  /**
   * Gets all hexes belonging to a specific region
   * @param zone - The zone containing the regions
   * @param regionId - The ID of the region to get hexes for
   * @returns Array of RegionHex objects for the region, or undefined if region not found
   */
  getRegionHexes(zone: Zone, regionId: RegionID): RegionHex[] | undefined {
    return zone.regions.find((region) => region.map_region_id === regionId)
      ?.hexes;
  },

  /**
   * Gets all hexes in the zone
   * @param zone - The zone to get all hexes from
   * @returns Array of RegionHex objects from all regions
   */
  getAllHexes(zone: Zone): RegionHex[] {
    return zone.regions.flatMap((region) => region.hexes);
  },

  /**
   * Gets a single region from a zone by its ID
   * @param zone - The zone containing the regions
   * @param regionId - The ID of the region to get
   * @returns The Region object if found, undefined otherwise
   */
  getRegion(zone: Zone, regionId: RegionID): Region | undefined {
    return zone.regions.find((region) => region.map_region_id === regionId);
  },

  extractRegionHexCoords(zone: Zone, regionId: RegionID): HexCoordinate[] {
    let coords: HexCoordinate[] = [];
    for (const region of zone.regions) {
      if (regionId === region.map_region_id) {
        for (const regionHex of region.hexes) {
          coords.push({ x: regionHex.x, y: regionHex.y });
        }
      }
    }
    return coords;
  },

  extractAllZoneHexCoords(zone: Zone) {
    let coords: HexCoordinate[] = [];
    for (const region of zone.regions) {
      for (const regionHex of region.hexes) {
        coords.push({ x: regionHex.x, y: regionHex.y });
      }
    }
    return coords;
  },

  /**
   * Extracts the facility coordinates from a given zone object.
   * Iterates through the regions of the zone and retrieves the coordinates for each facility.
   */
  extractFacilityCoordinates(zone: Zone): Record<number, WorldCoordinate> {
    const facility_coords = {};
    for (const obj of zone['regions']) {
      if (obj['location_x'] !== undefined && obj['location_z'] !== undefined) {
        facility_coords[obj['facility_id']] = {
          x: obj['location_x'],
          z: obj['location_z'],
        };
      }
    }
    return facility_coords;
  },

  /**
   * Generate canonical key for a lattice link
   * Ensures consistent ordering regardless of input order
   */
  getLinkKey(link: FacilityLink): FacilityLinkKey {
    const facilityA = link.facility_id_a;
    const facilityB = link.facility_id_b;
    const [lower, higher] =
      facilityA < facilityB ? [facilityA, facilityB] : [facilityB, facilityA];
    return `${lower}-${higher}` as FacilityLinkKey;
  },

  /**
   * Generate key for a region id for use in maps
   */
  getRegionKey(regionId: RegionID): RegionKey {
    return `region_${regionId}` as RegionKey;
  },

  /**
   * Creates a mapping of region IDs to their neighboring region IDs using facility links
   * @param zone - The zone containing regions and facility links
   * @returns Map where key is a region ID and value is a Set of neighboring region IDs
   */
  getRegionNeighborsMap(zone: Zone): Map<RegionID, Set<RegionID>> {
    const neighbors = new Map<RegionID, Set<RegionID>>();

    // Initialize empty sets for all regions
    zone.regions.forEach((region) => {
      neighbors.set(region.map_region_id, new Set<RegionID>());
    });

    // Use facility links to determine neighbors
    zone.links?.forEach((link) => {
      const regionA = zone.regions.find(
        (r) => r.facility_id === link.facility_id_a
      )?.map_region_id;
      const regionB = zone.regions.find(
        (r) => r.facility_id === link.facility_id_b
      )?.map_region_id;

      if (regionA && regionB) {
        neighbors.get(regionA)?.add(regionB);
        neighbors.get(regionB)?.add(regionA);
      }
    });

    return neighbors;
  },

  /**
   * Creates a mapping of facility IDs to their neighboring facility IDs using facility links
   * @param zone - The zone containing facilities and facility links
   * @returns Map where key is a facility ID and value is a Set of neighboring facility IDs
   */
  getFacilityNeighborsMap(zone: Zone): Map<FacilityID, Set<FacilityID>> {
    const neighbors = new Map<FacilityID, Set<FacilityID>>();

    // Initialize empty sets for all facilities
    zone.regions.forEach((region) => {
      if (region.facility_id) {
        neighbors.set(region.facility_id, new Set<FacilityID>());
      }
    });

    // Use facility links to determine neighbors
    zone.links?.forEach((link) => {
      const facilityA = link.facility_id_a;
      const facilityB = link.facility_id_b;

      neighbors.get(facilityA)?.add(facilityB);
      neighbors.get(facilityB)?.add(facilityA);
    });

    return neighbors;
  },
} as const; // Make the object immutable
