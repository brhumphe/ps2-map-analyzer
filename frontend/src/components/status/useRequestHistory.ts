import {computed, readonly, ref} from 'vue'

export interface Request {
  timestamp: string
  type: string
  data: string
  success: boolean
}

const requestHistory = ref<Request[]>([])

export function useRequestHistory() {
  const requestCount = computed(() => {
    return requestHistory.value.length;
  });

  const hasErrors = computed(() => {
    return requestHistory.value.some(req => !req.success);
  });

  const addRequest = (request: Request) => {
    requestHistory.value.push(request)
  }

  const clearHistory = () => {
    requestHistory.value = []
  }

  return {
    requestHistory: readonly(requestHistory),
    addRequest,
    clearHistory,
    requestCount,
    hasErrors,
  }
}
