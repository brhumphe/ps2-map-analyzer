import { ref } from 'vue'

export interface Request {
  timestamp: string
  type: string
  data: string
  success: boolean
}

const requestHistory = ref<Request[]>([])

export function useRequestHistory() {
  const addRequest = (request: Request) => {
    requestHistory.value.push(request)
  }

  const clearHistory = () => {
    requestHistory.value = []
  }

  return {
    requestHistory,
    addRequest,
    clearHistory
  }
}
