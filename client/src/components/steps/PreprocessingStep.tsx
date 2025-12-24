import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import { Button } from '../Button';
import { Settings, ArrowRight, ArrowLeft, Info } from 'lucide-react';
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
      description: 'Standardizes features by removing the mean and scaling to unit variance (z-score normalization)',
      formula: '(x - mean) / std',
      useCase: 'Best for normally distributed data'
    },
    {
      value: 'MinMaxScaler',
      name: 'MinMax Scaler',
      description: 'Scales features to a fixed range, typically [0, 1]',
      formula: '(x - min) / (max - min)',
      useCase: 'Best when you know the bounds of your data'
    },
    {
      value: 'none',
      name: 'No Scaling',
      description: 'Skip preprocessing and use raw data',
      formula: 'x (unchanged)',
      useCase: 'When your data is already properly scaled'
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Data Preprocessing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-800 mb-1">Why Preprocessing?</h4>
                <p className="text-blue-700 text-sm">
                  Machine learning algorithms work better when features are on similar scales.
                  Preprocessing helps normalize your data for optimal model performance.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Choose a Scaling Method:</h3>

            <div className="grid gap-4">
              {scalerOptions.map((option) => (
                <div
                  key={option.value}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedScaler === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                  onClick={() => setSelectedScaler(option.value)}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="scaler"
                      value={option.value}
                      checked={selectedScaler === option.value}
                      onChange={() => setSelectedScaler(option.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{option.name}</h4>
                      <p className="text-gray-600 text-sm mb-2">{option.description}</p>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div><strong>Formula:</strong> {option.formula}</div>
                        <div><strong>Best for:</strong> {option.useCase}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedScaler && selectedScaler !== 'none' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">Selected: {scalerOptions.find(o => o.value === selectedScaler)?.name}</h4>
              <p className="text-green-700 text-sm">
                This scaling method will be applied to all numerical columns in your dataset during training.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Upload
        </Button>
        <Button
          onClick={onNext}
          disabled={!selectedScaler}
          className="flex items-center gap-2"
        >
          Continue to Split
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};