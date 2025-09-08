<!-- components/RuleParameterEditor.vue -->
<template>
  <v-card>
    <v-card-title>Style Rule Settings</v-card-title>
    <v-card-text>
      <v-expansion-panels variant="accordion">
        <v-expansion-panel v-for="(schema, ruleId) in schemas" :key="ruleId">
          <v-expansion-panel-title>
            <h3 class="text-subtitle-1">
              {{ formatRuleId(ruleId) }}
            </h3></v-expansion-panel-title
          >
          <v-expansion-panel-text>
            <div v-for="(param, key) in schema" :key="key" class="mb-2">
              <!-- Number parameter -->
              <v-slider
                v-if="param.type === 'number'"
                :model-value="ruleParameters[ruleId]?.[key]"
                :label="param.label"
                :min="param.min"
                :max="param.max"
                :step="param.step"
                thumb-label
                density="compact"
                @update:model-value="setParameter(ruleId, key, $event)"
              />

              <!-- Color parameter -->
              <div
                v-else-if="param.type === 'color'"
                class="color-picker-container"
              >
                <v-label class="mb-2">{{ param.label }}</v-label>
                <v-color-picker
                  :model-value="ruleParameters[ruleId]?.[key]"
                  mode="hex"
                  hide-inputs
                  show-swatches
                  swatches-max-height="100"
                  @update:model-value="setParameter(ruleId, key, $event)"
                />
              </div>

              <!-- Boolean parameter -->
              <v-switch
                v-else-if="param.type === 'boolean'"
                :model-value="ruleParameters[ruleId]?.[key]"
                :label="param.label"
                density="compact"
                hide-details
                @update:model-value="setParameter(ruleId, key, $event)"
              />
            </div>

            <v-btn
              size="small"
              variant="outlined"
              class="mt-2"
              @click="resetRule(ruleId)"
            >
              Reset to Defaults
            </v-btn>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { useRuleParameters } from '@/composables/useRuleParameters';

const { ruleParameters, setParameter, resetRule, schemas } =
  useRuleParameters();

function formatRuleId(ruleId: string): string {
  return ruleId.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}
</script>
