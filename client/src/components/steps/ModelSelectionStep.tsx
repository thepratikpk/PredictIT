import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Brain, ArrowRight, ArrowLeft, Info, Target, CheckSquare } from 'lucide-react';
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
  const categoricalColumns = datasetInfo?.categoricalColumns || [];

  useEffect(() => {
    if (selectedModel && targetColumn && featureColumns.length > 0) {
      setModelConfig({
        modelType: selectedModel,
        targetColumn,
        featureColumns
      });
    }
  }, [selectedModel, targetColumn, featureColumns, setModelConfig]);

  const modelOptions = [
    {
      value: 'LogisticRegression',
      name: 'Logistic Regression',
      description: 'Linear model for binary and multiclass classification',
      pros: ['Fast training', 'Interpretable', 'Good baseline'],
      cons: ['Assumes linear relationships', 'May underfit complex data'],
      bestFor: 'Binary classification, linear relationships'
    },
    {
      value: 'DecisionTree',
      name: 'Decision Tree',
      description: 'Tree-based model that makes decisions using if-else conditions',
      pros: ['Easy to interpret', 'Handles non-linear data', 'No scaling needed'],
      cons: ['Can overfit', 'Unstable with small data changes'],
      bestFor: 'Non-linear patterns, feature interactions'
    }
  ];

  const handleFeatureToggle = (column: string) => {
    setFeatureColumns(prev => 
      prev.includes(column) 
        ? prev.filter(f => f !== column)
        : [...prev, column]
    );
  };

  // Only use numeric columns for features, but allow any column as target
  const availableFeatures = numericColumns.filter((col: string) => col !== targetColumn);
  const isConfigured = selectedModel && targetColumn && featureColumns.length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Model Selection & Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-800 mb-1">Choose Your Model</h4>
                <p className="text-blue-700 text-sm">
                  Select the machine learning algorithm that best fits your data and problem type. 
                  Each model has different strengths and is suited for different scenarios.
                </p>
              </div>
            </div>
          </div>

          {/* Model Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">1. Choose Algorithm:</h3>
            
            <div className="grid gap-4">
              {modelOptions.map((model) => (
                <div
                  key={model.value}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedModel === model.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedModel(model.value)}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="model"
                      value={model.value}
                      checked={selectedModel === model.value}
                      onChange={() => setSelectedModel(model.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{model.name}</h4>
                      <p className="text-gray-600 text-sm mb-3">{model.description}</p>
                      
                      <div className="grid md:grid-cols-2 gap-4 text-xs">
                        <div>
                          <h5 className="font-medium text-green-700 mb-1">Pros:</h5>
                          <ul className="text-green-600 space-y-0.5">
                            {model.pros.map((pro, idx) => (
                              <li key={idx}>• {pro}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-medium text-red-700 mb-1">Cons:</h5>
                          <ul className="text-red-600 space-y-0.5">
                            {model.cons.map((con, idx) => (
                              <li key={idx}>• {con}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-xs">
                        <span className="font-medium text-gray-700">Best for:</span> {model.bestFor}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Target Column Selection */}
          {selectedModel && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Target className="w-5 h-5" />
                2. Select Target Column:
              </h3>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-800 text-sm">
                  The target column is what you want to predict. Choose the column that contains the outcomes or labels.
                </p>
              </div>
              
              <select
                value={targetColumn}
                onChange={(e) => {
                  setTargetColumn(e.target.value);
                  setFeatureColumns([]); // Reset features when target changes
                }}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select target column...</option>
                {datasetColumns.map((col: string) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
          )}

          {/* Feature Selection */}
          {targetColumn && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CheckSquare className="w-5 h-5" />
                3. Select Feature Columns:
              </h3>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-800 text-sm">
                  Features are the input variables used to make predictions. Only numeric columns can be used as features.
                </p>
              </div>

              {availableFeatures.length === 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">
                    <strong>No numeric features available!</strong> 
                    {numericColumns.length === 0 
                      ? " Your dataset contains no numeric columns. Machine learning requires numeric data."
                      : " All numeric columns are being used as the target. Please select a different target column."
                    }
                  </p>
                  {categoricalColumns.length > 0 && (
                    <p className="text-red-700 text-sm mt-2">
                      Categorical columns detected: {categoricalColumns.join(', ')}. 
                      These cannot be used as features in the current version.
                    </p>
                  )}
                </div>
              )}
              
              {availableFeatures.length > 0 && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {availableFeatures.map((column: string) => (
                      <label key={column} className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={featureColumns.includes(column)}
                          onChange={() => handleFeatureToggle(column)}
                          className="rounded"
                        />
                        <span className="text-sm flex items-center gap-1">
                          {column}
                          <span className="px-1 py-0.5 bg-green-100 text-green-700 rounded text-xs">numeric</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  
                  {categoricalColumns.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-yellow-800 text-sm">
                        <strong>Note:</strong> Categorical columns ({categoricalColumns.join(', ')}) are not shown as they cannot be used as features in the current version.
                      </p>
                    </div>
                  )}
                </>
              )}
              
              {featureColumns.length > 0 && (
                <div className="text-sm text-gray-600">
                  Selected {featureColumns.length} feature{featureColumns.length !== 1 ? 's' : ''}: {featureColumns.join(', ')}
                </div>
              )}
            </div>
          )}

          {/* Configuration Summary */}
          {isConfigured && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">Configuration Summary</h4>
              <div className="text-green-700 text-sm space-y-1">
                <div><strong>Model:</strong> {modelOptions.find(m => m.value === selectedModel)?.name}</div>
                <div><strong>Target:</strong> {targetColumn}</div>
                <div><strong>Features:</strong> {featureColumns.join(', ')}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Split
        </Button>
        <Button 
          onClick={onNext} 
          disabled={!isConfigured}
          className="flex items-center gap-2"
        >
          Train Model & View Results
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};