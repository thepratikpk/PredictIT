import React, { useCallback, useMemo, useState } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Node,
    Edge,
    Handle,
    Position,
    NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
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
    Menu,
    RotateCcw,
    Sparkles,
} from 'lucide-react';
import { DataUploadStep } from './steps/DataUploadStep';
import { PreprocessingStep } from './steps/PreprocessingStep';
import { TrainTestSplitStep } from './steps/TrainTestSplitStep';
import { ModelSelectionStep } from './steps/ModelSelectionStep';
import { ResultsStep } from './steps/ResultsStep';
import { usePipelineStore } from '../store/pipelineStore';
import { useAuthStore } from '../store/authStore';
import { SaveProjectDialog } from './SaveProjectDialog';

// Pipeline Node Component
const PipelineNode = ({ data, selected }: NodeProps) => {
    const Icon = data.icon;
    const isCompleted = data.completed;
    const isCurrent = data.current;

    return (
        <div
            className={`
        pipeline-node
        ${selected ? 'selected' : ''}
        ${isCompleted ? 'completed' : ''}
        ${isCurrent ? 'border-md-primary' : ''}
      `}
            onClick={data.onClick}
        >
            <Handle type="target" position={Position.Left} />
            <div
                className={`pipeline-node-icon ${isCompleted ? 'bg-green-100' : isCurrent ? 'bg-md-primary-container' : 'bg-gray-100'
                    }`}
            >
                {isCompleted ? (
                    <Check className="w-5 h-5 text-green-600" />
                ) : (
                    <Icon className={`w-5 h-5 ${isCurrent ? 'text-md-primary' : 'text-gray-600'}`} />
                )}
            </div>
            <div className="font-medium text-gray-900">{data.label}</div>
            <div className="text-xs text-gray-500 mt-1">{data.description}</div>
            <Handle type="source" position={Position.Right} />
        </div>
    );
};

const nodeTypes = {
    pipeline: PipelineNode,
};

interface VisualPipelineProps {
    onBack: () => void;
    onProjectSaved?: () => void;
    sidebarCollapsed?: boolean;
    setSidebarCollapsed?: (collapsed: boolean) => void;
}

export const VisualPipeline: React.FC<VisualPipelineProps> = ({
    onBack,
    onProjectSaved,
    sidebarCollapsed,
    setSidebarCollapsed,
}) => {
    const [selectedNode, setSelectedNode] = useState<string | null>('upload');
    const [showSaveDialog, setShowSaveDialog] = useState(false);

    const { isAuthenticated } = useAuthStore();
    const store = usePipelineStore();
    const {
        datasetInfo,
        preprocessingConfig,
        splitConfig,
        modelConfig,
        results,
        resetPipeline,
        getCompletedSteps,
        isRunning,
    } = store;

    // Determine node states
    const nodeStates = useMemo(() => ({
        upload: { completed: !!datasetInfo, current: selectedNode === 'upload' },
        preprocess: { completed: !!preprocessingConfig, current: selectedNode === 'preprocess', enabled: !!datasetInfo },
        split: { completed: !!splitConfig, current: selectedNode === 'split', enabled: !!preprocessingConfig },
        model: { completed: !!modelConfig, current: selectedNode === 'model', enabled: !!splitConfig },
        results: { completed: !!results, current: selectedNode === 'results', enabled: !!modelConfig },
    }), [datasetInfo, preprocessingConfig, splitConfig, modelConfig, results, selectedNode]);

    const initialNodes: Node[] = [
        {
            id: 'upload',
            type: 'pipeline',
            position: { x: 50, y: 150 },
            data: {
                label: 'Upload Data',
                description: 'CSV or Excel file',
                icon: Upload,
                completed: nodeStates.upload.completed,
                current: nodeStates.upload.current,
                onClick: () => setSelectedNode('upload'),
            },
        },
        {
            id: 'preprocess',
            type: 'pipeline',
            position: { x: 250, y: 150 },
            data: {
                label: 'Preprocess',
                description: 'Scale features',
                icon: Settings,
                completed: nodeStates.preprocess.completed,
                current: nodeStates.preprocess.current,
                onClick: () => nodeStates.preprocess.enabled && setSelectedNode('preprocess'),
            },
        },
        {
            id: 'split',
            type: 'pipeline',
            position: { x: 450, y: 150 },
            data: {
                label: 'Train-Test Split',
                description: 'Divide dataset',
                icon: Scissors,
                completed: nodeStates.split.completed,
                current: nodeStates.split.current,
                onClick: () => nodeStates.split.enabled && setSelectedNode('split'),
            },
        },
        {
            id: 'model',
            type: 'pipeline',
            position: { x: 650, y: 150 },
            data: {
                label: 'Select Model',
                description: 'Choose algorithm',
                icon: Brain,
                completed: nodeStates.model.completed,
                current: nodeStates.model.current,
                onClick: () => nodeStates.model.enabled && setSelectedNode('model'),
            },
        },
        {
            id: 'results',
            type: 'pipeline',
            position: { x: 850, y: 150 },
            data: {
                label: 'Results',
                description: 'View performance',
                icon: BarChart3,
                completed: nodeStates.results.completed,
                current: nodeStates.results.current,
                onClick: () => nodeStates.results.enabled && setSelectedNode('results'),
            },
        },
    ];

    const initialEdges: Edge[] = [
        { id: 'e1-2', source: 'upload', target: 'preprocess', animated: nodeStates.upload.completed },
        { id: 'e2-3', source: 'preprocess', target: 'split', animated: nodeStates.preprocess.completed },
        { id: 'e3-4', source: 'split', target: 'model', animated: nodeStates.split.completed },
        { id: 'e4-5', source: 'model', target: 'results', animated: nodeStates.model.completed },
    ];

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // Update nodes when state changes
    React.useEffect(() => {
        setNodes(nodes => nodes.map(node => ({
            ...node,
            data: {
                ...node.data,
                completed: nodeStates[node.id as keyof typeof nodeStates]?.completed,
                current: nodeStates[node.id as keyof typeof nodeStates]?.current,
            },
        })));

        setEdges([
            { id: 'e1-2', source: 'upload', target: 'preprocess', animated: nodeStates.upload.completed },
            { id: 'e2-3', source: 'preprocess', target: 'split', animated: nodeStates.preprocess.completed },
            { id: 'e3-4', source: 'split', target: 'model', animated: nodeStates.split.completed },
            { id: 'e4-5', source: 'model', target: 'results', animated: nodeStates.model.completed },
        ]);
    }, [nodeStates]);

    const handleReset = () => {
        if (confirm('Reset the entire pipeline?')) {
            resetPipeline();
            setSelectedNode('upload');
        }
    };

    const handleNextStep = () => {
        const steps = ['upload', 'preprocess', 'split', 'model', 'results'];
        const currentIndex = steps.indexOf(selectedNode || 'upload');
        if (currentIndex < steps.length - 1) {
            const nextStep = steps[currentIndex + 1];
            if (nodeStates[nextStep as keyof typeof nodeStates]?.enabled || currentIndex === 0) {
                setSelectedNode(nextStep);
            }
        }
    };

    const handlePrevStep = () => {
        const steps = ['upload', 'preprocess', 'split', 'model', 'results'];
        const currentIndex = steps.indexOf(selectedNode || 'upload');
        if (currentIndex > 0) {
            setSelectedNode(steps[currentIndex - 1]);
        }
    };

    const renderStepPanel = () => {
        switch (selectedNode) {
            case 'upload':
                return <DataUploadStep onNext={handleNextStep} />;
            case 'preprocess':
                return <PreprocessingStep onNext={handleNextStep} onPrevious={handlePrevStep} />;
            case 'split':
                return <TrainTestSplitStep onNext={handleNextStep} onPrevious={handlePrevStep} />;
            case 'model':
                return <ModelSelectionStep onNext={handleNextStep} onPrevious={handlePrevStep} />;
            case 'results':
                return <ResultsStep onPrevious={handlePrevStep} onReset={handleReset} onProjectSaved={onProjectSaved} />;
            default:
                return (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <p>Click a node to configure</p>
                    </div>
                );
        }
    };

    const completedSteps = getCompletedSteps();

    return (
        <div className="h-screen flex flex-col bg-white">
            {/* Header */}
            <header className="h-14 border-b border-md-outline-variant flex items-center justify-between px-4 bg-white z-10">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => setSidebarCollapsed?.(!sidebarCollapsed)} className="lg:hidden">
                        <Menu className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" onClick={onBack}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <div className="hidden sm:flex items-center gap-2">
                        <div className="w-8 h-8 bg-md-primary rounded-lg flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-medium">Visual Pipeline</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 hidden sm:block">
                        {completedSteps}/5 steps complete
                    </span>
                    {isAuthenticated && completedSteps > 0 && (
                        <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(true)}>
                            <Save className="w-4 h-4 mr-2" />
                            Save
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={handleReset}>
                        <RotateCcw className="w-4 h-4" />
                    </Button>
                </div>
            </header>

            {/* Main content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Flow canvas */}
                <div className="flex-1 relative">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        nodeTypes={nodeTypes}
                        fitView
                        fitViewOptions={{ padding: 0.5 }}
                        minZoom={0.5}
                        maxZoom={1.5}
                        nodesDraggable={false}
                        nodesConnectable={false}
                        elementsSelectable={true}
                        panOnDrag={true}
                        zoomOnScroll={true}
                    >
                        <Controls />
                        <Background gap={20} size={1} color="#E0E0E0" />
                    </ReactFlow>
                </div>

                {/* Step configuration panel */}
                <div className="w-[400px] lg:w-[480px] border-l border-md-outline-variant bg-md-surface-dim overflow-y-auto">
                    <div className="p-4">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={selectedNode}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                {renderStepPanel()}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <SaveProjectDialog
                isOpen={showSaveDialog}
                onClose={() => setShowSaveDialog(false)}
                onSaved={() => {
                    onProjectSaved?.();
                }}
            />
        </div>
    );
};
