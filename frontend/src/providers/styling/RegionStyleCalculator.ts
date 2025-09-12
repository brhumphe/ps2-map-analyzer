import { Faction } from '@/types/common';
import { FactionColor } from '@/utilities/colors';
import type { RegionState } from '@/types/territory';
import type { MapDisplaySettings } from '@/composables/useMapDisplaySettings';
import {
  type StyleContext,
  type StyleEvaluationResult,
  StyleRuleSet,
} from '@/providers/styling/RegionStyleRules';
import type { PolylineOptions } from 'leaflet';
import { useRuleParameters } from '@/composables/useRuleParameters';
import type { RuleSchemas } from '@/providers/styling/RegionRuleParameters';

/**
 * Region style calculator that converts region states into visual properties
 *
 * This layer is responsible for translating strategic analysis results into
 * concrete visual styling for Leaflet polygon objects. It maintains separation
 * between analysis (what does the data mean) and presentation (how should it look).
 */
export class RegionStyleCalculator {
  private ruleParams = useRuleParameters();
  /**
   * Convert a region state to Leaflet polygon styling options
   *   *
   * @param regionState The strategic state of the region
   * @param playerFaction Faction POV of user
   * @param mapSettings Global map settings
   * @returns Leaflet PolylineOptions for styling the region polygon
   */
  calculateRegionStyle(
    regionState: RegionState,
    playerFaction: Faction | undefined,
    mapSettings: MapDisplaySettings
  ): StyleEvaluationResult {
    const context: StyleContext = {
      playerFaction: playerFaction ?? Faction.NONE,
      mapSettings: mapSettings,
      regionState: regionState,
      factionColor: FactionColor[regionState.owning_faction_id] ?? '#ff00ff',
      getParams: <K extends keyof RuleSchemas>(ruleId: K) => {
        return this.ruleParams.getRuleParams(ruleId);
      },
    };
    const data: Partial<PolylineOptions> = {};

    return StyleRuleSet.evaluate(
      [
        'default-region-style',
        'inactive-region',
        'active-region',
        'fade-player-faction-from-front',
        'fade-non-player-faction-from-front',
        'player-can-capture-region',
        'highlight-steals',
        'outline-cutoff-region',
      ],
      context,
      data
    );
  }
}
