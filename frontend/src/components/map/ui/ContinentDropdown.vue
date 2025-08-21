<template>
  <div class="d-flex align-center ga-1">
    <v-select
      :model-value="selectedContinent"
      @update:model-value="selectContinent"
      :items="selectItems"
      item-title="name"
      item-value="continent"
      :loading="isLoading"
      :error="hasError"
      :error-messages="hasError ? 'Failed to load status' : undefined"
      variant="outlined"
      density="compact"
      class="continent-select"
      @click:control="onSelectClick"
      style="min-width: 140px"
      hide-details
    >
      <template v-slot:selection="{ item }">
        <div class="d-flex align-center">
          <v-icon
            :icon="getContinentIcon(item.raw.continent).icon"
            :color="getContinentIcon(item.raw.continent).color"
            size="small"
            class="mr-2"
          />
          {{ item.raw.name }}
        </div>
      </template>

      <template v-slot:item="{ item, props }">
        <v-list-item
          v-bind="props"
          :class="getContinentStatusClass(item.raw.continent)"
        >
          <template v-slot:prepend>
            <v-icon
              :icon="getContinentIcon(item.raw.continent).icon"
              :color="getContinentIcon(item.raw.continent).color"
              size="small"
            />
          </template>
        </v-list-item>
      </template>
    </v-select>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { Continent } from '@/types/common.ts';
import { useAppState } from '@/composables/useAppState.ts';
import type { HonuWorldOverview, HonuZoneStatus } from '@/types/honu-api.ts';

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
new Map([
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
    return 'continent-alert';
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
    return { icon: 'mdi-alarm-light', color: '#ff1610' };
  } else if (isContinentOpen(continent)) {
    return { icon: 'mdi-earth', color: 'success' };
  }
  return { icon: 'mdi-help-circle-outline', color: 'grey' };
};

const onSelectClick = () => {
  fetchActiveContinents();
};

const selectContinent = (continent: Continent) => {
  setContinent(continent);
};

const selectItems = computed(() => allContinents);

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
<style scoped>
.continent-alert {
  background-color: #751010;
}
</style>
