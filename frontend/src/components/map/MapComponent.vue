<template>
  <!-- Loading overlay -->
  <v-overlay
    v-if="isLoading || territoryLoading || territoryRefreshing"
    contained
  >
    <v-progress-circular indeterminate size="64"></v-progress-circular>
    <div class="mt-4">
      {{
        isLoading
          ? 'Loading map data...'
          : territoryRefreshing
            ? 'Refreshing territory data...'
            : 'Loading territory data...'
      }}
    </div>
  </v-overlay>

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
      :key="regionKey"
      :id="regionKey"
      :points="regionData.points"
      :style="regionData.style as Partial<L.PolylineOptions>"
    />
  </template>

  <!-- Lattice Links - rendered as headless components -->
  <template v-if="map && currentZone && mapDisplaySettings.showLatticeLinks">
    <PolylineEntity
      v-for="[linkId, linkData] in latticeLinks"
      :key="linkId"
      :id="linkId"
      :points="linkData.points"
      :style="linkData.style as Partial<L.PolylineOptions>"
    />
  </template>

  <!--  Region Markers - rendered as headless components-->
  <template v-if="map && currentZone && mapDisplaySettings.showMarkers">
    <MarkerEntity
      v-for="[regionKey, markerData] in regionMarkers"
      :key="regionKey"
      :id="regionKey"
      :position="markerData.position"
      :popup="markerData.popup"
      :options="markerData.options as Partial<L.MarkerOptions>"
      :tooltip="markerData.facilityName"
      :tooltipOptions="{ permanent: true, direction: 'bottom' }"
      :visible="isMarkerVisible(markerData.regionId)"
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
import PolylineEntity from '@/components/map/PolylineEntity.vue';
import PolygonEntity from '@/components/map/PolygonEntity.vue';
import MarkerEntity from '@/components/map/MarkerEntity.vue';
import * as L from 'leaflet';
import { useMapDisplaySettings } from '@/composables/useMapDisplaySettings.ts';
import type { RegionID } from '@/types/common.ts';

const { selectedWorld, selectedContinent } = useAppState();

// Map container reference
const mapContainer = ref<HTMLElement>();

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
  isLoading: territoryLoading,
  isRefreshing: territoryRefreshing,
  error: territoryError,
  refreshTerritoryData,
} = useTerritoryData();

// Use region analysis to get faction-based styling
const { regionStyles, getRegionState } = useRegionAnalysis(
  territorySnapshot,
  currentZone
);

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

// Usee map display settings
const { mapDisplaySettings } = useMapDisplaySettings();

// Function to completely rebuild map and content
const rebuildMap = async () => {
  if (!mapContainer.value) return;

  // Destroy existing map completely
  cleanupMap();

  // Create fresh map with selected continent
  await initializeMap(mapContainer.value, selectedContinent.value);

  // Fetch territory data using current app state
  await refreshTerritoryData();

  // Initialize map content after map and zone data are loaded
  if (currentZone.value) {
    initializeRegionPolygons(currentZone.value);
    initializeLatticeLinks(currentZone.value);
    initializeRegionMarkers(currentZone.value);
  }
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
};

const isMarkerVisible = computed(() => {
  return (regionId: RegionID) => {
    const regionState = getRegionState.value(regionId);
    return regionState?.can_capture ?? false;
  };
});

// Watch for continent changes - switch continent and load new zone
watch(
  () => selectedContinent.value,
  async (newContinent) => {
    if (map.value) {
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
    }
  }
);

// Watch for zone changes - rebuild map content
watch(currentZone, rebuildMapContent);

// Watch for world changes - only update territory data
watch(
  () => selectedWorld.value,
  async () => {
    await refreshTerritoryData();
  }
);

// Initialize the map when the component mounts
onMounted(rebuildMap);

// Clean up when the component unmounts
onUnmounted(() => {
  // Clean up map elements first, then the map itself
  // This ensures proper cleanup order and prevents stale references
  try {
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
  height: calc(100vh - 64px);
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
