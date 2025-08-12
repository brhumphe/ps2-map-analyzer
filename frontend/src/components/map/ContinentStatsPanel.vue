<template>
  <v-app-bar
    location="bottom"
    color="surface"
    theme="dark"
    height="56"
    flat
    class="continent-stats-bar"
  >
    <div class="d-flex align-center justify-space-between w-100 px-4">
      <!-- Territory counts by faction -->
      <div class="d-flex align-center ga-6">
        <!-- VS -->
        <div class="faction-stat d-flex align-center ga-2">
          <v-chip
            size="x-small"
            color="purple"
            variant="flat"
            class="faction-chip"
          >
            VS
          </v-chip>
          <span class="faction-count text-h6">{{
            continentAnalysis.factionTerritoryCount.value.VS
          }}</span>
        </div>

        <!-- NC -->
        <div class="faction-stat d-flex align-center ga-2">
          <v-chip
            size="x-small"
            color="blue"
            variant="flat"
            class="faction-chip"
          >
            NC
          </v-chip>
          <span class="faction-count text-h6">{{
            continentAnalysis.factionTerritoryCount.value.NC
          }}</span>
        </div>

        <!-- TR -->
        <div class="faction-stat d-flex align-center ga-2">
          <v-chip
            size="x-small"
            color="red"
            variant="flat"
            class="faction-chip"
          >
            TR
          </v-chip>
          <span class="faction-count text-h6">{{
            continentAnalysis.factionTerritoryCount.value.TR
          }}</span>
        </div>

        <!-- NSO (only show if they have territory) -->
        <div
          v-if="continentAnalysis.factionTerritoryCount.value.NSO > 0"
          class="faction-stat d-flex align-center ga-2"
        >
          <v-chip
            size="x-small"
            color="grey"
            variant="flat"
            class="faction-chip"
          >
            NSO
          </v-chip>
          <span class="faction-count text-h6">{{
            continentAnalysis.factionTerritoryCount.value.NSO
          }}</span>
        </div>
      </div>

      <!-- Summary information -->
      <div class="summary-info d-flex align-center ga-4">
        <v-chip size="small" variant="text" class="text-caption">
          {{ continentAnalysis.trackedRegions }}/{{
            continentAnalysis.totalRegions
          }}
          regions
        </v-chip>
        <v-chip
          v-if="continentAnalysis.dominantFaction"
          size="small"
          color="primary"
          variant="tonal"
          class="text-caption font-weight-medium"
        >
          {{ continentAnalysis.dominantFaction }} leads
        </v-chip>
      </div>
    </div>
  </v-app-bar>
</template>

<script setup lang="ts">
import { useTerritoryData } from '@/composables/useTerritoryData';
import { useContinentAnalysis } from '@/composables/useContinentAnalysis';
import { useLeafletMap } from '@/composables/useLeafletMap';

// Use composables directly instead of props
const { territorySnapshot } = useTerritoryData();
const { currentZone } = useLeafletMap();
const continentAnalysis = useContinentAnalysis(territorySnapshot, currentZone);
</script>

<style scoped>
.continent-stats-bar {
  border-top: thin solid rgba(var(--v-border-color), 0.12);
}

.faction-stat {
  min-width: 80px;
}

.faction-chip {
  min-width: 36px;
  font-weight: 600;
}

.faction-count {
  font-variant-numeric: tabular-nums;
  min-width: 24px;
  text-align: center;
}
</style>
