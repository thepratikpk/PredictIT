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
        // Client-side validation
        if (!email || !password) {
          throw new Error('Email and password are required');
        }
        
        if (!email.includes('@')) {
          throw new Error('Please enter a valid email address');
        }
        
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long');
        }

        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          
          // Handle specific error cases
          switch (response.status) {
            case 400:
              throw new Error(error.detail || 'Invalid input. Please check your email and password.');
            case 401:
              throw new Error(error.detail || 'Incorrect password. Please try again.');
            case 404:
              throw new Error(error.detail || 'Account not found. Please check your email or sign up for a new account.');
            case 429:
              throw new Error('Too many login attempts. Please try again in a few minutes.');
            case 500:
              throw new Error('Login service is temporarily unavailable. Please try again later.');
            default:
              throw new Error(error.detail || 'Login failed. Please try again.');
          }
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
      } catch (error: any) {
        set({ isLoading: false });
        
        // Handle network errors
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          throw new Error('Unable to connect to the server. Please check your internet connection.');
        }
        
        throw error;
      }
    },
    
    register: async (name: string, email: string, password: string) => {
      set({ isLoading: true });
      try {
        // Client-side validation
        if (!name || !email || !password) {
          throw new Error('Name, email, and password are required');
        }
        
        if (name.trim().length < 2) {
          throw new Error('Name must be at least 2 characters long');
        }
        
        if (!email.includes('@') || !email.includes('.')) {
          throw new Error('Please enter a valid email address');
        }
        
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long');
        }

        const response = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            name: name.trim(), 
            email: email.trim().toLowerCase(), 
            password 
          }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          
          // Handle specific error cases
          switch (response.status) {
            case 400:
              throw new Error(error.detail || 'Invalid input. Please check your information.');
            case 409:
              throw new Error(error.detail || 'An account with this email already exists. Please sign in instead.');
            case 429:
              throw new Error('Too many registration attempts. Please try again in a few minutes.');
            case 500:
              throw new Error('Registration service is temporarily unavailable. Please try again later.');
            default:
              throw new Error(error.detail || 'Registration failed. Please try again.');
          }
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
      } catch (error: any) {
        set({ isLoading: false });
        
        // Handle network errors
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          throw new Error('Unable to connect to the server. Please check your internet connection.');
        }
        
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