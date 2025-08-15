<template>
  <v-card
    v-if="hoveredRegionInfo"
    class="region-hover-display"
    variant="elevated"
    elevation="8"
  >
    <v-card-text class="pa-3">
      <div class="text-subtitle-2 text-high-emphasis mb-1">
        {{ hoveredRegionInfo.facility_name }}<br />
        Facility ID: {{ hoveredRegionInfo.facility_id }}<br />
        Facility Type ID: {{ hoveredRegionInfo.facility_type_id }}<br />
        Region ID: {{ hoveredRegionInfo.map_region_id }}
      </div>
      <div class="text-body-2 text-medium-emphasis">
        <v-chip :color="factionColor" size="small" variant="flat">
          {{ factionName }}
        </v-chip>
      </div>

      <!-- Add tactical information -->
      <div v-if="hoveredRegionState" class="text-caption mt-2">
        <v-chip
          v-if="hoveredRegionState.can_steal"
          color="success"
          size="x-small"
          class="mr-1 mb-1"
        >
          Priority Target
        </v-chip>
        <v-chip
          v-else-if="hoveredRegionState.can_capture"
          color="warning"
          size="x-small"
          class="mr-1 mb-1"
        >
          Capturable
        </v-chip>
        <v-chip
          v-if="!hoveredRegionState.is_active"
          color="grey"
          size="x-small"
          class="mr-1 mb-1"
        >
          Inactive
        </v-chip>
      </div>

      <!-- State information as JSON -->
      <div v-if="hoveredRegionState" class="mt-2">
        <div class="text-caption text-medium-emphasis mb-1">Region State:</div>
        <pre class="style-json">{{
          JSON.stringify(hoveredRegionState, null, 2)
        }}</pre>
      </div>

      <!-- Style information as JSON -->
      <div v-if="hoveredRegionStyle" class="mt-2">
        <div class="text-caption text-medium-emphasis mb-1">Region Style:</div>
        <pre class="style-json">{{
          JSON.stringify(hoveredRegionStyle, null, 2)
        }}</pre>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRegionHover } from '@/composables/useRegionHover';
import { useTerritoryData } from '@/composables/useTerritoryData';
import { useLeafletMap } from '@/composables/useLeafletMap';
import { useRegionAnalysis } from '@/composables/useRegionAnalysis';
import { zoneUtils } from '@/utilities/zone_utils';
import { Faction } from '@/types/common';

const { currentHoveredRegion } = useRegionHover();
const { territorySnapshot } = useTerritoryData();
const { currentZone } = useLeafletMap();

// Add region analysis for style and tactical information
const { getRegionStyle, getRegionState } = useRegionAnalysis(
  territorySnapshot,
  currentZone
);

// Get region information for the currently hovered region
const hoveredRegionInfo = computed(() => {
  if (!currentHoveredRegion.value || !currentZone.value) {
    return null;
  }

  // Region keys in the Map are numbers, so try both string and number versions
  const region = currentZone.value.regions.get(currentHoveredRegion.value);
  if (!region) {
    return null;
  }

  return region;
});

// Get style information for the hovered region
const hoveredRegionStyle = computed(() => {
  if (!currentHoveredRegion.value) {
    return null;
  }

  const regionKey = zoneUtils.getRegionKey(currentHoveredRegion.value);
  return getRegionStyle.value(regionKey);
});

// Get analysis state for additional tactical info
const hoveredRegionState = computed(() => {
  if (!currentHoveredRegion.value) {
    return null;
  }

  return getRegionState.value(currentHoveredRegion.value);
});

// Get the faction that controls the hovered region
const controllingFaction = computed(() => {
  if (!currentHoveredRegion.value || !territorySnapshot.value) {
    return null;
  }
  return (
    territorySnapshot.value.region_ownership[currentHoveredRegion.value] || null
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
  min-width: 250px;
  z-index: 1000;
  pointer-events: none;
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
}
</style>
