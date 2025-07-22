<template>
  <v-card v-if="history.requestCount.value > 0" elevation="2">
    <v-card-title>
      <v-icon class="mr-2">mdi-history</v-icon>
      Request History
    </v-card-title>
    <v-card-text class="pa-0">
      <v-list density="comfortable">
        <v-list-item
          v-for="(request, index) in history.requestHistory.value"
          :key="index"
          class="border-b"
        >
          <template #prepend>
            <v-avatar
              size="small"
              :color="request.success ? 'success' : 'error'"
              class="mr-3"
            >
              <v-icon
                :icon="request.success ? 'mdi-check' : 'mdi-close'"
                size="small"
              >
              </v-icon>
            </v-avatar>
          </template>

          <v-list-item-title class="d-flex align-center">
            <span class="text-body-2 text-medium-emphasis mr-2">
              {{ request.timestamp }}
            </span>
            <v-chip
              size="small"
              :color="request.success ? 'success' : 'error'"
              variant="flat"
              density="compact"
            >
              {{ request.type }}
            </v-chip>
          </v-list-item-title>

          <v-list-item-subtitle
            :class="request.success ? 'text-success' : 'text-error'"
          >
            {{ request.data }}
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { useRequestHistory } from './useRequestHistory';

const history = useRequestHistory();
</script>

<style scoped>
.border-b:not(:last-child) {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
