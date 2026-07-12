'use client';

import { motion, type AnimationOptions } from 'motion/react';

import { cn } from '@/lib/utils';

type StaggerFrom = 'first' | 'last' | 'center' | number;

interface TextProps {
  label: string;
  fromFontVariationSettings: string;
  toFontVariationSettings: string;
  transition?: AnimationOptions;
  staggerDuration?: number;
  staggerFrom?: StaggerFrom;
  className?: string;
  onClick?: () => void;
}

const getStaggerOrder = (
  index: number,
  total: number,
  staggerFrom: StaggerFrom,
) => {
  if (typeof staggerFrom === 'number') {
    return Math.abs(index - staggerFrom);
  }

  if (staggerFrom === 'last') {
    return total - 1 - index;
  }

  if (staggerFrom === 'center') {
    return Math.abs(index - (total - 1) / 2);
  }

  return index;
};

const VariableFontHoverByLetter = ({
  label,
  fromFontVariationSettings = "'wght' 400",
  toFontVariationSettings = "'wght' 800",
  transition = {
    type: 'spring',
    duration: 0.45,
  },
  staggerDuration = 0.025,
  staggerFrom = 'first',
  className,
  onClick,
  ...props
}: TextProps) => {
  const variants = {
    rest: (order: number) => ({
      fontVariationSettings: fromFontVariationSettings,
      transition: {
        ...transition,
        delay: staggerDuration * order,
      },
    }),
    hover: (order: number) => ({
      fontVariationSettings: toFontVariationSettings,
      transition: {
        ...transition,
        delay: staggerDuration * order,
      },
    }),
  };

  return (
    <motion.span
      animate="rest"
      className={cn('motion-text', className)}
      initial="rest"
      onClick={onClick}
      whileHover="hover"
      {...props}
    >
      <span className="motion-sr-only">{label}</span>
      {label.split('').map((letter, index) => (
        <motion.span
          aria-hidden="true"
          className="motion-letter"
          custom={getStaggerOrder(index, label.length, staggerFrom)}
          key={`${letter}-${index}`}
          style={{ fontVariationSettings: fromFontVariationSettings }}
          variants={variants}
        >
          {letter}
        </motion.span>
      ))}
    </motion.span>
  );
};

export default VariableFontHoverByLetter;
