import { ref } from 'vue';
import { PS2DataService } from '@/types/services';
import { Continent, World } from '@/types/common';
import { TerritorySnapshot } from '@/types/territory';
import { Zone } from '@/types/zone_types';
import { CensusDataService } from '@/services/census';
import { DevelopmentDataService } from '@/services/dev_data';

const useDevData = ref(false);

class CensusData implements PS2DataService {
  census: CensusDataService;
  dev: DevelopmentDataService;

  constructor(serviceID: string = 'example') {
    this.census = new CensusDataService(serviceID);
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
export function useCensusData(serviceID: string = 'darkfurnace') {
  const dataService = new CensusData(serviceID);
  return { dataService, useDevData };
}
