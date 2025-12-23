import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Split } from 'lucide-react';

interface SplitNodeProps {
  id: string;
  data: any; // Simplified for legacy component
}

export const SplitNode: React.FC<SplitNodeProps> = () => {
  // Legacy component - simplified
  
  return (
    <Card className="w-64 border-2 border-yellow-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Split className="w-4 h-4" />
          Train/Test Split (Legacy)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-xs text-gray-500">
          This is a legacy component. Use the step-based pipeline for full functionality.
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