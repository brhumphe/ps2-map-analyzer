import {computed, readonly, ref} from 'vue'
import {ApiRequest, ResultData} from "@/components/status/status_types.js";

const requestHistory = ref<ApiRequest[]>([])

export function useRequestHistory() {
  const requestCount = computed(() => {
    return requestHistory.value.length;
  });

  const hasErrors = computed(() => {
    return requestHistory.value.some(req => !req.success);
  });

  const clearHistory = () => {
    requestHistory.value = []
  }

  const recordRequest = (type: string, success: boolean, data: ResultData): void => {
    requestHistory.value.push({
      timestamp: new Date().toLocaleTimeString(),
      type,
      success,
      data: success ? 'Success' : data.error || 'Unknown error'
    })
  };

  return {
    requestHistory: readonly(requestHistory),
    clearHistory,
    requestCount,
    hasErrors,
    recordRequest,
  }
}
