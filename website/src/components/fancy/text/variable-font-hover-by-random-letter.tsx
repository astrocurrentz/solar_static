'use client';

import { useEffect, useState } from 'react';
import { motion, type Transition } from 'motion/react';

import { cn } from '@/lib/utils';

interface TextProps {
  label: string;
  fromFontVariationSettings: string;
  toFontVariationSettings: string;
  transition?: Transition;
  staggerDuration?: number;
  className?: string;
  onClick?: () => void;
}

const createRandomOrder = (length: number) => {
  const order = Array.from({ length }, (_, index) => index);

  for (let index = order.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
  }

  return order;
};

const VariableFontHoverByRandomLetter = ({
  label,
  fromFontVariationSettings = "'wght' 400",
  toFontVariationSettings = "'wght' 800",
  transition = {
    type: 'spring',
    duration: 0.45,
  },
  staggerDuration = 0.022,
  className,
  onClick,
  ...props
}: TextProps) => {
  const [randomOrder, setRandomOrder] = useState(() =>
    createRandomOrder(label.length),
  );

  useEffect(() => {
    setRandomOrder(createRandomOrder(label.length));
  }, [label]);

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
      onHoverStart={() => setRandomOrder(createRandomOrder(label.length))}
      whileHover="hover"
      {...props}
    >
      <span className="motion-sr-only">{label}</span>
      {label.split('').map((letter, index) => (
        <motion.span
          aria-hidden="true"
          className="motion-letter"
          custom={randomOrder[index] ?? index}
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

export default VariableFontHoverByRandomLetter;
