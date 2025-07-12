// status-vue.js
import { createApp, ref, computed } from 'vue';

// Enhanced version with more reactive features
const StatusApp = {
  setup() {
    // Multiple pieces of reactive state
    const statusMessage = ref('Ready');
    const resultData = ref(null);
    const isLoading = ref(false);
    const requestHistory = ref([]);

    const requestCount = computed(() => requestHistory.value.length);
    const hasErrors = computed(() =>
      requestHistory.value.some(req => req.success === false)
    );

    const API_BASE = 'http://localhost:8000';

    // Helper to record request history
    const recordRequest = (type, success, data) => {
      requestHistory.value.push({
        timestamp: new Date().toLocaleTimeString(),
        type,
        success,
        data: success ? 'Success' : data.error || 'Unknown error'
      });
    };

    const testBackendConnection = async () => {
      try {
        isLoading.value = true;
        statusMessage.value = 'Testing backend connection...';
        resultData.value = null;

        const response = await fetch(`${API_BASE}/api/ping`);
        const data = await response.json();

        statusMessage.value = '✓ Backend connection successful!';
        resultData.value = data;
        recordRequest('Backend Test', true, data);

      } catch (error) {
        statusMessage.value = '✗ Backend connection failed!';
        resultData.value = { error: error.message };
        recordRequest('Backend Test', false, { error: error.message });
      } finally {
        isLoading.value = false;
      }
    };

    const fetchCapturableBases = async () => {
      try {
        isLoading.value = true;
        statusMessage.value = 'Fetching capturable bases...';
        resultData.value = null;

        const params = new URLSearchParams({
          world_id: 1,
          zone_id: 2,
          faction_id: 1
        });

        const response = await fetch(`${API_BASE}/api/capturable-bases/?${params}`);
        const data = await response.json();

        statusMessage.value = '✓ Data fetched successfully!';
        resultData.value = data;
        recordRequest('Capturable Bases', true, data);

      } catch (error) {
        statusMessage.value = '✗ Failed to fetch data!';
        resultData.value = { error: error.message };
        recordRequest('Capturable Bases', false, { error: error.message });
      } finally {
        isLoading.value = false;
      }
    };

    const clearHistory = () => {
      requestHistory.value = [];
    };

    return {
      statusMessage,
      resultData,
      isLoading,
      requestHistory,
      requestCount,
      hasErrors,
      testBackendConnection,
      fetchCapturableBases,
      clearHistory
    };
  },

  template: `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h1>PS2 Map State Application - Vue Version</h1>
      
      <!-- Request statistics that automatically update -->
      <div style="background: #f0f0f0; padding: 15px; margin: 20px 0; border-radius: 5px;">
        <h3>Request Statistics</h3>
        <p>Total Requests: {{ requestCount }}</p>
        <p :style="{ color: hasErrors ? 'red' : 'green' }">
          Status: {{ hasErrors ? 'Some requests failed' : 'All requests successful' }}
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
          @click="clearHistory" 
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
      
      <!-- Request history that automatically updates when new requests are made -->
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
    </div>
  `,

  methods: {
    getStatusColor() {
      if (this.statusMessage.includes('✓')) return 'green';
      if (this.statusMessage.includes('✗')) return 'red';
      return 'black';
    },

    formatResult(data) {
      return JSON.stringify(data, null, 2);
    }
  }
};

// Create and mount the application
createApp(StatusApp).mount('#app');
