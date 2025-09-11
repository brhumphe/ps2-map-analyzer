import { reactive, computed, watch } from 'vue';
import * as L from 'leaflet';
import type { RegionKey, Zone } from '@/types/zone_types';
import type { RegionID } from '@/types/common';
import { zoneUtils } from '@/utilities/zone_utils';
import { world_to_latLng } from '@/utilities/coordinates';
import { useRegionAnalysis } from '@/composables/useRegionAnalysis';
import { useRegionHover } from '@/composables/useRegionHover';
import { useTerritoryData } from '@/composables/useTerritoryData';
import { useLeafletMap } from '@/composables/useLeafletMap';
import { useAppState } from '@/composables/useAppState';

interface RegionMarker {
  position: L.LatLng;
  popup: string;
  options?: L.MarkerOptions;
  regionId: RegionID;
  facilityName: string;
  tooltip?: string;
}

export function useRegionMarkers() {
  // Get dependencies from singleton composables
  const { territorySnapshot } = useTerritoryData();
  const { currentZone } = useLeafletMap();
  const { getRegionState } = useRegionAnalysis(territorySnapshot, currentZone);
  const { currentHoveredRegion } = useRegionHover();
  const { playerFaction } = useAppState();

  // Reactive collection of region marker data (leaflet objects handled in MarkerEntity component)
  const regionMarkers = reactive(new Map<RegionKey, RegionMarker>());

  /**
   * Initialize region markers from zone data
   */
  const initializeRegionMarkers = (
    zone: Zone,
    defaultOptions: L.MarkerOptions = { opacity: 0, interactive: false }
  ) => {
    // Clear existing markers
    regionMarkers.clear();

    for (const region of zone.regions.values()) {
      try {
        // Convert coordinates to Leaflet position
        const position = world_to_latLng(
          zoneUtils.getRegionCenter(zone, region.map_region_id)
        );

        // Create popup content
        const popup = `Region ${region.facility_name} regionID:${region.map_region_id} @ ${region.location.x}, ${region.location.z}`;

        // Create marker entry
        const key = zoneUtils.getRegionKey(region.map_region_id);
        regionMarkers.set(key, {
          position,
          popup,
          options: { ...defaultOptions },
          regionId: region.map_region_id,
          facilityName: region.facility_name,
          tooltip: region.facility_name, // Initially set tooltip to facility name
        });
      } catch (_error) {
        // Skip regions that can't be created
        continue;
      }
    }

    // Update initial visibility after markers are created
    updateMarkerVisibility();
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
      regionMarkers.set(key, {
        ...marker,
        ...updates,
      });
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

  /**
   * Update marker opacity and tooltip visibility based on strategic relevance and hover state
   */
  const updateMarkerVisibility = () => {
    for (const [_, marker] of regionMarkers) {
      const regionState = getRegionState.value(marker.regionId);
      const isHovered = currentHoveredRegion.value === marker.regionId;
      const isRelevantToPlayer = regionState?.relevant_to_player ?? false;

      // Hide all markers by default
      const shouldShowMarker = false;

      const shouldShowTooltip = isHovered || isRelevantToPlayer;

      // Update marker opacity
      if (marker.options) {
        marker.options.opacity = shouldShowMarker ? 1 : 0;
      }

      // Update tooltip based on relevance to player
      if (shouldShowTooltip) {
        // Show tooltip with facility name
        marker.tooltip = marker.facilityName;
      } else {
        // Hide tooltip by setting undefined
        marker.tooltip = undefined;
      }
    }
  };

  // Watch for hover changes and update visibility
  watch(currentHoveredRegion, updateMarkerVisibility);

  // Watch for region state changes and update visibility
  watch(getRegionState, updateMarkerVisibility, { deep: true });

  watch(currentZone, updateMarkerVisibility);

  watch(territorySnapshot, updateMarkerVisibility);

  watch(playerFaction, updateMarkerVisibility);

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
