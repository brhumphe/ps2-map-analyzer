<template>
  <v-card v-if="history.requestCount.value > 0"
          max-width="600">
    <v-card-title>Request History:</v-card-title>
    <v-container>
      <v-list>
        <v-list-item
            v-for="(request, index) in history.requestHistory.value"
            :key="index"
            :style="{
            padding: '10px',
            // borderBottom: index < history.requestHistory.value.length - 1 ? '1px solid #eee' : 'none',
            backgroundColor: request.success ? '#235926' : '#D32F2F'
          }">
          <strong class="text-body-1">{{ request.timestamp }}</strong> - {{ request.type }}:
          <span :style="{ color: request.success ? 'green' : 'red' }">
            {{ request.data }}
          </span>
        </v-list-item>
      </v-list>
    </v-container>
  </v-card>
</template>

<script setup lang="ts">
import {useRequestHistory} from "./useRequestHistory";

const history = useRequestHistory()
</script>
