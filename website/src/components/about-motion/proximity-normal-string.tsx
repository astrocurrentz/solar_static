'use client';

import { Fragment, useRef } from 'react';

import VariableFontCursorProximity from '@/components/fancy/text/variable-font-cursor-proximity';
import { site, type Locale } from '@/data/site';
import { cn } from '@/lib/utils';

import { getNormalFontVariation, motionPresets } from './presets';
import { useInteractiveText } from './use-interactive-text';

interface ProximityNormalStringProps {
  text: string;
  locale: Locale;
  className?: string;
}

interface ProximitySegmentProps {
  text: string;
  locale: Locale;
}

const ProximitySegment = ({ text, locale }: ProximitySegmentProps) => {
  const containerRef = useRef<HTMLSpanElement>(null);
  const fontVariation = getNormalFontVariation(locale);

  return (
    <VariableFontCursorProximity
      as="span"
      className={cn('motion-normal-segment', `motion-normal-segment-${locale}`)}
      containerRef={containerRef}
      falloff={motionPresets.normalCursor.falloff}
      fromFontVariationSettings={fontVariation.from}
      radius={motionPresets.normalCursor.radius}
      ref={containerRef}
      reserveLayout
      toFontVariationSettings={fontVariation.to}
    >
      {text}
    </VariableFontCursorProximity>
  );
};

const renderStaticText = (text: string) => {
  const parts = text.split(site.name);

  return parts.map((part, index) => (
    <Fragment key={`${part}-${index}`}>
      {part}
      {index < parts.length - 1 && (
        <span className="brand-name">{site.name}</span>
      )}
    </Fragment>
  ));
};

const ProximityNormalString = ({
  text,
  locale,
  className,
}: ProximityNormalStringProps) => {
  const isInteractive = useInteractiveText();
  const parts = text.split(site.name);

  if (!isInteractive) {
    return (
      <span className={cn('motion-normal-string', className)}>
        {renderStaticText(text)}
      </span>
    );
  }

  return (
    <span className={cn('motion-normal-string', className)}>
      {parts.map((part, index) => (
        <Fragment key={`${part}-${index}`}>
          {part && <ProximitySegment locale={locale} text={part} />}
          {index < parts.length - 1 && (
            <span className="brand-name">{site.name}</span>
          )}
        </Fragment>
      ))}
    </span>
  );
};

export default ProximityNormalString;
