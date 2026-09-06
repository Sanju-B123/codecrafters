/**
 * BharatStandards AI - HTTP API Client
 * Centralized fetch client with JWT Bearer token attachment and error parsing.
 */

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

export const TOKEN_STORAGE_KEY = 'bharat_standards_token';
export const USER_STORAGE_KEY = 'bharat_standards_user';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export const getStoredToken = () => {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch (e) {
    return null;
  }
};

export const setStoredAuth = (token, user) => {
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    if (user) localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch (e) {
    console.error('Failed to persist auth data:', e);
  }
};

export const clearStoredAuth = () => {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear auth data:', e);
  }
};

export const apiClient = async (endpoint, options = {}) => {
  const { body, headers = {}, ...customConfig } = options;

  const token = getStoredToken();
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const defaultHeaders = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };

  const config = {
    method: body ? 'POST' : 'GET',
    ...customConfig,
    headers: defaultHeaders,
  };

  if (body) {
    if (isFormData) {
      config.body = body;
    } else {
      config.body = typeof body === 'string' ? body : JSON.stringify(body);
    }
  }

  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  let response;
  try {
    response = await fetch(url, config);
  } catch (networkError) {
    throw new ApiError('Unable to connect to BharatStandards API server.', 0, null);
  }

  // Parse JSON response or fallback to text
  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json().catch(() => null);
  } else {
    data = await response.text().catch(() => null);
  }

  if (!response.ok) {
    // 401 Unauthorized handling: token expired or invalid
    if (response.status === 401 && endpoint !== '/auth/login') {
      clearStoredAuth();
    }

    const errorMessage =
      (data && typeof data === 'object' && (data.detail || data.message)) ||
      (typeof data === 'string' && data) ||
      `Request failed with status ${response.status}`;

    throw new ApiError(errorMessage, response.status, data);
  }

  return data;
};

apiClient.get = (endpoint, options = {}) => apiClient(endpoint, { ...options, method: 'GET' });
apiClient.post = (endpoint, body, options = {}) =>
  apiClient(endpoint, { ...options, method: 'POST', body });
apiClient.put = (endpoint, body, options = {}) =>
  apiClient(endpoint, { ...options, method: 'PUT', body });
apiClient.delete = (endpoint, options = {}) =>
  apiClient(endpoint, { ...options, method: 'DELETE' });
