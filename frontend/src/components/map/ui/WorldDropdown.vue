<template>
  <div class="text-center">
    <v-select
      :model-value="selectedWorld"
      :items="items"
      item-title="name"
      item-value="world_id"
      variant="outlined"
      density="compact"
      class="world-select"
      style="min-width: 140px"
      hide-details
      @update:model-value="selectWorld"
    >
      <template #selection="{ item }">
        <div class="d-flex align-center">
          <v-icon
            icon="mdi-server-network"
            color="grey"
            size="small"
            class="mr-2"
          />
          {{ item.raw.name }}
        </div>
      </template>

      <template #item="{ props }">
        <v-list-item v-bind="props">
          <template #prepend>
            <v-icon icon="mdi-server-network" color="grey" size="small" />
          </template>
        </v-list-item>
      </template>
    </v-select>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { World, WorldName } from '@/types/common';
import { useAppState } from '@/composables/useAppState';

const { setWorld, selectedWorld } = useAppState();

const items = [
  { name: 'Osprey', world_id: World.Osprey },
  { name: 'Wainwright', world_id: World.Wainwright },
  { name: 'Jaeger', world_id: World.Jaeger },
  { name: 'SolTech', world_id: World.SolTech },
];

computed(() => WorldName.get(selectedWorld.value) || 'Select World');

const selectWorld = (worldId: World) => {
  setWorld(worldId);
};
</script>
