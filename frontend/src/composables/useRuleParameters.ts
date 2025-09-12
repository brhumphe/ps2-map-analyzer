// composables/useRuleParameters.ts

import { ref, watch } from 'vue';
import {
  type RuleSchemas,
  ruleSchemas,
} from '@/providers/styling/RegionRuleParameters';
import type { SchemaValues, ParameterValue } from '@/types/RuleParameterSchema';

// Simple deep merge utility to avoid adding lodash dependency
function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Record<string, unknown>
): T {
  const result = { ...target };

  for (const key in source) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key])
    ) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (result as any)[key] = deepMerge(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((target as any)[key] as Record<string, unknown>) || {},
        source[key] as Record<string, unknown>
      );
    } else if (source[key] !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (result as any)[key] = source[key];
    }
  }

  return result as T;
}

// Storage for all rule parameters - use a more flexible type for the ref
const ruleParameters = ref<Record<string, Record<string, unknown>>>({});

// Initialize with defaults from schemas
for (const [ruleId, schema] of Object.entries(ruleSchemas)) {
  const defaults: Record<string, unknown> = {};
  for (const [key, param] of Object.entries(schema)) {
    defaults[key] = param.defaultValue;
  }
  ruleParameters.value[ruleId] = defaults;
}

// Persist to localStorage
const STORAGE_KEY = 'rule-parameters';

// Load from localStorage
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      Object.assign(ruleParameters.value, JSON.parse(stored));
    }
  } catch (error) {
    console.warn('Failed to load rule parameters from localStorage:', error);
  }
}

// Save on change
watch(
  ruleParameters,
  (newParams) => {
    // Guard against SSR and test environments where localStorage isn't available
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newParams));
      } catch (error) {
        // Storage may fail due to privacy settings, quota limits, or other restrictions
        console.warn('Failed to save rule parameters to localStorage:', error);
      }
    }
  },
  { deep: true }
);

export function useRuleParameters() {
  // Type-safe getter for a specific rule's parameters
  function getRuleParams<K extends keyof RuleSchemas>(
    ruleId: K
  ): SchemaValues<RuleSchemas[K]> {
    const defaults = getDefaults(ruleId);
    const stored = ruleParameters.value[ruleId] || {};

    // Always merge defaults with stored values to ensure all fields are populated
    const merged = deepMerge(defaults as Record<string, unknown>, stored);

    return merged as SchemaValues<RuleSchemas[K]>;
  }

  // Update a single parameter with proper typing
  function setParameter<
    K extends keyof RuleSchemas,
    P extends keyof RuleSchemas[K],
  >(ruleId: K, key: P, value: ParameterValue<RuleSchemas[K][P]>) {
    if (!ruleParameters.value[ruleId]) {
      ruleParameters.value[ruleId] = getDefaults(ruleId) as Record<
        string,
        unknown
      >;
    }
    if (import.meta.env.DEV) {
      console.log('Setting parameter', ruleId, key, value);
    }
    (ruleParameters.value[ruleId] as Record<string, unknown>)[key as string] =
      value;
  }

  // Get defaults for a rule
  function getDefaults<K extends keyof RuleSchemas>(
    ruleId: K
  ): SchemaValues<RuleSchemas[K]> {
    const schema = ruleSchemas[ruleId];
    const defaults: Record<string, unknown> = {};
    for (const [key, param] of Object.entries(schema)) {
      defaults[key] = param.defaultValue;
    }
    return defaults as SchemaValues<RuleSchemas[K]>;
  }

  // Reset a rule to defaults
  function resetRule<K extends keyof RuleSchemas>(ruleId: K) {
    ruleParameters.value[ruleId] = getDefaults(ruleId) as Record<
      string,
      unknown
    >;
  }

  return {
    ruleParameters: ruleParameters,
    getRuleParams,
    setParameter,
    resetRule,
    schemas: ruleSchemas, // Expose for UI generation
  };
}
