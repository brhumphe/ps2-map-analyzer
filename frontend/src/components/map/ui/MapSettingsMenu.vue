<template>
  <div class="text-center">
    <v-menu v-model="menu" :close-on-content-click="false" location="end">
      <template #activator="{ props }">
        <v-btn icon v-bind="props">
          <v-icon>mdi-cog</v-icon>
        </v-btn>
      </template>

      <v-card min-width="300" max-width="400">
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
        <RuleParameterEditor />
        <v-divider></v-divider>
        <!-- Development Settings Section -->
        <v-list density="compact">
          <v-list-subheader class="text-caption text-medium-emphasis">
            Development Options
          </v-list-subheader>
          <v-list-item>
            <v-switch
              v-model="mapDisplaySettings['showRegionDebugInfo']"
              label="Show Region Debug Info"
              color="primary"
              hide-details
              density="compact"
              class="ml-2"
            ></v-switch>
          </v-list-item>
          <v-list-item>
            <v-switch
              v-model="useDevDataModel"
              label="Use Development Data"
              color="warning"
              hide-details
              density="compact"
              class="ml-2"
            ></v-switch>
            <template #subtitle>
              <span class="text-caption text-medium-emphasis">
                Load sample data for testing purposes.
              </span>
            </template>
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
import { ref, computed } from 'vue';
import { useMapDisplaySettings } from '@/composables/useMapDisplaySettings';
import { useAppState } from '@/composables/useAppState';
import RuleParameterEditor from '@/components/map/ui/RuleParameterEditor.vue';

// Local state - just for menu open/closed
const menu = ref(false);

// Global display settings from composable
const { mapDisplaySettings, resetToDefaults } = useMapDisplaySettings();

// Development settings from app state
const { useDevData, setUseDevData } = useAppState();

// Create computed property for v-model binding
const useDevDataModel = computed({
  get: () => useDevData.value,
  set: (value: boolean) => setUseDevData(value),
});

// Define the settings configuration
const displaySettingsList = [
  // { key: 'showMarkers', label: 'Show Facility Markers' },
  { key: 'showLatticeLinks', label: 'Show Lattice Links' },
  { key: 'showRegionBorders', label: 'Show Region Borders' },
  { key: 'showFacilityNames', label: 'Show Facility Names' },
  { key: 'highlightSteals', label: 'Highlight Steals' },
  { key: 'autoRefreshEnabled', label: 'Enable Auto-Refresh' },
] as const;
</script>
