<template>
  <div style="padding: 20px; font-family: Arial, sans-serif;">
    <h1>PS2 Map State Application - Vue Version</h1>

    <!-- Request statistics that automatically update -->
    <div style="background: #f0f0f0; padding: 15px; margin: 20px 0; border-radius: 5px;">
      <h3>Request Statistics</h3>
      <p>Total Requests: {{ history.requestCount }}</p>
      <p :style="{ color: history.hasErrors.value ? 'red' : 'green' }">
        Status: {{ history.hasErrors.value ? 'Some requests failed' : 'All requests successful' }}
      </p>
    </div>

    <div style="margin: 20px 0;">
      <button
        @click="testBackendConnection"
        :disabled="isLoading"
        style="margin-right: 10px; padding: 10px 20px;">
        Test Backend Connection
      </button>

      <button
        @click="fetchCapturableBases"
        :disabled="isLoading"
        style="margin-right: 10px; padding: 10px 20px;">
        Get Capturable Bases
      </button>

      <button
        @click="history.clearHistory"
        :disabled="isLoading"
        style="padding: 10px 20px; background: #ff6b6b; color: white; border: none; border-radius: 3px;">
        Clear History
      </button>
    </div>

    <!-- Status display -->
    <div style="margin: 20px 0; font-weight: bold;">
      <p :style="{ color: getStatusColor() }">{{ statusMessage }}</p>
      <p v-if="isLoading" style="color: #666;">Loading...</p>
    </div>

    <!-- Current result -->
    <div v-if="resultData" style="margin: 20px 0;">
      <h3>Current Result:</h3>
      <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto;">{{ formatResult(resultData) }}</pre>
    </div>

    <!-- Request history that automatically updates -->
    <RequestHistory :request-history="history"/>
  </div>
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
