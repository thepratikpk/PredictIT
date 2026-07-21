import React from 'react';
import { HelpCircle } from 'lucide-react';
import { gsapAnimations } from '../hooks/useGsapAnimation';
import gsap from 'gsap';

interface BlockTooltipProps {
    title: string;
    description: string;
    onClickHelp: () => void;
}

export const BlockTooltip: React.FC<BlockTooltipProps> = ({ title, description, onClickHelp }) => {
    const [isHovered, setIsHovered] = React.useState(false);
    const [isRendered, setIsRendered] = React.useState(false);
    const tooltipRef = React.useRef<HTMLDivElement>(null);
    const ctxRef = React.useRef<gsap.Context>();

    // Handle enter/leave animations
    React.useLayoutEffect(() => {
        if (isHovered && !isRendered) {
            setIsRendered(true);
        } else if (isHovered && tooltipRef.current) {
            ctxRef.current = gsap.context(() => {
                gsapAnimations.popIn(tooltipRef.current!);
            });
        } else if (!isHovered && isRendered && tooltipRef.current) {
            ctxRef.current = gsap.context(() => {
                gsapAnimations.popOut(tooltipRef.current!).then(() => setIsRendered(false));
            });
        }
        
        return () => ctxRef.current?.revert();
    }, [isHovered, isRendered]);

    // Initial render effect
    React.useLayoutEffect(() => {
        if (isRendered && isHovered && tooltipRef.current) {
            ctxRef.current = gsap.context(() => {
                gsapAnimations.popIn(tooltipRef.current!);
            });
        }
        return () => ctxRef.current?.revert();
    }, [isRendered]);

    return (
        <div 
            className="relative inline-flex items-center"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <button 
                className="w-4 h-4 rounded-full flex items-center justify-center text-md-on-surface-variant hover:text-md-primary hover:bg-md-primary-container transition-colors ml-1"
                onClick={(e) => {
                    e.stopPropagation();
                    onClickHelp();
                }}
            >
                <HelpCircle className="w-3 h-3" />
            </button>
            
            {isRendered && (
                <div
                    ref={tooltipRef}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-md-surface-dim border border-md-outline-variant rounded-lg shadow-md-2 z-50 text-center pointer-events-none"
                    style={{ opacity: 0 }}
                >
                    <div className="text-[10px] font-bold text-md-on-surface mb-0.5">{title}</div>
                    <div className="text-[10px] text-md-on-surface-variant leading-tight">{description}</div>
                    
                    {/* Tooltip caret */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-2 h-2 bg-md-surface-dim border-b border-r border-md-outline-variant rotate-45" />
                </div>
            )}
        </div>
    );
};
