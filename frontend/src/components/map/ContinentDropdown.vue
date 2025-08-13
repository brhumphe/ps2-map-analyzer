<template>
  <div class="text-center">
    <v-menu @update:model-value="onMenuToggle">
      <template v-slot:activator="{ props }">
        <v-btn variant="tonal" v-bind="props" class="d-flex align-center">
          <v-icon
            v-if="isLoading"
            icon="mdi-loading"
            size="small"
            class="mr-2 mdi-spin"
          />
          <v-icon
            v-else
            :icon="getContinentIcon(selectedContinent).icon"
            :color="getContinentIcon(selectedContinent).color"
            size="small"
            class="mr-2"
          />

          {{ selectedContinentName }}
        </v-btn>
      </template>

      <v-list>
        <v-list-item v-if="isLoading">
          <v-list-item-title>Loading...</v-list-item-title>
        </v-list-item>

        <v-list-item v-else-if="hasError">
          <v-list-item-title class="text-error">
            Failed to load status
          </v-list-item-title>
        </v-list-item>

        <v-list-item
          v-for="(item, index) in items"
          :key="index"
          @click="selectContinent(item)"
          :class="getContinentStatusClass(item.continent)"
        >
          <template v-slot:prepend>
            <v-icon
              :icon="getContinentIcon(item.continent).icon"
              :color="getContinentIcon(item.continent).color"
              size="small"
            />
          </template>

          <v-list-item-title>{{ item.name }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { Continent } from '@/types/common';
import { useAppState } from '@/composables/useAppState';
import type { HonuWorldOverview, HonuZoneStatus } from '@/types/honu-api';

const { setContinent, selectedContinent, selectedWorld } = useAppState();

const allContinents = [
  { name: 'Indar', continent: Continent.INDAR },
  { name: 'Hossin', continent: Continent.HOSSIN },
  { name: 'Amerish', continent: Continent.AMERISH },
  { name: 'Esamir', continent: Continent.ESAMIR },
  { name: 'Oshur', continent: Continent.OSHUR },
];

const continentStatusMap = ref<Map<number, HonuZoneStatus>>(new Map());
const isLoading = ref(false);
const hasError = ref(false);

const continentNames = new Map([
  [Continent.INDAR, 'Indar'],
  [Continent.HOSSIN, 'Hossin'],
  [Continent.AMERISH, 'Amerish'],
  [Continent.ESAMIR, 'Esamir'],
  [Continent.OSHUR, 'Oshur'],
]);

const fetchActiveContinents = async () => {
  console.log('Fetching active continents');
  if (isLoading.value) return;

  isLoading.value = true;
  hasError.value = false;

  try {
    const response = await fetch('https://wt.honu.pw/api/world/overview');
    const worlds: HonuWorldOverview[] = await response.json();

    const worldData = worlds.find((w) => w.worldID === selectedWorld.value);
    if (!worldData) {
      throw new Error('World not found');
    }

    // Store zone status for each continent
    continentStatusMap.value.clear();
    worldData.zones.forEach((zone) => {
      if (Object.values(Continent).includes(zone.zoneID as Continent)) {
        continentStatusMap.value.set(zone.zoneID, zone);
      }
    });
  } catch (error) {
    console.error('Failed to fetch continent status:', error);
    hasError.value = true;
  } finally {
    isLoading.value = false;
  }
};

const isContinentLocked = (continent: Continent): boolean => {
  const zoneData = continentStatusMap.value.get(continent);
  return zoneData ? !zoneData.isOpened : false;
};

const isContinentOpen = (continent: Continent): boolean => {
  const zoneData = continentStatusMap.value.get(continent);
  return zoneData ? zoneData.isOpened : false;
};

const hasAlertInfo = (continent: Continent): boolean => {
  const zoneData = continentStatusMap.value.get(continent);
  return zoneData ? !!zoneData.alert : false;
};

const getContinentStatusClass = (continent: Continent): string => {
  if (isContinentLocked(continent)) {
    return 'text-disabled';
  } else if (hasAlertInfo(continent)) {
    return 'text-error';
  } else if (isContinentOpen(continent)) {
    return 'text-success';
  }
  return '';
};

const getContinentIcon = (
  continent: Continent
): { icon: string; color?: string } => {
  if (isContinentLocked(continent)) {
    return { icon: 'mdi-lock' };
  } else if (isContinentOpen(continent) && hasAlertInfo(continent)) {
    return { icon: 'mdi-alarm-light', color: 'error' };
  } else if (isContinentOpen(continent)) {
    return { icon: 'mdi-earth', color: 'success' };
  }
  return { icon: 'mdi-help-circle-outline', color: 'grey' };
};

const selectedContinentName = computed(
  () => continentNames.get(selectedContinent.value) || 'Select Continent'
);

const onMenuToggle = (isOpen: boolean) => {
  if (isOpen && continentStatusMap.value.size === 0) {
    fetchActiveContinents();
  }
};

const selectContinent = (item: { name: string; continent: Continent }) => {
  setContinent(item.continent);
};
const items = computed(() => allContinents);

// Fetch continent status on component mount
onMounted(() => {
  fetchActiveContinents();
});

// Refetch when world changes
watch(selectedWorld, () => {
  continentStatusMap.value.clear(); // Clear old data immediately
  fetchActiveContinents();
});
</script>
