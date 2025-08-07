import { ref } from 'vue';
import type { PS2DataService } from '@/types/services';
import { Continent, World } from '@/types/common';
import type { TerritorySnapshot } from '@/types/territory';
import type { Zone } from '@/types/zone_types';
import { CensusDataService } from '@/services/census';
import { DevelopmentDataService } from '@/services/dev_data';
import config from '@/config.json';

const useDevData = ref(true);

class CensusData implements PS2DataService {
  census: CensusDataService;
  dev: DevelopmentDataService;

  constructor() {
    this.census = new CensusDataService(config.censusServiceId);
    this.dev = new DevelopmentDataService();
  }

  getCurrentTerritorySnapshot(
    continent: Continent,
    world: World
  ): Promise<TerritorySnapshot> {
    if (useDevData.value) {
      return this.dev.getCurrentTerritorySnapshot(continent, world);
    } else {
      return this.census.getCurrentTerritorySnapshot(continent, world);
    }
  }

  getZoneData(continent: Continent): Promise<Zone> {
    if (useDevData.value) {
      return this.dev.getZoneData(continent);
    } else {
      return this.census.getZoneData(continent);
    }
  }
}

/**
 * Factory for getting the appropriate PS2DataService
 */
export function useCensusData() {
  const dataService = new CensusData();
  return { dataService, useDevData };
}
