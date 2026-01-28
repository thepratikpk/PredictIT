import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import { Button } from '../Button';
import { Scissors, ArrowRight, ArrowLeft, Info, Check } from 'lucide-react';
import { usePipelineStore } from '../../store/pipelineStore';

interface TrainTestSplitStepProps {
  onNext: () => void;
  onPrevious: () => void;
}

export const TrainTestSplitStep: React.FC<TrainTestSplitStepProps> = ({ onNext, onPrevious }) => {
  const { splitConfig, setSplitConfig, datasetInfo } = usePipelineStore();
  const [splitRatio, setSplitRatio] = useState(splitConfig?.splitRatio || 0.2);

  useEffect(() => {
    setSplitConfig({ splitRatio });
  }, [splitRatio, setSplitConfig]);

  const trainPercent = Math.round((1 - splitRatio) * 100);
  const testPercent = Math.round(splitRatio * 100);
  const totalRows = datasetInfo?.rowCount || 100;
  const trainRows = Math.round(totalRows * (1 - splitRatio));
  const testRows = totalRows - trainRows;

  const commonSplits = [
    { ratio: 0.2, label: '80 / 20' },
    { ratio: 0.3, label: '70 / 30' },
    { ratio: 0.1, label: '90 / 10' },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-md-primary-container flex items-center justify-center">
              <Scissors className="w-5 h-5 text-md-primary" />
            </div>
            Train-test split
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Info */}
          <div className="flex items-start gap-3 p-4 bg-md-primary-container rounded-lg">
            <Info className="w-5 h-5 text-md-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-md-on-primary-container">
              Split your data into training and testing sets to evaluate model performance on unseen data.
            </p>
          </div>

          {/* Quick select */}
          <div>
            <p className="text-sm font-medium text-md-on-surface mb-3">Quick select</p>
            <div className="flex gap-2">
              {commonSplits.map((split) => {
                const isSelected = Math.abs(splitRatio - split.ratio) < 0.01;

                return (
                  <button
                    key={split.ratio}
                    onClick={() => setSplitRatio(split.ratio)}
                    className={`
                      flex-1 py-3 px-4 rounded-full text-sm font-medium transition-all
                      ${isSelected
                        ? 'bg-md-primary text-white'
                        : 'bg-md-surface-container text-md-on-surface hover:bg-md-surface-container-high'
                      }
                    `}
                  >
                    {split.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-md-on-surface">Custom split</p>
              <span className="text-sm text-md-on-surface-variant">Test: {testPercent}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.4"
              step="0.05"
              value={splitRatio}
              onChange={(e) => setSplitRatio(parseFloat(e.target.value))}
              className="w-full h-1 bg-md-surface-container rounded-full appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none 
                         [&::-webkit-slider-thumb]:w-4 
                         [&::-webkit-slider-thumb]:h-4 
                         [&::-webkit-slider-thumb]:bg-md-primary 
                         [&::-webkit-slider-thumb]:rounded-full 
                         [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>

          {/* Visual split */}
          <div className="p-4 bg-md-surface-dim rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-md-on-surface">Data distribution</p>
              <span className="text-xs text-md-on-surface-variant">{totalRows.toLocaleString()} rows</span>
            </div>

            <div className="flex gap-1 mb-4 h-8 rounded-lg overflow-hidden">
              <motion.div
                className="bg-md-primary flex items-center justify-center text-white text-xs font-medium"
                initial={{ width: 0 }}
                animate={{ width: `${trainPercent}%` }}
                transition={{ duration: 0.3 }}
              >
                {trainPercent}%
              </motion.div>
              <motion.div
                className="bg-green-500 flex items-center justify-center text-white text-xs font-medium"
                initial={{ width: 0 }}
                animate={{ width: `${testPercent}%` }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                {testPercent}%
              </motion.div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-md-primary rounded" />
                <span className="text-md-on-surface-variant">Training: {trainRows.toLocaleString()} rows</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span className="text-md-on-surface-variant">Testing: {testRows.toLocaleString()} rows</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={onNext}>
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};