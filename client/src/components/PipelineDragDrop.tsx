import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Node,
    Edge,
    Handle,
    Position,
    NodeProps,
    useReactFlow,
    ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';
import {
    Upload,
    Settings,
    Scissors,
    Brain,
    BarChart3,
    Play,
    X,
    Check,
    ArrowLeft,
    Save,
    Trash2,
    GripVertical,
    Sparkles,
    CheckCircle,
    Loader2,
    Table,
    AlertTriangle,
    ChevronDown,
    ChevronRight,
    // New block icons
    Hash,
    Scale,
    RefreshCcw,
    TrendingUp,
    Users,
    Percent,
    CircleDot,
    Zap,
    SlidersHorizontal,
    Download,
    Wand2,
    HelpCircle,
    Search as SearchChart,
} from 'lucide-react';
import { usePipelineStore } from '../store/pipelineStore';
import { useAuthStore } from '../store/authStore';
import { SaveProjectDialog } from './SaveProjectDialog';
import { gsap } from 'gsap';
import { buildGraphFromTemplate } from '../utils/layoutUtils';
import { API_BASE_URL } from '../config/api';
import {
    uploadFile, preprocessData, trainModel,
    cleanData, encodeCategories, exploreData,
    balanceClasses, crossValidate, tuneModel,
    exportModel, predictNewData,
} from '../api/mlApi';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { BlockTooltip } from './BlockTooltip';
import toast from 'react-hot-toast';

// Custom node data types
interface NodeData {
    status?: 'complete' | 'error';
    filename?: string;
    columns?: string[];
    numericColumns?: string[];
    scaler?: string;
    ratio?: number;
    modelType?: string;
    targetColumn?: string;
    features?: string[];
    accuracy?: number;
    confusionMatrix?: number[][];
    precision?: number;
    recall?: number;
    f1Score?: number;
    classLabels?: string[];
    trainSize?: number;
    testSize?: number;
    featureCount?: number;
    sampleData?: any[];
    rowCount?: number;
    // New block fields
    cleanStrategy?: string;
    dropDuplicates?: boolean;
    encodeMethod?: string;
    encodeColumns?: string[];
    balanceMethod?: string;
    balanceTarget?: string;
    cvFolds?: number;
    cvScores?: number[];
    cvMean?: number;
    tuneSearchType?: string;
    tuneBestParams?: Record<string, any>;
    tuneBestScore?: number;
    edaData?: any;
    taskType?: string;
    rmse?: number;
    mae?: number;
    r2?: number;
    silhouette?: number;
    [key: string]: unknown;
}

// ============================================================
// Core Toolbox items (existing 5 — DO NOT CHANGE)
// ============================================================
const coreToolboxItems = [
    { type: 'dataNode', label: 'Data Upload', icon: Upload, color: '#1A73E8', description: 'Upload CSV/Excel', required: true },
    { type: 'preprocessNode', label: 'Preprocess', icon: Settings, color: '#7C3AED', description: 'Scale features (optional)' },
    { type: 'splitNode', label: 'Train-Test Split', icon: Scissors, color: '#EC4899', description: 'Split data (optional)' },
    { type: 'modelNode', label: 'ML Model', icon: Brain, color: '#F59E0B', description: 'Train model', required: true },
    { type: 'resultsNode', label: 'Results', icon: BarChart3, color: '#10B981', description: 'View results' },
];

// ============================================================
// Advanced Toolbox items (13 new blocks)
// ============================================================
const advancedToolboxItems = {
    'Data Prep': [
        { type: 'cleanNode', label: 'Clean Data', icon: Sparkles, color: '#06B6D4', description: 'Fill/drop missing, remove dupes' },
        { type: 'encodeNode', label: 'Encode Categories', icon: Hash, color: '#8B5CF6', description: 'Text → numbers' },
        { type: 'edaNode', label: 'Explore Data', icon: SearchChart, color: '#0EA5E9', description: 'Stats, correlations, balance' },
    ],
    'Balancing & Validation': [
        { type: 'balanceNode', label: 'Balance Classes', icon: Scale, color: '#F97316', description: 'SMOTE oversampling' },
        { type: 'crossValNode', label: 'Cross-Validation', icon: RefreshCcw, color: '#14B8A6', description: 'Multi-fold testing' },
    ],
    'Tuning & Deployment': [
        { type: 'tuneNode', label: 'Tune Model', icon: SlidersHorizontal, color: '#A855F7', description: 'Auto hyperparameter search' },
        { type: 'exportNode', label: 'Export Model', icon: Download, color: '#6366F1', description: 'Download .joblib' },
        { type: 'predictNewNode', label: 'Predict New Data', icon: Wand2, color: '#D946EF', description: 'Upload CSV for predictions' },
    ],
};

// All model choices for the model config panel
const allModelChoices = [
    { value: 'LogisticRegression', label: 'Logistic Regression', category: 'classification' },
    { value: 'DecisionTree', label: 'Decision Tree', category: 'classification' },
    { value: 'RandomForest', label: 'Random Forest', category: 'classification' },
    { value: 'SVM', label: 'SVM', category: 'classification' },
    { value: 'KNeighborsClassifier', label: 'K-Nearest Neighbors', category: 'classification' },
    { value: 'GaussianNB', label: 'Naive Bayes', category: 'classification' },
    { value: 'GradientBoosting', label: 'Gradient Boosting', category: 'classification' },
    { value: 'LinearRegression', label: 'Linear Regression', category: 'regression' },
    { value: 'GradientBoostingRegressor', label: 'Gradient Boost (Regressor)', category: 'regression' },
    { value: 'KMeans', label: 'K-Means Clustering', category: 'clustering' },
];

// ============================================================
// Custom Node Components (existing 5 — unchanged)
// ============================================================

function DataNode({ data, selected }: NodeProps<Node<NodeData>>) {
    return (
        <div className={`pipeline-node ${selected ? 'selected' : ''} ${data.status === 'complete' ? 'completed' : ''}`}>
            {data.requiresInput && data.status !== 'complete' && (
                <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-sm border-2 border-white z-10" title="Requires file upload">
                    <AlertTriangle className="w-3 h-3 text-white" />
                </div>
            )}
            <Handle type="source" position={Position.Right} />
            <div className="pipeline-node-icon" style={{ backgroundColor: '#E8F0FE' }}>
                <Upload className="w-5 h-5" style={{ color: '#1A73E8' }} />
            </div>
            <div className="font-medium text-sm">Data Upload</div>
            {data.status === 'complete' && data.filename && (
                <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <Check className="w-3 h-3" /> {data.rowCount} rows
                </div>
            )}
        </div>
    );
}

function PreprocessNode({ data, selected }: NodeProps<Node<NodeData>>) {
    return (
        <div className={`pipeline-node ${selected ? 'selected' : ''} ${data.status === 'complete' ? 'completed' : ''}`}>
            <Handle type="target" position={Position.Left} />
            <Handle type="source" position={Position.Right} />
            <div className="pipeline-node-icon" style={{ backgroundColor: '#EDE9FE' }}>
                <Settings className="w-5 h-5" style={{ color: '#7C3AED' }} />
            </div>
            <div className="font-medium text-sm">Preprocess</div>
            {data.scaler && (
                <div className="text-xs text-purple-600 mt-1">{data.scaler === 'none' ? 'Skipped' : data.scaler}</div>
            )}
        </div>
    );
}

function SplitNode({ data, selected }: NodeProps<Node<NodeData>>) {
    const ratio = data.ratio || 0.2;
    return (
        <div className={`pipeline-node ${selected ? 'selected' : ''} ${data.status === 'complete' ? 'completed' : ''}`}>
            <Handle type="target" position={Position.Left} />
            <Handle type="source" position={Position.Right} />
            <div className="pipeline-node-icon" style={{ backgroundColor: '#FCE7F3' }}>
                <Scissors className="w-5 h-5" style={{ color: '#EC4899' }} />
            </div>
            <div className="font-medium text-sm">Train-Test Split</div>
            {data.status === 'complete' && (
                <div className="text-xs text-pink-600 mt-1">{Math.round((1 - ratio) * 100)}/{Math.round(ratio * 100)}</div>
            )}
        </div>
    );
}

function ModelNode({ data, selected }: NodeProps<Node<NodeData>>) {
    const modelLabel = allModelChoices.find(m => m.value === data.modelType)?.label || data.modelType;
    return (
        <div className={`pipeline-node ${selected ? 'selected' : ''} ${data.status === 'complete' ? 'completed' : ''}`}>
            {data.requiresInput && data.status !== 'complete' && (
                <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-sm border-2 border-white z-10" title="Requires configuration">
                    <AlertTriangle className="w-3 h-3 text-white" />
                </div>
            )}
            <Handle type="target" position={Position.Left} />
            <Handle type="source" position={Position.Right} />
            <div className="pipeline-node-icon" style={{ backgroundColor: '#FEF3C7' }}>
                <Brain className="w-5 h-5" style={{ color: '#F59E0B' }} />
            </div>
            <div className="font-medium text-sm">ML Model</div>
            {data.modelType && (
                <div className="text-xs text-amber-600 mt-1">{modelLabel}</div>
            )}
        </div>
    );
}

function ResultsNode({ data, selected }: NodeProps<Node<NodeData>>) {
    return (
        <div className={`pipeline-node ${selected ? 'selected' : ''} ${data.status === 'complete' ? 'completed' : ''}`}>
            <Handle type="target" position={Position.Left} />
            <div className="pipeline-node-icon" style={{ backgroundColor: '#D1FAE5' }}>
                <BarChart3 className="w-5 h-5" style={{ color: '#10B981' }} />
            </div>
            <div className="font-medium text-sm">Results</div>
            {data.accuracy !== undefined && (
                <div className="text-xs text-green-600 mt-1 font-semibold">{(data.accuracy * 100).toFixed(1)}%</div>
            )}
        </div>
    );
}

// ============================================================
// New Node Components (13 new blocks)
// ============================================================

function makeSimpleNode(label: string, IconComp: any, iconColor: string, iconBg: string, statusField?: string) {
    return function SimpleNode({ data, selected }: NodeProps<Node<NodeData>>) {
        return (
            <div className={`pipeline-node ${selected ? 'selected' : ''} ${data.status === 'complete' ? 'completed' : ''}`}>
                {data.requiresInput && data.status !== 'complete' && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-sm border-2 border-white z-10" title="Requires configuration">
                        <AlertTriangle className="w-3 h-3 text-white" />
                    </div>
                )}
                <Handle type="target" position={Position.Left} />
                <Handle type="source" position={Position.Right} />
                <div className="pipeline-node-icon" style={{ backgroundColor: iconBg }}>
                    <IconComp className="w-5 h-5" style={{ color: iconColor }} />
                </div>
                <div className="font-medium text-sm">{label}</div>
                {data.status === 'complete' && statusField && (data as any)[statusField] && (
                    <div className="text-xs mt-1" style={{ color: iconColor }}>{String((data as any)[statusField])}</div>
                )}
                {data.status === 'complete' && !statusField && (
                    <div className="text-xs text-green-600 mt-1 flex items-center gap-1"><Check className="w-3 h-3" /> Done</div>
                )}
            </div>
        );
    };
}

const CleanNode = makeSimpleNode('Clean Data', Sparkles, '#06B6D4', '#CFFAFE', 'cleanStrategy');
const EncodeNode = makeSimpleNode('Encode Categories', Hash, '#8B5CF6', '#EDE9FE', 'encodeMethod');
const EDANode = makeSimpleNode('Explore Data', SearchChart, '#0EA5E9', '#E0F2FE');
const BalanceNode = makeSimpleNode('Balance Classes', Scale, '#F97316', '#FFF7ED', 'balanceMethod');
const CrossValNode = makeSimpleNode('Cross-Validation', RefreshCcw, '#14B8A6', '#CCFBF1');
const TuneNode = makeSimpleNode('Tune Model', SlidersHorizontal, '#A855F7', '#F3E8FF');
const ExportNode = makeSimpleNode('Export Model', Download, '#6366F1', '#EEF2FF');
const PredictNewNode = makeSimpleNode('Predict New Data', Wand2, '#D946EF', '#FDF4FF');

// Node types registry (existing + new)
const nodeTypes = {
    dataNode: DataNode,
    preprocessNode: PreprocessNode,
    splitNode: SplitNode,
    modelNode: ModelNode,
    resultsNode: ResultsNode,
    cleanNode: CleanNode,
    encodeNode: EncodeNode,
    edaNode: EDANode,
    balanceNode: BalanceNode,
    crossValNode: CrossValNode,
    tuneNode: TuneNode,
    exportNode: ExportNode,
    predictNewNode: PredictNewNode,
};

// ============================================================
// Toolbox item component (unchanged)
// ============================================================

// Helper to map node type to docs slug
const nodeTypeToSlug = (type: string): string => {
    switch(type) {
        case 'dataNode': return 'block-data-upload';
        case 'preprocessNode': return 'block-preprocess';
        case 'splitNode': return 'block-split';
        case 'modelNode': return 'block-model';
        case 'resultsNode': return 'block-results';
        case 'cleanNode': return 'block-clean-data';
        case 'encodeNode': return 'block-encode';
        case 'edaNode': return 'block-explore-data';
        case 'balanceNode': return 'block-balance-classes';
        case 'crossValNode': return 'block-cross-validation';
        case 'tuneNode': return 'block-tune-model';
        case 'exportNode': return 'block-export-model';
        case 'predictNewNode': return 'block-predict-new-data';
        default: return 'getting-started';
    }
};

function ToolboxItem({ item, onDragStart, onOpenDocs }: { item: typeof coreToolboxItems[0]; onDragStart: (e: React.DragEvent, type: string) => void; onOpenDocs?: (slug: string) => void }) {
    const Icon = item.icon;
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, item.type)}
            className="flex items-center gap-3 p-3 bg-white rounded-xl border border-md-outline-variant cursor-grab hover:border-md-primary hover:shadow-md-1 transition-all active:cursor-grabbing"
        >
            <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${item.color}15` }}
            >
                <Icon className="w-5 h-5" style={{ color: item.color }} />
            </div>
            <div className="flex-1">
                <div className="font-medium text-sm text-md-on-surface flex items-center">
                    {item.label}
                    {onOpenDocs && (
                        <BlockTooltip
                            title={item.label}
                            description={`Click for detailed docs on ${item.label}`}
                            onClickHelp={() => onOpenDocs(nodeTypeToSlug(item.type))}
                        />
                    )}
                </div>
                <div className="text-xs text-md-on-surface-variant">{item.description}</div>
            </div>
            <GripVertical className="w-4 h-4 text-md-on-surface-variant" />
        </div>
    );
}

// Data Preview Component (unchanged)
function DataPreview({ data }: { data: NodeData }) {
    if (!data.sampleData || !data.columns) return null;

    return (
        <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
                <Table className="w-4 h-4 text-md-on-surface-variant" />
                <span className="text-sm font-medium text-md-on-surface">Data Preview</span>
            </div>
            <div className="overflow-x-auto rounded-lg border border-md-outline-variant">
                <table className="min-w-full text-xs">
                    <thead className="bg-md-surface-dim">
                        <tr>
                            {data.columns.slice(0, 5).map((col) => (
                                <th key={col} className="px-3 py-2 text-left font-medium text-md-on-surface-variant whitespace-nowrap">
                                    {col}
                                </th>
                            ))}
                            {data.columns.length > 5 && (
                                <th className="px-3 py-2 text-left text-md-on-surface-variant">+{data.columns.length - 5} more</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-md-outline-variant">
                        {data.sampleData.slice(0, 3).map((row, idx) => (
                            <tr key={idx}>
                                {data.columns!.slice(0, 5).map((col) => (
                                    <td key={col} className="px-3 py-2 text-md-on-surface whitespace-nowrap">
                                        {String(row[col]).substring(0, 15)}
                                    </td>
                                ))}
                                {data.columns!.length > 5 && <td className="px-3 py-2 text-md-on-surface-variant">...</td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">{data.rowCount} rows</span>
                <span className="px-2 py-1 bg-green-50 text-green-700 rounded">{data.numericColumns?.length || 0} numeric</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">{data.columns.length} columns</span>
            </div>
        </div>
    );
}

// ============================================================
// Configuration Panel (extended with new block configs)
// ============================================================

function ConfigPanel({
    selectedNode,
    nodes,
    updateNodeData,
    onClose,
}: {
    selectedNode: string | null;
    nodes: Node<NodeData>[];
    updateNodeData: (nodeId: string, data: Partial<NodeData>) => void;
    onClose: () => void;
}) {
    const node = nodes.find((n) => n.id === selectedNode);
    const { setSessionId, datasetInfo, setDatasetInfo, setFileInfo } = usePipelineStore();
    const [isUploading, setIsUploading] = useState(false);

    if (!node) {
        return (
            <div className="p-6 text-center text-md-on-surface-variant">
                <p>Select a node to configure</p>
            </div>
        );
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
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
                categoricalColumns: response.categorical_columns,
            });
            updateNodeData(node.id, {
                status: 'complete',
                filename: file.name,
                columns: response.columns,
                numericColumns: response.numeric_columns,
                sampleData: response.sample_data,
                rowCount: response.row_count,
            });
            toast.success('File uploaded!');
        } catch (error: any) {
            toast.error(error.message || 'Upload failed');
            updateNodeData(node.id, { status: 'error' });
        } finally {
            setIsUploading(false);
        }
    };

    const renderConfig = () => {
        switch (node.type) {
            case 'dataNode':
                return (
                    <div className="space-y-4">
                        <h3 className="font-medium text-md-on-surface">Upload Dataset</h3>
                        <div
                            className="border-2 border-dashed border-md-outline rounded-xl p-6 text-center hover:border-md-primary transition-colors cursor-pointer"
                            onClick={() => document.getElementById('file-input')?.click()}
                        >
                            {isUploading ? (
                                <Loader2 className="w-8 h-8 mx-auto mb-2 text-md-primary animate-spin" />
                            ) : (
                                <Upload className="w-8 h-8 mx-auto mb-2 text-md-on-surface-variant" />
                            )}
                            <p className="text-sm text-md-on-surface-variant">
                                {isUploading ? 'Uploading...' : 'Click to upload CSV/Excel'}
                            </p>
                            <input id="file-input" type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} className="hidden" />
                        </div>
                        {node.data.filename && (
                            <>
                                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="text-sm text-green-700">{node.data.filename}</span>
                                </div>
                                <DataPreview data={node.data} />
                            </>
                        )}
                    </div>
                );

            case 'preprocessNode':
                return (
                    <div className="space-y-4">
                        <h3 className="font-medium text-md-on-surface">Preprocessing (Optional)</h3>
                        <p className="text-xs text-md-on-surface-variant">
                            Scaling helps ML models converge faster. Skip if your data is already normalized.
                        </p>
                        <div className="space-y-2">
                            {['StandardScaler', 'MinMaxScaler', 'none'].map((scaler) => (
                                <label
                                    key={scaler}
                                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${node.data.scaler === scaler
                                        ? 'border-md-primary bg-md-primary-container'
                                        : 'border-md-outline-variant hover:border-md-outline'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="scaler"
                                        value={scaler}
                                        checked={node.data.scaler === scaler}
                                        onChange={() => updateNodeData(node.id, { scaler, status: 'complete' })}
                                        className="sr-only"
                                    />
                                    <div
                                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${node.data.scaler === scaler ? 'border-md-primary bg-md-primary' : 'border-md-outline'
                                            }`}
                                    >
                                        {node.data.scaler === scaler && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium">{scaler === 'none' ? 'Skip scaling' : scaler}</span>
                                        <p className="text-xs text-md-on-surface-variant">
                                            {scaler === 'StandardScaler' && 'Zero mean, unit variance'}
                                            {scaler === 'MinMaxScaler' && 'Scale to [0, 1] range'}
                                            {scaler === 'none' && 'Use raw data'}
                                        </p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                );

            case 'splitNode': {
                const ratioValue = node.data.ratio ?? 0.2;
                return (
                    <div className="space-y-4">
                        <h3 className="font-medium text-md-on-surface">Train-Test Split (Optional)</h3>
                        <p className="text-xs text-md-on-surface-variant">
                            Split data to evaluate model. Default is 80/20 if skipped.
                        </p>
                        <div className="flex gap-2">
                            {[0.2, 0.3, 0.1].map((ratio) => (
                                <button
                                    key={ratio}
                                    onClick={() => updateNodeData(node.id, { ratio, status: 'complete' })}
                                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${ratioValue === ratio
                                        ? 'bg-md-primary text-white'
                                        : 'bg-md-surface-dim text-md-on-surface hover:bg-md-surface-container'
                                        }`}
                                >
                                    {Math.round((1 - ratio) * 100)}/{Math.round(ratio * 100)}
                                </button>
                            ))}
                        </div>
                        <div>
                            <label className="text-sm text-md-on-surface-variant">Custom: {Math.round(ratioValue * 100)}% test</label>
                            <input
                                type="range"
                                min="0.1"
                                max="0.4"
                                step="0.05"
                                value={ratioValue}
                                onChange={(e) => updateNodeData(node.id, { ratio: parseFloat(e.target.value), status: 'complete' })}
                                className="w-full mt-2"
                            />
                        </div>
                    </div>
                );
            }

            case 'modelNode': {
                const columns = datasetInfo?.numericColumns || node.data.numericColumns || [];
                const allColumns = datasetInfo?.columns || node.data.columns || [];
                const features = node.data.features || [];
                const selectedModel = allModelChoices.find(m => m.value === node.data.modelType);
                const isKMeans = node.data.modelType === 'KMeans';
                return (
                    <div className="space-y-4">
                        <h3 className="font-medium text-md-on-surface">Model Configuration</h3>

                        <div>
                            <label className="text-sm text-md-on-surface-variant block mb-2">Algorithm</label>
                            <div className="space-y-1">
                                {['Classification', 'Regression', 'Clustering'].map(cat => {
                                    const models = allModelChoices.filter(m => m.category === cat.toLowerCase());
                                    return (
                                        <div key={cat}>
                                            <div className="text-xs font-medium text-md-on-surface-variant uppercase tracking-wider py-1">{cat}</div>
                                            <div className="grid grid-cols-2 gap-1">
                                                {models.map((model) => (
                                                    <button
                                                        key={model.value}
                                                        onClick={() => updateNodeData(node.id, { modelType: model.value })}
                                                        className={`p-2 rounded-lg text-xs font-medium transition-all ${node.data.modelType === model.value
                                                            ? 'bg-md-primary text-white'
                                                            : 'bg-md-surface-dim text-md-on-surface hover:bg-md-surface-container border border-md-outline-variant'
                                                            }`}
                                                    >
                                                        {model.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {!isKMeans && (
                            <div>
                                <label className="text-sm text-md-on-surface-variant block mb-2">Target Column (what to predict)</label>
                                <select
                                    value={node.data.targetColumn || ''}
                                    onChange={(e) => {
                                        updateNodeData(node.id, { targetColumn: e.target.value, features: [] });
                                    }}
                                    className="w-full p-3 border border-md-outline rounded-lg text-sm"
                                >
                                    <option value="">Select target...</option>
                                    {allColumns.map((col: string) => (
                                        <option key={col} value={col}>
                                            {col}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {isKMeans && (
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <p className="text-xs text-blue-700">K-Means is unsupervised — no target column needed. All numeric features will be used for clustering.</p>
                            </div>
                        )}

                        {(node.data.targetColumn || isKMeans) && (
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm text-md-on-surface-variant">Features (inputs)</label>
                                    <button
                                        className="text-xs text-md-primary hover:underline"
                                        onClick={() => {
                                            const availableFeatures = columns.filter((c: string) => c !== node.data.targetColumn);
                                            updateNodeData(node.id, { features: availableFeatures, status: 'complete' });
                                        }}
                                    >
                                        Select all
                                    </button>
                                </div>
                                <div className="max-h-40 overflow-y-auto space-y-1 border border-md-outline-variant rounded-lg p-2">
                                    {columns
                                        .filter((c: string) => c !== node.data.targetColumn)
                                        .map((col: string) => (
                                            <label
                                                key={col}
                                                className="flex items-center gap-2 p-2 hover:bg-md-surface-dim rounded-lg cursor-pointer"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={features.includes(col)}
                                                    onChange={(e) => {
                                                        const newFeatures = e.target.checked
                                                            ? [...features, col]
                                                            : features.filter((f: string) => f !== col);
                                                        updateNodeData(node.id, {
                                                            features: newFeatures,
                                                            status: newFeatures.length > 0 ? 'complete' : undefined,
                                                        });
                                                    }}
                                                    className="rounded"
                                                />
                                                <span className="text-sm">{col}</span>
                                            </label>
                                        ))}
                                </div>
                                {features.length > 0 && (
                                    <p className="text-xs text-green-600 mt-2">✓ {features.length} features selected</p>
                                )}
                            </div>
                        )}

                        {columns.length === 0 && (
                            <div className="p-3 bg-amber-50 rounded-lg flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-700">Upload data first to see available columns</p>
                            </div>
                        )}
                    </div>
                );
            }

            case 'resultsNode':
                return (
                    <div className="space-y-4">
                        <h3 className="font-medium text-md-on-surface">Results</h3>
                        {node.data.accuracy !== undefined ? (
                            <div className="text-center p-6 bg-green-50 rounded-xl">
                                <div className="text-4xl font-bold text-green-600 mb-2">{(node.data.accuracy * 100).toFixed(1)}%</div>
                                <div className="text-sm text-green-700">
                                    {node.data.taskType === 'regression' ? 'R² Score' : node.data.taskType === 'clustering' ? 'Silhouette Score' : 'Model Accuracy'}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center p-6 bg-md-surface-dim rounded-xl">
                                <BarChart3 className="w-8 h-8 mx-auto mb-2 text-md-on-surface-variant" />
                                <p className="text-sm text-md-on-surface-variant">Run the pipeline to see results</p>
                            </div>
                        )}
                    </div>
                );

            // ====== NEW BLOCK CONFIGS ======

            case 'cleanNode':
                return (
                    <div className="space-y-4">
                        <h3 className="font-medium text-md-on-surface">Clean Data</h3>
                        <p className="text-xs text-md-on-surface-variant">Handle missing values and remove duplicates.</p>
                        <div className="space-y-2">
                            {[
                                { value: 'mean', label: 'Fill with Mean', desc: 'Replace missing numbers with average' },
                                { value: 'median', label: 'Fill with Median', desc: 'More robust to outliers' },
                                { value: 'most_frequent', label: 'Most Frequent', desc: 'Good for categorical data' },
                                { value: 'drop_na', label: 'Drop Missing Rows', desc: 'Remove rows with any missing value' },
                            ].map(opt => (
                                <label key={opt.value} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${node.data.cleanStrategy === opt.value ? 'border-md-primary bg-md-primary-container' : 'border-md-outline-variant hover:border-md-outline'}`}>
                                    <input type="radio" name="cleanStrategy" value={opt.value} checked={node.data.cleanStrategy === opt.value} onChange={() => updateNodeData(node.id, { cleanStrategy: opt.value, status: 'complete' })} className="sr-only" />
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${node.data.cleanStrategy === opt.value ? 'border-md-primary bg-md-primary' : 'border-md-outline'}`}>
                                        {node.data.cleanStrategy === opt.value && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium">{opt.label}</span>
                                        <p className="text-xs text-md-on-surface-variant">{opt.desc}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={node.data.dropDuplicates !== false} onChange={(e) => updateNodeData(node.id, { dropDuplicates: e.target.checked })} className="rounded" />
                            <span className="text-sm">Remove duplicate rows</span>
                        </label>
                    </div>
                );

            case 'encodeNode':
                return (
                    <div className="space-y-4">
                        <h3 className="font-medium text-md-on-surface">Encode Categories</h3>
                        <p className="text-xs text-md-on-surface-variant">Convert text columns to numbers that ML models can use.</p>
                        <div className="space-y-2">
                            {[
                                { value: 'onehot', label: 'One-Hot Encoding', desc: 'Creates a column per category (recommended)' },
                                { value: 'label', label: 'Label Encoding', desc: 'Assigns each category a number' },
                            ].map(opt => (
                                <label key={opt.value} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${node.data.encodeMethod === opt.value ? 'border-md-primary bg-md-primary-container' : 'border-md-outline-variant hover:border-md-outline'}`}>
                                    <input type="radio" name="encodeMethod" value={opt.value} checked={node.data.encodeMethod === opt.value} onChange={() => updateNodeData(node.id, { encodeMethod: opt.value, status: 'complete' })} className="sr-only" />
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${node.data.encodeMethod === opt.value ? 'border-md-primary bg-md-primary' : 'border-md-outline'}`}>
                                        {node.data.encodeMethod === opt.value && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium">{opt.label}</span>
                                        <p className="text-xs text-md-on-surface-variant">{opt.desc}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                );

            case 'edaNode':
                return (
                    <div className="space-y-4">
                        <h3 className="font-medium text-md-on-surface">Explore Data (EDA)</h3>
                        <p className="text-xs text-md-on-surface-variant">Get a quick preview of your data — statistics, correlations, and class distribution.</p>
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <p className="text-xs text-blue-700">This block runs automatically when the pipeline executes. No configuration needed.</p>
                        </div>
                        {node.data.edaData && (
                            <div className="space-y-2 text-xs">
                                <p><strong>Rows:</strong> {node.data.edaData.row_count}</p>
                                <p><strong>Columns:</strong> {node.data.edaData.column_count}</p>
                                <p><strong>Numeric:</strong> {node.data.edaData.numeric_columns?.length || 0}</p>
                                <p><strong>Categorical:</strong> {node.data.edaData.categorical_columns?.length || 0}</p>
                            </div>
                        )}
                        <button onClick={() => updateNodeData(node.id, { status: 'complete' })} className="w-full py-2 bg-md-primary text-white rounded-lg text-sm font-medium">
                            Mark Ready
                        </button>
                    </div>
                );

            case 'balanceNode': {
                const allCols = datasetInfo?.columns || node.data.columns || [];
                return (
                    <div className="space-y-4">
                        <h3 className="font-medium text-md-on-surface">Balance Classes</h3>
                        <p className="text-xs text-md-on-surface-variant">Use SMOTE to create synthetic examples of rare classes so the model doesn't ignore them.</p>
                        <div>
                            <label className="text-sm text-md-on-surface-variant block mb-2">Target Column</label>
                            <select value={node.data.balanceTarget || ''} onChange={(e) => updateNodeData(node.id, { balanceTarget: e.target.value, balanceMethod: 'smote', status: e.target.value ? 'complete' : undefined })} className="w-full p-3 border border-md-outline rounded-lg text-sm">
                                <option value="">Select target...</option>
                                {allCols.map((col: string) => <option key={col} value={col}>{col}</option>)}
                            </select>
                        </div>
                    </div>
                );
            }

            case 'crossValNode':
                return (
                    <div className="space-y-4">
                        <h3 className="font-medium text-md-on-surface">Cross-Validation</h3>
                        <p className="text-xs text-md-on-surface-variant">Test model on multiple data slices for a trustworthy accuracy estimate.</p>
                        <div>
                            <label className="text-sm text-md-on-surface-variant block mb-2">Number of Folds</label>
                            <div className="flex gap-2">
                                {[3, 5, 10].map(folds => (
                                    <button key={folds} onClick={() => updateNodeData(node.id, { cvFolds: folds, status: 'complete' })} className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${(node.data.cvFolds || 5) === folds ? 'bg-md-primary text-white' : 'bg-md-surface-dim text-md-on-surface hover:bg-md-surface-container'}`}>
                                        {folds}-fold
                                    </button>
                                ))}
                            </div>
                        </div>
                        {node.data.cvMean !== undefined && (
                            <div className="p-3 bg-green-50 rounded-lg text-xs text-green-700">
                                Mean Score: {(node.data.cvMean * 100).toFixed(1)}%
                            </div>
                        )}
                    </div>
                );

            case 'tuneNode':
                return (
                    <div className="space-y-4">
                        <h3 className="font-medium text-md-on-surface">Tune Model</h3>
                        <p className="text-xs text-md-on-surface-variant">Automatically search for the best hyperparameters.</p>
                        <div className="space-y-2">
                            {[
                                { value: 'random', label: 'Random Search', desc: 'Faster, samples random combinations' },
                                { value: 'grid', label: 'Grid Search', desc: 'Exhaustive, tries all combinations' },
                            ].map(opt => (
                                <label key={opt.value} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${(node.data.tuneSearchType || 'random') === opt.value ? 'border-md-primary bg-md-primary-container' : 'border-md-outline-variant hover:border-md-outline'}`}>
                                    <input type="radio" name="tuneSearch" value={opt.value} checked={(node.data.tuneSearchType || 'random') === opt.value} onChange={() => updateNodeData(node.id, { tuneSearchType: opt.value, status: 'complete' })} className="sr-only" />
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${(node.data.tuneSearchType || 'random') === opt.value ? 'border-md-primary bg-md-primary' : 'border-md-outline'}`}>
                                        {(node.data.tuneSearchType || 'random') === opt.value && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium">{opt.label}</span>
                                        <p className="text-xs text-md-on-surface-variant">{opt.desc}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                        {node.data.tuneBestScore !== undefined && (
                            <div className="p-3 bg-green-50 rounded-lg text-xs text-green-700">
                                Best Score: {(node.data.tuneBestScore * 100).toFixed(1)}%
                            </div>
                        )}
                    </div>
                );

            case 'exportNode':
                return (
                    <div className="space-y-4">
                        <h3 className="font-medium text-md-on-surface">Export Model</h3>
                        <p className="text-xs text-md-on-surface-variant">Download your trained model as a .joblib file to use in your own code.</p>
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <p className="text-xs text-blue-700">Run the pipeline first, then the model file will be available for download.</p>
                        </div>
                        <button onClick={() => updateNodeData(node.id, { status: 'complete' })} className="w-full py-2 bg-md-primary text-white rounded-lg text-sm font-medium">
                            Mark Ready
                        </button>
                    </div>
                );

            case 'predictNewNode':
                return (
                    <div className="space-y-4">
                        <h3 className="font-medium text-md-on-surface">Predict New Data</h3>
                        <p className="text-xs text-md-on-surface-variant">Upload a new CSV (without the target column) and get predictions from your trained model.</p>
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <p className="text-xs text-blue-700">Train your model first, then use this block to make predictions on new data.</p>
                        </div>
                        <button onClick={() => updateNodeData(node.id, { status: 'complete' })} className="w-full py-2 bg-md-primary text-white rounded-lg text-sm font-medium">
                            Mark Ready
                        </button>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="font-medium text-md-on-surface">Configure Node</h2>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="w-4 h-4" />
                </Button>
            </div>
            {renderConfig()}
        </div>
    );
}

// ============================================================
// Main Pipeline Editor
// ============================================================

function PipelineEditorInner({ onBack, onProjectSaved, onOpenDocs }: { onBack: () => void; onProjectSaved?: () => void; onOpenDocs?: (slug: string) => void }) {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const { sessionId, setResults, templateIdToLoad, setTemplateIdToLoad, loadedNodes, loadedEdges } = usePipelineStore();
    const { isAuthenticated } = useAuthStore();
    
    const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>(loadedNodes || []);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(loadedEdges || []);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const [analyticsData, setAnalyticsData] = useState<{
        accuracy: number;
        precision: number;
        recall: number;
        f1Score: number;
        confusionMatrix: number[][];
        classLabels: string[];
        trainSize: number;
        testSize: number;
        modelType: string;
        featureCount: number;
        taskType?: string;
        rmse?: number;
        mae?: number;
        r2?: number;
        silhouette?: number;
    } | null>(null);
    const { screenToFlowPosition, fitView } = useReactFlow();

    // GSAP entry animation for loaded projects
    useEffect(() => {
        if (!templateIdToLoad && loadedNodes && loadedNodes.length > 0 && reactFlowWrapper.current) {
            requestAnimationFrame(() => {
                setTimeout(() => {
                    if (reactFlowWrapper.current) {
                        const ctx = gsap.context(() => {
                            gsap.fromTo('.pipeline-node', 
                                { scale: 0.85, opacity: 0 }, 
                                { 
                                    scale: 1, 
                                    opacity: 1, 
                                    duration: 0.5, 
                                    stagger: 0.08, 
                                    ease: 'power3.out',
                                    onComplete: () => {
                                        fitView({ padding: 0.2, duration: 600 });
                                    }
                                }
                            );
                            gsap.fromTo('.react-flow__edge-path', 
                                { strokeDasharray: "1000", strokeDashoffset: "1000" },
                                { strokeDashoffset: "0", duration: 1, stagger: 0.08, ease: 'power2.out', delay: 0.2 }
                            );
                        }, reactFlowWrapper.current);
                    }
                }, 50);
            });
        }
    }, [loadedNodes, templateIdToLoad, fitView]);

    useEffect(() => {
        if (templateIdToLoad) {
            loadPipelineFromTemplate(templateIdToLoad);
            // clear it so it doesn't trigger again
            setTemplateIdToLoad(null);
        }
    }, [templateIdToLoad]);

    const loadPipelineFromTemplate = async (templateId: string) => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`${API_BASE_URL}/pipelines/from-template/${templateId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const project = await res.json();
                const { nodes: layoutNodes, edges: layoutEdges } = buildGraphFromTemplate(
                    project.template_blocks, 
                    project.template_edges
                );
                
                setNodes(layoutNodes);
                setEdges(layoutEdges);
                
                // GSAP animation
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        if (reactFlowWrapper.current) {
                            const ctx = gsap.context(() => {
                                gsap.fromTo('.pipeline-node', 
                                    { scale: 0.85, opacity: 0 }, 
                                    { 
                                        scale: 1, 
                                        opacity: 1, 
                                        duration: 0.5, 
                                        stagger: 0.08, 
                                        ease: 'power3.out',
                                        onComplete: () => {
                                            fitView({ padding: 0.2, duration: 600 });
                                        }
                                    }
                                );
                                gsap.fromTo('.react-flow__edge-path', 
                                    { strokeDasharray: "1000", strokeDashoffset: "1000" },
                                    { strokeDashoffset: "0", duration: 1, stagger: 0.08, ease: 'power2.out', delay: 0.2 }
                                );
                            }, reactFlowWrapper.current);
                            return () => ctx.revert();
                        }
                    }, 50); // tiny delay to ensure DOM is ready
                });
            } else {
                toast.error("Failed to load template");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error loading template");
        }
    };

    const nodeIdRef = useRef(0);
    const getId = () => `node_${nodeIdRef.current++}`;

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
        [setEdges]
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');
            if (!type) return;

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode: Node<NodeData> = {
                id: getId(),
                type,
                position,
                data: {},
            };

            setNodes((nds) => [...nds, newNode]);
            toast.success(`Added ${type.replace('Node', '')} block`);
        },
        [screenToFlowPosition, setNodes]
    );

    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const updateNodeData = useCallback(
        (nodeId: string, data: Partial<NodeData>) => {
            setNodes((nds) =>
                nds.map((node) => {
                    if (node.id === nodeId) {
                        return { ...node, data: { ...node.data, ...data } };
                    }
                    return node;
                })
            );
        },
        [setNodes]
    );

    const deleteNode = useCallback(
        (nodeId: string) => {
            setNodes((nds) => nds.filter((n) => n.id !== nodeId));
            setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
            setSelectedNode(null);
            toast.success('Node deleted');
        },
        [setNodes, setEdges]
    );

    // Validate and run pipeline
    const runPipeline = async () => {
        const dataNode = nodes.find((n) => n.type === 'dataNode');
        const cleanNode = nodes.find((n) => n.type === 'cleanNode');
        const encodeNode = nodes.find((n) => n.type === 'encodeNode');
        const edaNode = nodes.find((n) => n.type === 'edaNode');
        const preprocessNode = nodes.find((n) => n.type === 'preprocessNode');
        const balanceNode = nodes.find((n) => n.type === 'balanceNode');
        const splitNode = nodes.find((n) => n.type === 'splitNode');
        const crossValNode = nodes.find((n) => n.type === 'crossValNode');
        const modelNode = nodes.find((n) => n.type === 'modelNode');
        const tuneNode = nodes.find((n) => n.type === 'tuneNode');
        const resultsNode = nodes.find((n) => n.type === 'resultsNode');
        const exportNode = nodes.find((n) => n.type === 'exportNode');

        // Validate required nodes
        if (!dataNode) { toast.error('Add a Data Upload block first'); return; }
        if (!dataNode.data.filename) { toast.error('Upload a dataset in the Data Upload block'); return; }
        if (!modelNode) { toast.error('Add an ML Model block'); return; }
        if (!modelNode.data.modelType) { toast.error('Select an algorithm in the ML Model block'); return; }

        const isKMeans = modelNode.data.modelType === 'KMeans';

        if (!isKMeans && !modelNode.data.targetColumn) { toast.error('Select a target column in the ML Model block'); return; }
        if (!isKMeans && !modelNode.data.features?.length) { toast.error('Select at least one feature in the ML Model block'); return; }

        const scaler = preprocessNode?.data.scaler || 'none';
        const splitRatio = splitNode?.data.ratio || 0.2;

        setIsRunning(true);

        try {
            // 1. Clean Data (if present)
            if (cleanNode && cleanNode.data.cleanStrategy) {
                toast.loading('Cleaning data...', { id: 'pipeline' });
                await cleanData(sessionId!, cleanNode.data.cleanStrategy, cleanNode.data.dropDuplicates !== false);
                updateNodeData(cleanNode.id, { status: 'complete' });
            }

            // 2. Encode Categories (if present)
            if (encodeNode && encodeNode.data.encodeMethod) {
                toast.loading('Encoding categories...', { id: 'pipeline' });
                await encodeCategories(sessionId!, encodeNode.data.encodeMethod, encodeNode.data.encodeColumns);
                updateNodeData(encodeNode.id, { status: 'complete' });
            }

            // 3. EDA (if present)
            if (edaNode) {
                toast.loading('Exploring data...', { id: 'pipeline' });
                const edaResult = await exploreData(sessionId!);
                updateNodeData(edaNode.id, { status: 'complete', edaData: edaResult });
            }

            // 4. Preprocessing (if configured)
            if (scaler !== 'none') {
                toast.loading(`Applying ${scaler}...`, { id: 'pipeline' });
                await preprocessData(sessionId!, modelNode.data.targetColumn || '_none_', scaler);
            }

            // 5. Balance Classes (if present)
            if (balanceNode && balanceNode.data.balanceTarget) {
                toast.loading('Balancing classes...', { id: 'pipeline' });
                await balanceClasses(sessionId!, balanceNode.data.balanceTarget);
                updateNodeData(balanceNode.id, { status: 'complete' });
            }

            // 6. Training
            toast.loading('Training model...', { id: 'pipeline' });
            const result = await trainModel({
                session_id: sessionId!,
                model_type: modelNode.data.modelType,
                target_column: modelNode.data.targetColumn || '',
                feature_columns: modelNode.data.features || [],
                split_ratio: splitRatio,
            });

            // 7. Cross-Validation (if present)
            if (crossValNode && !isKMeans) {
                toast.loading('Running cross-validation...', { id: 'pipeline' });
                const cvResult = await crossValidate(
                    sessionId!, modelNode.data.modelType,
                    modelNode.data.targetColumn!, modelNode.data.features!,
                    crossValNode.data.cvFolds || 5
                );
                updateNodeData(crossValNode.id, { status: 'complete', cvScores: cvResult.scores, cvMean: cvResult.mean_score });
            }

            // 8. Tune Model (if present)
            if (tuneNode && !isKMeans) {
                toast.loading('Tuning model...', { id: 'pipeline' });
                const tuneResult = await tuneModel(
                    sessionId!, modelNode.data.modelType,
                    modelNode.data.targetColumn!, modelNode.data.features!,
                    tuneNode.data.tuneSearchType || 'random'
                );
                updateNodeData(tuneNode.id, { status: 'complete', tuneBestParams: tuneResult.best_params, tuneBestScore: tuneResult.best_score });
            }

            // 9. Export Model (if present)
            if (exportNode) {
                toast.loading('Exporting model...', { id: 'pipeline' });
                const blob = await exportModel(sessionId!);
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `predictit_model.joblib`;
                a.click();
                URL.revokeObjectURL(url);
                updateNodeData(exportNode.id, { status: 'complete' });
            }

            // Update results node
            if (resultsNode) {
                updateNodeData(resultsNode.id, {
                    accuracy: result.accuracy,
                    status: 'complete',
                    confusionMatrix: result.confusion_matrix,
                    precision: result.precision,
                    recall: result.recall,
                    f1Score: result.f1_score,
                    classLabels: result.class_labels,
                    trainSize: result.train_size,
                    testSize: result.test_size,
                    modelType: result.model_type,
                    featureCount: result.feature_count,
                    taskType: result.task_type,
                    rmse: result.rmse,
                    mae: result.mae,
                    r2: result.r2,
                    silhouette: result.silhouette,
                });
            }

            setResults({
                accuracy: result.accuracy,
                confusionMatrix: result.confusion_matrix,
            });

            // Show analytics modal
            setShowAnalytics(true);
            setAnalyticsData({
                accuracy: result.accuracy,
                precision: result.precision,
                recall: result.recall,
                f1Score: result.f1_score,
                confusionMatrix: result.confusion_matrix,
                classLabels: result.class_labels,
                trainSize: result.train_size,
                testSize: result.test_size,
                modelType: result.model_type,
                featureCount: result.feature_count,
                taskType: result.task_type,
                rmse: result.rmse,
                mae: result.mae,
                r2: result.r2,
                silhouette: result.silhouette,
            });

            const displayMetric = result.task_type === 'regression'
                ? `R²: ${(result.r2 || 0).toFixed(3)}`
                : result.task_type === 'clustering'
                    ? `Silhouette: ${(result.silhouette || 0).toFixed(3)}`
                    : `Accuracy: ${(result.accuracy * 100).toFixed(1)}%`;

            toast.success(`✓ ${displayMetric}`, { id: 'pipeline' });
        } catch (error: any) {
            console.error('Pipeline error:', error);
            toast.error(error.response?.data?.detail || error.message || 'Pipeline failed', { id: 'pipeline' });
        } finally {
            setIsRunning(false);
        }
    };

    const clearCanvas = () => {
        if (nodes.length === 0 || confirm('Clear all nodes?')) {
            setNodes([]);
            setEdges([]);
            toast.success('Canvas cleared');
        }
    };

    return (
        <div className="h-screen flex flex-col bg-white">
            {/* Header */}
            <header className="h-14 border-b border-md-outline-variant flex items-center justify-between px-4 bg-white z-10">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={onBack}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <div className="hidden sm:flex items-center gap-2">
                        <div className="w-8 h-8 bg-md-primary rounded-lg flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-medium">Pipeline Builder</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs text-md-on-surface-variant hidden sm:block">{nodes.length} blocks</span>
                    <Button variant="ghost" size="sm" onClick={clearCanvas}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                    {isAuthenticated && (
                        <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(true)}>
                            <Save className="w-4 h-4 mr-2" />
                            Save
                        </Button>
                    )}
                    <Button onClick={runPipeline} disabled={isRunning}>
                        {isRunning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                        {isRunning ? 'Running...' : 'Run'}
                    </Button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Toolbox */}
                <div className="w-64 border-r border-md-outline-variant bg-md-surface-dim p-4 overflow-y-auto">
                    {/* Core Blocks */}
                    <h3 className="text-xs font-medium text-md-on-surface-variant uppercase tracking-wider mb-3">Core Blocks</h3>
                    <div className="space-y-2">
                        {coreToolboxItems.map((item) => (
                            <ToolboxItem key={item.type} item={item} onDragStart={onDragStart} onOpenDocs={onOpenDocs} />
                        ))}
                    </div>

                    {/* Advanced Blocks (collapsible) */}
                    <button
                        onClick={() => setAdvancedOpen(!advancedOpen)}
                        className="flex items-center gap-2 w-full mt-6 mb-3 text-xs font-medium text-md-on-surface-variant uppercase tracking-wider hover:text-md-on-surface transition-colors"
                    >
                        {advancedOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        Advanced Blocks
                    </button>

                    <AnimatePresence>
                        {advancedOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
                                className="overflow-hidden"
                            >
                                {Object.entries(advancedToolboxItems).map(([category, items]) => (
                                    <div key={category} className="mb-4">
                                        <div className="text-[10px] font-medium text-md-on-surface-variant uppercase tracking-wider mb-2 pl-1">{category}</div>
                                        <div className="space-y-2">
                                            {items.map((item) => (
                                                <ToolboxItem key={item.type} item={item} onDragStart={onDragStart} onOpenDocs={onOpenDocs} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                        <h4 className="font-medium text-blue-900 text-sm mb-2">Quick Start</h4>
                        <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                            <li>Drag Data Upload to canvas</li>
                            <li>Upload your CSV file</li>
                            <li>Drag ML Model block</li>
                            <li>Configure target & features</li>
                            <li>Click Run!</li>
                        </ol>
                    </div>

                    <div className="mt-4 p-4 bg-amber-50 rounded-xl">
                        <h4 className="font-medium text-amber-900 text-sm mb-1">Optional Blocks</h4>
                        <p className="text-xs text-amber-700">Preprocess and Split are optional. We'll use smart defaults if skipped.</p>
                    </div>
                </div>

                {/* Canvas */}
                <div className="flex-1 h-full" ref={reactFlowWrapper} style={{ minHeight: '400px' }}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        onNodeClick={(_, node) => setSelectedNode(node.id)}
                        onPaneClick={() => setSelectedNode(null)}
                        nodeTypes={nodeTypes}
                        fitView
                        deleteKeyCode={['Backspace', 'Delete']}
                    >
                        <Controls />
                        <MiniMap />
                        <Background gap={20} size={1} color="#E0E0E0" />
                    </ReactFlow>
                </div>

                {/* Config Panel */}
                <AnimatePresence>
                    {selectedNode && (
                        <motion.div
                            initial={{ x: 320, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 320, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="w-80 border-l border-md-outline-variant bg-white overflow-y-auto"
                        >
                            <ConfigPanel selectedNode={selectedNode} nodes={nodes} updateNodeData={updateNodeData} onClose={() => setSelectedNode(null)} />
                            <div className="p-4 border-t border-md-outline-variant">
                                <Button variant="destructive" className="w-full" onClick={() => deleteNode(selectedNode)}>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Block
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Analytics Modal */}
            <AnimatePresence>
                {showAnalytics && analyticsData && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                        onClick={() => setShowAnalytics(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-md-surface-dim rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-md-on-surface">Training Results</h2>
                                <Button variant="ghost" size="icon" onClick={() => setShowAnalytics(false)}>
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                            <AnalyticsDashboard {...analyticsData} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <SaveProjectDialog isOpen={showSaveDialog} onClose={() => setShowSaveDialog(false)} onSaved={() => onProjectSaved?.()} nodes={nodes} edges={edges} />
        </div>
    );
}

// Wrap with ReactFlowProvider
interface PipelineDragDropProps {
    onBack: () => void;
    onProjectSaved?: () => void;
    sidebarCollapsed?: boolean;
    setSidebarCollapsed?: (collapsed: boolean) => void;
    onOpenDocs?: (slug?: string) => void;
}

export const PipelineDragDrop: React.FC<PipelineDragDropProps> = (props) => {
    return (
        <ReactFlowProvider>
            <PipelineEditorInner onBack={props.onBack} onProjectSaved={props.onProjectSaved} onOpenDocs={props.onOpenDocs} />
        </ReactFlowProvider>
    );
};
