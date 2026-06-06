import React, { useCallback, useEffect, useState } from 'react';
import GlitchText from '../GlitchText';

export interface ViewportSize {
  width: number;
  height: number;
}

export const randomFrom = <T,>(items: readonly T[]): T => {
  const fallback = items[0];
  if (fallback === undefined) {
    throw new Error('randomFrom called with empty array');
  }
  return items[Math.floor(Math.random() * items.length)] ?? fallback;
};

export function useOccasionalGlitchSignal(minDelayMs = 4200, maxDelayMs = 9200) {
  const [signal, setSignal] = useState(0);

  useEffect(() => {
    let timeoutId: number | null = null;
    let active = true;

    const schedule = () => {
      const nextDelay = Math.floor(Math.random() * (maxDelayMs - minDelayMs + 1)) + minDelayMs;
      timeoutId = window.setTimeout(() => {
        if (!active) {
          return;
        }
        setSignal((currentSignal) => currentSignal + 1);
        schedule();
      }, nextDelay);
    };

    schedule();

    return () => {
      active = false;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [maxDelayMs, minDelayMs]);

  return signal;
}

export function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

export function useViewportSize(): ViewportSize {
  const getViewportSize = useCallback(() => ({
    width: window.visualViewport?.width ?? window.innerWidth,
    height: window.visualViewport?.height ?? window.innerHeight,
  }), []);

  const [viewportSize, setViewportSize] = useState<ViewportSize>(() => {
    if (typeof window === 'undefined') {
      return { width: 1280, height: 720 };
    }

    return getViewportSize();
  });

  useEffect(() => {
    const updateViewportSize = () => {
      setViewportSize(getViewportSize());
    };

    updateViewportSize();
    window.addEventListener('resize', updateViewportSize);
    window.visualViewport?.addEventListener('resize', updateViewportSize);

    return () => {
      window.removeEventListener('resize', updateViewportSize);
      window.visualViewport?.removeEventListener('resize', updateViewportSize);
    };
  }, [getViewportSize]);

  return viewportSize;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function OccasionalGlitchText({
  text,
  className,
  tag = 'span',
  minDelayMs,
  maxDelayMs,
  scrambleStepMs = 24,
  scrambleRevealStep = 1.2,
  wrapToWidth = false,
  wrapToWidthDesktopOnly = false,
}: {
  text: string;
  className?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';
  minDelayMs?: number;
  maxDelayMs?: number;
  scrambleStepMs?: number;
  scrambleRevealStep?: number;
  wrapToWidth?: boolean;
  wrapToWidthDesktopOnly?: boolean;
}) {
  const scrambleSignal = useOccasionalGlitchSignal(minDelayMs, maxDelayMs);

  return (
    <GlitchText
      text={text}
      tag={tag}
      wrapToWidth={wrapToWidth}
      wrapToWidthDesktopOnly={wrapToWidthDesktopOnly}
      scrambleOnMount={false}
      scrambleSignal={scrambleSignal}
      scrambleStepMs={scrambleStepMs}
      scrambleRevealStep={scrambleRevealStep}
      className={className}
    />
  );
}
