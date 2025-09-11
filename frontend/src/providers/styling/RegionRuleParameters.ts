// RegionRuleParameters.ts

import type {
  BooleanParameter,
  ColorParameter,
  NumberParameter,
  SchemaValues,
} from '@/types/RuleParameterSchema';

// Define schema for outline-cutoff rule
export const outlineCutoffSchema = {
  enabled: {
    type: 'boolean',
    defaultValue: true,
    label: 'Enable',
  } as BooleanParameter,
  borderColor: {
    type: 'color',
    defaultValue: '#ffeb00',
    label: 'Cutoff Border Color',
    description: 'Color for regions cut off from warpgate',
  } as ColorParameter,

  borderWidth: {
    type: 'number',
    defaultValue: 5,
    label: 'Border Width',
    min: 1,
    max: 10,
    step: 1,
  } as NumberParameter,

  lightnessAdjustment: {
    type: 'number',
    defaultValue: -0.35,
    label: 'Lightness Adjustment',
    min: -1,
    max: 1,
    step: 0.01,
  } as NumberParameter,

  saturationAdjustment: {
    type: 'number',
    defaultValue: 0.5,
    label: 'Saturation Adjustment',
    min: -1,
    max: 1,
    step: 0.01,
  } as NumberParameter,

  borderOpacity: {
    type: 'number',
    defaultValue: 1,
    label: 'Border Opacity',
    min: 0,
    max: 1,
    step: 0.01,
  } as NumberParameter,

  fillOpacity: {
    type: 'number',
    defaultValue: 0.95,
    label: 'Fill Opacity',
    min: 0,
    max: 1,
    step: 0.01,
  } as NumberParameter,
} as const;

// Type-safe parameter type derived from schema
export type OutlineCutoffParams = SchemaValues<typeof outlineCutoffSchema>;

// Define schema for fade-from-front rule
export const fadeFromFrontSchema = {
  enabled: {
    type: 'boolean',
    defaultValue: true,
    label: 'Enable',
  } as BooleanParameter,

  maxDistance: {
    type: 'number',
    defaultValue: 5,
    label: 'Maximum Fade Distance',
    min: 1,
    max: 10,
    step: 1,
  } as NumberParameter,

  nonPlayerMultiplier: {
    type: 'number',
    defaultValue: 1.5,
    label: 'Enemy Fade Multiplier',
    min: 0.1,
    max: 3,
    step: 0.1,
  } as NumberParameter,

  playerMultiplier: {
    type: 'number',
    defaultValue: 1,
    label: 'Player Fade Multiplier',
    min: 0.1,
    max: 3,
    step: 0.1,
  },
} as const;

export type FadeFromFrontParams = SchemaValues<typeof fadeFromFrontSchema>;

// Collect all rule schemas
export const ruleSchemas = {
  'outline-cutoff-region': outlineCutoffSchema,
  'fade-with-distance-from-front': fadeFromFrontSchema,
  // Add more as needed
};

export type RuleSchemas = typeof ruleSchemas;
