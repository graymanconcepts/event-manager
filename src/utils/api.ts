import { API_BASE_URL } from './config';
import type { ApiResponse, ErrorResponse } from './types';

interface RequestOptions extends RequestInit {
  token?: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...fetchOptions,
      headers
    });

    // Handle non-JSON responses first
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      if (!response.ok) {
        throw new ApiError(response.status, `Server error: ${response.statusText}`);
      }
      throw new ApiError(response.status, 'Invalid response format: Expected JSON');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        response.status,
        data.message || data.error || 'An error occurred',
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new ApiError(
        0, 
        'Unable to connect to the server. Please ensure both frontend and backend servers are running.'
      );
    }
    throw new ApiError(500, 'An unexpected error occurred. Please try again later.');
  }
}