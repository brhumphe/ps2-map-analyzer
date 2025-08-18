<template>
  <v-select
    :model-value="playerFaction"
    @update:model-value="setPlayerFaction"
    :items="factionItems"
    item-title="name"
    item-value="value"
    placeholder="Select Faction"
    density="compact"
    variant="outlined"
    class="faction-dropdown"
    style="min-width: 140px"
    hide-details
  >
    <template v-slot:selection="{ item }">
      <div class="d-flex align-center">
        <v-icon :color="item.raw.color" size="small">
          {{ item.raw.icon }}
        </v-icon>
        <span>{{ item.raw.name }}</span>
      </div>
    </template>
    <template v-slot:item="{ props, item }">
      <v-list-item v-bind="props">
        <template v-slot:prepend>
          <v-icon :color="item.raw.color" size="small">
            {{ item.raw.icon }}
          </v-icon>
        </template>
      </v-list-item>
    </template>
  </v-select>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAppState } from '@/composables/useAppState';
import { Faction } from '@/types/common';

const { playerFaction, setPlayerFaction } = useAppState();

const factionItems = computed(() => [
  {
    value: Faction.NONE,
    name: 'No Faction',
    icon: 'mdi-help',
    color: 'grey',
  },
  {
    value: Faction.VS,
    name: 'Vanu Sovereignty',
    icon: 'mdi-triangle',
    color: '#8E44AD',
  },
  {
    value: Faction.NC,
    name: 'New Conglomerate',
    icon: 'mdi-shield',
    color: '#3498DB',
  },
  {
    value: Faction.TR,
    name: 'Terran Republic',
    icon: 'mdi-hexagon',
    color: '#E74C3C',
  },
  {
    value: Faction.NSO,
    name: 'NS Operatives',
    icon: 'mdi-robot',
    color: '#95A5A6',
  },
]);
</script>

<style scoped>
.faction-dropdown {
  max-width: 250px;
}
</style>
