import React, { useEffect, useState, useMemo, useRef, useLayoutEffect } from 'react';
import {
    X, BookOpen, Search, ChevronRight,
    Loader2, GraduationCap, Box, BookText, Route
} from 'lucide-react';
import { Button } from './Button';
import { getDocs } from '../api/mlApi';
import { DocEntry, DocSection } from '../types';
import { gsapAnimations } from '../hooks/useGsapAnimation';
import gsap from 'gsap';

const sectionMeta: Record<string, { label: string; icon: React.ElementType; description: string }> = {
    'getting-started': { label: 'Getting Started', icon: GraduationCap, description: 'Learn the basics' },
    'block-reference': { label: 'Block Reference', icon: Box, description: '18 block types explained' },
    'ml-glossary': { label: 'ML Glossary', icon: BookText, description: 'Key ML terms' },
    'template-walkthroughs': { label: 'Template Walkthroughs', icon: Route, description: 'Why each template works' },
};

interface DocsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    scrollToBlock?: string; // slug to deep-link to
}

export const DocsDrawer: React.FC<DocsDrawerProps> = ({ isOpen, onClose, scrollToBlock }) => {
    const [docs, setDocs] = useState<DocEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<string>('getting-started');
    const [selectedDoc, setSelectedDoc] = useState<DocEntry | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    // GSAP rendering state
    const [isRendered, setIsRendered] = useState(false);
    const backdropRef = useRef<HTMLDivElement>(null);
    const drawerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const ctxRef = useRef<gsap.Context>();

    // Handle open/close animations
    useLayoutEffect(() => {
        if (isOpen && !isRendered) {
            setIsRendered(true);
        } else if (isOpen && drawerRef.current && backdropRef.current) {
            ctxRef.current = gsap.context(() => {
                gsapAnimations.fadeIn(backdropRef.current!);
                gsapAnimations.slideInRight(drawerRef.current!);
            });
        } else if (!isOpen && isRendered && drawerRef.current && backdropRef.current) {
            ctxRef.current = gsap.context(() => {
                gsapAnimations.fadeOut(backdropRef.current!);
                gsapAnimations.slideOutRight(drawerRef.current!).then(() => setIsRendered(false));
            });
        }
        
        return () => ctxRef.current?.revert();
    }, [isOpen, isRendered]);

    // Initial render effect
    useLayoutEffect(() => {
        if (isRendered && isOpen && drawerRef.current && backdropRef.current) {
            ctxRef.current = gsap.context(() => {
                gsapAnimations.fadeIn(backdropRef.current!);
                gsapAnimations.slideInRight(drawerRef.current!);
            });
        }
        return () => ctxRef.current?.revert();
    }, [isRendered]);
    
    // Animate list items on filter or section change
    useLayoutEffect(() => {
        if (isRendered && listRef.current && !loading && !selectedDoc) {
            const ctx = gsap.context(() => {
                const items = listRef.current?.querySelectorAll('.doc-list-item');
                if (items && items.length > 0) {
                    gsapAnimations.staggerFadeUp(items);
                }
            }, listRef);
            return () => ctx.revert();
        }
    }, [isRendered, loading, selectedDoc, activeSection, searchQuery]);

    useEffect(() => {
        if (isOpen && docs.length === 0) {
            fetchDocs();
        }
    }, [isOpen]);

    useEffect(() => {
        if (scrollToBlock && docs.length > 0) {
            const target = docs.find(d => d.slug === scrollToBlock);
            if (target) {
                setActiveSection(target.section);
                setSelectedDoc(target);
            }
        }
    }, [scrollToBlock, docs]);

    const fetchDocs = async () => {
        setLoading(true);
        try {
            const data = await getDocs();
            setDocs(data);
        } catch (err) {
            console.error('Failed to load docs:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredDocs = useMemo(() => {
        let filtered = docs;
        if (activeSection) {
            filtered = filtered.filter(d => d.section === activeSection);
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(d =>
                d.title.toLowerCase().includes(q) || d.content.toLowerCase().includes(q)
            );
        }
        return filtered.sort((a, b) => a.order - b.order);
    }, [docs, activeSection, searchQuery]);

    const sections = Object.keys(sectionMeta) as DocSection[];

    const renderContent = (content: string) => {
        const lines = content.split('\n');
        return lines.map((line, idx) => {
            const trimmed = line.trim();
            if (trimmed.startsWith('## ')) {
                return <h2 key={idx} className="text-lg font-bold text-md-on-surface mt-4 mb-2">{trimmed.slice(3)}</h2>;
            }
            if (trimmed.startsWith('### ')) {
                return <h3 key={idx} className="text-base font-semibold text-md-on-surface mt-3 mb-1">{trimmed.slice(4)}</h3>;
            }
            if (trimmed.startsWith('- ')) {
                return <li key={idx} className="text-sm text-md-on-surface ml-4 list-disc">{renderInline(trimmed.slice(2))}</li>;
            }
            if (trimmed.match(/^\d+\.\s/)) {
                return <li key={idx} className="text-sm text-md-on-surface ml-4 list-decimal">{renderInline(trimmed.replace(/^\d+\.\s/, ''))}</li>;
            }
            if (trimmed === '') {
                return <div key={idx} className="h-2" />;
            }
            return <p key={idx} className="text-sm text-md-on-surface leading-relaxed">{renderInline(trimmed)}</p>;
        });
    };

    const renderInline = (text: string) => {
        const parts = text.split(/(\*\*[^*]+\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
            }
            return <span key={i}>{part}</span>;
        });
    };

    if (!isRendered) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                ref={backdropRef}
                className="fixed inset-0 bg-black/30 z-40 opacity-0"
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                ref={drawerRef}
                className="fixed right-0 top-0 h-screen w-full max-w-2xl bg-white z-50 flex flex-col md-elevation-3 translate-x-full"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-md-outline-variant">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-md-primary-container rounded-lg flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-md-primary" />
                        </div>
                        <div>
                            <h2 className="font-medium text-md-on-surface">Documentation</h2>
                            <p className="text-xs text-md-on-surface-variant">{docs.length} entries</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Search */}
                <div className="px-5 py-3 border-b border-md-outline-variant">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-md-on-surface-variant" />
                        <input
                            type="text"
                            placeholder="Search docs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-sm bg-md-surface-dim border border-md-outline-variant rounded-full focus:outline-none focus:border-md-primary transition-colors"
                        />
                    </div>
                </div>

                {/* Body: sidebar + content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Section nav */}
                    <div className="w-48 border-r border-md-outline-variant bg-md-surface-dim overflow-y-auto flex-shrink-0 hidden sm:block">
                        <div className="p-3 space-y-1">
                            {sections.map(section => {
                                const meta = sectionMeta[section];
                                const Icon = meta.icon;
                                const isActive = activeSection === section;
                                return (
                                    <button
                                        key={section}
                                        onClick={() => { setActiveSection(section); setSelectedDoc(null); }}
                                        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors text-left ${
                                            isActive ? 'bg-md-primary-container text-md-primary' : 'text-md-on-surface-variant hover:bg-md-surface-container'
                                        }`}
                                    >
                                        <Icon className="w-4 h-4 flex-shrink-0" />
                                        <span className="truncate">{meta.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Mobile section tabs */}
                    <div className="sm:hidden border-b border-md-outline-variant overflow-x-auto">
                        <div className="flex p-2 gap-1">
                            {sections.map(section => {
                                const meta = sectionMeta[section];
                                return (
                                    <button
                                        key={section}
                                        onClick={() => { setActiveSection(section); setSelectedDoc(null); }}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 ${
                                            activeSection === section ? 'bg-md-primary text-white' : 'bg-md-surface-dim text-md-on-surface-variant'
                                        }`}
                                    >
                                        {meta.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Content area */}
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-6 h-6 text-md-primary animate-spin" />
                            </div>
                        ) : selectedDoc ? (
                            /* Full doc view */
                            <div className="p-5">
                                <button
                                    onClick={() => setSelectedDoc(null)}
                                    className="flex items-center gap-1 text-xs text-md-primary mb-4 hover:underline"
                                >
                                    ← Back to {sectionMeta[activeSection]?.label}
                                </button>
                                <h1 className="text-xl font-bold text-md-on-surface mb-4">{selectedDoc.title}</h1>
                                <div className="prose prose-sm max-w-none">
                                    {renderContent(selectedDoc.content)}
                                </div>
                            </div>
                        ) : (
                            /* Doc list */
                            <div className="p-4 space-y-2" ref={listRef}>
                                {filteredDocs.length === 0 ? (
                                    <p className="text-sm text-md-on-surface-variant text-center py-10">
                                        {searchQuery ? 'No docs match your search' : 'No docs in this section'}
                                    </p>
                                ) : (
                                    filteredDocs.map((doc) => (
                                        <button
                                            key={doc._id}
                                            className="doc-list-item w-full text-left p-4 bg-md-surface-dim rounded-xl hover:bg-md-surface-container transition-colors group opacity-0"
                                            onClick={() => setSelectedDoc(doc)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-medium text-sm text-md-on-surface group-hover:text-md-primary transition-colors">{doc.title}</h3>
                                                <ChevronRight className="w-4 h-4 text-md-on-surface-variant group-hover:text-md-primary" />
                                            </div>
                                            {doc.shortDescription && (
                                                <p className="text-xs text-md-on-surface-variant mt-1">{doc.shortDescription}</p>
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};
