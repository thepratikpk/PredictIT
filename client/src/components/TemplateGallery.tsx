import React, { useEffect, useState, useMemo, useRef, useLayoutEffect } from 'react';
import {
    GraduationCap, UserMinus, Home, Users, Landmark, ShieldAlert, Briefcase, HeartPulse,
    X, ArrowRight, Sparkles, Filter, Loader2, AlertTriangle
} from 'lucide-react';
import { Button } from './Button';
import { getTemplates } from '../api/mlApi';
import { PipelineTemplate } from '../types';
import { gsapAnimations } from '../hooks/useGsapAnimation';
import gsap from 'gsap';

// Map icon string names from backend to lucide components
const iconMap: Record<string, React.ElementType> = {
    GraduationCap, UserMinus, Home, Users, Landmark, ShieldAlert, Briefcase, HeartPulse,
};

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
    classification: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    regression: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    clustering: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
};

const difficultyBadge: Record<string, { bg: string; text: string }> = {
    beginner: { bg: 'bg-green-100', text: 'text-green-700' },
    intermediate: { bg: 'bg-amber-100', text: 'text-amber-700' },
};

// Mini flow diagram — shows block chain preview
function MiniFlowPreview({ blocks }: { blocks: PipelineTemplate['blocks'] }) {
    const blockLabels: Record<string, { label: string; color: string }> = {
        dataNode: { label: 'Upload', color: '#1A73E8' },
        preprocessNode: { label: 'Scale', color: '#7C3AED' },
        splitNode: { label: 'Split', color: '#EC4899' },
        modelNode: { label: 'Model', color: '#F59E0B' },
        resultsNode: { label: 'Results', color: '#10B981' },
        cleanNode: { label: 'Clean', color: '#06B6D4' },
        encodeNode: { label: 'Encode', color: '#8B5CF6' },
        edaNode: { label: 'EDA', color: '#0EA5E9' },
        balanceNode: { label: 'Balance', color: '#F97316' },
        crossValNode: { label: 'CV', color: '#14B8A6' },
        tuneNode: { label: 'Tune', color: '#A855F7' },
        exportNode: { label: 'Export', color: '#6366F1' },
        predictNewNode: { label: 'Predict', color: '#D946EF' },
    };

    return (
        <div className="flex items-center gap-1 overflow-x-auto py-2">
            {blocks.sort((a, b) => a.order - b.order).map((block, idx) => {
                const info = blockLabels[block.type] || { label: block.type, color: '#999' };
                return (
                    <React.Fragment key={idx}>
                        {idx > 0 && (
                            <div className="w-4 h-0.5 bg-gray-300 flex-shrink-0" />
                        )}
                        <div
                            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium flex-shrink-0"
                            style={{ backgroundColor: `${info.color}15`, color: info.color, border: `1px solid ${info.color}30` }}
                        >
                            {info.label}
                        </div>
                    </React.Fragment>
                );
            })}
        </div>
    );
}

interface TemplateGalleryProps {
    onBack: () => void;
    onUseTemplate: (template: PipelineTemplate) => void;
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({ onBack, onUseTemplate }) => {
    const [templates, setTemplates] = useState<PipelineTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
    const [difficultyFilter, setDifficultyFilter] = useState<string | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<PipelineTemplate | null>(null);
    
    // GSAP refs and states
    const gridRef = useRef<HTMLDivElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const ctxRef = useRef<gsap.Context>();
    const [isRendered, setIsRendered] = useState(false);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getTemplates();
            setTemplates(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load templates');
        } finally {
            setLoading(false);
        }
    };

    const filteredTemplates = useMemo(() => {
        return templates.filter(t => {
            if (categoryFilter && t.category !== categoryFilter) return false;
            if (difficultyFilter && t.difficulty !== difficultyFilter) return false;
            return true;
        });
    }, [templates, categoryFilter, difficultyFilter]);

    // Animate Grid Items
    useLayoutEffect(() => {
        if (!loading && gridRef.current && filteredTemplates.length > 0) {
            const ctx = gsap.context(() => {
                const items = gridRef.current?.querySelectorAll('.template-card');
                if (items && items.length > 0) {
                    gsapAnimations.staggerFadeUp(items, 0.05);
                }
            }, gridRef);
            return () => ctx.revert();
        }
    }, [loading, filteredTemplates]);

    // Handle open/close animations for modal
    useLayoutEffect(() => {
        if (selectedTemplate && !isRendered) {
            setIsRendered(true);
        } else if (selectedTemplate && modalRef.current && backdropRef.current) {
            ctxRef.current = gsap.context(() => {
                gsapAnimations.fadeIn(backdropRef.current!);
                gsapAnimations.scaleUp(modalRef.current!);
            });
        } else if (!selectedTemplate && isRendered && modalRef.current && backdropRef.current) {
            ctxRef.current = gsap.context(() => {
                gsapAnimations.fadeOut(backdropRef.current!);
                gsapAnimations.scaleDown(modalRef.current!).then(() => setIsRendered(false));
            });
        }
        
        return () => ctxRef.current?.revert();
    }, [selectedTemplate, isRendered]);

    // Initial render effect for modal
    useLayoutEffect(() => {
        if (isRendered && selectedTemplate && modalRef.current && backdropRef.current) {
            ctxRef.current = gsap.context(() => {
                gsapAnimations.fadeIn(backdropRef.current!);
                gsapAnimations.scaleUp(modalRef.current!);
            });
        }
        return () => ctxRef.current?.revert();
    }, [isRendered]);

    const categories = ['classification', 'regression', 'clustering'];
    const difficulties = ['beginner', 'intermediate'];

    return (
        <div className="h-screen flex flex-col bg-white">
            {/* Header */}
            <header className="h-14 border-b border-md-outline-variant flex items-center justify-between px-4 sm:px-6 bg-white z-10">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={onBack}>
                        ← Back
                    </Button>
                    <div className="hidden sm:flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-md-primary to-blue-600 rounded-lg flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <span className="font-medium text-md-on-surface">Template Gallery</span>
                            <span className="text-xs text-md-on-surface-variant ml-2">
                                {filteredTemplates.length} templates
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Filter Chips */}
            <div className="px-4 sm:px-6 py-3 border-b border-md-outline-variant bg-md-surface-dim overflow-x-auto">
                <div className="flex items-center gap-2 flex-nowrap">
                    <Filter className="w-4 h-4 text-md-on-surface-variant flex-shrink-0" />

                    {/* Category filters */}
                    <button
                        onClick={() => setCategoryFilter(null)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex-shrink-0 ${
                            !categoryFilter ? 'bg-md-primary text-white' : 'bg-white border border-md-outline-variant text-md-on-surface hover:bg-md-surface-container'
                        }`}
                    >
                        All
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all capitalize flex-shrink-0 ${
                                categoryFilter === cat ? 'bg-md-primary text-white' : 'bg-white border border-md-outline-variant text-md-on-surface hover:bg-md-surface-container'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}

                    <div className="w-px h-5 bg-md-outline-variant mx-1 flex-shrink-0" />

                    {/* Difficulty filters */}
                    {difficulties.map(diff => (
                        <button
                            key={diff}
                            onClick={() => setDifficultyFilter(difficultyFilter === diff ? null : diff)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all capitalize flex-shrink-0 ${
                                difficultyFilter === diff ? 'bg-md-primary text-white' : 'bg-white border border-md-outline-variant text-md-on-surface hover:bg-md-surface-container'
                            }`}
                        >
                            {diff}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-md-primary animate-spin mb-3" />
                        <p className="text-sm text-md-on-surface-variant">Loading templates...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <AlertTriangle className="w-8 h-8 text-amber-500 mb-3" />
                        <p className="text-sm text-md-on-surface-variant mb-4">{error}</p>
                        <Button variant="outline" size="sm" onClick={fetchTemplates}>Retry</Button>
                    </div>
                ) : filteredTemplates.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-md-on-surface-variant">No templates match your filters</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" ref={gridRef}>
                        {filteredTemplates.map((template, idx) => {
                            const IconComp = iconMap[template.icon] || Sparkles;
                            const catColor = categoryColors[template.category] || categoryColors.classification;
                            const diffBadge = difficultyBadge[template.difficulty] || difficultyBadge.beginner;

                            return (
                                <div
                                    key={template._id}
                                    className="template-card group bg-white rounded-2xl border border-md-outline-variant p-5 cursor-pointer hover:border-md-primary hover:shadow-lg transition-all opacity-0"
                                    onClick={() => setSelectedTemplate(template)}
                                >
                                    {/* Icon + badges */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${catColor.bg}` }}>
                                            <IconComp className={`w-6 h-6 ${catColor.text}`} />
                                        </div>
                                        <div className="flex gap-1.5">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${catColor.bg} ${catColor.text}`}>
                                                {template.category}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${diffBadge.bg} ${diffBadge.text}`}>
                                                {template.difficulty}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Title + description */}
                                    <h3 className="font-medium text-md-on-surface mb-1 group-hover:text-md-primary transition-colors">
                                        {template.name}
                                    </h3>
                                    <p className="text-xs text-md-on-surface-variant line-clamp-2 mb-3">
                                        {template.description}
                                    </p>

                                    {/* Mini flow preview */}
                                    <MiniFlowPreview blocks={template.blocks} />

                                    {/* Block count */}
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-md-outline-variant">
                                        <span className="text-xs text-md-on-surface-variant">{template.blocks.length} blocks</span>
                                        <ArrowRight className="w-4 h-4 text-md-on-surface-variant group-hover:text-md-primary transition-colors" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {isRendered && selectedTemplate && (
                <div
                    ref={backdropRef}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 opacity-0"
                    onClick={() => setSelectedTemplate(null)}
                >
                    <div
                        ref={modalRef}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                        style={{ opacity: 0, transform: 'scale(0.9)' }}
                    >
                        {/* Modal header */}
                        <div className="p-6 border-b border-md-outline-variant">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    {(() => {
                                        const Icon = iconMap[selectedTemplate.icon] || Sparkles;
                                        const catColor = categoryColors[selectedTemplate.category];
                                        return (
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${catColor.bg}`}>
                                                <Icon className={`w-6 h-6 ${catColor.text}`} />
                                            </div>
                                        );
                                    })()}
                                    <div>
                                        <h2 className="text-lg font-bold text-md-on-surface">{selectedTemplate.name}</h2>
                                        <div className="flex gap-1.5 mt-1">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${categoryColors[selectedTemplate.category].bg} ${categoryColors[selectedTemplate.category].text}`}>
                                                {selectedTemplate.category}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${difficultyBadge[selectedTemplate.difficulty].bg} ${difficultyBadge[selectedTemplate.difficulty].text}`}>
                                                {selectedTemplate.difficulty}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setSelectedTemplate(null)}>
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Modal body */}
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-md-on-surface">{selectedTemplate.description}</p>

                            <div>
                                <h4 className="text-sm font-medium text-md-on-surface mb-2">Pipeline Flow</h4>
                                <MiniFlowPreview blocks={selectedTemplate.blocks} />
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-md-on-surface mb-2">Blocks ({selectedTemplate.blocks.length})</h4>
                                <div className="space-y-1">
                                    {selectedTemplate.blocks.sort((a, b) => a.order - b.order).map((block, idx) => (
                                        <div key={idx} className="flex items-center gap-2 p-2 bg-md-surface-dim rounded-lg text-xs">
                                            <span className="w-5 h-5 rounded-full bg-md-primary text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">{idx + 1}</span>
                                            <span className="text-md-on-surface font-medium">{block.type.replace('Node', '')}</span>
                                            {Object.keys(block.config).length > 0 && (
                                                <span className="text-md-on-surface-variant ml-auto">
                                                    {Object.entries(block.config).map(([k, v]) => `${k}: ${v}`).join(', ')}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Modal footer */}
                        <div className="p-6 border-t border-md-outline-variant">
                            <Button className="w-full" onClick={() => {
                                onUseTemplate(selectedTemplate);
                                setSelectedTemplate(null);
                            }}>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Use this Template
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
