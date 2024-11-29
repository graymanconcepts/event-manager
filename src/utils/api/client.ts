import { ApiError } from './errors';
import { API_CONFIG } from './config';

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth = false, ...fetchOptions } = options;
  
  const headers: HeadersInit = {
    ...API_CONFIG.defaultHeaders,
    ...options.headers
  };

  // Add token from localStorage if available
  if (!skipAuth) {
    const token = localStorage.getItem('adminToken');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  try {
    const url = `${API_CONFIG.baseUrl}${endpoint}`;
    console.log('Making API request to:', url);

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: 'include' // Include cookies in requests
    });

    if (!response.ok) {
      console.error('API request failed:', response.status, response.statusText);
      const errorData = await response.text();
      console.error('Error response:', errorData);
      
      if (response.status === 401) {
        // Clear token and redirect to login
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
        throw new ApiError('Authentication required');
      }
      
      throw new ApiError(
        errorData ? JSON.parse(errorData).message : response.statusText
      );
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return response.text() as T;
  } catch (error) {
    console.error('API request error:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error instanceof Error ? error.message : 'Network error');
  }
}