import React, { useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Split } from 'lucide-react';
import { usePipelineStore } from '../../store/pipelineStore';
import { NodeData } from '../../types';

interface SplitNodeProps {
  id: string;
  data: NodeData;
}

export const SplitNode: React.FC<SplitNodeProps> = ({ id, data }) => {
  const { updateNodeData } = usePipelineStore();

  const handleSplitChange = useCallback((splitRatio: number) => {
    updateNodeData(id, {
      config: { ...data.config, splitRatio },
      isConfigured: true
    });
  }, [id, data.config, updateNodeData]);

  const splitRatio = data.config?.splitRatio || 0.2;
  const trainPercent = Math.round((1 - splitRatio) * 100);
  const testPercent = Math.round(splitRatio * 100);

  return (
    <Card className="w-64 border-2 border-yellow-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Split className="w-4 h-4" />
          Train/Test Split
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="space-y-2">
          <label className="text-xs font-medium">Test Size:</label>
          <input
            type="range"
            min="0.1"
            max="0.5"
            step="0.05"
            value={splitRatio}
            onChange={(e) => handleSplitChange(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Train: {trainPercent}%</span>
            <span>Test: {testPercent}%</span>
          </div>
        </div>
      </CardContent>
      
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-yellow-500"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-yellow-500"
      />
    </Card>
  );
};