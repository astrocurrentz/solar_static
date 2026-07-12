import type { Locale } from '../../data/site';

export const motionMediaQuery = '(hover: hover) and (pointer: fine)';

export const fontVariationPresets = {
  hero: {
    from: "'wght' 740",
    to: "'wght' 800",
  },
  heading: {
    en: {
      from: "'wght' 700",
      to: "'wght' 800",
    },
    zh: {
      from: "'wght' 600",
      to: "'wght' 720",
    },
  },
  normal: {
    en: {
      from: "'wght' 400",
      to: "'wght' 650",
    },
    zh: {
      from: "'wght' 400",
      to: "'wght' 700",
    },
  },
} as const;

export const motionPresets = {
  cursor: {
    radius: 144,
    falloff: 'gaussian',
  },
  normalCursor: {
    radius: 168,
    falloff: 'gaussian',
  },
  orderedHeading: {
    staggerDuration: 0.026,
    staggerFrom: 'first',
    transition: {
      type: 'spring',
      duration: 0.46,
      bounce: 0,
    },
  },
  randomHeading: {
    staggerDuration: 0.022,
    transition: {
      type: 'spring',
      duration: 0.42,
      bounce: 0,
    },
  },
  scramble: {
    maxTicks: 11,
    scrambleSpeed: 40,
    revealDirection: 'start',
  },
  underline: {
    underlineHeightRatio: 0.1,
    underlinePaddingRatio: 0.015,
    transition: {
      type: 'spring',
      damping: 30,
      stiffness: 300,
    },
  },
} as const;

export const getHeadingFontVariation = (locale: Locale) =>
  fontVariationPresets.heading[locale];

export const getNormalFontVariation = (locale: Locale) =>
  fontVariationPresets.normal[locale];

export const getScrambleRevealStep = (text: string) => {
  const visibleLength = Array.from(text).filter(
    (character) => character !== ' ',
  ).length;

  return Math.max(
    1,
    Math.ceil(visibleLength / motionPresets.scramble.maxTicks),
  );
};
