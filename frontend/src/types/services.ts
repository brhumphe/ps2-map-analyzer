import { Continent, World } from '@/types/common';
import { Zone } from '@/types/zone_types';
import { TerritorySnapshot } from '@/types/territory';

export interface PS2DataService {
  getZoneData(continent: Continent): Promise<Zone>;
  getCurrentTerritorySnapshot(
    continent: Continent,
    world: World
  ): Promise<TerritorySnapshot>;
}
