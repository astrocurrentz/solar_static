'use client';

import VariableFontHoverByLetter from '@/components/fancy/text/variable-font-hover-by-letter';
import type { Locale } from '@/data/site';
import { cn } from '@/lib/utils';

import { getHeadingFontVariation, motionPresets } from './presets';
import { useInteractiveText } from './use-interactive-text';

interface VariableSectionHeadingProps {
  text: string;
  locale: Locale;
  className?: string;
}

const VariableSectionHeading = ({
  text,
  locale,
  className,
}: VariableSectionHeadingProps) => {
  const isInteractive = useInteractiveText();
  const fontVariation = getHeadingFontVariation(locale);
  const classes = cn('motion-heading', `motion-heading-${locale}`, className);

  if (!isInteractive) {
    return <span className={classes}>{text}</span>;
  }

  return (
    <VariableFontHoverByLetter
      className={classes}
      fromFontVariationSettings={fontVariation.from}
      label={text}
      staggerDuration={motionPresets.orderedHeading.staggerDuration}
      staggerFrom={motionPresets.orderedHeading.staggerFrom}
      toFontVariationSettings={fontVariation.to}
      transition={motionPresets.orderedHeading.transition}
    />
  );
};

export default VariableSectionHeading;
