'use client';

import {
  type ElementType,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { motion, type ValueAnimationTransition } from 'motion/react';

import { cn } from '@/lib/utils';

interface UnderlineProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  transition?: ValueAnimationTransition;
  targetTextColor: string;
  underlineHeightRatio?: number;
  underlinePaddingRatio?: number;
}

const UnderlineToBackground = ({
  children,
  as,
  className,
  transition = { type: 'spring', damping: 30, stiffness: 300 },
  underlineHeightRatio = 0.1,
  underlinePaddingRatio = 0.01,
  targetTextColor = 'var(--color-reversed)',
  ...props
}: UnderlineProps) => {
  const textRef = useRef<HTMLElement>(null);
  const MotionComponent = useMemo(() => motion.create(as ?? 'span'), [as]);

  useEffect(() => {
    const updateUnderlineStyles = () => {
      if (!textRef.current) {
        return;
      }

      const fontSize = Number.parseFloat(
        getComputedStyle(textRef.current).fontSize,
      );

      textRef.current.style.setProperty(
        '--underline-height',
        `${fontSize * underlineHeightRatio}px`,
      );
      textRef.current.style.setProperty(
        '--underline-padding',
        `${fontSize * underlinePaddingRatio}px`,
      );
    };

    updateUnderlineStyles();
    window.addEventListener('resize', updateUnderlineStyles);

    return () => window.removeEventListener('resize', updateUnderlineStyles);
  }, [underlineHeightRatio, underlinePaddingRatio]);

  return (
    <MotionComponent
      className={cn('motion-underline', className)}
      ref={textRef}
      whileHover="target"
      {...props}
    >
      <motion.span
        aria-hidden="true"
        className="motion-underline-background"
        variants={{
          rest: { height: 'var(--underline-height)' },
          target: { height: '100%', transition },
        }}
      />
      <motion.span
        className="motion-underline-label"
        variants={{
          rest: { color: 'currentColor' },
          target: { color: targetTextColor, transition },
        }}
      >
        {children}
      </motion.span>
    </MotionComponent>
  );
};

UnderlineToBackground.displayName = 'UnderlineToBackground';

export default UnderlineToBackground;
