import axios from 'axios';
import { UploadResponse, TrainRequest, TrainResponse, PipelineTemplate, DocEntry } from '../types';
import { API_BASE_URL } from '../config/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 second timeout (tuning/CV can be slow)
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Enhanced error handling for common issues
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timeout - the server is taking too long to respond';
    } else if (error.message?.includes('Network Error')) {
      error.message = 'Network error - cannot connect to the backend server';
    } else if (error.response?.status === 0) {
      error.message = 'Connection failed - backend server is not accessible';
    }
    
    return Promise.reject(error);
  }
);

// ============================================================
// Core Pipeline
// ============================================================

export const uploadFile = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const preprocessData = async (sessionId: string, targetColumn: string, operationType: string) => {
  const response = await api.post('/preprocess', {
    session_id: sessionId,
    target_column: targetColumn,
    operation_type: operationType,
  });
  
  return response.data;
};

export const trainModel = async (request: TrainRequest): Promise<TrainResponse> => {
  const response = await api.post('/train', request);
  return response.data;
};

export const cleanupSession = async (sessionId: string) => {
  const response = await api.delete(`/cleanup/${sessionId}`);
  return response.data;
};

// ============================================================
// New Block APIs
// ============================================================

export const cleanData = async (sessionId: string, strategy: string, dropDuplicates: boolean) => {
  const response = await api.post('/clean', {
    session_id: sessionId,
    strategy,
    drop_duplicates: dropDuplicates,
  });
  return response.data;
};

export const encodeCategories = async (sessionId: string, method: string, columns?: string[]) => {
  const response = await api.post('/encode', {
    session_id: sessionId,
    method,
    columns: columns || null,
  });
  return response.data;
};

export const exploreData = async (sessionId: string) => {
  const response = await api.post('/eda', {
    session_id: sessionId,
  });
  return response.data;
};

export const balanceClasses = async (sessionId: string, targetColumn: string, method: string = 'smote') => {
  const response = await api.post('/balance', {
    session_id: sessionId,
    target_column: targetColumn,
    method,
  });
  return response.data;
};

export const crossValidate = async (
  sessionId: string,
  modelType: string,
  targetColumn: string,
  featureColumns: string[],
  cvFolds: number = 5
) => {
  const response = await api.post('/cross-validate', {
    session_id: sessionId,
    model_type: modelType,
    target_column: targetColumn,
    feature_columns: featureColumns,
    cv_folds: cvFolds,
  });
  return response.data;
};

export const tuneModel = async (
  sessionId: string,
  modelType: string,
  targetColumn: string,
  featureColumns: string[],
  searchType: string = 'random'
) => {
  const response = await api.post('/tune', {
    session_id: sessionId,
    model_type: modelType,
    target_column: targetColumn,
    feature_columns: featureColumns,
    search_type: searchType,
  });
  return response.data;
};

export const exportModel = async (sessionId: string) => {
  const response = await api.post('/export-model', {
    session_id: sessionId,
  }, {
    responseType: 'blob',
  });
  return response.data;
};

export const predictNewData = async (sessionId: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post(`/predict-new?session_id=${sessionId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// ============================================================
// Templates API
// ============================================================

export const getTemplates = async (category?: string, difficulty?: string): Promise<PipelineTemplate[]> => {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  if (difficulty) params.append('difficulty', difficulty);
  const response = await api.get(`/api/templates?${params.toString()}`);
  return response.data;
};

export const getTemplateById = async (id: string): Promise<PipelineTemplate> => {
  const response = await api.get(`/api/templates/${id}`);
  return response.data;
};

// ============================================================
// Docs API
// ============================================================

export const getDocs = async (section?: string): Promise<DocEntry[]> => {
  const params = section ? `?section=${section}` : '';
  const response = await api.get(`/api/docs${params}`);
  return response.data;
};

export const getDocBySlug = async (slug: string): Promise<DocEntry> => {
  const response = await api.get(`/api/docs/${slug}`);
  return response.data;
};