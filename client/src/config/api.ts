// API Configuration for different environments
const getApiUrl = (): string => {
  // In production, use the backend URL
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
  
  // ML Pipeline — Core
  UPLOAD: `${API_BASE_URL}/upload`,
  PREPROCESS: `${API_BASE_URL}/preprocess`,
  TRAIN: `${API_BASE_URL}/train`,
  PREDICT: `${API_BASE_URL}/predict`,
  RESET: (sessionId: string) => `${API_BASE_URL}/reset/${sessionId}`,
  
  // ML Pipeline — New Blocks
  CLEAN: `${API_BASE_URL}/clean`,
  ENCODE: `${API_BASE_URL}/encode`,
  EDA: `${API_BASE_URL}/eda`,
  BALANCE: `${API_BASE_URL}/balance`,
  CROSS_VALIDATE: `${API_BASE_URL}/cross-validate`,
  TUNE: `${API_BASE_URL}/tune`,
  EXPORT_MODEL: `${API_BASE_URL}/export-model`,
  PREDICT_NEW: `${API_BASE_URL}/predict-new`,
  
  // Projects
  PROJECTS: `${API_BASE_URL}/projects`,
  PROJECTS_SAVE: `${API_BASE_URL}/projects/save`,
  PROJECT_BY_ID: (id: string) => `${API_BASE_URL}/projects/${id}`,

  // Templates
  TEMPLATES: `${API_BASE_URL}/api/templates`,
  TEMPLATE_BY_ID: (id: string) => `${API_BASE_URL}/api/templates/${id}`,

  // Docs
  DOCS: `${API_BASE_URL}/api/docs`,
  DOC_BY_SLUG: (slug: string) => `${API_BASE_URL}/api/docs/${slug}`,
};

export default API_BASE_URL;