import { Faction } from '@/types/common';
import type { MapDisplaySettings } from '@/composables/useMapDisplaySettings';
import type { RegionState } from '@/types/territory';
import {
  type Rule,
  type RuleEvaluationResult,
  type RuleId,
  RuleSet,
} from '@/types/rules';
import type { PolylineOptions } from 'leaflet';
import {
  adjustColorLightnessSaturation,
  interpolate,
  type InterpolationCurve,
  setColorLightnessSaturation,
} from '@/utilities/colors';
import { RegionPane } from '@/utilities/leaflet_utils';
import type { RuleSchemas } from '@/providers/styling/RegionRuleParameters';
import type {
  BooleanParameter,
  NumberParameter,
  SchemaValues,
  SelectParameter,
} from '@/types/RuleParameterSchema';

export type StyleContext = {
  playerFaction: Faction;
  mapSettings: MapDisplaySettings;
  regionState: RegionState;
  factionColor: string;
  getParams<K extends keyof RuleSchemas>(
    ruleId: K
  ): SchemaValues<RuleSchemas[K]>;
};

/**
 * Rule interface for applying styling based on region state
 */
interface StyleRule extends Rule<StyleContext, PolylineOptions> {}

export type StyleEvaluationResult = RuleEvaluationResult<PolylineOptions>;

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
    const params = context.getParams<'player-can-capture-region'>(
      'player-can-capture-region'
    );

    const regionState = context.regionState;
    return (
      params.enabled &&
      (regionState.can_capture ?? false) &&
      (regionState.relevant_to_player ?? false)
    );
  },

  apply(
    context: StyleContext,
    _data: Partial<PolylineOptions>
  ): Partial<PolylineOptions> {
    const params = context.getParams<'player-can-capture-region'>(
      'player-can-capture-region'
    );
    // Player's faction is involved in the region - brighter
    return {
      fillColor: adjustColorLightnessSaturation(
        context.factionColor,
        params.lightnessAdjustment,
        params.saturationAdjustment
      ),
      fillOpacity: params.fillOpacity ?? 0.8,
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

function applyFrontlineFade<T>(
  distance: number,
  params: SchemaValues<{
    readonly enabled: BooleanParameter;
    readonly maxDistance: NumberParameter;
    readonly fadeIntensity: NumberParameter;
    readonly interpolationCurve: SelectParameter<InterpolationCurve>;
    readonly brightnessStart: NumberParameter;
    readonly brightnessEnd: NumberParameter;
    readonly saturationStart: NumberParameter;
    readonly saturationEnd: NumberParameter;
    readonly opacityStart: NumberParameter;
    readonly opacityEnd: NumberParameter;
  }>,
  context: StyleContext,
  data: Partial<PolylineOptions>
) {
  // Normalize distance: treat negative/unknown distances as 0
  const normalizedDistance = Math.max(distance, 0);

  // Calculate fade intensity for non-player faction
  const effectiveDistance = normalizedDistance * params.fadeIntensity;
  const fadeIntensity = Math.min(
    Math.max(effectiveDistance / params.maxDistance, 0),
    1
  );

  // Create dynamic interpolation settings from parameters
  const brightnessSettings = {
    curve: params.interpolationCurve as InterpolationCurve,
    start: params.brightnessStart,
    end: params.brightnessEnd,
  };
  const saturationSettings = {
    curve: params.interpolationCurve as InterpolationCurve,
    start: params.saturationStart,
    end: params.saturationEnd,
  };
  const opacitySettings = {
    curve: params.interpolationCurve as InterpolationCurve,
    start: params.opacityStart,
    end: params.opacityEnd,
  };

  // Use dynamic settings
  const brightnessAdjustment = interpolate(brightnessSettings, fadeIntensity);
  const saturationAdjustment = interpolate(saturationSettings, fadeIntensity);
  const fillOpacity = interpolate(opacitySettings, fadeIntensity);

  // Apply color adjustments to base faction color
  const adjustedFillColor = setColorLightnessSaturation(
    context.factionColor,
    brightnessAdjustment,
    saturationAdjustment
  );

  return {
    ...data,
    fillColor: adjustedFillColor,
    fillOpacity: fillOpacity,
  };
}

const fadePlayerFactionFromFront: StyleRule = {
  id: 'fade-player-faction-from-front',
  applicable(context: StyleContext): boolean {
    const params = context.getParams<'fade-player-faction-from-front'>(
      'fade-player-faction-from-front'
    );
    if (!params.enabled) {
      return false;
    }

    const isPlayerFaction =
      context.playerFaction !== undefined &&
      context.regionState.owning_faction_id === context.playerFaction;

    return (
      isPlayerFaction &&
      context.regionState.distance_to_front >= 0 &&
      context.mapSettings.fadeDistantRegions
    );
  },
  apply(
    context: StyleContext,
    data: Partial<PolylineOptions>
  ): Partial<PolylineOptions> {
    const distance = context.regionState.distance_to_front;
    const params = context.getParams<'fade-player-faction-from-front'>(
      'fade-player-faction-from-front'
    );

    return applyFrontlineFade(distance, params, context, data);
  },
};

const fadeNonPlayerFactionFromFront: StyleRule = {
  id: 'fade-non-player-faction-from-front',
  applicable(context: StyleContext): boolean {
    const params = context.getParams<'fade-non-player-faction-from-front'>(
      'fade-non-player-faction-from-front'
    );
    if (!params.enabled) {
      return false;
    }

    const isPlayerFaction =
      context.playerFaction !== undefined &&
      context.regionState.owning_faction_id === context.playerFaction;

    return (
      !isPlayerFaction &&
      context.regionState.distance_to_front >= 0 &&
      context.mapSettings.fadeDistantRegions
    );
  },
  apply(
    context: StyleContext,
    data: Partial<PolylineOptions>
  ): Partial<PolylineOptions> {
    const distance = context.regionState.distance_to_front;
    const params = context.getParams<'fade-non-player-faction-from-front'>(
      'fade-non-player-faction-from-front'
    );
    return applyFrontlineFade(distance, params, context, data);
  },
};

const outlineCutoffRegion: StyleRule = {
  id: 'outline-cutoff-region',
  applicable(context: StyleContext): boolean {
    const regionState = context.regionState;
    const params = context.getParams<'outline-cutoff-region'>(
      'outline-cutoff-region'
    );
    return (
      params.enabled &&
      regionState.distance_to_wg < 0 &&
      regionState.owning_faction_id !== Faction.NONE
    );
  },
  apply(
    context: StyleContext,
    _data: Partial<PolylineOptions>
  ): Partial<PolylineOptions> {
    const fillColor = context.factionColor ?? '#ff00ff';
    const params = context.getParams<'outline-cutoff-region'>(
      'outline-cutoff-region'
    );
    return {
      color: params.borderColor ?? '#ff00ff',
      weight: params.borderWidth ?? 1,
      pane: RegionPane.PRIORITY,
      fillColor: adjustColorLightnessSaturation(
        fillColor,
        params.lightnessAdjustment,
        params.saturationAdjustment
      ),
      opacity: params.borderOpacity ?? 1,
      fillOpacity: params.fillOpacity ?? 0.5,
    };
  },
};

export const StyleRuleSet = new RuleSet<StyleContext, PolylineOptions>([
  defaultRegionStyle,
  inactiveRegion,
  activeRegion,
  fadePlayerFactionFromFront,
  fadeNonPlayerFactionFromFront,
  playerCapturableRegion,
  highlightSteals,
  outlineCutoffRegion,
]);
