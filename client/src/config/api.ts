// API Configuration for different environments
export const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.MODE === 'production' 
    ? 'https://your-backend-domain.railway.app'  // Replace with your actual backend URL
    : 'http://localhost:8000');

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  ME: `${API_BASE_URL}/auth/me`,
  STATUS: `${API_BASE_URL}/auth/status`,
  
  // ML Pipeline
  UPLOAD: `${API_BASE_URL}/upload`,
  PREPROCESS: `${API_BASE_URL}/preprocess`,
  TRAIN: `${API_BASE_URL}/train`,
  PREDICT: `${API_BASE_URL}/predict`,
  RESET: (sessionId: string) => `${API_BASE_URL}/reset/${sessionId}`,
  
  // Projects
  PROJECTS: `${API_BASE_URL}/projects`,
  PROJECTS_SAVE: `${API_BASE_URL}/projects/save`,
  PROJECT_BY_ID: (id: string) => `${API_BASE_URL}/projects/${id}`,
};

export default API_BASE_URL;