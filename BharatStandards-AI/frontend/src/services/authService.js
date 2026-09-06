/**
 * Authentication Service for BharatStandards AI
 */
import {
  apiClient,
  setStoredAuth,
  clearStoredAuth,
  getStoredToken,
  USER_STORAGE_KEY,
} from './apiClient';
import { mongoStorageService } from './mongoStorageService';

const LOCAL_USERS_KEY = 'bs_demo_registered_users';

const DEMO_PRESET_USERS = {
  'demo@bharatstandards.ai': {
    id: 1,
    name: 'Demo Compliance Officer',
    email: 'demo@bharatstandards.ai',
    password: 'DemoUser123!',
    role: 'industry',
    is_active: true,
  },
  'admin@bharatstandards.ai': {
    id: 2,
    name: 'BIS System Administrator',
    email: 'admin@bharatstandards.ai',
    password: 'Admin@123456',
    role: 'ADMIN',
    is_active: true,
  },
  'consumer@bharatstandards.ai': {
    id: 3,
    name: 'Citizen Consumer',
    email: 'consumer@bharatstandards.ai',
    password: 'Consumer123!',
    role: 'consumer',
    is_active: true,
  },
};

const getLocalRegisteredUsers = () => {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

const saveLocalRegisteredUser = (user, password) => {
  try {
    const users = getLocalRegisteredUsers();
    users[user.email.toLowerCase()] = { ...user, password };
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.warn('Failed to cache local registered user:', e);
  }
};

export const authService = {
  /**
   * Register a new user (Industry or Consumer).
   * @param {Object} data { name, email, password, confirm_password, role }
   * @returns {Promise<{ access_token: string, token_type: string, user: Object }>}
   */
  async register(data) {
    const normalizedEmail = (data.email || '').toLowerCase().trim();

    try {
      const response = await apiClient.post('/auth/register', data);
      if (response?.access_token) {
        setStoredAuth(response.access_token, response.user);
        // Also persist state snapshot
        mongoStorageService.saveState(`user_${normalizedEmail}`, response.user);
      }
      return response;
    } catch (apiError) {
      // Check if backend API is not available (e.g. running statically on Netlify)
      const isUnreachable =
        apiError.status === 0 ||
        apiError.status === 404 ||
        apiError.status === 502 ||
        apiError.status === 503 ||
        (typeof apiError.message === 'string' &&
          (apiError.message.includes('offline') ||
            apiError.message.includes('unreachable') ||
            apiError.message.includes('not deployed') ||
            apiError.message.includes('not hosted') ||
            apiError.message.includes('Demo') ||
            apiError.message.includes('HTML') ||
            apiError.message.includes('404')));

      if (!isUnreachable) {
        throw apiError;
      }

      // Check if user already exists in preset or local demo cache
      const localUsers = getLocalRegisteredUsers();
      if (DEMO_PRESET_USERS[normalizedEmail] || localUsers[normalizedEmail]) {
        throw new Error('An account with this email already exists.');
      }

      // Create resilient client-authenticated session
      const newUser = {
        id: Date.now(),
        name: data.name.trim(),
        email: normalizedEmail,
        role: data.role || 'industry',
        is_active: true,
        created_at: new Date().toISOString(),
      };

      saveLocalRegisteredUser(newUser, data.password);
      mongoStorageService.saveState(`user_${normalizedEmail}`, newUser);

      const demoToken = `bs_token_offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      setStoredAuth(demoToken, newUser);

      return {
        access_token: demoToken,
        token_type: 'bearer',
        user: newUser,
      };
    }
  },

  /**
   * Log in an existing user.
   * @param {Object} credentials { email, password, remember_me }
   * @returns {Promise<{ access_token: string, token_type: string, user: Object }>}
   */
  async login(credentials) {
    const normalizedEmail = (credentials.email || '').toLowerCase().trim();

    try {
      const response = await apiClient.post('/auth/login', credentials);
      if (response?.access_token) {
        setStoredAuth(response.access_token, response.user);
      }
      return response;
    } catch (apiError) {
      // If backend is unreachable or 404, check against demo & offline credentials
      const isUnreachable =
        apiError.status === 0 ||
        apiError.status === 404 ||
        apiError.status === 502 ||
        apiError.status === 503 ||
        (typeof apiError.message === 'string' &&
          (apiError.message.includes('offline') ||
            apiError.message.includes('unreachable') ||
            apiError.message.includes('not deployed') ||
            apiError.message.includes('not hosted') ||
            apiError.message.includes('Demo') ||
            apiError.message.includes('HTML') ||
            apiError.message.includes('404')));

      if (!isUnreachable) {
        throw apiError;
      }

      // Check demo preset accounts
      const preset = DEMO_PRESET_USERS[normalizedEmail];
      if (preset && preset.password === credentials.password) {
        const { password, ...userWithoutPassword } = preset;
        const demoToken = `bs_demo_token_${preset.role}_${Date.now()}`;
        setStoredAuth(demoToken, userWithoutPassword);
        return {
          access_token: demoToken,
          token_type: 'bearer',
          user: userWithoutPassword,
        };
      }

      // Check locally registered accounts
      const localUsers = getLocalRegisteredUsers();
      const localUser = localUsers[normalizedEmail];
      if (localUser && localUser.password === credentials.password) {
        const { password, ...userWithoutPassword } = localUser;
        const demoToken = `bs_token_offline_${Date.now()}`;
        setStoredAuth(demoToken, userWithoutPassword);
        return {
          access_token: demoToken,
          token_type: 'bearer',
          user: userWithoutPassword,
        };
      }

      throw new Error('Invalid email or password.');
    }
  },

  /**
   * Log out the current user and invalidate local auth storage.
   */
  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      // Ignore network errors during logout
    } finally {
      clearStoredAuth();
    }
  },

  /**
   * Fetch current authenticated user profile using active JWT.
   * @returns {Promise<Object>} User details with profile
   */
  async getCurrentUser() {
    const token = getStoredToken();
    if (!token) return null;

    try {
      return await apiClient.get('/auth/me');
    } catch (err) {
      // If backend is unreachable, fallback to cached user object
      try {
        const cachedUserRaw = localStorage.getItem(USER_STORAGE_KEY);
        if (cachedUserRaw) {
          return JSON.parse(cachedUserRaw);
        }
      } catch (e) {
        // ignore
      }
      return null;
    }
  },
};

