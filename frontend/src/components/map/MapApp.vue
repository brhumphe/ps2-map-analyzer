<template>
  <v-app>
    <v-app-bar theme="dark">
      <v-app-bar-title
        >PS2 Map State Application - Territory Analyzer</v-app-bar-title
      >
      <template v-slot:append>
        <div class="d-flex align-center ga-2">
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
          <ContinentDropdown />
          <WorldDropdown />
          <MapSettingsMenu />
        </div>
      </template>
    </v-app-bar>

    <v-main>
      <MapComponent />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import WorldDropdown from '@/components/map/WorldDropdown.vue';
import ContinentDropdown from '@/components/map/ContinentDropdown.vue';
import MapComponent from '@/components/map/MapComponent.vue';
import MapSettingsMenu from '@/components/map/MapSettingsMenu.vue';
import { useTerritoryData } from '@/composables/useTerritoryData';

const { refreshTerritoryData, isRefreshing } = useTerritoryData();

const handleRefresh = async () => {
  await refreshTerritoryData();
};
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
