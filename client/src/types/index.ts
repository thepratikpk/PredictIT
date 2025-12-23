export interface UploadResponse {
  session_id: string;
  columns: string[];
  row_count: number;
  data_types: Record<string, string>;
  sample_data: Record<string, any>[];
  numeric_columns: string[];
  categorical_columns: string[];
}

export interface TrainRequest {
  session_id: string;
  model_type: string;
  split_ratio: number;
  target_column: string;
  feature_columns: string[];
  preprocessing_steps?: string[];
}

export interface TrainResponse {
  accuracy: number;
  confusion_matrix: number[][];
  status: string;
  message: string;
}

export interface NodeData {
  label: string;
  config?: any;
  sessionId?: string;
  columns?: string[];
  isConfigured?: boolean;
}

export type NodeType = 'dataset' | 'preprocessing' | 'split' | 'model' | 'result';