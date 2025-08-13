<template>
  <v-app>
    <v-app-bar theme="dark">
      <v-app-bar-title
        >PS2 Map State Application - Territory Analyzer</v-app-bar-title
      >
      <template v-slot:append>
        <div class="d-flex align-center ga-2">
          <div class="d-flex align-center ga-1">
            <v-btn
              variant="text"
              :disabled="isRefreshing"
              @click="handleRefresh"
              title="Refresh territory data"
            >
              <v-icon :class="{ 'rotate-animation': isRefreshing }">
                mdi-refresh
              </v-icon>
            </v-btn>
            <span
              class="text-caption text-medium-emphasis"
              v-if="lastUpdatedText"
            >
              {{ lastUpdatedText }}
            </span>
          </div>
          <ContinentDropdown />
          <WorldDropdown />
          <MapSettingsMenu />
        </div>
      </template>
    </v-app-bar>

    <v-main>
      <MapComponent />
      <RegionHoverDisplay v-if="showRegionHover" />

      <!-- Continent statistics panel at bottom -->
      <ContinentStatsPanel />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import WorldDropdown from '@/components/map/WorldDropdown.vue';
import ContinentDropdown from '@/components/map/ContinentDropdown.vue';
import MapComponent from '@/components/map/MapComponent.vue';
import MapSettingsMenu from '@/components/map/MapSettingsMenu.vue';
import RegionHoverDisplay from '@/components/map/RegionHoverDisplay.vue';
import ContinentStatsPanel from '@/components/map/ContinentStatsPanel.vue';
import { useTerritoryData } from '@/composables/useTerritoryData';
import { useMapDisplaySettings } from '@/composables/useMapDisplaySettings';

const { refreshTerritoryData, isRefreshing, territorySnapshot } =
  useTerritoryData();

const { showRegionHover } = useMapDisplaySettings();

const handleRefresh = async () => {
  await refreshTerritoryData();
};

// Format the last updated timestamp for display
const lastUpdatedText = computed(() => {
  if (!territorySnapshot.value || !territorySnapshot.value.timestamp) {
    return null;
  }

  const updateTime = new Date(territorySnapshot.value.timestamp * 1000);
  const timeString = updateTime.toLocaleTimeString();

  return `Updated: ${timeString}`;
});
</script>

<style scoped>
.rotate-animation {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
