<template>
  <div class="text-center">
    <v-menu open-on-hover>
      <template v-slot:activator="{ props }">
        <v-btn variant="tonal" v-bind="props">{{
          selectedContinentName
        }}</v-btn>
      </template>

      <v-list>
        <v-list-item
          v-for="(item, index) in items"
          :key="index"
          @click="selectContinent(item)"
        >
          <v-list-item-title>{{ item.name }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Continent } from '@/types/common';
import { useAppState } from '@/composables/useAppState';

const { setContinent, selectedContinent } = useAppState();

const items = [
  { name: 'Indar', continent: Continent.INDAR },
  { name: 'Hossin', continent: Continent.HOSSIN },
  { name: 'Amerish', continent: Continent.AMERISH },
  { name: 'Esamir', continent: Continent.ESAMIR },
  { name: 'Oshur', continent: Continent.OSHUR },
];

const continentNames = new Map([
  [Continent.INDAR, 'Indar'],
  [Continent.HOSSIN, 'Hossin'],
  [Continent.AMERISH, 'Amerish'],
  [Continent.ESAMIR, 'Esamir'],
  [Continent.OSHUR, 'Oshur'],
]);

const selectedContinentName = computed(
  () => continentNames.get(selectedContinent.value) || 'Select Continent'
);

const selectContinent = (item: { name: string; continent: Continent }) => {
  setContinent(item.continent);
};
</script>
