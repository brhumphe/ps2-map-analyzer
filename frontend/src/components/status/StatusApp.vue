<template>
  <v-app>
    <v-app-bar color="primary" dark>
      <v-app-bar-title>PS2 Map State Application - Vue Version</v-app-bar-title>
    </v-app-bar>

    <v-main>
      <v-container fluid>
        <v-row>
          <!-- Left column - Controls and Status -->
          <v-col cols="12" md="6">
            <!-- Stats Card -->
            <v-card class="mb-4" elevation="2">
              <v-card-title>
                <v-icon class="mr-2">mdi-chart-line</v-icon>
                Request Statistics
              </v-card-title>
              <v-card-text>
                <v-chip
                  class="mr-2"
                  color="info"
                  variant="flat"
                  prepend-icon="mdi-counter">
                  {{ history.requestCount }} Total
                </v-chip>
                <v-chip
                  :color="history.hasErrors.value ? 'error' : 'success'"
                  variant="flat"
                  :prepend-icon="history.hasErrors.value ? 'mdi-alert' : 'mdi-check-circle'">
                  {{ history.hasErrors.value ? 'Some Failed' : 'All Successful' }}
                </v-chip>
              </v-card-text>
            </v-card>

            <!-- Controls Card -->
            <v-card class="mb-4" elevation="2">
              <v-card-title>
                <v-icon class="mr-2">mdi-play-circle</v-icon>
                Actions
              </v-card-title>
              <v-card-text>
                <div class="d-flex flex-column ga-2">
                  <v-btn
                    @click="testBackendConnection"
                    :loading="isLoading"
                    color="primary"
                    variant="flat"
                    prepend-icon="mdi-lan-connect">
                    Test Backend Connection
                  </v-btn>

                  <v-btn
                    @click="fetchCapturableBases"
                    :loading="isLoading"
                    color="secondary"
                    variant="flat"
                    prepend-icon="mdi-database-search">
                    Get Capturable Bases
                  </v-btn>

                  <v-btn
                    @click="history.clearHistory"
                    :disabled="isLoading"
                    color="warning"
                    variant="outlined"
                    prepend-icon="mdi-delete">
                    Clear History
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>

            <!-- Status Message -->
            <v-alert
              v-if="statusMessage !== 'Ready'"
              :type="getAlertType()"
              :icon="getAlertIcon()"
              class="mb-4">
              {{ statusMessage }}
            </v-alert>

            <v-progress-linear
              v-if="isLoading"
              indeterminate
              color="primary"
              class="mb-4">
            </v-progress-linear>
          </v-col>

          <!-- Right column - Results and History -->
          <v-col cols="12" md="6">
            <!-- Current Result -->
            <v-card v-if="resultData" class="mb-4" elevation="2">
              <v-card-title>
                <v-icon class="mr-2">mdi-code-json</v-icon>
                Current Result
              </v-card-title>
              <v-card-text>
                <v-code class="d-block">{{ formatResult(resultData) }}</v-code>
              </v-card-text>
            </v-card>

            <!-- Request History -->
            <RequestHistory />
          </v-col>
        </v-row>
      </v-container>
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

    const getAlertType = (): 'success' | 'error' | 'info' => {
      if (statusMessage.value.includes('✓')) return 'success';
      if (statusMessage.value.includes('✗')) return 'error';
      return 'info';
    };

    const getAlertIcon = (): string => {
      if (statusMessage.value.includes('✓')) return 'mdi-check-circle';
      if (statusMessage.value.includes('✗')) return 'mdi-alert-circle';
      return 'mdi-information';
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
      getAlertType,
      getAlertIcon,
      formatResult
    };
  }
});
</script>
