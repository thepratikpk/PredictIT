import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Database, Settings, Split, Brain, BarChart3 } from 'lucide-react';

interface SidebarProps {
  onDragStart: (event: React.DragEvent, nodeType: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onDragStart }) => {
  const nodeTypes = [
    { type: 'dataset', label: 'Dataset', icon: Database, color: 'border-blue-200' },
    { type: 'preprocessing', label: 'Preprocessing', icon: Settings, color: 'border-green-200' },
    { type: 'split', label: 'Train/Test Split', icon: Split, color: 'border-yellow-200' },
    { type: 'model', label: 'Model', icon: Brain, color: 'border-purple-200' },
    { type: 'result', label: 'Results', icon: BarChart3, color: 'border-orange-200' },
  ];

  return (
    <div className="w-64 bg-muted/30 border-r p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pipeline Components</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {nodeTypes.map(({ type, label, icon: Icon, color }) => (
            <Button
              key={type}
              variant="outline"
              className={`w-full justify-start gap-2 ${color} cursor-grab active:cursor-grabbing`}
              draggable
              onDragStart={(event) => onDragStart(event, type)}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Instructions</CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-2">
          <p>1. Drag components to the canvas</p>
          <p>2. Connect them in order: Dataset → Preprocessing → Split → Model → Results</p>
          <p>3. Configure each component</p>
          <p>4. Click "Run Pipeline" to execute</p>
        </CardContent>
      </Card>
    </div>
  );
};