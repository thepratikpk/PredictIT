import React, { useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Settings } from 'lucide-react';
import { usePipelineStore } from '../../store/pipelineStore';
import { NodeData } from '../../types';

interface PreprocessingNodeProps {
  id: string;
  data: NodeData;
}

export const PreprocessingNode: React.FC<PreprocessingNodeProps> = ({ id, data }) => {
  const { updateNodeData } = usePipelineStore();

  const handleScalerChange = useCallback((scaler: string) => {
    updateNodeData(id, {
      config: { ...data.config, scaler },
      isConfigured: true
    });
  }, [id, data.config, updateNodeData]);

  return (
    <Card className="w-64 border-2 border-green-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Preprocessing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="space-y-2">
          <label className="text-xs font-medium">Scaler Type:</label>
          <select
            value={data.config?.scaler || ''}
            onChange={(e) => handleScalerChange(e.target.value)}
            className="w-full p-2 text-xs border rounded"
          >
            <option value="">Select Scaler</option>
            <option value="StandardScaler">Standard Scaler</option>
            <option value="MinMaxScaler">MinMax Scaler</option>
          </select>
        </div>
        
        {data.config?.scaler && (
          <div className="text-xs text-muted-foreground">
            Selected: {data.config.scaler}
          </div>
        )}
      </CardContent>
      
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-green-500"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-green-500"
      />
    </Card>
  );
};