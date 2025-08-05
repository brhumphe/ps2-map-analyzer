<template>
  <v-app>
    <v-app-bar theme="dark">
      <v-app-bar-title
        >PS2 Map State Application - Territory Analyzer</v-app-bar-title
      >
      <template v-slot:append>
        <div class="d-flex ga-2">
          <ContinentDropdown />
          <WorldDropdown />
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
</script>
