import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Plus,
  User,
  LogOut,
  Trash2,
  Calendar,
  BarChart3,
  Database,
  Brain,
  ChevronLeft,
  ChevronRight,
  Search,
  Sparkles
} from 'lucide-react';
import { Button } from './Button';
import { DeletingAnimation } from './DeletingAnimation';
import { useAuthStore } from '../store/authStore';
import { usePipelineStore } from '../store/pipelineStore';
import { API_BASE_URL } from '../config/api';

interface SavedPipeline {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  dataset_info?: {
    columns: string[];
    row_count: number;
  };
  results?: {
    accuracy: number;
    model_type: string;
  };
}

interface ModernSidebarProps {
  onAuthClick: (mode: 'login' | 'register') => void;
  onNewPipeline: () => void;
  onLoadPipeline: (pipelineId: string) => void;
  onProjectSaved?: () => void;
  onSidebarToggle?: (isCollapsed: boolean) => void;
}

export const ModernSidebar = forwardRef<
  { refreshProjects: () => void },
  ModernSidebarProps
>(({ onAuthClick, onNewPipeline, onLoadPipeline, onProjectSaved, onSidebarToggle }, ref) => {
  const [savedPipelines, setSavedPipelines] = useState<SavedPipeline[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingPipelineName, setDeletingPipelineName] = useState('');

  const { user, isAuthenticated, logout, token } = useAuthStore();
  const { resetPipeline } = usePipelineStore();

  useEffect(() => {
    if (onSidebarToggle) {
      onSidebarToggle(isCollapsed);
    }
  }, [isCollapsed, onSidebarToggle]);

  const loadSavedPipelines = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const pipelines = await response.json();
        setSavedPipelines(pipelines);
      }
    } catch (error) {
      console.error('Failed to load pipelines:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && token) {
      loadSavedPipelines();
    }
  }, [isAuthenticated, token]);

  useImperativeHandle(ref, () => ({
    refreshProjects: loadSavedPipelines
  }));

  const handleDeletePipeline = async (pipelineId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const pipeline = savedPipelines.find(p => p.id === pipelineId);
    if (!token || !pipeline || !confirm('Delete this pipeline?')) return;

    setIsDeleting(true);
    setDeletingPipelineName(pipeline.name);

    try {
      const response = await fetch(`${API_BASE_URL}/projects/${pipelineId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setSavedPipelines(prev => prev.filter(p => p.id !== pipelineId));
        toast.success('Pipeline deleted');
      }
    } catch (error) {
      toast.error('Failed to delete');
    } finally {
      setIsDeleting(false);
      setDeletingPipelineName('');
    }
  };

  const handleNewPipeline = () => {
    setSelectedPipeline(null);
    resetPipeline();
    onNewPipeline();
  };

  const handleLoadPipeline = (pipelineId: string) => {
    setSelectedPipeline(pipelineId);
    onLoadPipeline(pipelineId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredPipelines = savedPipelines.filter(pipeline =>
    pipeline.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      className={`bg-white border-r border-md-outline-variant flex flex-col h-screen fixed left-0 top-0 z-40 ${isCollapsed ? 'w-16' : 'w-72'
        }`}
      initial={false}
      animate={{ width: isCollapsed ? 64 : 288 }}
      transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
    >
      {/* Header */}
      <div className="p-4 border-b border-md-outline-variant">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-md-primary rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-medium text-md-on-surface">PredictIT</span>
                <p className="text-xs text-md-on-surface-variant">ML Pipeline</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-md-on-surface-variant"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>

        <div className="mt-4">
          <Button
            onClick={handleNewPipeline}
            className={`w-full ${isCollapsed ? 'px-0' : ''}`}
          >
            <Plus className="w-4 h-4" />
            {!isCollapsed && <span className="ml-2">New Pipeline</span>}
          </Button>
        </div>
      </div>

      {/* Search */}
      {!isCollapsed && isAuthenticated && (
        <div className="p-4 border-b border-md-outline-variant">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-md-on-surface-variant" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-md-surface-dim border border-md-outline-variant rounded-full focus:outline-none focus:border-md-primary"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {!isAuthenticated ? (
          !isCollapsed && (
            <div className="text-center py-8">
              <div className="w-14 h-14 bg-md-surface-dim rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-7 h-7 text-md-on-surface-variant" />
              </div>
              <p className="font-medium text-md-on-surface mb-2">Sign in to save</p>
              <p className="text-sm text-md-on-surface-variant mb-6">Save and manage your pipelines</p>
              <div className="space-y-2">
                <Button onClick={() => onAuthClick('login')} className="w-full">
                  Sign In
                </Button>
                <Button variant="outline" onClick={() => onAuthClick('register')} className="w-full">
                  Sign Up
                </Button>
              </div>
            </div>
          )
        ) : (
          <>
            {!isCollapsed && (
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-md-on-surface-variant uppercase tracking-wider">
                  Saved Pipelines
                </span>
                {isLoading && (
                  <div className="w-4 h-4 border-2 border-md-primary border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            )}

            <AnimatePresence>
              {filteredPipelines.length === 0 && !isLoading ? (
                !isCollapsed && (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-md-surface-dim rounded-full flex items-center justify-center mx-auto mb-3">
                      <Database className="w-6 h-6 text-md-on-surface-variant" />
                    </div>
                    <p className="text-sm text-md-on-surface-variant">
                      {searchQuery ? 'No results' : 'No pipelines yet'}
                    </p>
                  </div>
                )
              ) : (
                <div className="space-y-1">
                  {filteredPipelines.map((pipeline) => (
                    <motion.div
                      key={pipeline.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`
                        group rounded-lg p-3 cursor-pointer transition-colors
                        ${selectedPipeline === pipeline.id
                          ? 'bg-md-primary-container'
                          : 'hover:bg-md-surface-dim'
                        }
                      `}
                      onClick={() => handleLoadPipeline(pipeline.id)}
                    >
                      {isCollapsed ? (
                        <div className="w-8 h-8 bg-md-primary rounded-lg flex items-center justify-center mx-auto">
                          <BarChart3 className="w-4 h-4 text-white" />
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-md-on-surface truncate text-sm">
                              {pipeline.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-md-on-surface-variant">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(pipeline.updated_at)}
                              </span>
                              {pipeline.results && (
                                <span className="flex items-center gap-1 text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                                  {(pipeline.results.accuracy * 100).toFixed(0)}%
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 text-md-on-surface-variant hover:text-red-500 -mr-1"
                            onClick={(e) => handleDeletePipeline(pipeline.id, e)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* User section */}
      {isAuthenticated && user && (
        <div className="p-4 border-t border-md-outline-variant">
          <div className="flex items-center justify-between">
            {isCollapsed ? (
              <div className="flex flex-col items-center gap-2 w-full">
                <div className="w-8 h-8 bg-md-primary rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <Button variant="ghost" size="icon" onClick={logout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-md-primary rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-md-on-surface truncate">{user.name}</p>
                    <p className="text-xs text-md-on-surface-variant truncate">{user.email}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={logout} className="text-md-on-surface-variant">
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      <DeletingAnimation isVisible={isDeleting} message={`Deleting "${deletingPipelineName}"...`} />
    </motion.div>
  );
});