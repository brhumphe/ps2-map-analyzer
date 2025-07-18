// Create a new file: src/utils/zone_utils.ts

import {Zone, RegionHex, Region, WorldCoordinate, FacilityLink, FacilityLinkKey} from '@/types/zone_types';
import {FacilityID, RegionID} from '@/types/common';
import {HexCoordinate} from "@/utilities/hexagons";

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
        return zone.regions.find(region => region.map_region_id === regionId)?.hexes;
    },

    /**
     * Gets all hexes in the zone
     * @param zone - The zone to get all hexes from
     * @returns Array of RegionHex objects from all regions
     */
    getAllHexes(zone: Zone): RegionHex[] {
        return zone.regions.flatMap(region => region.hexes);
    },

    /**
     * Gets a single region from a zone by its ID
     * @param zone - The zone containing the regions
     * @param regionId - The ID of the region to get
     * @returns The Region object if found, undefined otherwise
     */
    getRegion(zone: Zone, regionId: RegionID): Region | undefined {
        return zone.regions.find(region => region.map_region_id === regionId);
    },

    extractRegionHexCoords(zone:Zone, regionId: RegionID): HexCoordinate[] {
        let coords: HexCoordinate[] = []
        for (const region of zone.regions) {
            if (regionId === region.map_region_id){
                for (const regionHex of region.hexes) {
                    coords.push({x: regionHex.x, y: regionHex.y})
                }
            }
        }
        return coords
    },

    extractAllZoneHexCoords(zone:Zone) {
        let coords: HexCoordinate[] = []
        for (const region of zone.regions) {
            for (const regionHex of region.hexes) {
                coords.push({x: regionHex.x, y: regionHex.y})
            }
        }
        return coords
    },


    /**
     * Extracts the facility coordinates from a given zone object.
     * Iterates through the regions of the zone and retrieves the coordinates for each facility.
     */
    extractFacilityCoordinates(zone: Zone):Record<number, WorldCoordinate> {
        const facility_coords = {};
        for (const obj of zone["regions"]) {
            if (obj["location_x"] !== undefined && obj["location_z"] !== undefined) {
                facility_coords[obj["facility_id"]] = {x: obj["location_x"], z:obj["location_z"]};
            }
        }
        return facility_coords;
    },

      /**
   * Generate canonical key for a lattice link
   * Ensures consistent ordering regardless of input order
   */
  getLinkKey(link:FacilityLink): FacilityLinkKey {
      const facilityA = link.facility_id_a;
      const facilityB = link.facility_id_b;
      const [lower, higher] = facilityA < facilityB ? [facilityA, facilityB] : [facilityB, facilityA];
      return `${lower}-${higher}` as FacilityLinkKey;
  },
} as const;  // Make the object immutable
