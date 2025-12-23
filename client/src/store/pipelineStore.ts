import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface PipelineState {
  // Core state
  sessionId: string | null;
  isRunning: boolean;
  results: any | null;
  currentStep: number;
  
  // Step data
  datasetInfo: any | null;
  preprocessingConfig: { scaler: string } | null;
  splitConfig: { splitRatio: number } | null;
  modelConfig: { 
    modelType: string;
    targetColumn: string;
    featureColumns: string[];
  } | null;

  // File management
  fileUrl: string | null;
  fileName: string | null;

  // Animation state
  animationState: {
    currentPhase: 'idle' | 'uploading' | 'preprocessing' | 'splitting' | 'training' | 'evaluating' | 'complete';
    progress: number;
    message: string;
  };
  
  // Actions
  setSessionId: (sessionId: string) => void;
  setIsRunning: (isRunning: boolean) => void;
  setResults: (results: any) => void;
  setCurrentStep: (step: number) => void;
  setDatasetInfo: (info: any) => void;
  setPreprocessingConfig: (config: { scaler: string }) => void;
  setSplitConfig: (config: { splitRatio: number }) => void;
  setModelConfig: (config: { 
    modelType: string;
    targetColumn: string;
    featureColumns: string[];
  }) => void;
  setFileInfo: (url: string | null, fileName: string | null) => void;
  setAnimationState: (state: Partial<PipelineState['animationState']>) => void;
  resetPipeline: () => void;
  startNewPipeline: () => void; // New action for starting fresh
  
  // Project management
  saveProject: (name: string, description?: string) => Promise<string | null>;
  loadProject: (projectId: string) => Promise<boolean>;
  refreshProjects: () => Promise<void>; // New action to refresh project list
  
  // Computed getters
  getCompletedSteps: () => number;
  canProceedToStep: (step: number) => boolean;
  
  // Persistence methods
  saveToStorage: () => void;
  loadFromStorage: () => void;
  
  // Legacy compatibility
  updateNodeData: () => void;
}

const STORAGE_KEY = 'ml-pipeline-state';

const initialAnimationState = {
  currentPhase: 'idle' as const,
  progress: 0,
  message: 'Ready to start'
};

const initialState = {
  sessionId: null,
  isRunning: false,
  results: null,
  currentStep: 1,
  datasetInfo: null,
  preprocessingConfig: null,
  splitConfig: null,
  modelConfig: null,
  fileUrl: null,
  fileName: null,
  animationState: initialAnimationState,
};

export const usePipelineStore = create<PipelineState>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,
    
    // Actions
    setSessionId: (sessionId) => {
      set({ sessionId });
      get().saveToStorage();
    },
    
    setIsRunning: (isRunning) => set({ isRunning }),
    
    setResults: (results) => {
      set({ results });
      get().saveToStorage();
    },
    
    setCurrentStep: (step) => {
      set({ currentStep: step });
      get().saveToStorage();
    },
    
    setDatasetInfo: (info) => {
      set({ datasetInfo: info });
      get().saveToStorage();
    },
    
    setPreprocessingConfig: (config) => {
      set({ preprocessingConfig: config });
      get().saveToStorage();
    },
    
    setSplitConfig: (config) => {
      set({ splitConfig: config });
      get().saveToStorage();
    },
    
    setModelConfig: (config) => {
      set({ modelConfig: config });
      get().saveToStorage();
    },
    
    setFileInfo: (url, fileName) => {
      set({ fileUrl: url, fileName });
      get().saveToStorage();
    },
    
    setAnimationState: (newState) => set((state) => ({
      animationState: { ...state.animationState, ...newState }
    })),
    
    resetPipeline: () => {
      const state = get();
      
      // Clean up temp files if session exists
      if (state.sessionId) {
        fetch(`http://localhost:8000/cleanup/session/${state.sessionId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        }).catch(error => {
          console.warn('Failed to cleanup temp files:', error);
        });
      }
      
      set(initialState);
      localStorage.removeItem(STORAGE_KEY);
    },
    
    startNewPipeline: () => {
      const state = get();
      
      // Clean up temp files if session exists
      if (state.sessionId) {
        fetch(`http://localhost:8000/cleanup/session/${state.sessionId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        }).catch(error => {
          console.warn('Failed to cleanup temp files:', error);
        });
      }
      
      // Reset to initial state but don't load from storage
      set(initialState);
      localStorage.removeItem(STORAGE_KEY);
      console.log('Started new pipeline - cleared all data');
    },
    
    // Project management
    saveProject: async (name: string, description = '') => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('❌ No auth token found');
        return null;
      }
      
      const state = get();
      console.log('💾 Saving project with state:', {
        name,
        sessionId: state.sessionId,
        hasDataset: !!state.datasetInfo,
        hasPreprocessing: !!state.preprocessingConfig,
        hasModel: !!state.modelConfig
      });
      
      try {
        const response = await fetch('http://localhost:8000/projects/save', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name,
            description,
            session_id: state.sessionId,
            dataset_info: state.datasetInfo,
            preprocessing_config: state.preprocessingConfig,
            split_config: state.splitConfig,
            model_config: state.modelConfig,
            results: state.results
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ Project saved successfully:', result);
          
          // Update file URL if uploaded to Cloudinary
          if (result.cloudinary_url) {
            set({ fileUrl: result.cloudinary_url });
            get().saveToStorage();
          }
          
          return result.project_id;
        } else {
          const error = await response.text();
          console.error('❌ Save project failed:', response.status, error);
        }
      } catch (error) {
        console.error('❌ Save project error:', error);
      }
      
      return null;
    },
    
    loadProject: async (projectId: string) => {
      const token = localStorage.getItem('auth_token');
      if (!token) return false;
      
      try {
        console.log(`📂 Loading project: ${projectId}`);
        const response = await fetch(`http://localhost:8000/projects/${projectId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const project = await response.json();
          
          // Load project and jump to step 4 (Model Selection) since file is restored from Cloudinary
          set({
            sessionId: project.session_id,
            datasetInfo: project.dataset_info,
            preprocessingConfig: project.preprocessing_config,
            splitConfig: project.split_config,
            modelConfig: project.model_config,
            results: project.results,
            fileUrl: project.file_url,
            fileName: project.dataset_info?.filename,
            // Always jump to step 4 for saved projects (file is restored, preprocessing done)
            currentStep: 4
          });
          
          console.log(`✅ Loaded project "${project.name}" - jumping to step 4 (Model Selection)`);
          get().saveToStorage();
          return true;
        }
      } catch (error) {
        console.error('Failed to load project:', error);
      }
      
      return false;
    },
    
    refreshProjects: async () => {
      // This will be called from the sidebar to refresh project list
      // Implementation will be in the sidebar component
    },
    
    // Computed getters
    getCompletedSteps: () => {
      const state = get();
      let completed = 0;
      if (state.datasetInfo) completed++;
      if (state.preprocessingConfig) completed++;
      if (state.splitConfig) completed++;
      if (state.modelConfig) completed++;
      if (state.results) completed++;
      return completed;
    },
    
    canProceedToStep: (step: number) => {
      const state = get();
      switch (step) {
        case 1: return true;
        case 2: return !!state.datasetInfo;
        case 3: return !!state.datasetInfo && !!state.preprocessingConfig;
        case 4: return !!state.datasetInfo && !!state.preprocessingConfig && !!state.splitConfig;
        case 5: return !!state.datasetInfo && !!state.preprocessingConfig && !!state.splitConfig && !!state.modelConfig;
        default: return false;
      }
    },
    
    // Persistence methods
    saveToStorage: () => {
      try {
        const state = get();
        const persistedState = {
          sessionId: state.sessionId,
          currentStep: state.currentStep,
          datasetInfo: state.datasetInfo,
          preprocessingConfig: state.preprocessingConfig,
          splitConfig: state.splitConfig,
          modelConfig: state.modelConfig,
          results: state.results,
          fileUrl: state.fileUrl,
          fileName: state.fileName,
          timestamp: Date.now()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));
        console.log('State saved to localStorage:', persistedState);
      } catch (error) {
        console.error('Failed to save state:', error);
      }
    },
    
    loadFromStorage: () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsedState = JSON.parse(stored);
          
          // Check if state is not too old (24 hours)
          const isExpired = Date.now() - parsedState.timestamp > 24 * 60 * 60 * 1000;
          if (isExpired) {
            console.log('⏰ Stored pipeline data expired, clearing...');
            localStorage.removeItem(STORAGE_KEY);
            return;
          }
          
          // Only load if we have meaningful progress (not just step 1)
          const hasRealProgress = parsedState.datasetInfo && (
            parsedState.preprocessingConfig || 
            parsedState.splitConfig || 
            parsedState.modelConfig || 
            parsedState.results
          );
          
          if (!hasRealProgress) {
            console.log('🚫 No meaningful progress found, not loading old data');
            return;
          }
          
          set({
            sessionId: parsedState.sessionId,
            currentStep: parsedState.currentStep || 1,
            datasetInfo: parsedState.datasetInfo,
            preprocessingConfig: parsedState.preprocessingConfig,
            splitConfig: parsedState.splitConfig,
            modelConfig: parsedState.modelConfig,
            results: parsedState.results,
            fileUrl: parsedState.fileUrl,
            fileName: parsedState.fileName,
          });
          console.log('✅ Loaded pipeline state from localStorage:', parsedState);
        }
      } catch (error) {
        console.error('Failed to load state:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    },
    
    // Legacy compatibility
    updateNodeData: () => {
      // Kept for compatibility
    }
  }))
);

// Load state on initialization
if (typeof window !== 'undefined') {
  // Load immediately without timeout to prevent loops
  const store = usePipelineStore.getState();
  store.loadFromStorage();
}