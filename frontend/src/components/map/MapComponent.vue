<template>
  <!-- Loading overlay -->
  <v-overlay v-if="isLoading || territoryLoading" contained>
    <v-progress-circular indeterminate size="64"></v-progress-circular>
    <div class="mt-4">
      {{ isLoading ? 'Loading map data...' : 'Loading territory data...' }}
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
      :map="map"
    />
  </template>

  <!-- Lattice Links - rendered as headless components -->
  <template v-if="map && currentZone">
    <PolylineEntity
      v-for="[linkId, linkData] in latticeLinks"
      :key="linkId"
      :id="linkId"
      :points="linkData.points"
      :style="linkData.style as Partial<L.PolylineOptions>"
      :map="map"
    />
  </template>

  <!-- Region Markers - rendered as headless components -->
  <template v-if="map && currentZone">
    <MarkerEntity
      v-for="[regionKey, markerData] in regionMarkers"
      :key="regionKey"
      :id="regionKey"
      :position="markerData.position"
      :popup="markerData.popup"
      :options="markerData.options as Partial<L.MarkerOptions>"
      :tooltip="markerData.facilityName"
      :tooltipOptions="{ permanent: true, direction: 'bottom' }"
      :map="map"
    />
  </template>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useLeafletMap } from '@/composables/useLeafletMap';
import { useLatticeLinks } from '@/composables/useLatticeLinks';
import { useRegionPolygons } from '@/composables/useRegionPolygons';
import { useTerritoryData } from '@/composables/useTerritoryData';
import { useRegionAnalysis } from '@/composables/useRegionAnalysis';
import { useLinkAnalysis } from '@/composables/useLinkAnalysis';
import { useRegionMarkers } from '@/composables/useRegionMarkers';
import { Continent, World } from '@/types/common';
import PolylineEntity from '@/components/map/PolylineEntity.vue';
import PolygonEntity from '@/components/map/PolygonEntity.vue';
import MarkerEntity from '@/components/map/MarkerEntity.vue';
import * as L from 'leaflet';

// Props from parent
const props = defineProps<{
  world: World;
  continent: Continent;
}>();

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
  error: territoryError,
  fetchTerritoryData,
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

// Function to completely rebuild map and content
const rebuildMap = async () => {
  if (!mapContainer.value) return;

  // Destroy existing map completely
  cleanupMap();

  // Create fresh map with selected continent
  await initializeMap(mapContainer.value, props.continent);

  // Fetch territory data for selected world/continent
  await fetchTerritoryData(props.world, props.continent);

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

  // Fetch territory data for current world/continent
  await fetchTerritoryData(props.world, props.continent);

  // Initialize map content
  initializeRegionPolygons(currentZone.value);
  initializeLatticeLinks(currentZone.value);
  initializeRegionMarkers(currentZone.value);
};

// Watch for continent changes - switch continent and load new zone
watch(
  () => props.continent,
  async (newContinent) => {
    if (map.value) {
      // Clear existing content immediately to avoid lingering
      clearMarkers();
      clearLinks();
      clearRegions();

      await switchContinent(newContinent);
    }
  }
);

// Watch for zone changes - rebuild map content
watch(currentZone, rebuildMapContent);

// Watch for world changes - only update territory data
watch(
  () => props.world,
  async () => {
    await fetchTerritoryData(props.world, props.continent);
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
<script setup lang="ts"></script>
