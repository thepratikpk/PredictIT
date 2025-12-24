import React, { useEffect, useState } from 'react';
import { Button } from './Button';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Progress } from './Progress';
import { ArrowLeft, CheckCircle, Save } from 'lucide-react';
import { DataUploadStep } from './steps/DataUploadStep';
import { PreprocessingStep } from './steps/PreprocessingStep';
import { TrainTestSplitStep } from './steps/TrainTestSplitStep';
import { ModelSelectionStep } from './steps/ModelSelectionStep';
import { ResultsStep } from './steps/ResultsStep';
import { AnimatedPipelineFlow } from './AnimatedPipelineFlow';
import { SaveProjectDialog } from './SaveProjectDialog';
import { usePipelineStore } from '../store/pipelineStore';
import { useAuthStore } from '../store/authStore';

interface StepBasedPipelineProps {
  onBack: () => void;
  onProjectSaved?: () => void;
  sidebarCollapsed?: boolean;
  setSidebarCollapsed?: (collapsed: boolean) => void;
}

const steps = [
  { id: 1, title: 'Upload Dataset', description: 'Upload your CSV or Excel file' },
  { id: 2, title: 'Preprocessing', description: 'Apply scaling and normalization' },
  { id: 3, title: 'Train-Test Split', description: 'Configure data splitting' },
  { id: 4, title: 'Model Selection', description: 'Choose and configure your model' },
  { id: 5, title: 'Results', description: 'View model performance' },
];

export const StepBasedPipeline: React.FC<StepBasedPipelineProps> = ({ onBack, onProjectSaved, sidebarCollapsed, setSidebarCollapsed }) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  
  const { isAuthenticated } = useAuthStore();
  const store = usePipelineStore();
  const { 
    currentStep,
    setCurrentStep,
    resetPipeline, 
    datasetInfo, 
    preprocessingConfig, 
    splitConfig, 
    modelConfig,
    canProceedToStep,
    getCompletedSteps,
    isRunning,
    saveToStorage,
    loadFromStorage
  } = store;

  // Load state on component mount
  useEffect(() => {
    // Only load if not already loaded
    if (!datasetInfo && !preprocessingConfig && !splitConfig && !modelConfig) {
      loadFromStorage();
    }
  }, []); // Empty dependency array - only run once

  // Auto-save state when it changes (debounced)
  useEffect(() => {
    if (datasetInfo || preprocessingConfig || splitConfig || modelConfig) {
      const timer = setTimeout(() => {
        saveToStorage();
      }, 2000); // Increased debounce time

      return () => clearTimeout(timer);
    }
  }, [datasetInfo, preprocessingConfig, splitConfig, modelConfig]); // Removed currentStep from deps

  const handleNext = () => {
    const nextStep = currentStep + 1;
    if (nextStep <= steps.length && canProceedToStep(nextStep)) {
      setCurrentStep(nextStep);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset the entire pipeline? This will clear all your progress.')) {
      resetPipeline();
    }
  };

  const handleStepClick = (stepId: number) => {
    if (canProceedToStep(stepId)) {
      setCurrentStep(stepId);
    }
  };

  const getStepStatus = (stepId: number) => {
    if (stepId < currentStep) {
      // Check if step is actually completed
      switch (stepId) {
        case 1:
          return datasetInfo ? 'completed' : 'current';
        case 2:
          return preprocessingConfig ? 'completed' : 'current';
        case 3:
          return splitConfig ? 'completed' : 'current';
        case 4:
          return modelConfig ? 'completed' : 'current';
        default:
          return 'completed';
      }
    }
    if (stepId === currentStep) return 'current';
    return canProceedToStep(stepId) ? 'available' : 'locked';
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <DataUploadStep onNext={handleNext} />;
      case 2:
        return <PreprocessingStep onNext={handleNext} onPrevious={handlePrevious} />;
      case 3:
        return <TrainTestSplitStep onNext={handleNext} onPrevious={handlePrevious} />;
      case 4:
        return <ModelSelectionStep onNext={handleNext} onPrevious={handlePrevious} />;
      case 5:
        return <ResultsStep onPrevious={handlePrevious} onReset={handleReset} onProjectSaved={onProjectSaved} />;
      default:
        return null;
    }
  };

  const completedSteps = getCompletedSteps();

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-4">
                {/* Mobile menu button */}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSidebarCollapsed?.(!sidebarCollapsed)}
                  className="lg:hidden text-gray-600 hover:text-gray-900 p-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </Button>
                
                <Button variant="ghost" onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm sm:text-base">
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Back to Home</span>
                  <span className="sm:hidden">Back</span>
                </Button>
                <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                  PredictIT Pipeline
                </h1>
              </div>
              <div className="flex items-center gap-2 sm:gap-6">
                <div className="text-xs sm:text-sm text-gray-500">
                  {completedSteps}/{steps.length} steps
                </div>
                <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full hidden sm:block">
                  Auto-saved ✓
                </div>
                {isAuthenticated && completedSteps > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setShowSaveDialog(true)}
                    className="text-gray-600 border-gray-300 hover:bg-gray-50 text-xs sm:text-sm px-2 sm:px-4"
                  >
                    <Save className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Save Project</span>
                  </Button>
                )}
                <Button variant="outline" onClick={handleReset} className="text-gray-600 border-gray-300 hover:bg-gray-50 text-xs sm:text-sm px-2 sm:px-4">
                  <span className="hidden sm:inline">Reset Pipeline</span>
                  <span className="sm:hidden">Reset</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
          <div className="max-w-6xl mx-auto">
            {/* Progress Steps */}
            <Card className="mb-6 sm:mb-8 border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">Pipeline Progress</CardTitle>
                  <span className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-2 sm:px-3 py-1 rounded-full">
                    Step {currentStep} of {steps.length}
                  </span>
                </div>
                <Progress value={(completedSteps / steps.length) * 100} className="mb-4 h-2" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex justify-between relative overflow-x-auto pb-4">
                  <div className="flex gap-4 sm:gap-0 sm:justify-between min-w-max sm:min-w-0 w-full">
                    {steps.map((step) => {
                      const status = getStepStatus(step.id);
                      const isClickable = canProceedToStep(step.id);
                      
                      return (
                        <div 
                          key={step.id} 
                          className={`flex flex-col items-center text-center transition-all duration-200 relative z-10 min-w-0 flex-shrink-0 sm:flex-shrink ${
                            isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed opacity-60'
                          }`}
                          onClick={() => handleStepClick(step.id)}
                          title={isClickable ? `Go to ${step.title}` : `Complete previous steps first`}
                        >
                          <div className={`
                            w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-2 sm:mb-3 transition-all duration-200 border-2
                            ${status === 'completed' ? 'bg-green-500 border-green-500 text-white shadow-md' :
                              status === 'current' ? 'bg-slate-900 border-slate-900 text-white shadow-md' :
                              status === 'available' ? 'bg-white border-gray-300 text-gray-600 hover:border-gray-400' :
                              'bg-gray-100 border-gray-200 text-gray-400'}
                          `}>
                            {status === 'completed' ? (
                              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                            ) : (
                              <span className="text-xs sm:text-sm font-semibold">{step.id}</span>
                            )}
                          </div>
                          <h3 className={`text-xs sm:text-sm font-medium mb-1 transition-colors duration-200 max-w-20 sm:max-w-24 ${
                            status === 'current' ? 'text-slate-900 font-semibold' : 
                            status === 'completed' ? 'text-green-600 font-medium' :
                            status === 'available' ? 'text-gray-600' :
                            'text-gray-400'
                          }`}>
                            {step.title}
                          </h3>
                          <p className="text-xs text-gray-500 max-w-20 sm:max-w-24 leading-tight hidden sm:block">
                            {step.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Connection lines - hidden on mobile */}
                  <div className="absolute top-5 sm:top-6 left-0 right-0 h-0.5 bg-gray-200 -z-0 mx-6 hidden sm:block">
                    <div 
                      className="h-full bg-green-500 transition-all duration-500"
                      style={{ width: `${Math.min((completedSteps / (steps.length - 1)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step Content */}
            <div className="mb-6 sm:mb-8">
              {renderStepContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Animated Pipeline Flow Overlay */}
      {isRunning && <AnimatedPipelineFlow />}
      
      {/* Save Project Dialog */}
      <SaveProjectDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSaved={(projectId) => {
          console.log('Project saved with ID:', projectId);
          onProjectSaved?.(); // Call the refresh function
        }}
      />
    </>
  );
};