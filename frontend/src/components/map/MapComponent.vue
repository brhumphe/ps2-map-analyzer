<template>
  <!-- Loading overlay for map rebuilding -->
  <DismissibleLoadingOverlay :show="isMapRebuilding" message="Loading Map" />

  <!-- Error display -->
  <v-alert v-if="error || territoryError" type="error" class="ma-4">
    {{ error || territoryError }}
  </v-alert>

  <!-- Map container -->
  <div id="map_div" ref="mapContainer" class="map-container"></div>

  <!-- Region Polygons - rendered as headless components -->
  <template v-if="map && currentZone">
    <PolygonEntity
      v-for="[regionKey, regionData] in regionPolygons"
      :id="regionKey"
      :key="regionKey"
      :region-id="regionData.regionId"
      :points="regionData.points"
      :style="regionData.style as Partial<L.PolylineOptions>"
    />
  </template>

  <!-- Lattice Links - rendered as headless components -->
  <template v-if="map && currentZone && mapDisplaySettings.showLatticeLinks">
    <PolylineEntity
      v-for="[linkId, linkData] in latticeLinks"
      :id="linkId"
      :key="linkId"
      :points="linkData.points"
      :style="linkData.style as Partial<L.PolylineOptions>"
    />
  </template>

  <!--  Region Markers - rendered as headless components-->
  <template v-if="map && currentZone && mapDisplaySettings.showFacilityNames">
    <MarkerEntity
      v-for="[regionKey, markerData] in regionMarkers"
      :id="regionKey"
      :key="regionKey"
      :position="markerData.position"
      :popup="markerData.popup"
      :options="markerData.options as Partial<L.MarkerOptions>"
      :tooltip="markerData.tooltip"
      :tooltip-options="{ permanent: true, direction: 'bottom' }"
    />
  </template>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useAppState } from '@/composables/useAppState';
import { useLeafletMap } from '@/composables/useLeafletMap';
import { useLatticeLinks } from '@/composables/useLatticeLinks';
import { useRegionPolygons } from '@/composables/useRegionPolygons';
import { useTerritoryData } from '@/composables/useTerritoryData';
import { useRegionAnalysis } from '@/composables/useRegionAnalysis';
import { useLinkAnalysis } from '@/composables/useLinkAnalysis';
import { useRegionMarkers } from '@/composables/useRegionMarkers';
import { useRegionSelection } from '@/composables/useRegionSelection';
import PolylineEntity from '@/components/map/PolylineEntity.vue';
import PolygonEntity from '@/components/map/PolygonEntity.vue';
import MarkerEntity from '@/components/map/MarkerEntity.vue';
import DismissibleLoadingOverlay from '@/components/map/ui/DismissibleLoadingOverlay.vue';
import * as L from 'leaflet';
import { useMapDisplaySettings } from '@/composables/useMapDisplaySettings.ts';
import {
  addMapInteractionHandler,
  removeMapInteractionHandlers,
} from '@/utilities/leaflet_utils';

const { selectedWorld, selectedContinent } = useAppState();

// Map container reference
const mapContainer = ref<HTMLElement>();

// Track when we're rebuilding due to app state changes
// Default to true to show loading overlay on initial load
const isRebuildingFromStateChange = ref(true);

// Use the map initialization composable
const {
  map,
  currentZone,
  isLoading,
  error,
  initializeMap,
  cleanupMap,
  switchContinent,
} = useLeafletMap();

// Use the territory data composable
const {
  territorySnapshot,
  error: territoryError,
  refreshTerritoryData,
} = useTerritoryData();

// Use region analysis to get faction-based styling
const { regionStyles } = useRegionAnalysis(territorySnapshot, currentZone);

// Use link analysis to get contestable link styling
const { linkStyles } = useLinkAnalysis(territorySnapshot, currentZone);

// Use the region polygons composable with analysis-based styling
const { regionPolygons, initializeRegionPolygons, clearRegions } =
  useRegionPolygons(regionStyles);

// Use the lattice links composable with analysis-based styling
const { latticeLinks, initializeLatticeLinks, clearLinks } =
  useLatticeLinks(linkStyles);

// Use the region markers composable
const { regionMarkers, initializeRegionMarkers, clearMarkers } =
  useRegionMarkers();

// Use map display settings
const { mapDisplaySettings } = useMapDisplaySettings();

// Use region selection handlers
const { handleMapClick } = useRegionSelection();

// Computed property to determine if map is being rebuilt
const isMapRebuilding = computed(() => {
  // Always show loading during initial map setup
  if (isLoading.value) {
    return true;
  }

  // Show loading if we have zone data but no polygons (content not ready)
  if (currentZone.value && regionPolygons.size === 0 && !error.value) {
    return true;
  }

  // Show loading during rebuilds when we're actively clearing content
  if (isRebuildingFromStateChange.value) {
    return true;
  }

  return false;
});

// Function to completely rebuild map and content
const rebuildMap = async () => {
  if (!mapContainer.value) return;

  // Remove existing event handlers if map exists
  if (map.value) {
    removeMapInteractionHandlers(map.value);
  }

  // Destroy existing map completely
  cleanupMap();

  // Create fresh map with selected continent
  await initializeMap(mapContainer.value, selectedContinent.value);

  // Setup event handlers for the new map
  if (map.value) {
    addMapInteractionHandler(map.value, handleMapClick);
  }

  // Fetch territory data using current app state
  await refreshTerritoryData();

  // Initialize map content after map and zone data are loaded
  if (currentZone.value) {
    initializeRegionPolygons(currentZone.value);
    initializeLatticeLinks(currentZone.value);
    initializeRegionMarkers(currentZone.value);
  }

  // Clear rebuilding flag once everything is loaded
  isRebuildingFromStateChange.value = false;
};

// Function to rebuild map content when zone changes
const rebuildMapContent = async () => {
  if (!currentZone.value) return;

  // Refresh territory data using current app state
  await refreshTerritoryData();

  // Initialize map content
  initializeRegionPolygons(currentZone.value);
  initializeLatticeLinks(currentZone.value);
  initializeRegionMarkers(currentZone.value);

  // Clear rebuilding flag once everything is loaded
  isRebuildingFromStateChange.value = false;
};

// Watch for continent changes - switch continent and load new zone
watch(
  () => selectedContinent.value,
  async (newContinent) => {
    if (map.value) {
      // Set rebuilding flag
      isRebuildingFromStateChange.value = true;

      // Clear existing content immediately to avoid lingering
      clearMarkers();
      clearLinks();
      clearRegions();

      // Set currentZone to null to unmount entity components
      currentZone.value = null;

      // Wait for Vue to process unmounting
      await nextTick();

      // Now switch continent
      await switchContinent(newContinent);

      // Re-add the map interaction handler after continent switch
      if (map.value) {
        addMapInteractionHandler(map.value, handleMapClick);
      }
    }
  }
);

// Watch for zone changes - rebuild map content
watch(currentZone, rebuildMapContent);

// Watch for world changes - rebuild territory data and content
watch(
  () => selectedWorld.value,
  async () => {
    // Set rebuilding flag for world changes
    isRebuildingFromStateChange.value = true;

    // Clear existing content to show we're rebuilding
    clearMarkers();
    clearLinks();
    clearRegions();

    // Refresh territory data with new world
    await refreshTerritoryData();

    // Rebuild content if zone is available
    if (currentZone.value) {
      initializeRegionPolygons(currentZone.value);
      initializeLatticeLinks(currentZone.value);
      initializeRegionMarkers(currentZone.value);
    }

    // Clear rebuilding flag once everything is loaded
    isRebuildingFromStateChange.value = false;
  }
);

// Initialize the map when the component mounts
onMounted(rebuildMap);

// Clean up when the component unmounts
onUnmounted(() => {
  // Clean up map elements first, then the map itself
  // This ensures proper cleanup order and prevents stale references
  try {
    if (map.value) {
      removeMapInteractionHandlers(map.value);
    }
    clearMarkers();
    clearLinks();
    clearRegions();
  } catch (error) {
    console.warn('Error during component cleanup:', error);
  }
  cleanupMap();
});
</script>

<style scoped>
.map-container {
  height: calc(
    100vh - 64px - 56px
  ); /* Account for app bar (64px) and stats panel (56px) */
  width: 100%;
  position: relative;
  background-color: #051110;
}

:deep(.hex-label) {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid #ccc;
  border-radius: 3px;
  font-size: 10px;
  text-align: center;
  padding: 2px;
}
</style>
