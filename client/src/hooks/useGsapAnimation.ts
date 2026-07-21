import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

// Register CustomEase and define MD3-emphasized easing
gsap.registerPlugin(CustomEase);
CustomEase.create('md3', '0.4, 0, 0.2, 1');

export const useGsapAnimation = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      // Setup initial states if needed
    }, containerRef);
    
    return () => ctx.revert();
  }, []);

  return containerRef;
};

// Reusable animation builders
export const gsapAnimations = {
  // Drawer slide from right
  slideInRight: (target: string | Element) => {
    return gsap.fromTo(target,
      { x: '100%' },
      { x: '0%', duration: 0.4, ease: 'md3' }
    );
  },
  slideOutRight: (target: string | Element) => {
    return gsap.to(target,
      { x: '100%', duration: 0.3, ease: 'md3' }
    );
  },
  
  // Card stagger fade up
  staggerFadeUp: (targets: string | Element | NodeList | Element[], stagger = 0.05) => {
    return gsap.fromTo(targets,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, stagger, ease: 'md3' }
    );
  },
  
  // Tooltip pop
  popIn: (target: string | Element) => {
    return gsap.fromTo(target,
      { y: 5, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.2, ease: 'md3' }
    );
  },
  popOut: (target: string | Element) => {
    return gsap.to(target,
      { y: 5, opacity: 0, duration: 0.15, ease: 'md3' }
    );
  },
  
  // Modal scale up
  scaleUp: (target: string | Element) => {
    return gsap.fromTo(target,
      { scale: 0.9, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.3, ease: 'md3' }
    );
  },
  scaleDown: (target: string | Element) => {
    return gsap.to(target,
      { scale: 0.9, opacity: 0, duration: 0.2, ease: 'md3' }
    );
  },
  
  // Backdrop fade
  fadeIn: (target: string | Element) => {
    return gsap.fromTo(target,
      { opacity: 0 },
      { opacity: 1, duration: 0.3, ease: 'md3' }
    );
  },
  fadeOut: (target: string | Element) => {
    return gsap.to(target,
      { opacity: 0, duration: 0.2, ease: 'md3' }
    );
  }
};
