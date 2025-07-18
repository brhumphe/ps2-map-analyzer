// Create a new file: src/utils/zone_utils.ts

import {Zone, RegionHex, Region} from '@/types/zone_types';
import { RegionID } from '@/types/common';

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
    }
} as const;  // Make the object immutable
