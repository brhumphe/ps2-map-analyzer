import { Faction } from '@/types/common';
import { FactionColor } from '@/utilities/colors';
import type { RegionState } from '@/types/territory';
import type { MapDisplaySettings } from '@/composables/useMapDisplaySettings';
import {
  type StyleEvaluationResult,
  StyleRuleSet,
} from '@/utilities/style_rules.ts';

/**
 * Region style calculator that converts region states into visual properties
 *
 * This layer is responsible for translating strategic analysis results into
 * concrete visual styling for Leaflet polygon objects. It maintains separation
 * between analysis (what does the data mean) and presentation (how should it look).
 */
export class RegionStyleCalculator {
  /**
   * Convert a region state to Leaflet polygon styling options
   *
   * Maps region control states to faction colors:
   * - VS: Purple/Teal (#441c7a)
   * - NC: Blue (#004bad)
   * - TR: Red (#9d2621)
   * - NSO: Gray (#565851)
   * - none: Light gray with low opacity
   * - unknown: Dark gray with dashed border
   *
   * @param regionState The strategic state of the region
   * @param playerFaction Faction POV of user
   * @param mapSettings
   * @returns Leaflet PolylineOptions for styling the region polygon
   */
  calculateRegionStyle(
    regionState: RegionState,
    playerFaction: Faction | undefined,
    mapSettings: MapDisplaySettings
  ): StyleEvaluationResult {
    const context = {
      playerFaction: playerFaction ?? Faction.NONE,
      mapSettings: mapSettings,
      regionState: regionState,
      factionColor: FactionColor[regionState.owning_faction_id] ?? '#ff00ff',
    };
    const data = {};

    return StyleRuleSet.evaluate(
      [
        'default-region-style',
        'inactive-region',
        'active-region',
        'fade-with-distance-from-front',
        'player-can-capture-region',
      ],
      context,
      data
    );
  }
}
