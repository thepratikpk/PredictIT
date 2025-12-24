import axios from 'axios';
import { UploadResponse, TrainRequest, TrainResponse } from '../types';
import { API_BASE_URL } from '../config/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
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