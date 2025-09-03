<template>
  <v-card
    v-if="displayedRegionInfo"
    class="region-hover-display"
    :class="{ 'region-selected': isShowingSelectedRegion }"
    variant="elevated"
    elevation="8"
  >
    <v-card-text class="pa-3">
      <div class="d-flex align-center justify-space-between mb-1">
        <div class="text-subtitle-2 text-high-emphasis">
          {{ displayedRegionInfo.facility_name }}
        </div>
        <v-chip
          v-if="isShowingSelectedRegion"
          color="primary"
          size="x-small"
          variant="flat"
        >
          Selected
        </v-chip>
      </div>
      <div class="text-body-2 text-medium-emphasis">
        <v-chip :color="factionColor" size="small" variant="flat">
          {{ factionName }}
        </v-chip>
      </div>

      <!-- Add tactical information -->
      <div v-if="displayedRegionState" class="text-caption mt-2">
        <v-chip
          v-if="displayedRegionState.can_steal"
          color="success"
          size="x-small"
          class="mr-1 mb-1"
        >
          Priority Target
        </v-chip>
        <v-chip
          v-else-if="displayedRegionState.can_capture"
          color="warning"
          size="x-small"
          class="mr-1 mb-1"
        >
          Capturable
        </v-chip>
        <v-chip
          v-if="!displayedRegionState.is_active"
          color="grey"
          size="x-small"
          class="mr-1 mb-1"
        >
          Inactive
        </v-chip>
        <v-chip
          v-if="displayedRegionState.distance_to_wg === -1"
          color="error"
          size="x-small"
          class="mr-1 mb-1"
        >
          Cut Off
        </v-chip>
      </div>

      <!-- Debug Toggle -->
      <div class="mt-2">
        <v-switch
          v-model="mapDisplaySettings['showRegionDebugInfo']"
          label="Show Debug Info"
          color="primary"
          hide-details
          density="compact"
          class="debug-toggle"
        ></v-switch>
      </div>

      <!-- Debug info section with scrollable container -->
      <div v-if="showRegionDebugInfo" class="debug-section">
        <div class="debug-scroll-container">
          <div class="text-subtitle-2 text-high-emphasis mb-1">
            Facility ID: {{ displayedRegionInfo.facility_id }}<br />
            Facility Type ID: {{ displayedRegionInfo.facility_type_id }}<br />
            Region ID: {{ displayedRegionInfo.map_region_id }}
          </div>

          <!-- State information as JSON -->
          <div v-if="displayedRegionState" class="mt-2">
            <div class="text-caption text-medium-emphasis mb-1">
              Region State:
            </div>
            <pre class="style-json">{{
              JSON.stringify(displayedRegionState, null, 2)
            }}</pre>
          </div>

          <!-- Style information as JSON -->
          <div v-if="displayedRegionStyle" class="mt-2">
            <div class="text-caption text-medium-emphasis mb-1">
              Region Style:
            </div>
            <pre class="style-json">{{
              JSON.stringify(displayedRegionStyle.result, null, 2)
            }}</pre>
            <div class="text-caption text-medium-emphasis mb-1">
              Rules application info:
            </div>
            <pre class="style-json">{{
              JSON.stringify(displayedRegionStyle.evals, null, 2)
            }}</pre>
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRegionHover } from '@/composables/useRegionHover.ts';
import { useRegionSelection } from '@/composables/useRegionSelection.ts';
import { useTerritoryData } from '@/composables/useTerritoryData.ts';
import { useLeafletMap } from '@/composables/useLeafletMap.ts';
import { useRegionAnalysis } from '@/composables/useRegionAnalysis.ts';
import { zoneUtils } from '@/utilities/zone_utils.ts';
import { Faction } from '@/types/common.ts';
import { useMapDisplaySettings } from '@/composables/useMapDisplaySettings.ts';

const { currentHoveredRegion } = useRegionHover();
const { currentSelectedRegion } = useRegionSelection();
const { territorySnapshot } = useTerritoryData();
const { currentZone } = useLeafletMap();
const { showRegionDebugInfo, mapDisplaySettings } = useMapDisplaySettings();

// Add region analysis for style and tactical information
const { getRegionStyle, getRegionState } = useRegionAnalysis(
  territorySnapshot,
  currentZone
);

// Determine which region to display - selected takes precedence over hovered
const displayedRegionId = computed(() => {
  return currentSelectedRegion.value || currentHoveredRegion.value;
});

// Check if we're showing a selected region (for styling purposes)
const isShowingSelectedRegion = computed(() => {
  return !!currentSelectedRegion.value;
});

// Get region information for the displayed region (selected or hovered)
const displayedRegionInfo = computed(() => {
  if (!displayedRegionId.value || !currentZone.value) {
    return null;
  }

  // Region keys in the Map are numbers, so try both string and number versions
  const region = currentZone.value.regions.get(displayedRegionId.value);
  if (!region) {
    return null;
  }

  return region;
});

// Get style information for the displayed region
const displayedRegionStyle = computed(() => {
  if (!displayedRegionId.value) {
    return null;
  }

  const regionKey = zoneUtils.getRegionKey(displayedRegionId.value);
  return getRegionStyle.value(regionKey);
});

// Get analysis state for additional tactical info
const displayedRegionState = computed(() => {
  if (!displayedRegionId.value) {
    return null;
  }

  return getRegionState.value(displayedRegionId.value);
});

// Get the faction that controls the displayed region
const controllingFaction = computed(() => {
  if (!displayedRegionId.value || !territorySnapshot.value) {
    return null;
  }
  return (
    territorySnapshot.value.region_ownership.get(displayedRegionId.value) ||
    null
  );
});

// Get faction name for display
const factionName = computed(() => {
  const faction = controllingFaction.value as Faction | null;

  switch (faction) {
    case Faction.VS:
      return 'Vanu Sovereignty';
    case Faction.NC:
      return 'New Conglomerate';
    case Faction.TR:
      return 'Terran Republic';
    case Faction.NSO:
      return 'Nanite Systems';
    case Faction.NONE:
      return 'None';
    default:
      return 'N/A';
  }
});

// Get faction color for display
const factionColor = computed(() => {
  const faction = controllingFaction.value as Faction | null;

  switch (faction) {
    case Faction.NONE:
      return 'grey';
    case 1:
      return 'purple'; // Vanu Sovereignty
    case 2:
      return 'blue'; // New Conglomerate
    case 3:
      return 'red'; // Terran Republic
    case 4:
      return 'grey'; // Nanite Systems
    default:
      return 'magenta'; // Unknown/invalid
  }
});
</script>

<style scoped>
.region-hover-display {
  position: fixed;
  top: 80px;
  right: 16px;
  width: 400px; /* Fixed width instead of min/max */
  z-index: 1000;
  /* Enable pointer events for the entire display */
  pointer-events: auto;
  transition: border-color 0.3s ease;
}

.region-selected {
  border: 2px solid #1976d2;
}

.debug-toggle {
  margin-left: 0;
  /* Ensure the toggle can receive pointer events */
  pointer-events: auto;
}

.debug-section {
  /* Ensure debug section also captures pointer events */
  pointer-events: auto;
}

.debug-scroll-container {
  max-height: 400px;
  overflow-y: auto;
  /* Ensure scrolling works and captures pointer events */
  pointer-events: auto;
}

/* Custom scrollbar styling for better visibility */
.debug-scroll-container::-webkit-scrollbar {
  width: 8px;
}

.debug-scroll-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

.debug-scroll-container::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.debug-scroll-container::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.5);
}

.style-json {
  font-size: 0.75rem;
  background-color: rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  padding: 8px;
  margin: 0;
  overflow-x: auto;
  white-space: pre;
  font-family: 'Courier New', monospace;
  /* Ensure JSON blocks also capture pointer events */
  pointer-events: auto;
}
</style>
