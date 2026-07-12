'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';

import { cn } from '@/lib/utils';

interface ScrambleHoverProps {
  text: string;
  scrambleSpeed?: number;
  maxIterations?: number;
  sequential?: boolean;
  revealDirection?: 'start' | 'end' | 'center';
  revealStep?: number;
  useOriginalCharsOnly?: boolean;
  characters?: string;
  className?: string;
  scrambledClassName?: string;
}

const getRevealOrder = (
  length: number,
  revealDirection: NonNullable<ScrambleHoverProps['revealDirection']>,
) => {
  if (revealDirection === 'end') {
    return Array.from({ length }, (_, index) => length - 1 - index);
  }

  if (revealDirection === 'center') {
    const center = (length - 1) / 2;

    return Array.from({ length }, (_, index) => index).sort(
      (left, right) => Math.abs(left - center) - Math.abs(right - center),
    );
  }

  return Array.from({ length }, (_, index) => index);
};

const shuffle = (characters: string[]) => {
  const shuffled = [...characters];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }

  return shuffled;
};

const scrambleText = (
  text: string,
  revealedIndices: Set<number>,
  useOriginalCharsOnly: boolean,
  characters: string,
) => {
  const sourceCharacters = text.split('');
  const hiddenCharacters = sourceCharacters.filter(
    (character, index) => character !== ' ' && !revealedIndices.has(index),
  );
  const replacementCharacters = useOriginalCharsOnly
    ? shuffle(hiddenCharacters)
    : characters.split('');
  let replacementIndex = 0;

  return sourceCharacters
    .map((character, index) => {
      if (character === ' ' || revealedIndices.has(index)) {
        return character;
      }

      if (useOriginalCharsOnly) {
        const replacement = replacementCharacters[replacementIndex];
        replacementIndex += 1;

        return replacement ?? character;
      }

      return replacementCharacters[
        Math.floor(Math.random() * replacementCharacters.length)
      ];
    })
    .join('');
};

const ScrambleHover: React.FC<ScrambleHoverProps> = ({
  text,
  scrambleSpeed = 40,
  maxIterations = 11,
  useOriginalCharsOnly = false,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  className,
  scrambledClassName,
  sequential = false,
  revealDirection = 'start',
  revealStep = 1,
  ...props
}) => {
  const [displayText, setDisplayText] = useState(text);
  const [isHovering, setIsHovering] = useState(false);
  const [isScrambling, setIsScrambling] = useState(false);
  const [revealedIndices, setRevealedIndices] = useState(new Set<number>());
  const revealOrder = useMemo(
    () => getRevealOrder(text.length, revealDirection),
    [text.length, revealDirection],
  );

  useEffect(() => {
    if (!isHovering) {
      setDisplayText(text);
      setIsScrambling(false);
      setRevealedIndices(new Set());
      return;
    }

    let iteration = 0;
    const nextRevealedIndices = new Set<number>();
    setIsScrambling(true);

    const interval = window.setInterval(() => {
      iteration += 1;

      if (sequential) {
        const nextRevealCount = Math.min(
          revealOrder.length,
          nextRevealedIndices.size + revealStep,
        );

        revealOrder.slice(0, nextRevealCount).forEach((index) => {
          nextRevealedIndices.add(index);
        });

        setRevealedIndices(new Set(nextRevealedIndices));

        if (nextRevealedIndices.size >= text.length) {
          setDisplayText(text);
          setIsScrambling(false);
          window.clearInterval(interval);
          return;
        }

        setDisplayText(
          scrambleText(
            text,
            nextRevealedIndices,
            useOriginalCharsOnly,
            characters,
          ),
        );
        return;
      }

      if (iteration >= maxIterations) {
        setDisplayText(text);
        setIsScrambling(false);
        window.clearInterval(interval);
        return;
      }

      setDisplayText(
        scrambleText(
          text,
          nextRevealedIndices,
          useOriginalCharsOnly,
          characters,
        ),
      );
    }, scrambleSpeed);

    return () => {
      window.clearInterval(interval);
    };
  }, [
    characters,
    isHovering,
    maxIterations,
    revealOrder,
    revealStep,
    scrambleSpeed,
    sequential,
    text,
    useOriginalCharsOnly,
  ]);

  return (
    <motion.span
      className={cn('motion-text motion-scramble', className)}
      onHoverEnd={() => setIsHovering(false)}
      onHoverStart={() => setIsHovering(true)}
      {...props}
    >
      <span className="motion-sr-only">{text}</span>
      <span aria-hidden="true">
        {displayText.split('').map((character, index) => (
          <span
            className={
              isScrambling && !revealedIndices.has(index)
                ? scrambledClassName
                : undefined
            }
            key={`${character}-${index}`}
          >
            {character}
          </span>
        ))}
      </span>
    </motion.span>
  );
};

export default ScrambleHover;
