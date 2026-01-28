import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Progress } from './Progress';
import { ArrowLeft, Check, Save, Menu, RotateCcw, Sparkles } from 'lucide-react';
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
  { id: 1, title: 'Upload', description: 'Import your dataset' },
  { id: 2, title: 'Preprocess', description: 'Scale your data' },
  { id: 3, title: 'Split', description: 'Train-test split' },
  { id: 4, title: 'Model', description: 'Choose algorithm' },
  { id: 5, title: 'Results', description: 'View performance' },
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

  useEffect(() => {
    if (!datasetInfo && !preprocessingConfig && !splitConfig && !modelConfig) {
      loadFromStorage();
    }
  }, []);

  useEffect(() => {
    if (datasetInfo || preprocessingConfig || splitConfig || modelConfig) {
      const timer = setTimeout(() => {
        saveToStorage();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [datasetInfo, preprocessingConfig, splitConfig, modelConfig]);

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
    if (confirm('Reset the entire pipeline? This will clear all progress.')) {
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
      switch (stepId) {
        case 1: return datasetInfo ? 'completed' : 'current';
        case 2: return preprocessingConfig ? 'completed' : 'current';
        case 3: return splitConfig ? 'completed' : 'current';
        case 4: return modelConfig ? 'completed' : 'current';
        default: return 'completed';
      }
    }
    if (stepId === currentStep) return 'current';
    return canProceedToStep(stepId) ? 'available' : 'locked';
  };

  const renderStepContent = () => {
    const content = (() => {
      switch (currentStep) {
        case 1: return <DataUploadStep onNext={handleNext} />;
        case 2: return <PreprocessingStep onNext={handleNext} onPrevious={handlePrevious} />;
        case 3: return <TrainTestSplitStep onNext={handleNext} onPrevious={handlePrevious} />;
        case 4: return <ModelSelectionStep onNext={handleNext} onPrevious={handlePrevious} />;
        case 5: return <ResultsStep onPrevious={handlePrevious} onReset={handleReset} onProjectSaved={onProjectSaved} />;
        default: return null;
      }
    })();

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
        >
          {content}
        </motion.div>
      </AnimatePresence>
    );
  };

  const completedSteps = getCompletedSteps();
  const progressPercentage = (completedSteps / steps.length) * 100;

  return (
    <>
      <div className="min-h-screen bg-md-surface-dim">
        {/* Header - Clean MD3 */}
        <header className="bg-white border-b border-md-outline-variant sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed?.(!sidebarCollapsed)}
                className="lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </Button>

              <Button variant="ghost" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>

              <div className="hidden sm:flex items-center gap-2">
                <div className="w-8 h-8 bg-md-primary rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium text-md-on-surface">ML Pipeline</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                Auto-saved
              </div>

              {isAuthenticated && completedSteps > 0 && (
                <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(true)}>
                  <Save className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Save</span>
                </Button>
              )}

              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          {/* Step Progress - MD3 Style */}
          <Card className="mb-6">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-4">
                <CardTitle>Pipeline Progress</CardTitle>
                <span className="text-sm text-md-on-surface-variant">
                  Step {currentStep} of {steps.length}
                </span>
              </div>
              <Progress value={progressPercentage} />
            </CardHeader>
            <CardContent>
              {/* Step indicators */}
              <div className="flex justify-between">
                {steps.map((step) => {
                  const status = getStepStatus(step.id);
                  const isClickable = canProceedToStep(step.id);

                  return (
                    <button
                      key={step.id}
                      onClick={() => handleStepClick(step.id)}
                      disabled={!isClickable}
                      className={`
                        flex flex-col items-center text-center flex-1 py-2 rounded-lg transition-colors
                        ${isClickable ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-not-allowed'}
                      `}
                    >
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center mb-2 text-sm font-medium transition-colors
                        ${status === 'completed'
                          ? 'bg-md-primary text-white'
                          : status === 'current'
                            ? 'bg-md-primary-container text-md-primary ring-2 ring-md-primary ring-offset-2'
                            : 'bg-md-surface-container text-md-on-surface-variant'
                        }
                      `}>
                        {status === 'completed' ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          step.id
                        )}
                      </div>

                      <span className={`text-xs font-medium ${status === 'current' ? 'text-md-primary' :
                          status === 'completed' ? 'text-md-on-surface' :
                            'text-md-on-surface-variant'
                        }`}>
                        {step.title}
                      </span>

                      <span className="text-xs text-md-on-surface-variant hidden sm:block mt-0.5">
                        {step.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Step Content */}
          <div className="mb-8">
            {renderStepContent()}
          </div>
        </div>
      </div>

      {isRunning && <AnimatedPipelineFlow />}

      <SaveProjectDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSaved={(projectId) => {
          console.log('Project saved:', projectId);
          onProjectSaved?.();
        }}
      />
    </>
  );
};