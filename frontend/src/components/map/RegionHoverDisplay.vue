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
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRegionHover } from '@/composables/useRegionHover';
import { useTerritoryData } from '@/composables/useTerritoryData';
import { useLeafletMap } from '@/composables/useLeafletMap';
import { Faction } from '@/types/common';

const { currentHoveredRegion } = useRegionHover();
const { territorySnapshot } = useTerritoryData();
const { currentZone } = useLeafletMap();

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
      return 'magenta'; // Contested
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
</style>
