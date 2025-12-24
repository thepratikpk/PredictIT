import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import { Button } from '../Button';
import { BarChart3, ArrowLeft, RefreshCw, CheckCircle, XCircle, TrendingUp, Target, AlertCircle, Brain, Save, BookmarkPlus } from 'lucide-react';
import { trainModel, preprocessData } from '../../api/mlApi';
import { usePipelineStore } from '../../store/pipelineStore';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config/api';

interface ResultsStepProps {
  onPrevious: () => void;
  onReset: () => void;
  onProjectSaved?: () => void; // Add this prop
}

export const ResultsStep: React.FC<ResultsStepProps> = ({ onPrevious, onReset, onProjectSaved }) => {
  const [isTraining, setIsTraining] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Save pipeline state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveData, setSaveData] = useState({ name: '', description: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Prediction state
  const [predictionInputs, setPredictionInputs] = useState<Record<string, number>>({});
  const [predictionResult, setPredictionResult] = useState<any>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  
  const { 
    sessionId, 
    datasetInfo,
    preprocessingConfig,
    splitConfig,
    modelConfig,
    setIsRunning,
    setResults: setStoreResults,
    setAnimationState
  } = usePipelineStore();

  const { isAuthenticated, token } = useAuthStore();

  const handleSavePipeline = async () => {
    if (!isAuthenticated || !token) {
      alert('Please sign in to save your pipeline');
      return;
    }

    if (!saveData.name.trim()) {
      setSaveError('Please enter a pipeline name');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/projects/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: saveData.name.trim(),
          description: saveData.description.trim(),
          session_id: sessionId,
          dataset_info: datasetInfo,
          preprocessing_config: preprocessingConfig,
          split_config: splitConfig,
          model_config: modelConfig,
          results: results
        }),
      });

      if (response.ok) {
      await response.json();
      setShowSaveModal(false);
      setSaveData({ name: '', description: '' });
      alert('Pipeline saved successfully!');
      
      // Refresh the projects list in sidebar
      if (onProjectSaved) {
        onProjectSaved();
      }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save pipeline');
      }
    } catch (error: any) {
      setSaveError(error.message || 'Failed to save pipeline');
    } finally {
      setIsSaving(false);
    }
  };

  const runTraining = async () => {
    if (!sessionId) {
      setError('No dataset uploaded');
      return;
    }

    if (!modelConfig) {
      setError('Model configuration is missing');
      return;
    }

    if (!modelConfig.modelType || !modelConfig.targetColumn || !modelConfig.featureColumns.length) {
      setError('Please complete model configuration: select model type, target column, and feature columns');
      return;
    }

    setIsTraining(true);
    setIsRunning(true);
    setError(null);
    setResults(null);

    try {
      // Phase 1: Data Loading
      setAnimationState({
        currentPhase: 'uploading',
        progress: 10,
        message: 'Loading your dataset...'
      });
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Phase 2: Preprocessing
      if (preprocessingConfig?.scaler && preprocessingConfig.scaler !== 'none') {
        setAnimationState({
          currentPhase: 'preprocessing',
          progress: 30,
          message: `Applying ${preprocessingConfig.scaler}...`
        });
        console.log('Applying preprocessing:', preprocessingConfig.scaler);
        await preprocessData(
          sessionId,
          modelConfig.targetColumn,
          preprocessingConfig.scaler
        );
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Phase 3: Data Splitting
      setAnimationState({
        currentPhase: 'splitting',
        progress: 50,
        message: 'Splitting data into train and test sets...'
      });
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Phase 4: Model Training
      setAnimationState({
        currentPhase: 'training',
        progress: 70,
        message: `Training ${modelConfig.modelType} model...`
      });

      const trainRequest = {
        session_id: sessionId,
        model_type: modelConfig.modelType,
        split_ratio: splitConfig?.splitRatio || 0.2,
        target_column: modelConfig.targetColumn,
        feature_columns: modelConfig.featureColumns,
        preprocessing_steps: preprocessingConfig?.scaler && preprocessingConfig.scaler !== 'none' 
          ? [preprocessingConfig.scaler] 
          : []
      };

      console.log('Training request:', trainRequest);
      const response = await trainModel(trainRequest);

      // Phase 5: Evaluation
      setAnimationState({
        currentPhase: 'evaluating',
        progress: 90,
        message: 'Evaluating model performance...'
      });
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Complete
      setAnimationState({
        currentPhase: 'complete',
        progress: 100,
        message: 'Training completed successfully!'
      });
      await new Promise(resolve => setTimeout(resolve, 500));

      setResults(response);
      setStoreResults(response);
      
      // Show success toast
      toast.success(`Model trained successfully! Accuracy: ${(response.accuracy * 100).toFixed(1)}%`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Training failed';
      setError(errorMessage);
      console.error('Training error:', err);
      console.error('Error response:', err.response?.data);
      
      // Show error toast
      toast.error(`Training failed: ${errorMessage}`);
      
      setAnimationState({
        currentPhase: 'idle',
        progress: 0,
        message: 'Training failed'
      });
    } finally {
      setIsTraining(false);
      setIsRunning(false);
    }
  };

  useEffect(() => {
    // Only auto-start training if we don't have results yet
    // This prevents re-training on page refresh
    if (!results && sessionId && modelConfig?.modelType && modelConfig?.targetColumn && modelConfig?.featureColumns?.length) {
      runTraining();
    }
  }, [sessionId, modelConfig]); // Dependencies to re-run when these change

  const handlePrediction = async () => {
    if (!sessionId || !modelConfig) {
      setPredictionError('No trained model available');
      return;
    }

    // Validate all inputs are provided
    const missingInputs = modelConfig.featureColumns.filter(
      feature => predictionInputs[feature] === undefined || predictionInputs[feature] === null
    );

    if (missingInputs.length > 0) {
      setPredictionError(`Please provide values for: ${missingInputs.join(', ')}`);
      return;
    }

    setIsPredicting(true);
    setPredictionError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          feature_values: predictionInputs
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Prediction failed');
      }

      const result = await response.json();
      setPredictionResult(result);
    } catch (err: any) {
      setPredictionError(err.message || 'Prediction failed');
    } finally {
      setIsPredicting(false);
    }
  };

  const clearPredictionInputs = () => {
    setPredictionInputs({});
    setPredictionResult(null);
    setPredictionError(null);
  };

  const handleInputChange = (feature: string, value: string) => {
    const numValue = parseFloat(value);
    setPredictionInputs(prev => ({
      ...prev,
      [feature]: isNaN(numValue) ? 0 : numValue
    }));
    setPredictionError(null); // Clear error when user types
  };

  const renderConfusionMatrix = (matrix: number[][]) => {
    if (!matrix || matrix.length === 0) return null;
    
    return (
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">Confusion Matrix:</h4>
        <div className="grid grid-cols-2 gap-1 max-w-32">
          {matrix.map((row, i) => 
            row.map((value, j) => (
              <div 
                key={`${i}-${j}`} 
                className={`p-2 text-center text-sm font-medium rounded ${
                  i === j ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {value}
              </div>
            ))
          )}
        </div>
        <div className="text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-100 rounded"></div>
            <span>Correct predictions</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-100 rounded"></div>
            <span>Incorrect predictions</span>
          </div>
        </div>
      </div>
    );
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.9) return 'text-green-600';
    if (accuracy >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAccuracyLabel = (accuracy: number) => {
    if (accuracy >= 0.9) return 'Excellent';
    if (accuracy >= 0.8) return 'Good';
    if (accuracy >= 0.7) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Model Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Configuration Check */}
          {(!modelConfig || !modelConfig.modelType || !modelConfig.targetColumn || !modelConfig.featureColumns.length) && (
            <div className="flex items-center gap-2 text-orange-600 bg-orange-50 border border-orange-200 rounded-lg p-4">
              <AlertCircle className="w-5 h-5" />
              <div>
                <h4 className="font-semibold">Configuration Incomplete</h4>
                <p className="text-sm">Please go back and complete all previous steps before training the model.</p>
                <ul className="text-sm mt-2 space-y-1">
                  {!datasetInfo && <li>• Upload a dataset</li>}
                  {!modelConfig?.modelType && <li>• Select a model type</li>}
                  {!modelConfig?.targetColumn && <li>• Choose a target column</li>}
                  {!modelConfig?.featureColumns?.length && <li>• Select feature columns</li>}
                </ul>
              </div>
            </div>
          )}

          {/* Training Status */}
          {isTraining && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Training Your Model...</h3>
                <p className="text-gray-600">This may take a few moments</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
              <XCircle className="w-5 h-5" />
              <div>
                <h4 className="font-semibold">Training Failed</h4>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Model trained successfully!</span>
              </div>

              {/* Performance Metrics */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Model Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className={`text-4xl font-bold ${getAccuracyColor(results.accuracy)}`}>
                          {(results.accuracy * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">Accuracy</div>
                        <div className={`text-sm font-medium ${getAccuracyColor(results.accuracy)}`}>
                          {getAccuracyLabel(results.accuracy)}
                        </div>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            results.accuracy >= 0.9 ? 'bg-green-500' :
                            results.accuracy >= 0.7 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${results.accuracy * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Prediction Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderConfusionMatrix(results.confusion_matrix)}
                  </CardContent>
                </Card>
              </div>

              {/* Prediction Interface */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Make New Predictions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Use your trained model to predict new values. Enter the feature values below:
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {modelConfig?.featureColumns.map((feature) => (
                        <div key={feature} className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {feature}
                          </label>
                          <input
                            type="number"
                            step="any"
                            placeholder={`Enter ${feature} value`}
                            value={predictionInputs[feature] || ''}
                            onChange={(e) => handleInputChange(feature, e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      ))}
                    </div>
                    
                    {predictionError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-700 text-sm">{predictionError}</p>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={handlePrediction}
                        disabled={isPredicting || !results}
                        className="flex items-center gap-2"
                      >
                        {isPredicting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Predicting...
                          </>
                        ) : (
                          <>
                            <Brain className="w-4 h-4" />
                            Predict
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={clearPredictionInputs}
                        disabled={isPredicting}
                      >
                        Clear
                      </Button>
                    </div>
                    
                    {/* Prediction Result */}
                    {predictionResult ? (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Prediction Result
                        </h4>
                        <div className="text-green-700 space-y-2">
                          <div className="text-lg font-bold">
                            Predicted {modelConfig?.targetColumn}: {predictionResult.prediction}
                          </div>
                          {predictionResult.probability && (
                            <div className="text-sm">
                              <strong>Confidence:</strong> {Math.max(...predictionResult.probability).toFixed(3)} ({(Math.max(...predictionResult.probability) * 100).toFixed(1)}%)
                            </div>
                          )}
                          <div className="text-xs text-green-600">
                            {predictionResult.message}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-semibold text-blue-800 mb-2">Prediction Result</h4>
                        <div className="text-blue-700">
                          <p className="text-sm">
                            {!results 
                              ? "Train your model first to enable predictions" 
                              : "Enter values above and click 'Predict' to see the result"
                            }
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Configuration Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Training Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Model:</span> {modelConfig?.modelType === 'LogisticRegression' ? 'Logistic Regression' : 'Decision Tree'}
                    </div>
                    <div>
                      <span className="font-medium">Target Column:</span> {modelConfig?.targetColumn}
                    </div>
                    <div>
                      <span className="font-medium">Features:</span> {modelConfig?.featureColumns.join(', ')}
                    </div>
                    <div>
                      <span className="font-medium">Train/Test Split:</span> {Math.round((1 - (splitConfig?.splitRatio || 0.2)) * 100)}/{Math.round((splitConfig?.splitRatio || 0.2) * 100)}
                    </div>
                    <div>
                      <span className="font-medium">Preprocessing:</span> {preprocessingConfig?.scaler || 'None'}
                    </div>
                    <div>
                      <span className="font-medium">Dataset:</span> {datasetInfo?.filename}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Interpretation */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">What do these results mean?</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-gray-700">
                    <p>
                      <strong>Accuracy ({(results.accuracy * 100).toFixed(1)}%):</strong> This means your model correctly predicted the target value for {(results.accuracy * 100).toFixed(1)}% of the test data.
                    </p>
                    <p>
                      <strong>Confusion Matrix:</strong> Shows how many predictions were correct (green) vs incorrect (red). The diagonal values represent correct predictions.
                    </p>
                    {results.accuracy >= 0.8 ? (
                      <p className="text-green-700">
                        <strong>Great job!</strong> Your model is performing well. This suggests your features are good predictors of the target variable.
                      </p>
                    ) : results.accuracy >= 0.6 ? (
                      <p className="text-yellow-700">
                        <strong>Room for improvement:</strong> Consider trying different features, more data, or a different model type.
                      </p>
                    ) : (
                      <p className="text-red-700">
                        <strong>Needs work:</strong> The model isn't performing well. Try different features, check your data quality, or consider if this is the right approach.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Model Selection
        </Button>
        <div className="flex gap-2">
          {results && (
            <Button variant="outline" onClick={runTraining} className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Retrain Model
            </Button>
          )}
          {results && isAuthenticated && (
            <Button 
              onClick={() => setShowSaveModal(true)}
              variant="outline" 
              className="flex items-center gap-2 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
            >
              <Save className="w-4 h-4" />
              Save Pipeline
            </Button>
          )}
          <Button onClick={onReset} className="flex items-center gap-2">
            Start New Pipeline
          </Button>
        </div>
      </div>

      {/* Save Pipeline Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookmarkPlus className="w-5 h-5" />
                Save Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Pipeline Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Customer Churn Prediction"
                  value={saveData.name}
                  onChange={(e) => setSaveData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  maxLength={100}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Description (Optional)</label>
                <textarea
                  placeholder="Describe what this pipeline does..."
                  value={saveData.description}
                  onChange={(e) => setSaveData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-20 resize-none"
                  maxLength={500}
                />
              </div>

              {saveError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{saveError}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSavePipeline}
                  disabled={isSaving || !saveData.name.trim()}
                  className="flex-1"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Pipeline
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSaveModal(false);
                    setSaveData({ name: '', description: '' });
                    setSaveError(null);
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};