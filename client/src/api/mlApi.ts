import axios from 'axios';
import { UploadResponse, TrainRequest, TrainResponse } from '../types';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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