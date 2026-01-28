import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import { Button } from '../Button';
import { Settings, ArrowRight, ArrowLeft, Info, Check } from 'lucide-react';
import { usePipelineStore } from '../../store/pipelineStore';

interface PreprocessingStepProps {
  onNext: () => void;
  onPrevious: () => void;
}

export const PreprocessingStep: React.FC<PreprocessingStepProps> = ({ onNext, onPrevious }) => {
  const { preprocessingConfig, setPreprocessingConfig } = usePipelineStore();
  const [selectedScaler, setSelectedScaler] = useState<string>(preprocessingConfig?.scaler || '');

  useEffect(() => {
    if (selectedScaler) {
      setPreprocessingConfig({ scaler: selectedScaler });
    }
  }, [selectedScaler, setPreprocessingConfig]);

  const scalerOptions = [
    {
      value: 'StandardScaler',
      name: 'Standard Scaler',
      description: 'Standardizes features by removing mean and scaling to unit variance',
      formula: '(x - μ) / σ'
    },
    {
      value: 'MinMaxScaler',
      name: 'MinMax Scaler',
      description: 'Scales features to a [0, 1] range',
      formula: '(x - min) / (max - min)'
    },
    {
      value: 'none',
      name: 'No Scaling',
      description: 'Skip preprocessing, use raw data',
      formula: 'x (unchanged)'
    }
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-md-primary-container flex items-center justify-center">
              <Settings className="w-5 h-5 text-md-primary" />
            </div>
            Data preprocessing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Info */}
          <div className="flex items-start gap-3 p-4 bg-md-primary-container rounded-lg">
            <Info className="w-5 h-5 text-md-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-md-on-primary-container">Why preprocess?</p>
              <p className="text-sm text-md-on-primary-container/80 mt-1">
                Scaling features to similar ranges helps ML algorithms perform better.
              </p>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-md-on-surface">Choose scaling method</p>

            {scalerOptions.map((option, index) => {
              const isSelected = selectedScaler === option.value;

              return (
                <motion.button
                  key={option.value}
                  onClick={() => setSelectedScaler(option.value)}
                  className={`
                    w-full p-4 rounded-xl border-2 text-left transition-all
                    ${isSelected
                      ? 'border-md-primary bg-md-primary-container'
                      : 'border-md-outline-variant hover:border-md-outline hover:bg-gray-50'
                    }
                  `}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`
                      w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5
                      ${isSelected ? 'border-md-primary bg-md-primary' : 'border-md-outline'}
                    `}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-md-on-surface">{option.name}</p>
                      <p className="text-sm text-md-on-surface-variant mt-0.5">{option.description}</p>
                      <code className="text-xs text-md-on-surface-variant bg-md-surface-container px-2 py-0.5 rounded mt-2 inline-block">
                        {option.formula}
                      </code>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={onNext} disabled={!selectedScaler}>
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};