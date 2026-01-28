import React, { useCallback, useRef, useState } from 'react';
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
} from 'lucide-react';
import { usePipelineStore } from '../store/pipelineStore';
import { useAuthStore } from '../store/authStore';
import { SaveProjectDialog } from './SaveProjectDialog';
import { uploadFile, preprocessData, trainModel } from '../api/mlApi';
import { AnalyticsDashboard } from './AnalyticsDashboard';
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
    [key: string]: unknown;
}

// Toolbox items
const toolboxItems = [
    { type: 'dataNode', label: 'Data Upload', icon: Upload, color: '#1A73E8', description: 'Upload CSV/Excel', required: true },
    { type: 'preprocessNode', label: 'Preprocess', icon: Settings, color: '#7C3AED', description: 'Scale features (optional)' },
    { type: 'splitNode', label: 'Train-Test Split', icon: Scissors, color: '#EC4899', description: 'Split data (optional)' },
    { type: 'modelNode', label: 'ML Model', icon: Brain, color: '#F59E0B', description: 'Train model', required: true },
    { type: 'resultsNode', label: 'Results', icon: BarChart3, color: '#10B981', description: 'View results' },
];

// Custom Node Components
function DataNode({ data, selected }: NodeProps<Node<NodeData>>) {
    return (
        <div className={`pipeline-node ${selected ? 'selected' : ''} ${data.status === 'complete' ? 'completed' : ''}`}>
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
    return (
        <div className={`pipeline-node ${selected ? 'selected' : ''} ${data.status === 'complete' ? 'completed' : ''}`}>
            <Handle type="target" position={Position.Left} />
            <Handle type="source" position={Position.Right} />
            <div className="pipeline-node-icon" style={{ backgroundColor: '#FEF3C7' }}>
                <Brain className="w-5 h-5" style={{ color: '#F59E0B' }} />
            </div>
            <div className="font-medium text-sm">ML Model</div>
            {data.modelType && (
                <div className="text-xs text-amber-600 mt-1">{data.modelType === 'LogisticRegression' ? 'Logistic' : 'Tree'}</div>
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

// Node types registry
const nodeTypes = {
    dataNode: DataNode,
    preprocessNode: PreprocessNode,
    splitNode: SplitNode,
    modelNode: ModelNode,
    resultsNode: ResultsNode,
};

// Toolbox item component
function ToolboxItem({ item, onDragStart }: { item: typeof toolboxItems[0]; onDragStart: (e: React.DragEvent, type: string) => void }) {
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
                <div className="font-medium text-sm text-md-on-surface">{item.label}</div>
                <div className="text-xs text-md-on-surface-variant">{item.description}</div>
            </div>
            <GripVertical className="w-4 h-4 text-md-on-surface-variant" />
        </div>
    );
}

// Data Preview Component
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

// Configuration Panel
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
                return (
                    <div className="space-y-4">
                        <h3 className="font-medium text-md-on-surface">Model Configuration</h3>

                        <div>
                            <label className="text-sm text-md-on-surface-variant block mb-2">Algorithm</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['LogisticRegression', 'DecisionTree'].map((model) => (
                                    <button
                                        key={model}
                                        onClick={() => updateNodeData(node.id, { modelType: model })}
                                        className={`p-3 rounded-xl text-sm font-medium transition-all ${node.data.modelType === model
                                            ? 'bg-md-primary text-white'
                                            : 'bg-md-surface-dim text-md-on-surface hover:bg-md-surface-container border border-md-outline-variant'
                                            }`}
                                    >
                                        {model === 'LogisticRegression' ? 'Logistic Regression' : 'Decision Tree'}
                                    </button>
                                ))}
                            </div>
                        </div>

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

                        {node.data.targetColumn && (
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
                                <div className="text-sm text-green-700">Model Accuracy</div>
                            </div>
                        ) : (
                            <div className="text-center p-6 bg-md-surface-dim rounded-xl">
                                <BarChart3 className="w-8 h-8 mx-auto mb-2 text-md-on-surface-variant" />
                                <p className="text-sm text-md-on-surface-variant">Run the pipeline to see results</p>
                            </div>
                        )}
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

// Main Pipeline Editor
function PipelineEditorInner({ onBack, onProjectSaved }: { onBack: () => void; onProjectSaved?: () => void }) {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);
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
    } | null>(null);
    const { screenToFlowPosition } = useReactFlow();

    const { sessionId, setResults } = usePipelineStore();
    const { isAuthenticated } = useAuthStore();

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

    // Validate and run pipeline with graceful handling
    const runPipeline = async () => {
        // Find nodes
        const dataNode = nodes.find((n) => n.type === 'dataNode');
        const preprocessNode = nodes.find((n) => n.type === 'preprocessNode');
        const splitNode = nodes.find((n) => n.type === 'splitNode');
        const modelNode = nodes.find((n) => n.type === 'modelNode');
        const resultsNode = nodes.find((n) => n.type === 'resultsNode');

        // Validate required nodes
        if (!dataNode) {
            toast.error('Add a Data Upload block first');
            return;
        }
        if (!dataNode.data.filename) {
            toast.error('Upload a dataset in the Data Upload block');
            return;
        }
        if (!modelNode) {
            toast.error('Add an ML Model block');
            return;
        }
        if (!modelNode.data.modelType) {
            toast.error('Select an algorithm in the ML Model block');
            return;
        }
        if (!modelNode.data.targetColumn) {
            toast.error('Select a target column in the ML Model block');
            return;
        }
        if (!modelNode.data.features?.length) {
            toast.error('Select at least one feature in the ML Model block');
            return;
        }

        // Use defaults for optional nodes
        const scaler = preprocessNode?.data.scaler || 'none';
        const splitRatio = splitNode?.data.ratio || 0.2;

        setIsRunning(true);

        try {
            // Preprocessing (if configured and not 'none')
            if (scaler !== 'none') {
                toast.loading(`Applying ${scaler}...`, { id: 'pipeline' });
                await preprocessData(sessionId!, modelNode.data.targetColumn, scaler);
            }

            // Training
            toast.loading('Training model...', { id: 'pipeline' });
            const result = await trainModel({
                session_id: sessionId!,
                model_type: modelNode.data.modelType,
                target_column: modelNode.data.targetColumn,
                feature_columns: modelNode.data.features,
                split_ratio: splitRatio
            });

            // Update results node if exists
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
            });

            toast.success(`✓ Accuracy: ${(result.accuracy * 100).toFixed(1)}%`, { id: 'pipeline' });
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
                    <h3 className="text-xs font-medium text-md-on-surface-variant uppercase tracking-wider mb-3">Drag blocks</h3>
                    <div className="space-y-2">
                        {toolboxItems.map((item) => (
                            <ToolboxItem key={item.type} item={item} onDragStart={onDragStart} />
                        ))}
                    </div>

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

            <SaveProjectDialog isOpen={showSaveDialog} onClose={() => setShowSaveDialog(false)} onSaved={() => onProjectSaved?.()} />
        </div>
    );
}

// Wrap with ReactFlowProvider
interface PipelineDragDropProps {
    onBack: () => void;
    onProjectSaved?: () => void;
    sidebarCollapsed?: boolean;
    setSidebarCollapsed?: (collapsed: boolean) => void;
}

export const PipelineDragDrop: React.FC<PipelineDragDropProps> = (props) => {
    return (
        <ReactFlowProvider>
            <PipelineEditorInner onBack={props.onBack} onProjectSaved={props.onProjectSaved} />
        </ReactFlowProvider>
    );
};
