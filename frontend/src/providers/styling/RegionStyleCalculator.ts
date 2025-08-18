import type { RegionState } from '@/types/region_analysis';
import type L from 'leaflet';
import { Faction } from '@/types/common';
import {
  adjustColorLightnessSaturation,
  FactionColor,
} from '@/utilities/colors';
import { RegionPane } from '@/utilities/leaflet_utils';

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
   * @returns Leaflet PolylineOptions for styling the region polygon
   */
  calculateRegionStyle(
    regionState: RegionState,
    playerFaction: Faction | undefined
  ): Partial<L.PolylineOptions> {
    let weight = 1;
    let opacity = 0.7;
    let fillOpacity = 0.6;
    let pane: RegionPane;

    const faction_color: string =
      FactionColor.get(regionState.owning_faction_id) || '#ff00ff';
    let border_color = '#404040';
    let fillColor: string = FactionColor.get(Faction.NONE) || '#ff00ff';
    if (regionState.can_steal) {
      fillColor = adjustColorLightnessSaturation(faction_color, 0.5, 1);
      fillOpacity = 0.8;
      border_color = '#2eff00';
      pane = RegionPane.PRIORITY;
      opacity = 1.0;
      weight = 4;
    } else if (regionState.can_capture) {
      if (regionState.relevant_to_player) {
        fillColor = adjustColorLightnessSaturation(faction_color, 0.5, 1);
        fillOpacity = 0.8;
        opacity = 1.0;
        pane = RegionPane.FRONTLINE;
        border_color = '#000000';
      } else {
        fillColor = adjustColorLightnessSaturation(faction_color, 0.0, 0);
        fillOpacity = 0.8;
        opacity = 0.5;
        pane = RegionPane.BASE;
      }
    } else if (regionState.is_active) {
      // Controlled by a faction but not available to attack
      const activeRegionStyle = this.calculateActiveRegionStyle(
        regionState.owning_faction_id,
        playerFaction,
        faction_color
      );
      opacity = activeRegionStyle.opacity;
      pane = activeRegionStyle.pane;
      fillOpacity = activeRegionStyle.fillOpacity;
      fillColor = activeRegionStyle.fillColor;
    } else {
      pane = RegionPane.INACTIVE;
      opacity = 0.9;
      fillOpacity = 0.75;
      fillColor = adjustColorLightnessSaturation(faction_color, -0.5, 0);
    }

    return {
      weight,
      opacity,
      fillOpacity,
      color: border_color,
      fillColor: fillColor,
      pane,
    };
  }

  private calculateActiveRegionStyle(
    owningFactionId: Faction,
    playerFaction: Faction | undefined,
    factionColor: string
  ) {
    const PLAYER_OWNED_LIGHTNESS = -0.25;
    const ENEMY_LIGHTNESS = -0.7;
    const NEUTRAL_LIGHTNESS = -0.5;
    const PLAYER_OWNED_SATURATION = 0.0;
    const ENEMY_SATURATION = 0.2;
    const NEUTRAL_SATURATION = 0.0;

    let lightnessAdjustment: number;
    let saturationAdjustment: number;
    let fillOpacity: number;

    if (owningFactionId === playerFaction) {
      // Player's own faction - brighter and more saturated
      lightnessAdjustment = PLAYER_OWNED_LIGHTNESS;
      saturationAdjustment = PLAYER_OWNED_SATURATION;
      fillOpacity = 0.65;
    } else if (playerFaction === undefined || playerFaction === Faction.NONE) {
      // Neutral perspective - desaturated
      lightnessAdjustment = ENEMY_LIGHTNESS;
      saturationAdjustment = NEUTRAL_SATURATION;
      fillOpacity = 0.6;
    } else {
      // Enemy faction - darker but slightly saturated
      lightnessAdjustment = ENEMY_LIGHTNESS;
      saturationAdjustment = ENEMY_SATURATION;
      fillOpacity = 0.5;
    }

    return {
      opacity: 1.0,
      pane: RegionPane.BASE,
      fillOpacity,
      fillColor: adjustColorLightnessSaturation(
        factionColor,
        lightnessAdjustment,
        saturationAdjustment
      ),
    };
  }
}
