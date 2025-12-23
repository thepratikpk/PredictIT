import React, { useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Brain } from 'lucide-react';
import { usePipelineStore } from '../../store/pipelineStore';
import { NodeData } from '../../types';

interface ModelNodeProps {
  id: string;
  data: NodeData;
}

export const ModelNode: React.FC<ModelNodeProps> = ({ id, data }) => {
  const { updateNodeData, nodes } = usePipelineStore();

  // Get columns from dataset node
  const datasetNode = nodes.find(node => node.type === 'dataset');
  const availableColumns = datasetNode?.data.columns || [];

  const handleModelChange = useCallback((modelType: string) => {
    updateNodeData(id, {
      config: { ...data.config, modelType },
      isConfigured: !!(modelType && data.config?.targetColumn && data.config?.featureColumns?.length)
    });
  }, [id, data.config, updateNodeData]);

  const handleTargetChange = useCallback((targetColumn: string) => {
    const featureColumns = availableColumns.filter(col => col !== targetColumn);
    updateNodeData(id, {
      config: { 
        ...data.config, 
        targetColumn,
        featureColumns: featureColumns.slice(0, Math.min(5, featureColumns.length)) // Limit features
      },
      isConfigured: !!(data.config?.modelType && targetColumn && featureColumns.length > 0)
    });
  }, [id, data.config, updateNodeData, availableColumns]);

  const handleFeatureToggle = useCallback((column: string) => {
    const currentFeatures = data.config?.featureColumns || [];
    const newFeatures = currentFeatures.includes(column)
      ? currentFeatures.filter(f => f !== column)
      : [...currentFeatures, column];
    
    updateNodeData(id, {
      config: { ...data.config, featureColumns: newFeatures },
      isConfigured: !!(data.config?.modelType && data.config?.targetColumn && newFeatures.length > 0)
    });
  }, [id, data.config, updateNodeData]);

  return (
    <Card className="w-64 border-2 border-purple-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="w-4 h-4" />
          Model
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="space-y-2">
          <label className="text-xs font-medium">Model Type:</label>
          <select
            value={data.config?.modelType || ''}
            onChange={(e) => handleModelChange(e.target.value)}
            className="w-full p-2 text-xs border rounded"
          >
            <option value="">Select Model</option>
            <option value="LogisticRegression">Logistic Regression</option>
            <option value="DecisionTree">Decision Tree</option>
          </select>
        </div>

        {availableColumns.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-medium">Target Column:</label>
            <select
              value={data.config?.targetColumn || ''}
              onChange={(e) => handleTargetChange(e.target.value)}
              className="w-full p-2 text-xs border rounded"
            >
              <option value="">Select Target</option>
              {availableColumns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
        )}

        {data.config?.targetColumn && (
          <div className="space-y-1">
            <label className="text-xs font-medium">Features:</label>
            <div className="max-h-20 overflow-y-auto space-y-1">
              {availableColumns
                .filter(col => col !== data.config.targetColumn)
                .map(col => (
                  <label key={col} className="flex items-center text-xs">
                    <input
                      type="checkbox"
                      checked={data.config?.featureColumns?.includes(col) || false}
                      onChange={() => handleFeatureToggle(col)}
                      className="mr-1"
                    />
                    {col}
                  </label>
                ))}
            </div>
          </div>
        )}
      </CardContent>
      
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-purple-500"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-purple-500"
      />
    </Card>
  );
};