import React, { useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Upload, Database } from 'lucide-react';
import { usePipelineStore } from '../../store/pipelineStore';
import { uploadFile } from '../../api/mlApi';
import { NodeData } from '../../types';

interface DatasetNodeProps {
  id: string;
  data: NodeData;
}

export const DatasetNode: React.FC<DatasetNodeProps> = ({ id, data }) => {
  const { updateNodeData, setSessionId } = usePipelineStore();

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      updateNodeData(id, { isConfigured: false });
      const response = await uploadFile(file);
      
      setSessionId(response.session_id);
      updateNodeData(id, {
        sessionId: response.session_id,
        columns: response.columns,
        config: {
          filename: file.name,
          rowCount: response.row_count,
          columns: response.columns,
          dataTypes: response.data_types
        },
        isConfigured: true
      });
    } catch (error) {
      console.error('Upload failed:', error);
      updateNodeData(id, { isConfigured: false });
    }
  }, [id, updateNodeData, setSessionId]);

  return (
    <Card className="w-64 border-2 border-blue-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Database className="w-4 h-4" />
          Dataset
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileUpload}
          className="hidden"
          id={`file-${id}`}
        />
        <label htmlFor={`file-${id}`}>
          <Button variant="outline" className="w-full cursor-pointer" asChild>
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload File
            </div>
          </Button>
        </label>
        
        {data.config && (
          <div className="text-xs space-y-1">
            <div className="font-medium">{data.config.filename}</div>
            <div className="text-muted-foreground">
              {data.config.rowCount} rows, {data.config.columns.length} columns
            </div>
          </div>
        )}
      </CardContent>
      
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-500"
      />
    </Card>
  );
};