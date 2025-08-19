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
        <v-icon
          :color="item.raw.value === Faction.NONE ? item.raw.color : undefined"
          size="small"
          class="mr-2"
        >
          <v-img
            v-if="item.raw.value !== Faction.NONE"
            :src="item.raw.imageUrl"
            width="20"
            height="20"
          />
          <template v-else>{{ item.raw.icon }}</template>
        </v-icon>
        <span>{{ item.raw.name }}</span>
      </div>
    </template>
    <template v-slot:item="{ props, item }">
      <v-list-item v-bind="props">
        <template v-slot:prepend>
          <v-icon
            :color="
              item.raw.value === Faction.NONE ? item.raw.color : undefined
            "
            size="small"
          >
            <v-img
              v-if="item.raw.value !== Faction.NONE"
              :src="item.raw.imageUrl"
              width="20"
              height="20"
            />
            <template v-else>{{ item.raw.icon }}</template>
          </v-icon>
        </template>
      </v-list-item>
    </template>
  </v-select>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAppState } from '@/composables/useAppState.ts';
import { Faction } from '@/types/common.ts';

const { playerFaction, setPlayerFaction } = useAppState();

const factionItems = computed(() => [
  {
    value: Faction.NONE,
    name: 'No Faction',
    icon: 'mdi-help',
    imageUrl: 'https://via.placeholder.com/16x16/grey/white?text=?',
    color: 'grey',
  },
  {
    value: Faction.VS,
    name: 'Vanu Sovereignty',
    icon: 'mdi-triangle',
    imageUrl: 'https://census.daybreakgames.com/files/ps2/images/static/93.png',
    color: '#8E44AD',
  },
  {
    value: Faction.NC,
    name: 'New Conglomerate',
    icon: 'mdi-shield',
    imageUrl: 'https://census.daybreakgames.com/files/ps2/images/static/8.png',
    color: '#3498DB',
  },
  {
    value: Faction.TR,
    name: 'Terran Republic',
    icon: 'mdi-hexagon',
    imageUrl: 'https://census.daybreakgames.com/files/ps2/images/static/14.png',
    color: '#E74C3C',
  },
]);
</script>

<style scoped>
.faction-dropdown {
  max-width: 250px;
}
</style>
