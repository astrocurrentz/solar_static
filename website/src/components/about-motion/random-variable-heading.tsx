'use client';

import VariableFontHoverByRandomLetter from '@/components/fancy/text/variable-font-hover-by-random-letter';
import type { Locale } from '@/data/site';
import { cn } from '@/lib/utils';

import { getHeadingFontVariation, motionPresets } from './presets';
import { useInteractiveText } from './use-interactive-text';

interface RandomVariableHeadingProps {
  text: string;
  locale: Locale;
  className?: string;
}

const RandomVariableHeading = ({
  text,
  locale,
  className,
}: RandomVariableHeadingProps) => {
  const isInteractive = useInteractiveText();
  const fontVariation = getHeadingFontVariation(locale);
  const classes = cn('motion-heading', `motion-heading-${locale}`, className);

  if (!isInteractive) {
    return <span className={classes}>{text}</span>;
  }

  return (
    <VariableFontHoverByRandomLetter
      className={classes}
      fromFontVariationSettings={fontVariation.from}
      label={text}
      staggerDuration={motionPresets.randomHeading.staggerDuration}
      toFontVariationSettings={fontVariation.to}
      transition={motionPresets.randomHeading.transition}
    />
  );
};

export default RandomVariableHeading;
