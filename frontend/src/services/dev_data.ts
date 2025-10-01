import { Continent, ContinentName, World } from '@/types/common';
import type { TerritorySnapshot } from '@/types/territory';
import { CensusDataService } from '@/services/census';
import { extractCensusMapState } from '@/services/parsers';

export class DevelopmentDataService extends CensusDataService {
  constructor(serviceId: string = 'dev') {
    super(serviceId);
  }

  async getCurrentTerritorySnapshot(
    continent: Continent,
    world: World
  ): Promise<TerritorySnapshot> {
    const url = `/${ContinentName.get(continent)?.toLowerCase()}-map-census.json`;
    try {
      // Load local JSON file from public directory
      const response = await fetch(url);
      if (!response.ok) {
        // noinspection ExceptionCaughtLocallyJS
        throw new Error(`Failed to load development data: ${response.status}`);
      }

      const data = await response.json();
      return extractCensusMapState(data, continent, world);
    } catch (err) {
      throw new Error(
        `Development data load failed: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
  }
}
