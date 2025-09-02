import { Faction } from '@/types/common.ts';
import type { MapDisplaySettings } from '@/composables/useMapDisplaySettings.ts';
import type { RegionState } from '@/types/territory.ts';
import { type Rule, type RuleId, RuleSet } from '@/types/rules.ts';
import type { PolylineOptions } from 'leaflet';
import {
  adjustColorLightnessSaturation,
  interpolate,
  type InterpolationSettings,
} from '@/utilities/colors.ts';
import { RegionPane } from '@/utilities/leaflet_utils.ts';

type StyleContext = {
  playerFaction: Faction;
  mapSettings: MapDisplaySettings;
  regionState: RegionState;
  factionColor: string;
};

/**
 * Rule interface for applying styling based on region state
 */
interface StyleRule extends Rule<StyleContext, PolylineOptions> {}

const highlightSteals: StyleRule = {
  id: 'highlight-steals' as RuleId,
  applicable(context: StyleContext): boolean {
    const regionState = context.regionState;
    const mapSettings = context.mapSettings;
    return regionState.can_steal && mapSettings.highlightSteals;
  },
  apply(context: StyleContext, _data: Partial<PolylineOptions>) {
    return {
      fillColor: adjustColorLightnessSaturation(context.factionColor, 0.5, 1),
      fillOpacity: 0.8,
      color: '#2eff00',
      pane: RegionPane.PRIORITY,
      opacity: 1.0,
      weight: 4,
    };
  },
};

const playerCapturableRegion: StyleRule = {
  id: 'player-can-capture-region' as RuleId,
  applicable(context: StyleContext): boolean {
    const regionState = context.regionState;
    return (
      (regionState.can_capture ?? false) &&
      (regionState.relevant_to_player ?? false)
    );
  },

  apply(
    context: StyleContext,
    _data: Partial<PolylineOptions>
  ): Partial<PolylineOptions> {
    // Player's faction is involved in the region - brighter
    return {
      fillColor: adjustColorLightnessSaturation(context.factionColor, 0.5, 1),
      fillOpacity: 0.8,
      opacity: 1.0,
      pane: RegionPane.FRONTLINE,
      color: '#000000',
    };
  },
};

const defaultRegionStyle: StyleRule = {
  id: 'default-region-style',
  applicable(_context: StyleContext): boolean {
    return true;
  },
  apply(_context: StyleContext, _data: Partial<PolylineOptions>) {
    return {
      color: '#666666',
      fillColor: '#333333',
      fillOpacity: 0.5,
      weight: 1,
      opacity: 0.5,
      pane: RegionPane.BASE,
    };
  },
};

const inactiveRegion: StyleRule = {
  id: 'inactive-region' as RuleId,
  applicable(context: StyleContext): boolean {
    return !context.regionState.is_active;
  },

  apply(
    context: StyleContext,
    _data: Partial<PolylineOptions>
  ): Partial<PolylineOptions> {
    return {
      pane: RegionPane.INACTIVE,
      opacity: 0.9,
      fillOpacity: 0.75,
      fillColor: adjustColorLightnessSaturation(context.factionColor, -0.5, 0),
      color: '#292929',
    };
  },
};

const activeRegion: StyleRule = {
  id: 'active-region' as RuleId,
  applicable(context: StyleContext): boolean {
    const regionState = context.regionState;
    return regionState.is_active;
  },
  apply(
    context: StyleContext,
    _data: Partial<PolylineOptions>
  ): Partial<PolylineOptions> {
    const owningFactionId = context.regionState.owning_faction_id;
    const playerFaction = context.playerFaction;
    const factionColor = context.factionColor;
    const PLAYER_OWNED_LIGHTNESS = 0;
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
      fillOpacity = 0.6;
    }

    return {
      pane: RegionPane.BASE,
      fillOpacity,
      fillColor: adjustColorLightnessSaturation(
        factionColor,
        lightnessAdjustment,
        saturationAdjustment
      ),
    };
  },
};

// Configuration constants at class level for easy adjustment
const FADE_MAX_DISTANCE = 7;
const NON_PLAYER_FADE_MULTIPLIER = 1;

// Interpolation settings for different properties and factions
const PLAYER_BRIGHTNESS_SETTINGS: InterpolationSettings = {
  curve: 'easeOut',
  start: -0.8,
  end: 0.6,
};

const PLAYER_SATURATION_SETTINGS: InterpolationSettings = {
  curve: 'easeOut',
  start: -0.4,
  end: 0.5,
};

const PLAYER_OPACITY_SETTINGS: InterpolationSettings = {
  curve: 'linear',
  start: 1,
  end: 0.7,
};

const NON_PLAYER_BRIGHTNESS_SETTINGS: InterpolationSettings = {
  curve: 'easeIn',
  start: -0.8,
  end: -0.2,
};

const NON_PLAYER_SATURATION_SETTINGS: InterpolationSettings = {
  curve: 'easeIn',
  start: -0.4,
  end: 0.2,
};

const NON_PLAYER_OPACITY_SETTINGS: InterpolationSettings = {
  curve: 'easeOut',
  start: 1,
  end: 0.5,
};

const fadeFromFront: StyleRule = {
  id: 'fade-with-distance-from-front',
  applicable(_context: StyleContext): boolean {
    return true;
  },
  apply(
    context: StyleContext,
    data: Partial<PolylineOptions>
  ): Partial<PolylineOptions> {
    const regionState = context.regionState;
    const playerFaction = context.playerFaction;
    const distance = regionState.distance_to_front;

    // Get the base faction color to work from
    const faction_color: string = context.factionColor;

    // Check if this region belongs to the player's faction
    const isPlayerFaction =
      playerFaction !== undefined &&
      regionState.owning_faction_id === playerFaction;

    // Calculate fade intensity with faction-based multiplier
    // Non-player factions fade faster (higher effective distance)
    const effectiveDistance = isPlayerFaction
      ? distance
      : distance * NON_PLAYER_FADE_MULTIPLIER;

    const fadeIntensity = Math.min(effectiveDistance / FADE_MAX_DISTANCE, 1.0);

    // Select settings based on faction
    const brightnessSettings = isPlayerFaction
      ? PLAYER_BRIGHTNESS_SETTINGS
      : NON_PLAYER_BRIGHTNESS_SETTINGS;
    const saturationSettings = isPlayerFaction
      ? PLAYER_SATURATION_SETTINGS
      : NON_PLAYER_SATURATION_SETTINGS;
    const opacitySettings = isPlayerFaction
      ? PLAYER_OPACITY_SETTINGS
      : NON_PLAYER_OPACITY_SETTINGS;

    // Use interpolation function with settings objects
    const brightnessAdjustment = interpolate(brightnessSettings, fadeIntensity);

    const saturationAdjustment = interpolate(saturationSettings, fadeIntensity);

    // Calculate opacity boost (higher opacity for more distant regions)
    const fillOpacity = interpolate(opacitySettings, fadeIntensity);

    // Apply color adjustments to base faction color
    const adjustedFillColor = adjustColorLightnessSaturation(
      faction_color,
      brightnessAdjustment,
      saturationAdjustment
    );

    return {
      ...data,
      fillColor: adjustedFillColor,
      fillOpacity: fillOpacity,
    };
  },
};

export const StyleRuleSet = new RuleSet<StyleContext, PolylineOptions>([
  defaultRegionStyle,
  inactiveRegion,
  activeRegion,
  fadeFromFront,
  playerCapturableRegion,
  highlightSteals,
]);
