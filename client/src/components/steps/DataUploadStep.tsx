import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import { Button } from '../Button';
import { Upload, AlertCircle, Check, ArrowRight, FileSpreadsheet, Database } from 'lucide-react';
import { uploadFile } from '../../api/mlApi';
import { usePipelineStore } from '../../store/pipelineStore';

interface DataUploadStepProps {
  onNext: () => void;
}

export const DataUploadStep: React.FC<DataUploadStepProps> = ({ onNext }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const { datasetInfo, setSessionId, setDatasetInfo, setFileInfo } = usePipelineStore();

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const response = await uploadFile(file);
      setSessionId(response.session_id);
      setFileInfo(null, file.name);

      setDatasetInfo({
        filename: file.name,
        columns: response.columns,
        rowCount: response.row_count,
        dataTypes: response.data_types,
        sampleData: response.sample_data,
        numericColumns: response.numeric_columns,
        categoricalColumns: response.categorical_columns
      });

      toast.success('File uploaded successfully');
    } catch (error: any) {
      let errorMessage = 'Failed to upload file';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      setUploadError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  }, [setSessionId, setDatasetInfo]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragActive(false);
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const input = document.createElement('input');
        input.type = 'file';
        input.files = files;
        handleFileUpload({ target: input } as React.ChangeEvent<HTMLInputElement>);
      } else {
        setUploadError('Please upload a CSV or Excel file');
      }
    }
  }, [handleFileUpload]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-md-primary-container flex items-center justify-center">
              <Database className="w-5 h-5 text-md-primary" />
            </div>
            Upload dataset
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AnimatePresence mode="wait">
            {!datasetInfo ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`
                  relative border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all cursor-pointer
                  ${isDragActive ? 'border-md-primary bg-md-primary-container' : 'border-md-outline hover:border-md-primary hover:bg-gray-50'}
                  ${isUploading ? 'pointer-events-none opacity-60' : ''}
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-md-surface-container flex items-center justify-center">
                  {isUploading ? (
                    <div className="w-5 h-5 border-2 border-md-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5 text-md-on-surface-variant" />
                  )}
                </div>

                <p className="font-medium text-md-on-surface mb-1">
                  {isUploading ? 'Uploading...' : 'Drop your file here'}
                </p>
                <p className="text-sm text-md-on-surface-variant mb-4">
                  or click to browse
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
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Choose file
                </Button>

                <p className="text-xs text-md-on-surface-variant mt-4">
                  Supports CSV and Excel files
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Success message */}
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-green-800">File uploaded</p>
                    <p className="text-sm text-green-700">{datasetInfo.filename}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 bg-md-surface-dim rounded-lg text-center">
                    <div className="text-2xl font-medium text-md-on-surface">{datasetInfo.rowCount.toLocaleString()}</div>
                    <div className="text-xs text-md-on-surface-variant mt-1">Rows</div>
                  </div>
                  <div className="p-4 bg-md-surface-dim rounded-lg text-center">
                    <div className="text-2xl font-medium text-md-on-surface">{datasetInfo.columns.length}</div>
                    <div className="text-xs text-md-on-surface-variant mt-1">Columns</div>
                  </div>
                  <div className="p-4 bg-md-surface-dim rounded-lg text-center">
                    <div className="text-2xl font-medium text-md-primary">{datasetInfo.numericColumns?.length || 0}</div>
                    <div className="text-xs text-md-on-surface-variant mt-1">Numeric</div>
                  </div>
                  <div className="p-4 bg-md-surface-dim rounded-lg text-center">
                    <div className="text-2xl font-medium text-orange-600">{datasetInfo.categoricalColumns?.length || 0}</div>
                    <div className="text-xs text-md-on-surface-variant mt-1">Categorical</div>
                  </div>
                </div>

                {/* Columns */}
                <div>
                  <h4 className="text-sm font-medium text-md-on-surface mb-2">Columns</h4>
                  <div className="flex flex-wrap gap-2">
                    {datasetInfo.columns.map((col: string) => (
                      <span key={col} className="px-3 py-1 bg-md-surface-container text-md-on-surface text-sm rounded-full">
                        {col}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Sample data */}
                <div>
                  <h4 className="text-sm font-medium text-md-on-surface mb-2">Sample data</h4>
                  <div className="overflow-x-auto rounded-lg border border-md-outline-variant">
                    <table className="min-w-full text-sm">
                      <thead className="bg-md-surface-dim">
                        <tr>
                          {datasetInfo.columns.map((col: string) => (
                            <th key={col} className="px-4 py-2.5 text-left font-medium text-md-on-surface-variant whitespace-nowrap">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-md-outline-variant">
                        {datasetInfo.sampleData.slice(0, 3).map((row: any, idx: number) => (
                          <tr key={idx}>
                            {datasetInfo.columns.map((col: string) => (
                              <td key={col} className="px-4 py-2.5 text-md-on-surface whitespace-nowrap">
                                {row[col]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {uploadError && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-700">{uploadError}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!datasetInfo}>
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};