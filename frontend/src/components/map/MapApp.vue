<template>
  <v-app>
    <v-app-bar theme="dark">
      <v-app-bar-title shrink>Nanite Nexus Map Analyzer</v-app-bar-title>
      <v-spacer />
      <AboutButton />
      <v-spacer />
      <template #append>
        <WorldDropdown />
        <ContinentDropdown />
        <FactionDropdown />
        <div class="d-flex align-center ga-2">
          <div class="d-flex align-center ga-1">
            <v-btn
              variant="text"
              :disabled="isRefreshing || isLoading"
              :title="error ? 'Retry failed request' : 'Refresh territory data'"
              @click="handleRefresh"
            >
              <v-icon
                :class="{ 'rotate-animation': isRefreshing || isLoading }"
                :color="error ? 'error' : undefined"
                :size="20"
              >
                {{ error ? 'mdi-alert-circle' : 'mdi-refresh' }}
              </v-icon>
            </v-btn>

            <!-- Add error chip if there's an error -->
            <v-chip
              v-if="error"
              size="small"
              color="error"
              variant="tonal"
              class="ml-2"
            >
              {{ error }}
            </v-chip>
            <span
              v-if="lastUpdatedText"
              class="text-caption text-medium-emphasis"
            >
              {{ lastUpdatedText }}
            </span>
          </div>
          <MapSettingsMenu />
        </div>
      </template>
    </v-app-bar>

    <v-main>
      <MapComponent />
      <RegionHoverDisplay />
      <ContinentStatsPanel />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import FactionDropdown from '@/components/map/ui/FactionDropdown.vue';
import WorldDropdown from '@/components/map/ui/WorldDropdown.vue';
import ContinentDropdown from '@/components/map/ui/ContinentDropdown.vue';
import MapComponent from '@/components/map/MapComponent.vue';
import MapSettingsMenu from '@/components/map/ui/MapSettingsMenu.vue';
import RegionHoverDisplay from '@/components/map/ui/RegionHoverDisplay.vue';
import ContinentStatsPanel from '@/components/map/ui/ContinentStatsPanel.vue';
import AboutButton from '@/components/map/ui/AboutButton.vue';
import { useTerritoryData } from '@/composables/useTerritoryData';
import { useAppState } from '@/composables/useAppState';

const {
  refreshTerritoryData,
  isRefreshing,
  isLoading,
  error,
  territorySnapshot,
} = useTerritoryData();
const { useDevData } = useAppState();

const handleRefresh = async () => {
  await refreshTerritoryData();
};

// Format the last updated timestamp for display
const lastUpdatedText = computed(() => {
  // Show development mode status when using dev data
  if (useDevData.value) {
    return 'Using development data';
  }

  // Show timestamp for live data
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
