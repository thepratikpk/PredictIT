import React, { useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Upload, AlertCircle, CheckCircle, Database, ArrowRight } from 'lucide-react';
import { uploadFile } from '../../api/mlApi';
import { usePipelineStore } from '../../store/pipelineStore';

interface DataUploadStepProps {
  onNext: () => void;
}

export const DataUploadStep: React.FC<DataUploadStepProps> = ({ onNext }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { datasetInfo, setSessionId, setDatasetInfo, setFileInfo } = usePipelineStore();

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const response = await uploadFile(file);
      setSessionId(response.session_id);
      
      // Store file information (no Cloudinary URL yet)
      setFileInfo(null, file.name);
      
      const info = {
        filename: file.name,
        columns: response.columns,
        rowCount: response.row_count,
        dataTypes: response.data_types,
        sampleData: response.sample_data,
        numericColumns: response.numeric_columns,
        categoricalColumns: response.categorical_columns
      };
      setDatasetInfo(info);
    } catch (error: any) {
      setUploadError(error.response?.data?.detail || 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  }, [setSessionId, setDatasetInfo]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        // Create a proper file input event
        const input = document.createElement('input');
        input.type = 'file';
        input.files = files;
        const event = { target: input } as React.ChangeEvent<HTMLInputElement>;
        handleFileUpload(event);
      } else {
        setUploadError('Please upload a CSV or Excel file');
      }
    }
  }, [handleFileUpload]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Upload Your Dataset
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!datasetInfo ? (
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {isUploading ? 'Uploading...' : 'Drop your file here or click to browse'}
              </h3>
              <p className="text-gray-500 mb-4">
                Supports CSV and Excel files (.csv, .xlsx, .xls)
              </p>
              <input
                id="file-upload"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isUploading}
              />
              <Button variant="outline" disabled={isUploading}>
                {isUploading ? 'Processing...' : 'Choose File'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">File uploaded successfully!</span>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">Dataset Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Filename:</span> {datasetInfo.filename}
                  </div>
                  <div>
                    <span className="font-medium">Rows:</span> {datasetInfo.rowCount}
                  </div>
                  <div>
                    <span className="font-medium">Columns:</span> {datasetInfo.columns.length}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Column Names:</h4>
                <div className="flex flex-wrap gap-2">
                  {datasetInfo.columns.map((col: string) => (
                    <span key={col} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {col}
                    </span>
                  ))}
                </div>
              </div>

              {/* Data Type Information */}
              {datasetInfo.numericColumns && datasetInfo.categoricalColumns && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Data Types:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium text-green-700 mb-2">
                        Numeric Columns ({datasetInfo.numericColumns.length})
                      </h5>
                      <div className="flex flex-wrap gap-1">
                        {datasetInfo.numericColumns.map((col: string) => (
                          <span key={col} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                            {col}
                          </span>
                        ))}
                      </div>
                      {datasetInfo.numericColumns.length === 0 && (
                        <p className="text-xs text-gray-500">No numeric columns found</p>
                      )}
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-orange-700 mb-2">
                        Text/Categorical Columns ({datasetInfo.categoricalColumns.length})
                      </h5>
                      <div className="flex flex-wrap gap-1">
                        {datasetInfo.categoricalColumns.map((col: string) => (
                          <span key={col} className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                            {col}
                          </span>
                        ))}
                      </div>
                      {datasetInfo.categoricalColumns.length === 0 && (
                        <p className="text-xs text-gray-500">No categorical columns found</p>
                      )}
                    </div>
                  </div>
                  {datasetInfo.categoricalColumns.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-yellow-800 text-sm">
                        <strong>Note:</strong> Only numeric columns can be used as features for machine learning. 
                        Categorical columns will be ignored during model training.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <h4 className="font-semibold">Sample Data:</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border border-gray-200 rounded">
                    <thead className="bg-gray-50">
                      <tr>
                        {datasetInfo.columns.map((col: string) => (
                          <th key={col} className="px-3 py-2 text-left font-medium text-gray-700 border-b">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {datasetInfo.sampleData.slice(0, 3).map((row: any, idx: number) => (
                        <tr key={idx} className="border-b">
                          {datasetInfo.columns.map((col: string) => (
                            <td key={col} className="px-3 py-2 text-gray-600">
                              {row[col]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {uploadError && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle className="w-5 h-5" />
              <span>{uploadError}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={onNext} 
          disabled={!datasetInfo}
          className="flex items-center gap-2"
        >
          Continue to Preprocessing
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};