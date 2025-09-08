// composables/useRuleParameters.ts

import { ref, watch } from 'vue';
import {
  type RuleSchemas,
  ruleSchemas,
} from '@/providers/styling/RegionRuleParameters';
import type { SchemaValues, ParameterValue } from '@/types/RuleParameterSchema';

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
try {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    Object.assign(ruleParameters.value, JSON.parse(stored));
  }
} catch (e) {
  console.warn('Failed to load rule parameters:', e);
}

// Save on change
watch(
  ruleParameters,
  (newParams) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newParams));
  },
  { deep: true }
);

export function useRuleParameters() {
  // Type-safe getter for a specific rule's parameters
  function getRuleParams<K extends keyof RuleSchemas>(
    ruleId: K
  ): SchemaValues<RuleSchemas[K]> {
    return (
      (ruleParameters.value[ruleId] as SchemaValues<RuleSchemas[K]>) ||
      getDefaults(ruleId)
    );
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
