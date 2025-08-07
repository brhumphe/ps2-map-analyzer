import { Continent, World } from '@/types/common';
import type { Zone } from '@/types/zone_types';
import type { TerritorySnapshot } from '@/types/territory';

export interface PS2DataService {
  getZoneData(continent: Continent): Promise<Zone>;
  getCurrentTerritorySnapshot(
    continent: Continent,
    world: World
  ): Promise<TerritorySnapshot>;
}
