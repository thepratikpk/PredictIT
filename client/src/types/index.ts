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
  precision: number;
  recall: number;
  f1_score: number;
  class_labels: string[];
  train_size: number;
  test_size: number;
  model_type: string;
  feature_count: number;
  status: string;
  message: string;
  task_type?: 'classification' | 'regression' | 'clustering';
  rmse?: number;
  mae?: number;
  r2?: number;
  silhouette?: number;
  cluster_labels?: number[];
  n_clusters?: number;
}

export interface NodeData {
  label: string;
  config?: any;
  sessionId?: string;
  columns?: string[];
  isConfigured?: boolean;
}

export type NodeType =
  | 'dataset'
  | 'preprocessing'
  | 'split'
  | 'model'
  | 'result'
  // Data Prep
  | 'cleanData'
  | 'encode'
  | 'eda'
  // Balancing & Validation
  | 'balance'
  | 'crossValidation'
  // More Models (handled via modelType in model block config)
  // Tuning & Deployment
  | 'tune'
  | 'export'
  | 'predictNew';

export type TaskType = 'classification' | 'regression' | 'clustering';

// Template types
export interface TemplateBlock {
  type: string;
  order: number;
  config: Record<string, any>;
}

export interface PipelineTemplate {
  _id: string;
  name: string;
  description: string;
  category: 'classification' | 'regression' | 'clustering';
  difficulty: 'beginner' | 'intermediate';
  icon: string;
  blocks: TemplateBlock[];
  sampleDatasetUrl: string | null;
  isSystem: boolean;
}

// Docs types
export interface DocEntry {
  _id: string;
  slug: string;
  title: string;
  section: DocSection;
  order: number;
  content: string;
  shortDescription?: string;
}

export type DocSection =
  | 'getting-started'
  | 'block-reference'
  | 'ml-glossary'
  | 'template-walkthroughs';