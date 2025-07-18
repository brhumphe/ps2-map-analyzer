<template>
  <v-app>
    <v-app-bar color="primary" dark>
      <v-app-bar-title>PS2 Map State Application - Territory Analyzer</v-app-bar-title>
    </v-app-bar>

    <v-main>
      <!-- Map container -->
      <div id="map_div" ref="mapContainer" class="map-container"></div>

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

      <!-- Loading overlay -->
      <v-overlay v-if="isLoading" contained>
        <v-progress-circular indeterminate size="64"></v-progress-circular>
        <div class="mt-4">Loading map data...</div>
      </v-overlay>

      <!-- Error display -->
      <v-alert v-if="error" type="error" class="ma-4">
        {{ error }}
      </v-alert>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useLeafletMap } from '@/composables/useLeafletMap'
import { useLatticeLinks } from '@/composables/useLatticeLinks'
import { Continent } from '@/types/common'
import PolylineEntity from '@/components/map/PolylineEntity.vue'

// Map container reference
const mapContainer = ref<HTMLElement>()

// Use the map initialization composable
const { map, currentZone, isLoading, error, initializeMap, cleanupMap } = useLeafletMap()

// Use the lattice links composable
const { latticeLinks, initializeLatticeLinks, clearLinks } = useLatticeLinks()

// Initialize lattice links when zone data is loaded
watch(currentZone, (zone) => {
  if (zone) {
    initializeLatticeLinks(zone, {
      color: 'yellow',
      weight: 2,
      opacity: 0.8
    })
  } else {
    clearLinks()
  }
})

// Initialize the map when the component mounts
onMounted(async () => {
  if (!mapContainer.value) {
    console.error('Map container not found')
    return
  }

  await initializeMap(mapContainer.value, Continent.INDAR)
})

// Clean up when the component unmounts
onUnmounted(() => {
  clearLinks()
  cleanupMap()
})
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
