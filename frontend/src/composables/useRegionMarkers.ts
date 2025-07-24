import { reactive, computed } from 'vue';
import * as L from 'leaflet';
import type { RegionKey, Zone } from '@/types/zone_types';
import type { RegionID } from '@/types/common';
import { world_to_latLng } from '@/utilities/coordinates';
import { zoneUtils } from '@/utilities/zone_utils';

interface RegionMarker {
  position: L.LatLng;
  popup: string;
  options?: L.MarkerOptions;
  regionId: RegionID;
  facilityName: string;
}

export function useRegionMarkers() {
  // Reactive collection of region markers
  const regionMarkers = reactive(new Map<RegionKey, RegionMarker>());

  /**
   * Initialize region markers from zone data
   */
  const initializeRegionMarkers = (
    zone: Zone,
    defaultOptions: L.MarkerOptions = {}
  ) => {
    // Clear existing markers
    regionMarkers.clear();

    for (const region of zone.regions) {
      // Skip regions without location data
      if (
        region.location_x === undefined ||
        region.location_z === undefined
      ) {
        continue;
      }

      try {
        // Convert coordinates to Leaflet position
        const position = world_to_latLng({
          x: region.location_x,
          z: region.location_z,
        });

        // Create popup content
        const popup = `Region ${region.facility_name} regionID:${region.map_region_id} @ ${region.location_x}, ${region.location_z}`;

        // Create marker entry
        const key = zoneUtils.getRegionKey(region.map_region_id);
        regionMarkers.set(key, {
          position,
          popup,
          options: { ...defaultOptions },
          regionId: region.map_region_id,
          facilityName: region.facility_name,
        });
      } catch (error) {
        // Skip regions that can't be created
        continue;
      }
    }
  };

  /**
   * Update marker for a specific region
   */
  const updateRegionMarker = (
    regionId: RegionID,
    updates: Partial<Omit<RegionMarker, 'regionId' | 'facilityName'>>
  ) => {
    const key = zoneUtils.getRegionKey(regionId);
    const marker = regionMarkers.get(key);

    if (marker) {
      // Merge updates with existing marker data
      Object.assign(marker, updates);
    }
  };

  /**
   * Update multiple markers
   */
  const updateMultipleRegionMarkers = (
    updates: Array<{
      regionId: RegionID;
      updates: Partial<Omit<RegionMarker, 'regionId' | 'facilityName'>>;
    }>
  ) => {
    for (const update of updates) {
      updateRegionMarker(update.regionId, update.updates);
    }
  };

  /**
   * Get a specific region marker
   */
  const getRegionMarker = (regionId: RegionID) => {
    const key = zoneUtils.getRegionKey(regionId);
    return regionMarkers.get(key);
  };

  /**
   * Clear all region markers
   */
  const clearMarkers = () => {
    regionMarkers.clear();
  };

  /**
   * Get count of current markers
   */
  const markerCount = computed(() => regionMarkers.size);

  /**
   * Get all region IDs with markers
   */
  const regionIds = computed(() => {
    return Array.from(regionMarkers.values()).map((marker) => marker.regionId);
  });

  return {
    // State
    regionMarkers,
    markerCount,
    regionIds,

    // Actions
    initializeRegionMarkers,
    updateRegionMarker,
    updateMultipleRegionMarkers,
    getRegionMarker,
    clearMarkers,
  };
}