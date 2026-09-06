'use client';

import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  /** Stagger, in ms, applied once the element enters the viewport. */
  delay?: number;
  className?: string;
  as?: ElementType;
  /** Slide distance in px. 0 fades in place. */
  y?: number;
}

/**
 * Fades content up as it scrolls into view.
 *
 * Uses IntersectionObserver rather than a scroll listener so it costs nothing
 * on the main thread, and unobserves after the first reveal — elements should
 * not re-animate when the user scrolls back up.
 */
export default function Reveal({ children, delay = 0, className = '', as: Tag = 'div', y = 16 }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Honour reduced motion by showing everything immediately.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShown(true);
        observer.unobserve(entry.target);
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`transition-[opacity,transform] duration-700 ease-out-expo ${className}`}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : `translateY(${y}px)`,
        transitionDelay: shown ? `${delay}ms` : '0ms',
      }}
    >
      {children}
    </Tag>
  );
}
