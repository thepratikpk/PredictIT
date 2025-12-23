import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { BarChart3, CheckCircle, XCircle } from 'lucide-react';
import { usePipelineStore } from '../../store/pipelineStore';
import { NodeData } from '../../types';

interface ResultNodeProps {
  id: string;
  data: NodeData;
}

export const ResultNode: React.FC<ResultNodeProps> = ({ id, data }) => {
  const { results, isRunning } = usePipelineStore();

  const renderConfusionMatrix = (matrix: number[][]) => {
    if (!matrix || matrix.length === 0) return null;
    
    return (
      <div className="grid grid-cols-2 gap-1 text-xs">
        {matrix.flat().map((value, idx) => (
          <div key={idx} className="bg-muted p-1 text-center rounded">
            {value}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="w-64 border-2 border-orange-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Results
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isRunning && (
          <div className="flex items-center gap-2 text-xs text-blue-600">
            <div className="animate-spin w-3 h-3 border border-blue-600 border-t-transparent rounded-full" />
            Training model...
          </div>
        )}
        
        {results && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {results.status === 'success' ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <span className="text-xs font-medium">
                {results.status === 'success' ? 'Success' : 'Failed'}
              </span>
            </div>
            
            {results.accuracy && (
              <div className="text-xs">
                <div className="font-medium">Accuracy: {(results.accuracy * 100).toFixed(2)}%</div>
              </div>
            )}
            
            {results.confusion_matrix && (
              <div className="space-y-1">
                <div className="text-xs font-medium">Confusion Matrix:</div>
                {renderConfusionMatrix(results.confusion_matrix)}
              </div>
            )}
            
            {results.message && (
              <div className="text-xs text-muted-foreground">
                {results.message}
              </div>
            )}
          </div>
        )}
        
        {!results && !isRunning && (
          <div className="text-xs text-muted-foreground">
            Run pipeline to see results
          </div>
        )}
      </CardContent>
      
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-orange-500"
      />
    </Card>
  );
};