<template>
  <v-card v-if="history.requestCount.value > 0">
    <h3>Request History:</h3>
    <v-container>
      <div
          v-for="(request, index) in history.requestHistory.value"
          :key="index"
          :style="{
            padding: '10px',
            borderBottom: index < history.requestHistory.value.length - 1 ? '1px solid #eee' : 'none',
            backgroundColor: request.success ? '#f0fff0' : '#fff0f0'
          }">
        <strong>{{ request.timestamp }}</strong> - {{ request.type }}:
        <span :style="{ color: request.success ? 'green' : 'red' }">
            {{ request.data }}
          </span>
      </div>
    </v-container>
  </v-card>
</template>

<script setup lang="ts">
import { useRequestHistory } from "./useRequestHistory";

const history = useRequestHistory()
</script>
