<template>
  <div>
    <v-btn
      variant="tonal"
      color="primary"
      @click="dialog = true"
      title="About"
      style="text-transform: none"
    >
      <v-icon>mdi-information</v-icon>
      <span class="ml-1">About</span>
    </v-btn>

    <v-dialog v-model="dialog" max-width="600">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span>About PS2 Territory Analyzer</span>
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            @click="dialog = false"
          />
        </v-card-title>

        <v-card-text>
          <p class="mb-4">
            PlanetSide 2 features large-scale territory control warfare where
            three factions (VS, NC, and TR) fight for control of facilities
            across vast continents. Each continent contains 75-90 regions
            connected by a lattice network.
          </p>

          <p class="mb-4">
            <strong>Key Mechanics:</strong> Factions can only capture facilities
            adjacent to ones they already control. Regions must maintain a
            lattice connection to your faction's warp gate or they become "cut
            off" - preventing spawning and reducing strategic value.
          </p>

          <p class="mb-0">
            <strong>Victory Conditions:</strong> During 90-minute territory
            control alerts, the faction controlling the most connected regions
            wins and takes control of the entire continent. This tool helps
            visualize lattice connections and identify strategic opportunities
            for territorial expansion.
          </p>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" variant="text" @click="dialog = false">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const dialog = ref(false);
</script>
