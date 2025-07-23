import { Faction } from '@/types/common';

/**
 * User-specific context that affects styling and analysis calculations
 *
 * This context allows display modes to provide personalized tactical
 * information based on the user's faction, selections, and preferences.
 */
export interface UserContext {
  /**
   * The faction the user is playing as
   * Used for "friendly vs enemy" tactical analysis
   */
  playerFaction?: Faction;

  // Future expansion possibilities:
  // selectedRegions?: number[]     // Regions user has selected for analysis
  // playerLocation?: number        // Region where user is currently located
  // tacticalFocus?: 'offense' | 'defense' // Preferred tactical perspective
}
