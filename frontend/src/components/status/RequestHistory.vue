<template>
  <div v-if="requestHistory.length > 0" style="margin: 20px 0;">
    <h3>Request History:</h3>
    <div style="max-height: 300px; overflow-y: auto; border: 1px solid #ccc; border-radius: 5px;">
      <div
          v-for="(request, index) in requestHistory"
          :key="index"
          :style="{
            padding: '10px',
            borderBottom: index < requestHistory.length - 1 ? '1px solid #eee' : 'none',
            backgroundColor: request.success ? '#f0fff0' : '#fff0f0'
          }">
        <strong>{{ request.timestamp }}</strong> - {{ request.type }}:
        <span :style="{ color: request.success ? 'green' : 'red' }">
            {{ request.data }}
          </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

import {useRequestHistory} from "./useRequestHistory";

const { requestHistory } = useRequestHistory()
</script>
