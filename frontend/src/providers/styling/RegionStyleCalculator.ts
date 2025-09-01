import type { PolylineOptions } from 'leaflet';
import { Faction } from '@/types/common';
import {
  adjustColorLightnessSaturation,
  FactionColor,
} from '@/utilities/colors';
import { RegionPane } from '@/utilities/leaflet_utils';
import type { RegionState } from '@/types/territory';
import type { MapDisplaySettings } from '@/composables/useMapDisplaySettings';

type InterpolationCurve = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
type InterpolationSettings = {
  curve: InterpolationCurve;
  start: number;
  end: number;
};

/**
 * Region style calculator that converts region states into visual properties
 *
 * This layer is responsible for translating strategic analysis results into
 * concrete visual styling for Leaflet polygon objects. It maintains separation
 * between analysis (what does the data mean) and presentation (how should it look).
 */
export class RegionStyleCalculator {
  // Configuration constants at class level for easy adjustment
  private static readonly FADE_MAX_DISTANCE = 7;
  private static readonly NON_PLAYER_FADE_MULTIPLIER = 1;

  // Interpolation settings for different properties and factions
  private static readonly PLAYER_BRIGHTNESS_SETTINGS: InterpolationSettings = {
    curve: 'easeOut',
    start: -0.8,
    end: 0.6,
  };

  private static readonly PLAYER_SATURATION_SETTINGS: InterpolationSettings = {
    curve: 'easeOut',
    start: -0.4,
    end: 0.5,
  };

  private static readonly PLAYER_OPACITY_SETTINGS: InterpolationSettings = {
    curve: 'linear',
    start: 1,
    end: 0.7,
  };

  private static readonly NON_PLAYER_BRIGHTNESS_SETTINGS: InterpolationSettings =
    {
      curve: 'easeIn',
      start: -0.8,
      end: -0.2,
    };

  private static readonly NON_PLAYER_SATURATION_SETTINGS: InterpolationSettings =
    {
      curve: 'easeIn',
      start: -0.4,
      end: 0.2,
    };

  private static readonly NON_PLAYER_OPACITY_SETTINGS: InterpolationSettings = {
    curve: 'easeOut',
    start: 1,
    end: 0.5,
  };
  /**
   * Interpolates using InterpolationSettings object
   *
   * @param settings Settings containing curve, min, and max values
   * @param t Progress from 0.0 to 1.0
   * @returns Interpolated value
   */
  private static interpolate(
    settings: InterpolationSettings,
    t: number
  ): number;

  private static interpolate(
    startOrSettings: number | InterpolationSettings,
    endOrT: number,
    t?: number,
    curve: InterpolationCurve = 'linear'
  ): number {
    let start: number;
    let end: number;
    let actualT: number;
    let actualCurve: InterpolationCurve;

    if (typeof startOrSettings === 'object') {
      // Using InterpolationSettings overload
      start = startOrSettings.end;
      end = startOrSettings.start;
      actualT = endOrT;
      actualCurve = startOrSettings.curve;
    } else {
      // Using individual parameters overload
      start = startOrSettings;
      end = endOrT;
      actualT = t!;
      actualCurve = curve;
    }

    // Clamp t to [0, 1]
    actualT = Math.max(0, Math.min(1, actualT));

    // Apply curve transformation
    let curvedT: number;
    switch (actualCurve) {
      case 'easeIn':
        curvedT = actualT * actualT; // Quadratic ease in
        break;
      case 'easeOut':
        curvedT = 1 - (1 - actualT) * (1 - actualT); // Quadratic ease out
        break;
      case 'easeInOut':
        curvedT =
          actualT < 0.5
            ? 2 * actualT * actualT
            : 1 - 2 * (1 - actualT) * (1 - actualT); // Quadratic ease in-out
        break;
      case 'linear':
      default:
        curvedT = actualT;
        break;
    }

    return start + (end - start) * curvedT;
  }

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
  ): Partial<PolylineOptions> {
    let style = this.calculateBaseStyle(
      regionState,
      mapSettings,
      playerFaction
    );

    style = this.applyDistanceFading(
      style,
      regionState,
      mapSettings,
      playerFaction
    );
    style = this.applyUserPreferences(style, mapSettings);
    return style;
  }

  private applyDistanceFading(
    style: Partial<PolylineOptions>,
    regionState: RegionState,
    mapSettings: MapDisplaySettings,
    playerFaction: Faction | undefined
  ): Partial<PolylineOptions> {
    // Skip if distance unknown or fading disabled
    if (
      regionState.distance_to_front === undefined ||
      regionState.distance_to_front < 0 ||
      !mapSettings.fadeDistantRegions
    ) {
      return style;
    }

    const distance = regionState.distance_to_front;

    // Get the base faction color to work from
    const faction_color: string =
      FactionColor.get(regionState.owning_faction_id) || '#ff00ff';

    // Check if this region belongs to the player's faction
    const isPlayerFaction =
      playerFaction !== undefined &&
      regionState.owning_faction_id === playerFaction;

    // Calculate fade intensity with faction-based multiplier
    // Non-player factions fade faster (higher effective distance)
    const effectiveDistance = isPlayerFaction
      ? distance
      : distance * RegionStyleCalculator.NON_PLAYER_FADE_MULTIPLIER;

    const fadeIntensity = Math.min(
      effectiveDistance / RegionStyleCalculator.FADE_MAX_DISTANCE,
      1.0
    );

    // Select settings based on faction
    const brightnessSettings = isPlayerFaction
      ? RegionStyleCalculator.PLAYER_BRIGHTNESS_SETTINGS
      : RegionStyleCalculator.NON_PLAYER_BRIGHTNESS_SETTINGS;
    const saturationSettings = isPlayerFaction
      ? RegionStyleCalculator.PLAYER_SATURATION_SETTINGS
      : RegionStyleCalculator.NON_PLAYER_SATURATION_SETTINGS;
    const opacitySettings = isPlayerFaction
      ? RegionStyleCalculator.PLAYER_OPACITY_SETTINGS
      : RegionStyleCalculator.NON_PLAYER_OPACITY_SETTINGS;

    // Use interpolation function with settings objects
    const brightnessAdjustment = RegionStyleCalculator.interpolate(
      brightnessSettings,
      fadeIntensity
    );

    const saturationAdjustment = RegionStyleCalculator.interpolate(
      saturationSettings,
      fadeIntensity
    );

    // Calculate opacity boost (higher opacity for more distant regions)
    const fillOpacity = RegionStyleCalculator.interpolate(
      opacitySettings,
      fadeIntensity
    );

    // Apply color adjustments to base faction color
    const adjustedFillColor = adjustColorLightnessSaturation(
      faction_color,
      brightnessAdjustment,
      saturationAdjustment
    );

    return {
      ...style,
      fillColor: adjustedFillColor,
      fillOpacity: fillOpacity,
    };
  }

  private applyUserPreferences(
    style: Partial<PolylineOptions>,
    mapSettings: MapDisplaySettings
  ): Partial<PolylineOptions> {
    if (!mapSettings.showRegionBorders) {
      return { ...style, opacity: 0.0 };
    }
    return style;
  }

  private calculateBaseStyle(
    regionState: RegionState,
    mapSettings: MapDisplaySettings,
    playerFaction: Faction | undefined
  ): Partial<PolylineOptions> {
    let weight = 1;
    let opacity = 0.7;
    let _fillOpacity = 0.6;
    let pane: RegionPane;

    const faction_color: string =
      FactionColor.get(regionState.owning_faction_id) || '#ff00ff';
    let border_color = '#292929';
    let _fillColor: string = FactionColor.get(Faction.NONE) || '#ff00ff';
    // 3-way fights can be "stolen" if one faction intervenes when the timer
    // is low, taking it from the other attacker.
    if (regionState.can_steal && mapSettings.highlightSteals) {
      _fillColor = adjustColorLightnessSaturation(faction_color, 0.5, 1);
      _fillOpacity = 0.8;
      border_color = '#2eff00';
      pane = RegionPane.PRIORITY;
      opacity = 1.0;
      weight = 4;
    } else if (regionState.can_capture) {
      if (regionState.relevant_to_player) {
        // Player's faction is involved in the region - brighter
        _fillColor = adjustColorLightnessSaturation(faction_color, 0.5, 1);
        _fillOpacity = 0.8;
        opacity = 1.0;
        pane = RegionPane.FRONTLINE;
        border_color = '#000000';
      } else {
        // Player's faction is not involved in the region - dimmer
        _fillColor = adjustColorLightnessSaturation(faction_color, 0.0, 0);
        _fillOpacity = 0.8;
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
      _fillOpacity = activeRegionStyle.fillOpacity;
      _fillColor = activeRegionStyle.fillColor;
    } else {
      // Not controlled by any faction and unavailable for capture
      pane = RegionPane.INACTIVE;
      opacity = 0.9;
      _fillOpacity = 0.75;
      _fillColor = adjustColorLightnessSaturation(faction_color, -0.5, 0);
    }
    return {
      weight,
      opacity,
      fillOpacity: 1.0,
      pane,
      color: border_color,
      fillColor: faction_color,
    };
  }

  private calculateActiveRegionStyle(
    owningFactionId: Faction,
    playerFaction: Faction | undefined,
    factionColor: string
  ) {
    const PLAYER_OWNED_LIGHTNESS = -0.25;
    const ENEMY_LIGHTNESS = -0.7;
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
