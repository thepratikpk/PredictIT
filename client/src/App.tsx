import { useState, useEffect, useRef, useCallback } from 'react';
import { StepBasedPipeline } from './components/StepBasedPipeline';
import { ModernSidebar } from './components/PipelineHistory';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/auth/AuthModal';
import { usePipelineStore } from './store/pipelineStore';
import { useAuthStore } from './store/authStore';

function App() {
  const [viewMode, setViewMode] = useState<'landing' | 'pipeline'>('landing');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoadingPipeline, setIsLoadingPipeline] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const sidebarRef = useRef<{ refreshProjects: () => void } | null>(null);
  
  const { loadFromStorage, currentStep, datasetInfo, loadProject, startNewPipeline } = usePipelineStore();
  const { loadFromStorage: loadAuthFromStorage, token, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Load persisted state on app start (only once)
    if (!isLoaded) {
      setIsInitializing(true);
      
      // Load auth first
      loadAuthFromStorage();
      
      // Small delay to ensure auth is loaded
      setTimeout(() => {
        // Check if user was in pipeline mode and is authenticated
        const savedViewMode = localStorage.getItem('ml-pipeline-view-mode');
        if (savedViewMode === 'pipeline' && isAuthenticated) {
          console.log('🔄 User was in pipeline mode, checking for saved progress...');
          loadFromStorage();
          setViewMode('pipeline');
        } else {
          console.log('🏠 Starting fresh - no saved pipeline mode or not authenticated');
        }
        
        setIsLoaded(true);
        setIsInitializing(false);
      }, 100);
    }
  }, [loadFromStorage, loadAuthFromStorage, isLoaded, isAuthenticated]);

  // Save view mode to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('ml-pipeline-view-mode', viewMode);
    }
  }, [viewMode, isLoaded]);

  const handleAuthClick = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleGetStarted = () => {
    // Start a completely new pipeline
    startNewPipeline();
    setViewMode('pipeline');
  };

  const handleLoadPipeline = async (pipelineId: string) => {
    if (!token) return;
    
    setIsLoadingPipeline(true);
    try {
      const success = await loadProject(pipelineId);
      if (success) {
        setViewMode('pipeline');
      }
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      setIsLoadingPipeline(false);
    }
  };

  const handleSidebarToggle = (isCollapsed: boolean) => {
    setSidebarCollapsed(isCollapsed);
  };

  const handleProjectSaved = useCallback(() => {
    console.log('🔄 Project saved - refreshing sidebar...');
    // Refresh the sidebar projects list
    if (sidebarRef.current) {
      console.log('✅ Calling refreshProjects');
      sidebarRef.current.refreshProjects();
    } else {
      console.log('❌ sidebarRef.current is null');
    }
  }, []);

  const handleBackToHome = () => {
    setViewMode('landing');
  };

  const hasProgress = currentStep > 1 || datasetInfo;

  // Show loading state while initializing
  if (!isLoaded || isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Loading PredictIT</h2>
          <p className="text-slate-600 font-medium">Preparing your workspace...</p>
        </div>
      </div>
    );
  }

  // Show pipeline loading state
  if (isLoadingPipeline) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Loading Your Pipeline</h2>
          <p className="text-slate-600 font-medium mb-4">Restoring your data from cloud storage...</p>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-center space-x-2 text-sm text-slate-500">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
              <span>Downloading dataset</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'landing') {
    return (
      <>
        <LandingPage
          onGetStarted={handleGetStarted}
          onSignIn={() => handleAuthClick('login')}
          onSignUp={() => handleAuthClick('register')}
          hasProgress={hasProgress}
          currentStep={currentStep}
        />
        
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={authMode}
          onSuccess={() => {
            setShowAuthModal(false);
            // If user has progress, go to pipeline
            if (hasProgress) {
              setViewMode('pipeline');
            }
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ModernSidebar
        onAuthClick={handleAuthClick}
        onNewPipeline={() => {
          console.log('🆕 Starting new pipeline...');
          startNewPipeline();
          setViewMode('pipeline');
        }}
        onLoadPipeline={handleLoadPipeline}
        onProjectSaved={handleProjectSaved}
        onSidebarToggle={handleSidebarToggle}
        ref={sidebarRef}
      />
      
      {/* Main content with dynamic margin based on sidebar state */}
      <main 
        className={`min-h-screen overflow-y-auto transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-80'
        }`}
      >
        <StepBasedPipeline 
          onBack={handleBackToHome}
          onProjectSaved={handleProjectSaved}
        />
      </main>
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
        onSuccess={() => setShowAuthModal(false)}
      />
    </div>
  );
}

export default App;