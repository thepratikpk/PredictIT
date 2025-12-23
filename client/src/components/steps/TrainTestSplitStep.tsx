import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Split, ArrowRight, ArrowLeft, Info, PieChart } from 'lucide-react';
import { usePipelineStore } from '../../store/pipelineStore';

interface TrainTestSplitStepProps {
  onNext: () => void;
  onPrevious: () => void;
}

export const TrainTestSplitStep: React.FC<TrainTestSplitStepProps> = ({ onNext, onPrevious }) => {
  const { splitConfig, setSplitConfig } = usePipelineStore();
  const [splitRatio, setSplitRatio] = useState(splitConfig?.splitRatio || 0.2);

  useEffect(() => {
    setSplitConfig({ splitRatio });
  }, [splitRatio, setSplitConfig]);

  const trainPercent = Math.round((1 - splitRatio) * 100);
  const testPercent = Math.round(splitRatio * 100);

  const commonSplits = [
    { ratio: 0.2, label: '80-20 Split', description: 'Most common split for medium datasets' },
    { ratio: 0.3, label: '70-30 Split', description: 'Good for smaller datasets' },
    { ratio: 0.1, label: '90-10 Split', description: 'For large datasets' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Split className="w-5 h-5" />
            Train-Test Split
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-800 mb-1">Why Split Data?</h4>
                <p className="text-blue-700 text-sm">
                  We split data into training and testing sets to evaluate how well our model performs on unseen data. 
                  The training set teaches the model, while the test set measures its accuracy.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Choose Split Ratio:</h3>
            
            <div className="grid gap-3">
              {commonSplits.map((split) => (
                <div
                  key={split.ratio}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    splitRatio === split.ratio
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSplitRatio(split.ratio)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="split"
                        value={split.ratio}
                        checked={splitRatio === split.ratio}
                        onChange={() => setSplitRatio(split.ratio)}
                      />
                      <div>
                        <h4 className="font-semibold text-gray-900">{split.label}</h4>
                        <p className="text-gray-600 text-sm">{split.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-700">
                        Train: {Math.round((1 - split.ratio) * 100)}%
                      </div>
                      <div className="text-sm font-medium text-gray-700">
                        Test: {Math.round(split.ratio * 100)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Custom Split:</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium min-w-20">Test Size:</label>
                  <input
                    type="range"
                    min="0.1"
                    max="0.4"
                    step="0.05"
                    value={splitRatio}
                    onChange={(e) => setSplitRatio(parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium min-w-12">{testPercent}%</span>
                </div>
                
                <div className="flex gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span>Training: {trainPercent}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span>Testing: {testPercent}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <PieChart className="w-4 h-4 text-gray-600" />
              <h4 className="font-semibold text-gray-800">Current Split</h4>
            </div>
            <div className="flex gap-2 mb-2">
              <div 
                className="bg-blue-500 h-6 rounded-l flex items-center justify-center text-white text-sm font-medium"
                style={{ width: `${trainPercent}%` }}
              >
                {trainPercent}% Train
              </div>
              <div 
                className="bg-green-500 h-6 rounded-r flex items-center justify-center text-white text-sm font-medium"
                style={{ width: `${testPercent}%` }}
              >
                {testPercent}% Test
              </div>
            </div>
            <p className="text-gray-600 text-sm">
              Your model will train on {trainPercent}% of the data and be tested on the remaining {testPercent}%.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Preprocessing
        </Button>
        <Button onClick={onNext} className="flex items-center gap-2">
          Continue to Model Selection
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};