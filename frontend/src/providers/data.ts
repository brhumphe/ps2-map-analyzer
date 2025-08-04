import { PS2DataService } from '@/types/services';
import { CensusDataService } from '@/services/census';
import { DevelopmentDataService } from '@/services/dev_data';

export class DataSourceProvider {
  constructor(
    private censusService: CensusDataService | null = null,
    private developmentService: DevelopmentDataService | null = null
  ) {}

  getDataService(forceLive = false): PS2DataService {
    // Business logic for choosing which service to use
    // Check if running in development mode
    const isDevelopment = forceLive
      ? false
      : import.meta.env.DEV || import.meta.env.VITE_USE_MOCK_DATA === 'true';
    if (isDevelopment) {
      if (!this.developmentService) {
        this.developmentService = new DevelopmentDataService();
      }
      return this.developmentService;
    }
    if (!this.censusService) {
      this.censusService = new CensusDataService();
    }
    return this.censusService;
  }
}
