import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

const AUTH_STORAGE_KEY = 'ml-pipeline-auth';

export const useAuthStore = create<AuthState>()(
  subscribeWithSelector((set, get) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    
    setUser: (user) => {
      set({ user, isAuthenticated: !!user });
      get().saveToStorage();
    },
    
    setToken: (token) => {
      set({ token });
      // Also save token separately for API calls
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
      get().saveToStorage();
    },
    
    setLoading: (loading) => set({ isLoading: loading }),
    
    login: async (email: string, password: string) => {
      set({ isLoading: true });
      try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || 'Login failed');
        }
        
        const data = await response.json();
        const token = data.access_token;
        
        set({
          user: data.user,
          token: token,
          isAuthenticated: true,
          isLoading: false
        });
        
        // Save token separately for API calls
        localStorage.setItem('auth_token', token);
        get().saveToStorage();
      } catch (error) {
        set({ isLoading: false });
        throw error;
      }
    },
    
    register: async (name: string, email: string, password: string) => {
      set({ isLoading: true });
      try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, email, password }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || 'Registration failed');
        }
        
        const data = await response.json();
        const token = data.access_token;
        
        set({
          user: data.user,
          token: token,
          isAuthenticated: true,
          isLoading: false
        });
        
        // Save token separately for API calls
        localStorage.setItem('auth_token', token);
        get().saveToStorage();
      } catch (error) {
        set({ isLoading: false });
        throw error;
      }
    },
    
    logout: () => {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
      });
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('ml-pipeline-view-mode');
      
      // Show logout toast
      toast.success('Successfully logged out. See you next time!');
    },
    
    loadFromStorage: () => {
      try {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const { user, token } = JSON.parse(stored);
          if (user && token) {
            set({
              user,
              token,
              isAuthenticated: true
            });
            // Also set the token for API calls
            localStorage.setItem('auth_token', token);
          }
        }
      } catch (error) {
        console.error('Failed to load auth from storage:', error);
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem('auth_token');
      }
    },
    
    saveToStorage: () => {
      try {
        const { user, token } = get();
        if (user && token) {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, token }));
        } else {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      } catch (error) {
        console.error('Failed to save auth to storage:', error);
      }
    }
  }))
);

// Load auth state on initialization - immediate execution
if (typeof window !== 'undefined') {
  const store = useAuthStore.getState();
  store.loadFromStorage();
  
  // Also check for existing token
  const existingToken = localStorage.getItem('auth_token');
  if (existingToken && !store.token) {
    // Verify token is still valid
    fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${existingToken}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error('Token invalid');
    })
    .then(user => {
      store.setUser(user);
      store.setToken(existingToken);
    })
    .catch(() => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('ml-pipeline-auth');
    });
  }
}