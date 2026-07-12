'use client';

import ScrambleHover from '@/components/fancy/text/scramble-hover';
import type { Locale } from '@/data/site';
import { cn } from '@/lib/utils';

import { getScrambleRevealStep, motionPresets } from './presets';
import { useInteractiveText } from './use-interactive-text';

interface ScrambleStatementProps {
  text: string;
  locale: Locale;
  className?: string;
}

const ScrambleStatement = ({ text, className }: ScrambleStatementProps) => {
  const isInteractive = useInteractiveText();

  if (!isInteractive) {
    return (
      <span className={cn('motion-scramble-static', className)}>{text}</span>
    );
  }

  return (
    <ScrambleHover
      className={className}
      revealDirection={motionPresets.scramble.revealDirection}
      revealStep={getScrambleRevealStep(text)}
      scrambleSpeed={motionPresets.scramble.scrambleSpeed}
      sequential
      text={text}
      useOriginalCharsOnly
    />
  );
};

export default ScrambleStatement;
