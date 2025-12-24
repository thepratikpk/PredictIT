import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from './Button';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { X, Save, Loader2, CheckCircle } from 'lucide-react';
import { usePipelineStore } from '../store/pipelineStore';

interface SaveProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (projectId: string) => void;
}

export const SaveProjectDialog: React.FC<SaveProjectDialogProps> = ({
  isOpen,
  onClose,
  onSaved
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  
  const { saveProject } = usePipelineStore();

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    setIsSaving(true);
    setUploadStatus('uploading');
    setError(null);

    try {
      console.log('💾 Saving project:', name);
      const projectId = await saveProject(name.trim(), description.trim());
      
      if (projectId) {
        console.log('✅ Project saved successfully:', projectId);
        setUploadStatus('success');
        toast.success(`Project "${name}" saved successfully!`);
        
        // Call onSaved immediately to refresh the list
        onSaved?.(projectId);
        
        setTimeout(() => {
          onClose();
          setName('');
          setDescription('');
          setUploadStatus('idle');
        }, 1500);
      } else {
        setUploadStatus('error');
        const errorMsg = 'Failed to save project. Please try again.';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('❌ Save project error:', error);
      setUploadStatus('error');
      const errorMsg = 'Failed to save project. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      onClose();
      setName('');
      setDescription('');
      setError(null);
      setUploadStatus('idle');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">Save Pipeline</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={isSaving}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="project-name" className="text-sm font-medium text-gray-700">
              Project Name *
            </label>
            <input
              id="project-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="project-description" className="text-sm font-medium text-gray-700">
              Description (Optional)
            </label>
            <textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your ML pipeline..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 resize-none"
              disabled={isSaving}
            />
          </div>

          {/* Upload Status */}
          {uploadStatus !== 'idle' && (
            <div className={`p-3 rounded-lg border ${
              uploadStatus === 'uploading' ? 'bg-blue-50 border-blue-200' :
              uploadStatus === 'success' ? 'bg-green-50 border-green-200' :
              'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                {uploadStatus === 'uploading' && (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-blue-800 text-sm">Uploading file to cloud storage...</span>
                  </>
                )}
                {uploadStatus === 'success' && (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-green-800 text-sm">Project saved successfully!</span>
                  </>
                )}
                {uploadStatus === 'error' && (
                  <>
                    <X className="w-4 h-4 text-red-600" />
                    <span className="text-red-800 text-sm">Upload failed</span>
                  </>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSaving}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !name.trim()}
              className="flex-1 bg-slate-900 hover:bg-slate-800"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Project
                </>
              )}
            </Button>
          </div>

          {/* Info text */}
          <div className="text-xs text-gray-500 text-center pt-2">
            Your dataset will be uploaded to secure cloud storage when saving
          </div>
        </CardContent>
      </Card>
    </div>
  );
};