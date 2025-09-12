// RuleParameterSchema.ts

// Define the possible parameter types and their UI hints
import type { HSLColor } from '@/utilities/colors';

export interface BaseParameter<T> {
  defaultValue: T;
  label: string;
  description?: string;
}

export interface NumberParameter extends BaseParameter<number> {
  type: 'number';
  min?: number;
  max?: number;
  step?: number;
}

export interface ColorParameter extends BaseParameter<string> {
  type: 'color';
}

export interface BooleanParameter extends BaseParameter<boolean> {
  type: 'boolean';
}

export interface SelectParameter<T extends string> extends BaseParameter<T> {
  type: 'select';
  options: readonly { value: T; label: string }[];
}

export interface HslColorParameter extends BaseParameter<HSLColor> {
  type: 'hsl';
  hue: number;
  saturation: number;
  lightness: number;
}

export type Parameter =
  | NumberParameter
  | ColorParameter
  | BooleanParameter
  | SelectParameter<string>
  | HslColorParameter;

// Type helper to extract the value type from a parameter
export type ParameterValue<P> = P extends BaseParameter<infer T> ? T : never;

// Type helper to extract values from a schema
export type SchemaValues<S> = {
  [K in keyof S]: S[K] extends BaseParameter<infer T> ? T : never;
};
