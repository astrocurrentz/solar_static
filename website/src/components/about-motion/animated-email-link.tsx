'use client';

import UnderlineToBackground from '@/components/fancy/text/underline-to-background';
import type { Locale } from '@/data/site';
import { cn } from '@/lib/utils';

import { motionPresets } from './presets';
import { useInteractiveText } from './use-interactive-text';

interface AnimatedEmailLinkProps {
  text: string;
  locale: Locale;
  className?: string;
}

const AnimatedEmailLink = ({ text, className }: AnimatedEmailLinkProps) => {
  const isInteractive = useInteractiveText();

  if (!isInteractive) {
    return (
      <span className={cn('motion-email-text motion-email-static', className)}>
        {text}
      </span>
    );
  }

  return (
    <UnderlineToBackground
      as="span"
      className={cn('motion-email-text', className)}
      targetTextColor="var(--color-reversed)"
      transition={motionPresets.underline.transition}
      underlineHeightRatio={motionPresets.underline.underlineHeightRatio}
      underlinePaddingRatio={motionPresets.underline.underlinePaddingRatio}
    >
      {text}
    </UnderlineToBackground>
  );
};

export default AnimatedEmailLink;
