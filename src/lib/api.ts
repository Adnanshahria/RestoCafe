const API_URL = import.meta.env.VITE_API_URL || '';

interface ApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  isFormData?: boolean;
}

class ApiClient {
  private getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  private setTokens(accessToken: string, refreshToken?: string) {
    localStorage.setItem('access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
  }

  clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  private async refreshAccessToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      this.setTokens(data.token);
      return true;
    } catch {
      return false;
    }
  }

  async request<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {}, isFormData = false } = options;

    const token = this.getAccessToken();
    const requestHeaders: Record<string, string> = {
      ...headers,
    };

    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    if (!isFormData && body) {
      requestHeaders['Content-Type'] = 'application/json';
    }

    const fetchOptions: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (body) {
      fetchOptions.body = isFormData ? body : JSON.stringify(body);
    }

    let response = await fetch(`${API_URL}${endpoint}`, fetchOptions);

    // Auto-refresh on 401
    if (response.status === 401 && endpoint !== '/api/auth/login' && endpoint !== '/api/auth/refresh') {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        // Retry with new token
        const newToken = this.getAccessToken();
        if (newToken) {
          requestHeaders['Authorization'] = `Bearer ${newToken}`;
        }
        response = await fetch(`${API_URL}${endpoint}`, {
          ...fetchOptions,
          headers: requestHeaders,
        });
      } else {
        this.clearTokens();
        window.location.href = '/login';
        throw new Error('Session expired');
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new ApiError(response.status, errorData.error || 'Request failed', errorData);
    }

    return response.json();
  }

  // Convenience methods
  get<T = any>(endpoint: string) {
    return this.request<T>(endpoint);
  }

  post<T = any>(endpoint: string, body: any) {
    return this.request<T>(endpoint, { method: 'POST', body });
  }

  put<T = any>(endpoint: string, body: any) {
    return this.request<T>(endpoint, { method: 'PUT', body });
  }

  patch<T = any>(endpoint: string, body: any) {
    return this.request<T>(endpoint, { method: 'PATCH', body });
  }

  delete<T = any>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  uploadFile<T = any>(endpoint: string, formData: FormData) {
    return this.request<T>(endpoint, { method: 'POST', body: formData, isFormData: true });
  }
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export const api = new ApiClient();
