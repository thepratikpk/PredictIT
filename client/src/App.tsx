import { useState, useEffect, useRef, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import { PipelineDragDrop } from './components/PipelineDragDrop';
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
    if (!isLoaded) {
      setIsInitializing(true);
      loadAuthFromStorage();

      setTimeout(() => {
        const savedViewMode = localStorage.getItem('ml-pipeline-view-mode');
        if (savedViewMode === 'pipeline' && isAuthenticated) {
          loadFromStorage();
          setViewMode('pipeline');
        }
        setIsLoaded(true);
        setIsInitializing(false);
      }, 100);
    }
  }, [loadFromStorage, loadAuthFromStorage, isLoaded, isAuthenticated]);

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
    if (sidebarRef.current) {
      sidebarRef.current.refreshProjects();
    }
  }, []);

  const handleBackToHome = () => {
    setViewMode('landing');
  };

  const hasProgress = currentStep > 1 || datasetInfo;

  // Loading states
  if (!isLoaded || isInitializing) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-md-surface-dim border-t-md-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-md-on-surface font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (isLoadingPipeline) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-md-surface-dim border-t-md-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-md-on-surface font-medium text-lg mb-2">Loading Pipeline</p>
          <p className="text-md-on-surface-variant text-sm">Restoring your data...</p>
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
            if (hasProgress) {
              setViewMode('pipeline');
            }
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-md-surface-dim">
      {/* Mobile overlay */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      <ModernSidebar
        onAuthClick={handleAuthClick}
        onNewPipeline={() => {
          startNewPipeline();
          setViewMode('pipeline');
        }}
        onLoadPipeline={handleLoadPipeline}
        onProjectSaved={handleProjectSaved}
        onSidebarToggle={handleSidebarToggle}
        ref={sidebarRef}
      />

      {/* Main content */}
      <main
        className={`min-h-screen transition-all duration-200 ease-md-standard ${sidebarCollapsed ? 'ml-0 lg:ml-16' : 'ml-0 lg:ml-72'
          }`}
      >
        <PipelineDragDrop
          onBack={handleBackToHome}
          onProjectSaved={handleProjectSaved}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
        />
      </main>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
        onSuccess={() => setShowAuthModal(false)}
      />

      {/* Toast */}
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#202124',
            color: '#fff',
            fontSize: '14px',
            borderRadius: '8px',
          },
          success: {
            iconTheme: { primary: '#34A853', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#EA4335', secondary: '#fff' },
          },
        }}
      />
    </div>
  );
}

export default App;