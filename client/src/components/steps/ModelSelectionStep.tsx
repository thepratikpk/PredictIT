import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import { Button } from '../Button';
import { Brain, ArrowRight, ArrowLeft, Info, Target, Check } from 'lucide-react';
import { usePipelineStore } from '../../store/pipelineStore';

interface ModelSelectionStepProps {
  onNext: () => void;
  onPrevious: () => void;
}

export const ModelSelectionStep: React.FC<ModelSelectionStepProps> = ({ onNext, onPrevious }) => {
  const { datasetInfo, modelConfig, setModelConfig } = usePipelineStore();
  const [selectedModel, setSelectedModel] = useState<string>(modelConfig?.modelType || '');
  const [targetColumn, setTargetColumn] = useState<string>(modelConfig?.targetColumn || '');
  const [featureColumns, setFeatureColumns] = useState<string[]>(modelConfig?.featureColumns || []);

  const datasetColumns = datasetInfo?.columns || [];
  const numericColumns = datasetInfo?.numericColumns || [];

  useEffect(() => {
    if (selectedModel && targetColumn && featureColumns.length > 0) {
      setModelConfig({ modelType: selectedModel, targetColumn, featureColumns });
    }
  }, [selectedModel, targetColumn, featureColumns, setModelConfig]);

  const modelOptions = [
    {
      value: 'LogisticRegression',
      name: 'Logistic Regression',
      description: 'Linear model for classification'
    },
    {
      value: 'DecisionTree',
      name: 'Decision Tree',
      description: 'Tree-based model for classification'
    }
  ];

  const handleFeatureToggle = (column: string) => {
    setFeatureColumns(prev =>
      prev.includes(column) ? prev.filter(f => f !== column) : [...prev, column]
    );
  };

  const availableFeatures = numericColumns.filter((col: string) => col !== targetColumn);
  const isConfigured = selectedModel && targetColumn && featureColumns.length > 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-md-primary-container flex items-center justify-center">
              <Brain className="w-5 h-5 text-md-primary" />
            </div>
            Model selection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Algorithm */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-md-on-surface">1. Choose algorithm</p>

            <div className="grid grid-cols-2 gap-3">
              {modelOptions.map((model) => {
                const isSelected = selectedModel === model.value;

                return (
                  <button
                    key={model.value}
                    onClick={() => setSelectedModel(model.value)}
                    className={`
                      p-4 rounded-xl border-2 text-left transition-all
                      ${isSelected
                        ? 'border-md-primary bg-md-primary-container'
                        : 'border-md-outline-variant hover:border-md-outline hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`
                        w-4 h-4 rounded-full border-2 flex items-center justify-center
                        ${isSelected ? 'border-md-primary bg-md-primary' : 'border-md-outline'}
                      `}>
                        {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <p className="font-medium text-md-on-surface text-sm">{model.name}</p>
                    </div>
                    <p className="text-xs text-md-on-surface-variant ml-6">{model.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Target */}
          <AnimatePresence>
            {selectedModel && (
              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <p className="text-sm font-medium text-md-on-surface flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  2. Select target column
                </p>

                <select
                  value={targetColumn}
                  onChange={(e) => {
                    setTargetColumn(e.target.value);
                    setFeatureColumns([]);
                  }}
                  className="w-full p-3 bg-white border border-md-outline rounded-lg text-md-on-surface focus:border-md-primary focus:ring-0 outline-none transition-colors"
                >
                  <option value="">Select column...</option>
                  {datasetColumns.map((col: string) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 3: Features */}
          <AnimatePresence>
            {targetColumn && (
              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-md-on-surface">3. Select features</p>
                  <button
                    className="text-xs text-md-primary hover:underline"
                    onClick={() => setFeatureColumns(availableFeatures)}
                  >
                    Select all
                  </button>
                </div>

                {availableFeatures.length === 0 ? (
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-700">No numeric features available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {availableFeatures.map((column: string) => {
                      const isSelected = featureColumns.includes(column);

                      return (
                        <button
                          key={column}
                          onClick={() => handleFeatureToggle(column)}
                          className={`
                            p-3 rounded-lg text-sm text-left transition-all flex items-center gap-2
                            ${isSelected
                              ? 'bg-md-primary-container text-md-primary'
                              : 'bg-md-surface-container text-md-on-surface hover:bg-md-surface-container-high'
                            }
                          `}
                        >
                          <div className={`
                            w-4 h-4 rounded border flex items-center justify-center flex-shrink-0
                            ${isSelected ? 'bg-md-primary border-md-primary' : 'border-md-outline bg-white'}
                          `}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className="truncate">{column}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {featureColumns.length > 0 && (
                  <p className="text-xs text-md-on-surface-variant">
                    {featureColumns.length} feature{featureColumns.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Summary */}
          <AnimatePresence>
            {isConfigured && (
              <motion.div
                className="p-4 bg-green-50 border border-green-200 rounded-lg"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="text-sm font-medium text-green-800 mb-2">Ready to train</p>
                <div className="text-sm text-green-700 space-y-1">
                  <p>Model: {modelOptions.find(m => m.value === selectedModel)?.name}</p>
                  <p>Target: {targetColumn}</p>
                  <p>Features: {featureColumns.length} columns</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={onNext} disabled={!isConfigured}>
          Train model
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};