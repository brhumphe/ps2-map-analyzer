export interface ApiRequest {
  timestamp: string
  type: string
  data: string
  success: boolean
}

export interface ResultData {
  error?: string;
  message?: string;
  status?: string;
}
