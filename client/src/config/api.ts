// API Configuration for different environments
const getApiUrl = (): string => {
  // In production, use the deployed backend URL
  if (import.meta.env.PROD) {
    // Render backend URL - replace 'predictit-api' with your actual Render service name
    return 'https://predictit-1.onrender.com';
  }
  
  // In development, use local backend
  return 'http://localhost:8000';
};

export const API_BASE_URL = getApiUrl();

// Log the API URL for debugging (only in development)
if (import.meta.env.DEV) {
  console.log(`🔗 API Base URL: ${API_BASE_URL} (Mode: ${import.meta.env.MODE})`);
}

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