import { reactive, computed, watch, type Ref } from 'vue';
import * as L from 'leaflet';
import type { RegionKey, Zone } from '@/types/zone_types';
import type { RegionID } from '@/types/common';
import { world_to_latLng } from '@/utilities/coordinates';
import { zoneUtils } from '@/utilities/zone_utils';
import { HexGeometry } from '@/utilities/hexagons';

interface RegionPolygon {
  points: L.LatLng[];
  style: Partial<L.PolylineOptions>;
  regionId: RegionID;
  facilityName: string;
}

export function useRegionPolygons(
  regionStyles?: Ref<Map<RegionKey, Partial<L.PolylineOptions>>>
) {
  // Default style for regions without territory data
  const unknownRegionStyle: L.PolylineOptions = {
    color: '#666666',
    fillColor: '#333333',
    fillOpacity: 0.2,
    weight: 1,
    opacity: 0.5,
    pane: 'regionPane',
  };

  // Reactive collection of region polygons
  const regionPolygons = reactive(new Map<RegionKey, RegionPolygon>());

  // Watch for region style changes and apply them automatically
  if (regionStyles) {
    watch(
      regionStyles,
      (newStyles) => {
        if (newStyles && newStyles.size > 0 && regionPolygons.size > 0) {
          applyRegionStyles(newStyles);
        }
      },
      { deep: true, immediate: true }
    );
  }

  /**
   * Apply styles from the analysis pipeline to regions
   */
  const applyRegionStyles = (
    styles: Map<RegionKey, Partial<L.PolylineOptions>>
  ) => {
    styles.forEach((style, regionKey) => {
      const region = regionPolygons.get(regionKey);

      if (region) {
        // Replace the entire style object to ensure reactivity
        region.style = { ...style };
      }
    });
  };

  /**
   * Initialize region polygons from zone data
   */
  const initializeRegionPolygons = (
    zone: Zone,
    defaultStyle: L.PolylineOptions = unknownRegionStyle
  ) => {
    // Clear existing polygons
    regionPolygons.clear();

    const geometry = new HexGeometry(zone.hex_size);

    for (const region of zone.regions.values()) {
      try {
        // Extract hex coordinates for this region
        const hexCoordinates = zoneUtils.extractRegionHexCoords(
          zone,
          region.map_region_id
        );

        if (hexCoordinates.length === 0) {
          continue;
        }

        // Get boundary vertices for the region
        const vertices = geometry.getBoundaryVertices(hexCoordinates);

        // Convert to LatLng coordinates
        const polygonPoints = vertices.map((coord) => world_to_latLng(coord));

        // Create region entry
        const key = zoneUtils.getRegionKey(region.map_region_id);
        regionPolygons.set(key, {
          points: polygonPoints,
          style: { ...defaultStyle },
          regionId: region.map_region_id,
          facilityName: region.facility_name,
        });
      } catch (_error) {
        // Skip regions that can't be created
        continue;
      }
    }

    // After creating all polygons, check if we have styles to apply
    if (regionStyles && regionStyles.value && regionStyles.value.size > 0) {
      applyRegionStyles(regionStyles.value);
    } else {
      console.debug(
        'No territory data available yet, using default region styles'
      );
    }
  };

  /**
   * Update style for a specific region
   */
  const updateRegionStyle = (
    regionId: RegionID,
    style: Partial<L.PolylineOptions>
  ) => {
    const key = zoneUtils.getRegionKey(regionId);
    const region = regionPolygons.get(key);

    if (region) {
      // Merge new style with existing style
      Object.assign(region.style, style);
    }
  };

  /**
   * Update styles for multiple regions
   */
  const updateMultipleRegionStyles = (
    updates: Array<{
      regionId: RegionID;
      style: Partial<L.PolylineOptions>;
    }>
  ) => {
    for (const update of updates) {
      updateRegionStyle(update.regionId, update.style);
    }
  };

  /**
   * Get a specific region polygon
   */
  const getRegion = (regionId: RegionID) => {
    const key = zoneUtils.getRegionKey(regionId);
    return regionPolygons.get(key);
  };

  /**
   * Clear all region polygons
   */
  const clearRegions = () => {
    regionPolygons.clear();
  };

  /**
   * Get count of current regions
   */
  const regionCount = computed(() => regionPolygons.size);

  /**
   * Get all region IDs
   */
  const regionIds = computed(() => {
    return Array.from(regionPolygons.values()).map((region) => region.regionId);
  });

  return {
    // State
    regionPolygons,
    regionCount,
    regionIds,

    // Actions
    initializeRegionPolygons,
    updateRegionStyle,
    updateMultipleRegionStyles,
    getRegion,
    clearRegions,
  };
}
