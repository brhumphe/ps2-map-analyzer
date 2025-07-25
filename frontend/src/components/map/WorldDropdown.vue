<template>
  <div class="text-center">
    <v-menu open-on-hover>
      <template v-slot:activator="{ props }">
        <v-btn variant="tonal" v-bind="props">{{ selectedWorldName }}</v-btn>
      </template>

      <v-list>
        <v-list-item
          v-for="(item, index) in items"
          :key="index"
          @click="selectWorld(item)"
        >
          <v-list-item-title>{{ item.name }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { World, WorldName } from '@/types/common';
import { useAppState } from '@/composables/useAppState';
const { setWorld, selectedWorld } = useAppState();

const items = [
  { name: 'Osprey', world_id: World.Osprey },
  { name: 'Wainwright', world_id: World.Wainwright },
  { name: 'Jaeger', world_id: World.Jaeger },
  { name: 'SolTech', world_id: World.SolTech },
];
console.log(selectedWorld.value, WorldName, WorldName.get(selectedWorld.value));
const selectedWorldName = ref(
  WorldName.get(selectedWorld.value) || 'Select World'
);

const selectWorld = (item: { name: string; world_id: World }) => {
  // Call setWorld with the selected world's ID
  setWorld(item.world_id);

  // Update the button label
  selectedWorldName.value = item.name;
};
</script>
