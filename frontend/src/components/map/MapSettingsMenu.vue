<template>
  <div class="text-center">
    <v-menu v-model="menu" :close-on-content-click="false" location="end">
      <template v-slot:activator="{ props }">
        <v-btn icon v-bind="props">
          <v-icon>mdi-cog</v-icon>
        </v-btn>
      </template>

      <v-card min-width="300">
        <v-card-title class="text-h6"> Map Display Settings </v-card-title>

        <v-divider></v-divider>

        <v-list density="compact">
          <v-list-item
            v-for="setting in displaySettingsList"
            :key="setting.key"
          >
            <v-switch
              v-model="mapDisplaySettings[setting.key]"
              :label="setting.label"
              color="primary"
              hide-details
              density="compact"
              class="ml-2"
            ></v-switch>
          </v-list-item>
        </v-list>

        <v-divider></v-divider>

        <v-card-actions>
          <v-btn variant="text" size="small" @click="resetToDefaults">
            Reset to Defaults
          </v-btn>

          <v-spacer></v-spacer>

          <v-btn variant="text" @click="menu = false"> Close </v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useMapDisplaySettings } from '@/composables/useMapDisplaySettings';

// Local state - just for menu open/closed
const menu = ref(false);

// Global display settings from composable
const { mapDisplaySettings, resetToDefaults } = useMapDisplaySettings();

// Define the settings configuration
const displaySettingsList = [
  // { key: 'showMarkers', label: 'Show Facility Markers' },
  { key: 'showLatticeLinks', label: 'Show Lattice Links' },
  // { key: 'showRegionBorders', label: 'Show Region Borders' },
  { key: 'showFacilityNames', label: 'Show Facility Names' },
  { key: 'autoRefreshEnabled', label: 'Enable Auto-Refresh' },
] as const;
</script>
