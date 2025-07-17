<template>
  <v-app>
    <v-app-bar title="PS2 Map State Application - Vue Version"></v-app-bar>

<v-main>
    <!-- Request statistics that automatically update -->
    <v-container>
      <h3>Request Statistics</h3>
      <p>Total Requests: {{ history.requestCount }}</p>
      <p :style="{ color: history.hasErrors.value ? 'red' : 'green' }">
        Status: {{ history.hasErrors.value ? 'Some requests failed' : 'All requests successful' }}
      </p>
    </v-container>

    <v-container>
      <v-btn
        @click="testBackendConnection"
        :disabled="isLoading">
        Test Backend Connection
      </v-btn>

      <v-btn
        @click="fetchCapturableBases"
        :disabled="isLoading">
        Get Capturable Bases
      </v-btn>

      <v-btn
        @click="history.clearHistory"
        :disabled="isLoading">
        Clear History
      </v-btn>
    </v-container>

    <!-- Status display -->
    <v-container>
      <p :style="{ color: getStatusColor() }">{{ statusMessage }}</p>
      <p v-if="isLoading" style="color: #666;">Loading...</p>
    </v-container>

    <!-- Current result -->
    <v-card v-if="resultData">
      <v-card-title>Current Result:</v-card-title>
     <v-card-text> <pre>{{ formatResult(resultData) }}</pre></v-card-text>
    </v-card>

    <!-- Request history that automatically updates -->
    <RequestHistory :request-history="history"/>
  </v-main>
  </v-app>
</template>

<script lang="ts">
import {defineComponent, ref} from 'vue';
import RequestHistory from "@/components/status/RequestHistory.vue";
import {useRequestHistory} from "@/components/status/useRequestHistory";
import {ResultData} from "@/components/status/status_types.js";

const API_BASE = 'http://localhost:8000';

export default defineComponent({
  components: {RequestHistory},
  setup() {
    const statusMessage = ref<string>('Ready');
    const resultData = ref<ResultData | null>(null);
    const isLoading = ref<boolean>(false);
    const history = useRequestHistory();

    const testBackendConnection = async (): Promise<void> => {
      try {
        isLoading.value = true;
        statusMessage.value = 'Testing backend connection...';
        resultData.value = null;

        const response = await fetch(`${API_BASE}/api/ping`);
        const data: ResultData = await response.json();

        statusMessage.value = '✓ Backend connection successful!';
        resultData.value = data;
        history.recordRequest('Backend Test', true, data);
      } catch (error) {
        const errorData: ResultData = {
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        statusMessage.value = '✗ Backend connection failed!';
        resultData.value = errorData;
        history.recordRequest('Backend Test', false, errorData);
      } finally {
        isLoading.value = false;
      }
    };

    const fetchCapturableBases = async (): Promise<void> => {
      try {
        isLoading.value = true;
        statusMessage.value = 'Fetching capturable bases...';
        resultData.value = null;

        const params = new URLSearchParams({
          world_id: '1',
          zone_id: '2',
          faction_id: '1'
        });

        const response = await fetch(`${API_BASE}/api/capturable-bases/?${params}`);
        const data: ResultData = await response.json();

        statusMessage.value = '✓ Data fetched successfully!';
        resultData.value = data;
        history.recordRequest('Capturable Bases', true, data);
      } catch (error) {
        const errorData: ResultData = {
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        statusMessage.value = '✗ Failed to fetch data!';
        resultData.value = errorData;
        history.recordRequest('Capturable Bases', false, errorData);
      } finally {
        isLoading.value = false;
      }
    };

    const getStatusColor = (): string => {
      if (statusMessage.value.includes('✓')) return 'green';
      if (statusMessage.value.includes('✗')) return 'red';
      return 'black';
    };

    const formatResult = (data: ResultData | null): string => {
      return JSON.stringify(data, null, 2);
    };

    return {
      statusMessage,
      resultData,
      isLoading,
      history,
      testBackendConnection,
      fetchCapturableBases,
      getStatusColor,
      formatResult
    };
  }
});
</script>
