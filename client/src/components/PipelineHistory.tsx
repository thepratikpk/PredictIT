import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  MessageSquare,
  User,
  LogOut,
  Settings,
  Trash2,
  Calendar,
  BarChart3,
  Database,
  Brain,
  ChevronLeft,
  ChevronRight,
  Search
} from 'lucide-react';
import { Button } from './Button';
import { Card, CardContent } from './Card';
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
  onSidebarToggle?: (isCollapsed: boolean) => void; // Add this prop
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

  const { user, isAuthenticated, logout, token } = useAuthStore();
  const { resetPipeline } = usePipelineStore();

  // Update body margin when sidebar collapses/expands
  React.useEffect(() => {
    // Notify parent component about sidebar state change
    if (onSidebarToggle) {
      onSidebarToggle(isCollapsed);
    }
  }, [isCollapsed, onSidebarToggle]);

  const loadSavedPipelines = async () => {
    if (!token) return;

    console.log('📡 Loading saved pipelines...');
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
        console.log('✅ Loaded pipelines:', pipelines.length);
        setSavedPipelines(pipelines);
      } else {
        console.error('❌ Failed to load pipelines:', response.status);
      }
    } catch (error) {
      console.error('❌ Failed to load pipelines:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && token) {
      loadSavedPipelines();
    }
  }, [isAuthenticated, token]);

  // Expose refresh function to parent
  useImperativeHandle(ref, () => ({
    refreshProjects: () => {
      console.log('🔄 Refresh projects called');
      loadSavedPipelines();
    }
  }));

  const handleDeletePipeline = async (pipelineId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!token || !confirm('Are you sure you want to delete this pipeline? This will also delete the associated files from cloud storage.')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/projects/${pipelineId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Project deleted:', result);
        setSavedPipelines(prev => prev.filter(p => p.id !== pipelineId));

        // Show success message if files were cleaned up
        if (result.cloudinary_deleted || result.temp_files_cleaned) {
          console.log('✅ Associated files cleaned up successfully');
        }
      }
    } catch (error) {
      console.error('Failed to delete pipeline:', error);
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

  // Refresh projects list
  const refreshProjectsList = async () => {
    if (isAuthenticated && token) {
      await loadSavedPipelines();
    }
  };

  // Expose refresh function to parent
  useImperativeHandle(ref, () => ({
    refreshProjects: refreshProjectsList
  }));

  // Call refresh when onProjectSaved is triggered
  useEffect(() => {
    if (onProjectSaved) {
      // This will be called from parent when project is saved
    }
  }, [onProjectSaved]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredPipelines = savedPipelines.filter(pipeline =>
    pipeline.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pipeline.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      className={`sidebar-gradient border-r border-slate-200/60 flex flex-col h-screen transition-smooth shadow-professional-lg fixed left-0 top-0 z-40 ${isCollapsed ? 'w-16' : 'w-80'
        }`}
      initial={false}
      animate={{ width: isCollapsed ? 64 : 320 }}
    >
      {/* Header */}
      <div className="p-6 border-b border-slate-200/60 glass-effect">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-slate-900 to-slate-700 rounded-xl flex items-center justify-center shadow-professional">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="font-bold text-slate-900 text-lg">PredictIT</span>
                <p className="text-xs text-slate-500 mt-0.5">AI-Powered Analytics</p>
              </div>
            </motion.div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-slate-500 hover:text-slate-700 hover:bg-slate-100/80 rounded-lg transition-smooth"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>

        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6"
          >
            <Button
              onClick={handleNewPipeline}
              className="w-full bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600 text-white shadow-professional hover:shadow-professional-lg transition-smooth rounded-xl py-3"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Pipeline
            </Button>
          </motion.div>
        )}

        {isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6"
          >
            <Button
              onClick={handleNewPipeline}
              size="sm"
              className="w-full bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600 text-white p-3 rounded-xl shadow-professional"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </div>

      {/* Search */}
      {!isCollapsed && isAuthenticated && (
        <div className="p-6 pt-4 border-b border-slate-200/60">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search pipelines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500/20 focus:border-slate-400 bg-slate-50/50 backdrop-blur-sm transition-all duration-200"
            />
          </div>
        </div>
      )}

      {/* Pipeline History */}
      <div className="flex-1 overflow-y-auto sidebar-scroll">
        {!isAuthenticated ? (
          !isCollapsed && (
            <div className="p-6">
              <Card className="border-slate-200/60 glass-effect shadow-professional">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <User className="w-8 h-8 text-slate-500" />
                  </div>
                  <h3 className="font-bold mb-3 text-slate-900 text-lg">Sign in to save pipelines</h3>
                  <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                    Create an account to save and manage your ML pipelines across sessions
                  </p>
                  <div className="space-y-3">
                    <Button
                      onClick={() => onAuthClick('login')}
                      className="w-full bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600 text-white rounded-xl py-3 shadow-professional transition-smooth"
                    >
                      Sign In
                    </Button>
                    <Button
                      onClick={() => onAuthClick('register')}
                      variant="outline"
                      className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl py-3 transition-smooth"
                    >
                      Sign Up
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        ) : (
          <div className="p-6">
            {!isCollapsed && (
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
                  Saved Pipelines
                </h2>
                {isLoading && (
                  <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                )}
              </div>
            )}

            <AnimatePresence>
              {filteredPipelines.length === 0 && !isLoading ? (
                !isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-medium">
                      {searchQuery ? 'No pipelines found' : 'No saved pipelines yet'}
                    </p>
                    {!searchQuery && (
                      <p className="text-slate-400 text-sm mt-2">
                        Create your first pipeline to get started
                      </p>
                    )}
                  </motion.div>
                )
              ) : (
                <div className="space-y-3">
                  {filteredPipelines.map((pipeline, index) => (
                    <motion.div
                      key={pipeline.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className={`group cursor-pointer rounded-xl p-4 transition-smooth ${selectedPipeline === pipeline.id
                        ? 'glass-effect border border-slate-300 shadow-professional scale-[1.02]'
                        : 'hover:bg-slate-50/80 border border-transparent hover:border-slate-200 hover:shadow-professional hover:scale-[1.01]'
                        }`}
                      onClick={() => handleLoadPipeline(pipeline.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          {isCollapsed ? (
                            <div className="w-10 h-10 bg-gradient-to-br from-slate-900 to-slate-700 rounded-xl flex items-center justify-center shadow-professional">
                              <BarChart3 className="w-5 h-5 text-white" />
                            </div>
                          ) : (
                            <>
                              <h3 className="font-semibold text-slate-900 truncate text-base mb-2">
                                {pipeline.name}
                              </h3>
                              <p className="text-sm text-slate-600 mb-3 line-clamp-2 leading-relaxed">
                                {pipeline.description || 'No description provided'}
                              </p>

                              <div className="flex items-center gap-4 text-xs text-slate-500">
                                <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-lg">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(pipeline.updated_at)}
                                </div>

                                {pipeline.dataset_info && (
                                  <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-lg">
                                    <Database className="w-3 h-3" />
                                    {pipeline.dataset_info.row_count} rows
                                  </div>
                                )}

                                {pipeline.results && (
                                  <div className="flex items-center gap-1.5 bg-green-100 text-green-700 px-2 py-1 rounded-lg">
                                    <BarChart3 className="w-3 h-3" />
                                    {(pipeline.results.accuracy * 100).toFixed(0)}%
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>

                        {!isCollapsed && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-smooth text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 h-auto rounded-lg"
                            onClick={(e) => handleDeletePipeline(pipeline.id, e)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* User Section */}
      {isAuthenticated && user && (
        <div className="p-6 border-t border-slate-200/60 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            {!isCollapsed ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-slate-900 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-sm font-bold text-white">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 h-auto rounded-lg"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={logout}
                    className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 h-auto rounded-lg"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-3 w-full">
                <div className="w-10 h-10 bg-gradient-to-br from-slate-900 to-slate-700 rounded-xl flex items-center justify-center mx-auto shadow-lg">
                  <span className="text-sm font-bold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 h-auto w-full rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
});