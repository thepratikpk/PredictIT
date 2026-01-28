import React from 'react';
import { motion } from 'framer-motion';
import {
    BarChart3,
    Target,
    TrendingUp,
    Percent,
    CheckCircle,
    XCircle,
    Activity,
    Layers,
    Database,
    Cpu,
    Award,
    PieChart,
} from 'lucide-react';

interface AnalyticsProps {
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
}

// Metric Card Component
function MetricCard({
    title,
    value,
    icon: Icon,
    color,
    description,
    delay = 0,
}: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
    description?: string;
    delay?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
            className="bg-white rounded-2xl p-6 border border-md-outline-variant shadow-sm hover:shadow-md transition-shadow"
        >
            <div className="flex items-start justify-between mb-4">
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${color}15` }}
                >
                    <Icon className="w-6 h-6" style={{ color }} />
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-50 text-green-700">
                    {typeof value === 'number' ? (value >= 0.7 ? 'Good' : value >= 0.5 ? 'Fair' : 'Low') : ''}
                </span>
            </div>
            <div className="text-3xl font-bold text-md-on-surface mb-1">
                {typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : value}
            </div>
            <div className="text-sm font-medium text-md-on-surface-variant">{title}</div>
            {description && <div className="text-xs text-md-on-surface-variant mt-1">{description}</div>}
        </motion.div>
    );
}

// Confusion Matrix Component
function ConfusionMatrix({
    matrix,
    labels,
}: {
    matrix: number[][];
    labels: string[];
}) {
    const maxVal = Math.max(...matrix.flat());

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="bg-white rounded-2xl p-6 border border-md-outline-variant"
        >
            <div className="flex items-center gap-2 mb-4">
                <PieChart className="w-5 h-5 text-md-primary" />
                <h3 className="font-semibold text-md-on-surface">Confusion Matrix</h3>
            </div>

            <div className="overflow-x-auto">
                <div className="min-w-[300px]">
                    {/* Header row */}
                    <div className="flex mb-2">
                        <div className="w-24"></div>
                        <div className="flex-1 text-center text-xs font-medium text-md-on-surface-variant pb-2">
                            Predicted
                        </div>
                    </div>
                    <div className="flex mb-1">
                        <div className="w-24"></div>
                        {labels.map((label, i) => (
                            <div
                                key={i}
                                className="flex-1 text-center text-xs font-medium text-md-on-surface-variant truncate px-1"
                            >
                                {label}
                            </div>
                        ))}
                    </div>

                    {/* Matrix rows */}
                    <div className="flex">
                        <div className="w-6 flex items-center justify-center">
                            <span
                                className="text-xs font-medium text-md-on-surface-variant"
                                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                            >
                                Actual
                            </span>
                        </div>
                        <div className="flex-1">
                            {matrix.map((row, i) => (
                                <div key={i} className="flex items-center mb-1">
                                    <div className="w-18 text-right pr-2 text-xs font-medium text-md-on-surface-variant truncate">
                                        {labels[i]}
                                    </div>
                                    {row.map((cell, j) => {
                                        const isCorrect = i === j;
                                        const intensity = maxVal > 0 ? cell / maxVal : 0;
                                        return (
                                            <div
                                                key={j}
                                                className={`flex-1 aspect-square flex items-center justify-center text-sm font-bold rounded-lg mx-0.5 ${isCorrect ? 'text-green-700' : 'text-red-700'
                                                    }`}
                                                style={{
                                                    backgroundColor: isCorrect
                                                        ? `rgba(34, 197, 94, ${0.1 + intensity * 0.5})`
                                                        : cell > 0
                                                            ? `rgba(239, 68, 68, ${0.1 + intensity * 0.3})`
                                                            : '#f8f9fa',
                                                }}
                                            >
                                                {cell}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-center gap-6 mt-4 text-xs">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-200"></div>
                    <span className="text-md-on-surface-variant">Correct</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-200"></div>
                    <span className="text-md-on-surface-variant">Incorrect</span>
                </div>
            </div>
        </motion.div>
    );
}

// Model Info Card
function ModelInfoCard({
    modelType,
    featureCount,
    trainSize,
    testSize,
}: {
    modelType: string;
    featureCount: number;
    trainSize: number;
    testSize: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="bg-white rounded-2xl p-6 border border-md-outline-variant"
        >
            <div className="flex items-center gap-2 mb-4">
                <Cpu className="w-5 h-5 text-md-primary" />
                <h3 className="font-semibold text-md-on-surface">Model Details</h3>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-md-outline-variant">
                    <div className="flex items-center gap-2 text-sm text-md-on-surface-variant">
                        <Cpu className="w-4 h-4" />
                        Algorithm
                    </div>
                    <span className="font-medium text-md-on-surface">
                        {modelType === 'LogisticRegression' ? 'Logistic Regression' : 'Decision Tree'}
                    </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-md-outline-variant">
                    <div className="flex items-center gap-2 text-sm text-md-on-surface-variant">
                        <Layers className="w-4 h-4" />
                        Features
                    </div>
                    <span className="font-medium text-md-on-surface">{featureCount}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-md-outline-variant">
                    <div className="flex items-center gap-2 text-sm text-md-on-surface-variant">
                        <Database className="w-4 h-4" />
                        Training Samples
                    </div>
                    <span className="font-medium text-md-on-surface">{trainSize.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2 text-sm text-md-on-surface-variant">
                        <Activity className="w-4 h-4" />
                        Test Samples
                    </div>
                    <span className="font-medium text-md-on-surface">{testSize.toLocaleString()}</span>
                </div>
            </div>

            {/* Train/Test Split Visual */}
            <div className="mt-4">
                <div className="text-xs text-md-on-surface-variant mb-2">Data Split</div>
                <div className="h-3 rounded-full overflow-hidden flex">
                    <div
                        className="bg-md-primary transition-all"
                        style={{ width: `${(trainSize / (trainSize + testSize)) * 100}%` }}
                    ></div>
                    <div
                        className="bg-md-secondary-container transition-all"
                        style={{ width: `${(testSize / (trainSize + testSize)) * 100}%` }}
                    ></div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-md-on-surface-variant">
                    <span>Train ({Math.round((trainSize / (trainSize + testSize)) * 100)}%)</span>
                    <span>Test ({Math.round((testSize / (trainSize + testSize)) * 100)}%)</span>
                </div>
            </div>
        </motion.div>
    );
}

// Main Analytics Dashboard
export function AnalyticsDashboard({
    accuracy,
    precision,
    recall,
    f1Score,
    confusionMatrix,
    classLabels,
    trainSize,
    testSize,
    modelType,
    featureCount,
}: AnalyticsProps) {
    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h2 className="text-2xl font-bold text-md-on-surface flex items-center gap-2">
                        <Award className="w-6 h-6 text-md-primary" />
                        Model Performance
                    </h2>
                    <p className="text-md-on-surface-variant mt-1">
                        Comprehensive analysis of your trained model
                    </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-700">Training Complete</span>
                </div>
            </motion.div>

            {/* Primary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Accuracy"
                    value={accuracy}
                    icon={Target}
                    color="#1A73E8"
                    description="Overall correctness"
                    delay={0}
                />
                <MetricCard
                    title="Precision"
                    value={precision}
                    icon={Percent}
                    color="#7C3AED"
                    description="Positive predictive value"
                    delay={0.1}
                />
                <MetricCard
                    title="Recall"
                    value={recall}
                    icon={TrendingUp}
                    color="#EC4899"
                    description="True positive rate"
                    delay={0.2}
                />
                <MetricCard
                    title="F1 Score"
                    value={f1Score}
                    icon={BarChart3}
                    color="#10B981"
                    description="Harmonic mean"
                    delay={0.3}
                />
            </div>

            {/* Secondary Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ConfusionMatrix matrix={confusionMatrix} labels={classLabels} />
                <ModelInfoCard
                    modelType={modelType}
                    featureCount={featureCount}
                    trainSize={trainSize}
                    testSize={testSize}
                />
            </div>

            {/* Performance Summary */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="bg-gradient-to-r from-md-primary to-blue-600 rounded-2xl p-6 text-white"
            >
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Performance Summary</h3>
                        <p className="text-blue-100 text-sm max-w-xl">
                            {accuracy >= 0.9
                                ? 'Excellent! Your model shows outstanding performance with high accuracy across all metrics.'
                                : accuracy >= 0.8
                                    ? 'Great performance! Your model achieves strong accuracy and is ready for predictions.'
                                    : accuracy >= 0.7
                                        ? 'Good baseline. Consider tuning hyperparameters or adding more training data to improve.'
                                        : 'The model could benefit from more data, feature engineering, or trying different algorithms.'}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-bold">{(accuracy * 100).toFixed(0)}%</div>
                        <div className="text-blue-100 text-sm">Overall Score</div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
