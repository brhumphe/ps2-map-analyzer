<template>
  <v-app>
    <v-app-bar color="primary" dark>
      <v-app-bar-title
        >PS2 Map State Application - Territory Analyzer</v-app-bar-title
      >
    </v-app-bar>

    <v-main>
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
          :options="markerData.options"
          :map="map"
        />
      </template>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useLeafletMap } from '@/composables/useLeafletMap';
import { useLatticeLinks } from '@/composables/useLatticeLinks';
import { useRegionPolygons } from '@/composables/useRegionPolygons';
import { useTerritoryData } from '@/composables/useTerritoryData';
import { useRegionAnalysis } from '@/composables/useRegionAnalysis';
import { useLinkAnalysis } from '@/composables/useLinkAnalysis';
import { useRegionMarkers } from '@/composables/useRegionMarkers';
import { Continent } from '@/types/common';
import PolylineEntity from '@/components/map/PolylineEntity.vue';
import PolygonEntity from '@/components/map/PolygonEntity.vue';
import MarkerEntity from '@/components/map/MarkerEntity.vue';

// Map container reference
const mapContainer = ref<HTMLElement>();

// Use the map initialization composable
const { map, currentZone, isLoading, error, initializeMap, cleanupMap } =
  useLeafletMap();

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
const { latticeLinks, initializeLatticeLinks, clearLinks } = useLatticeLinks(linkStyles);

// Use the region markers composable
const { regionMarkers, initializeRegionMarkers, clearMarkers } = useRegionMarkers();

// Initialize the map when the component mounts
onMounted(async () => {
  if (!mapContainer.value) {
    console.error('Map container not found');
    return;
  }

  await initializeMap(mapContainer.value, Continent.INDAR);

  // Fetch territory data for Connery server (world ID 1)
  await fetchTerritoryData(1, Continent.INDAR);

  // Initialize map content after map and zone data are loaded
  if (currentZone.value) {
    // Initialize region polygons first (background layer)
    // Note: Styles will be applied automatically from region analysis
    initializeRegionPolygons(currentZone.value);

    // Initialize lattice links on top
    // Note: Styles will be applied automatically from link analysis
    initializeLatticeLinks(currentZone.value);

    // Initialize region markers
    initializeRegionMarkers(currentZone.value);
  }
});

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
