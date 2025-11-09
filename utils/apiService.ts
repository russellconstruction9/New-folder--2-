/**
 * API Service Layer
 * Handles all communication with the backend API
 */

import { envService } from './environment';

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class ApiService {
  private baseURL: string;
  private authToken: string | null = null;

  constructor() {
    this.baseURL = envService.getConfig().apiBaseUrl;
    this.loadAuthToken();
  }

  private loadAuthToken(): void {
    this.authToken = localStorage.getItem('auth_token');
  }

  private saveAuthToken(token: string): void {
    this.authToken = token;
    localStorage.setItem('auth_token', token);
  }

  private removeAuthToken(): void {
    this.authToken = null;
    localStorage.removeItem('auth_token');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Use default message if JSON parsing fails
      }

      const error: ApiError = {
        message: errorMessage,
        status: response.status,
      };

      // Handle specific error codes
      if (response.status === 401) {
        this.removeAuthToken();
        // Redirect to login or emit event
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }

      throw error;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return response.text() as unknown as T;
  }

  // Generic HTTP methods
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(envService.getApiUrl(endpoint));
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(envService.getApiUrl(endpoint), {
      method: 'POST',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(envService.getApiUrl(endpoint), {
      method: 'PUT',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(envService.getApiUrl(endpoint), {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(envService.getApiUrl(endpoint), {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  // File upload method
  async uploadFile(endpoint: string, file: File, additionalData?: Record<string, any>): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    const headers: HeadersInit = {};
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(envService.getApiUrl(endpoint), {
      method: 'POST',
      headers,
      body: formData,
    });

    return this.handleResponse(response);
  }

  // Authentication methods
  async login(email: string, password: string): Promise<{ user: any; token: string }> {
    const response = await this.post<{ user: any; token: string }>('/auth/login', {
      email,
      password,
    });

    this.saveAuthToken(response.token);
    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.post('/auth/logout');
    } finally {
      this.removeAuthToken();
    }
  }

  async register(userData: {
    email: string;
    password: string;
    name: string;
    role: string;
  }): Promise<{ user: any; token: string }> {
    const response = await this.post<{ user: any; token: string }>('/auth/register', userData);
    this.saveAuthToken(response.token);
    return response;
  }

  async getCurrentUser(): Promise<any> {
    return this.get('/auth/me');
  }

  async refreshToken(): Promise<{ token: string }> {
    const response = await this.post<{ token: string }>('/auth/refresh');
    this.saveAuthToken(response.token);
    return response;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.authToken;
  }

  // Proxy methods for API keys (to keep them on backend)
  async getMapImage(lat: number, lng: number, zoom = 15, size = '200x150'): Promise<string> {
    const params = { lat, lng, zoom, size };
    const response = await this.get<{ imageUrl: string }>('/maps/static', params);
    return response.imageUrl;
  }

  async aiChat(messages: any[], model = 'gemini-2.5-flash'): Promise<any> {
    return this.post('/ai/chat', { messages, model });
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Error handler for global error handling
export const handleApiError = (error: ApiError, showToast?: (message: string) => void) => {
  console.error('API Error:', error);
  
  const message = error.message || 'An unexpected error occurred';
  
  if (showToast) {
    showToast(message);
  }
  
  // Handle specific error types
  switch (error.status) {
    case 401:
      // Redirect to login
      window.location.href = '/login';
      break;
    case 403:
      // Show permission denied message
      break;
    case 500:
      // Show server error message
      break;
    default:
      // Show generic error
      break;
  }
};

export default apiService;