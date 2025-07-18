<template>
  <v-app>
    <v-app-bar color="primary" dark>
      <v-app-bar-title>PS2 Map State Application - Territory Analyzer</v-app-bar-title>
    </v-app-bar>

    <v-main>
      <!-- Map container - this is where your existing map logic will live -->
      <div id="map_div" ref="mapContainer" class="map-container"></div>

      <!-- Optional: Loading overlay while map initializes -->
      <v-overlay v-if="isLoading" contained>
        <v-progress-circular indeterminate size="64"></v-progress-circular>
        <div class="mt-4">Loading map data...</div>
      </v-overlay>

      <!-- Optional: Error display -->
      <v-alert v-if="error" type="error" class="ma-4">
        {{ error }}
      </v-alert>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useLeafletMap } from '@/composables/useLeafletMap'
import { Continent } from '@/types/common'

// Map container reference
const mapContainer = ref<HTMLElement>()

// Use the map initialization composable
const { isLoading, error, initializeMap, cleanupMap } = useLeafletMap()

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
  cleanupMap()
})
</script>

<style scoped>
.map-container {
  height: calc(100vh - 64px); /* Subtract app bar height (64px is Vuetify default) */
  width: 100%;
  position: relative;
}

/* Import your hex label styles if needed */
:deep(.hex-label) {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid #ccc;
  border-radius: 3px;
  font-size: 10px;
  text-align: center;
  padding: 2px;
}
</style>
