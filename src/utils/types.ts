// API Response Types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

export interface LoginResponse {
  token: string;
}

export interface ErrorResponse {
  error: string;
  message?: string;
  status: number;
}