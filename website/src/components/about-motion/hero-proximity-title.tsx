'use client';

import { useRef } from 'react';

import VariableFontCursorProximity from '@/components/fancy/text/variable-font-cursor-proximity';
import type { Locale } from '@/data/site';
import { cn } from '@/lib/utils';

import { fontVariationPresets, motionPresets } from './presets';
import { useInteractiveText } from './use-interactive-text';

interface HeroProximityTitleProps {
  text: string;
  locale: Locale;
  className?: string;
}

const HeroProximityTitle = ({ text, className }: HeroProximityTitleProps) => {
  const containerRef = useRef<HTMLSpanElement>(null);
  const isInteractive = useInteractiveText();

  if (!isInteractive) {
    return <span className={cn('motion-title', className)}>{text}</span>;
  }

  return (
    <span className={cn('motion-title motion-proximity-shell', className)}>
      <VariableFontCursorProximity
        as="span"
        className="motion-proximity-title"
        containerRef={containerRef}
        falloff={motionPresets.cursor.falloff}
        fromFontVariationSettings={fontVariationPresets.hero.from}
        radius={motionPresets.cursor.radius}
        ref={containerRef}
        toFontVariationSettings={fontVariationPresets.hero.to}
      >
        {text}
      </VariableFontCursorProximity>
    </span>
  );
};

export default HeroProximityTitle;
