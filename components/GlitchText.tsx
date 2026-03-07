import React, { useEffect, useRef, useState } from 'react';

interface GlitchTextProps {
  text?: string;
  texts?: string[];
  autoLoop?: boolean;
  shuffleLoop?: boolean;
  loopIntervalMs?: number;
  loopIntervalOverridesMs?: Record<string, number>;
  wrapToWidth?: boolean;
  wrapToWidthDesktopOnly?: boolean;
  scrambleOnMount?: boolean;
  scrambleSignal?: number | string;
  scrambleStepMs?: number;
  scrambleRevealStep?: number;
  accentLettersEnabled?: boolean;
  className?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&?!<>';
const SCRAMBLE_STEP_MS = 30;
const SCRAMBLE_REVEAL_STEP = 1/3;
const ACCENT_LETTER_PROBABILITY = 0.35;
const normalizeLoopValue = (value: string) => value.replace(/-\n/g, '').replace(/\n/g, '');

const shuffleLoopSequence = (items: string[], previousItems?: string[]) => {
  if (items.length <= 1) {
    return [...items];
  }

  let shuffledItems = [...items];
  let attempts = 0;

  do {
    shuffledItems = [...items];

    for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffledItems[index], shuffledItems[randomIndex]] = [shuffledItems[randomIndex], shuffledItems[index]];
    }

    attempts += 1;
  } while (
    previousItems
    && previousItems.length === shuffledItems.length
    && shuffledItems.every((item, index) => item === previousItems[index])
    && attempts < 8
  );

  return shuffledItems;
};

const GlitchText: React.FC<GlitchTextProps> = ({
  text,
  texts,
  autoLoop = false,
  shuffleLoop = true,
  loopIntervalMs = 0,
  loopIntervalOverridesMs,
  wrapToWidth = true,
  wrapToWidthDesktopOnly = false,
  scrambleOnMount = true,
  scrambleSignal,
  scrambleStepMs = SCRAMBLE_STEP_MS,
  scrambleRevealStep = SCRAMBLE_REVEAL_STEP,
  accentLettersEnabled = true,
  className = '',
  tag: Tag = 'span',
}) => {
  const sequence = texts?.length ? texts : text ? [text] : [''];
  const sequenceKey = sequence.join('\u0000');
  const initialPlaybackSequence = autoLoop && shuffleLoop ? shuffleLoopSequence(sequence) : [...sequence];
  const [displayText, setDisplayText] = useState(initialPlaybackSequence[0] ?? '');
  const [activeIndex, setActiveIndex] = useState(0);
  const [accentIndex, setAccentIndex] = useState<number | null>(null);
  const [availableWidth, setAvailableWidth] = useState(0);
  const [singleLineHeight, setSingleLineHeight] = useState(0);
  const [isDesktopViewport, setIsDesktopViewport] = useState(() => window.matchMedia('(min-width: 768px)').matches);
  const [wrappedSequence, setWrappedSequence] = useState(sequence);
  const [playbackSequence, setPlaybackSequence] = useState(initialPlaybackSequence);
  const scrambleIntervalRef = useRef<number | null>(null);
  const loopTimeoutRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const measureRef = useRef<HTMLSpanElement | null>(null);
  const wrappedSequenceRef = useRef(wrappedSequence);
  const playbackSequenceRef = useRef(playbackSequence);
  const hasInitializedRef = useRef(false);
  const previousScrambleSignalRef = useRef<number | string | undefined>(undefined);

  const playbackSequenceKey = playbackSequence.join('\u0000');
  const shouldWrapToWidth = wrapToWidth && (!wrapToWidthDesktopOnly || isDesktopViewport);
  const longestText = wrappedSequence.reduce((longest, current) => (
    current.length > longest.length ? current : longest
  ), wrappedSequence[0] ?? '');
  const visibleLineCount = Math.max(1, displayText.split('\n').length);

  const clearTimers = () => {
    if (scrambleIntervalRef.current) {
      window.clearInterval(scrambleIntervalRef.current);
      scrambleIntervalRef.current = null;
    }

    if (loopTimeoutRef.current) {
      window.clearTimeout(loopTimeoutRef.current);
      loopTimeoutRef.current = null;
    }
  };

  const measureTextWidth = (value: string) => {
    if (!measureRef.current) {
      return 0;
    }

    measureRef.current.textContent = value;
    return measureRef.current.getBoundingClientRect().width;
  };

  const wrapWordToWidth = (word: string, width: number) => {
    if (!width || !measureRef.current || measureTextWidth(word) <= width) {
      return word;
    }

    const lines: string[] = [];
    let cursor = 0;

    while (cursor < word.length) {
      const remainingText = word.slice(cursor);
      if (measureTextWidth(remainingText) <= width) {
        lines.push(remainingText);
        break;
      }

      let sliceEnd = cursor + 1;

      while (sliceEnd < word.length && measureTextWidth(`${word.slice(cursor, sliceEnd)}-`) <= width) {
        sliceEnd += 1;
      }

      const resolvedEnd = Math.max(cursor + 1, sliceEnd - 1);
      const segment = word.slice(cursor, resolvedEnd);
      const hasMore = resolvedEnd < word.length;
      lines.push(hasMore ? `${segment}-` : segment);
      cursor = resolvedEnd;
    }

    return lines.join('\n');
  };

  const queueNextLoop = (nextIndex: number) => {
    if (!autoLoop || playbackSequenceRef.current.length <= 1) {
      return;
    }

    const currentLoopValue = playbackSequenceRef.current[nextIndex] ?? '';
    const resolvedLoopIntervalMs = loopIntervalOverridesMs?.[normalizeLoopValue(currentLoopValue)] ?? loopIntervalMs;

    loopTimeoutRef.current = window.setTimeout(() => {
      const currentPlaybackSequence = playbackSequenceRef.current;

      if (nextIndex >= currentPlaybackSequence.length - 1) {
        if (shuffleLoop) {
          const nextPlaybackSequence = shuffleLoopSequence(wrappedSequenceRef.current, currentPlaybackSequence);
          playbackSequenceRef.current = nextPlaybackSequence;
          setPlaybackSequence(nextPlaybackSequence);
        }
        setActiveIndex(0);
        return;
      }

      setActiveIndex(nextIndex + 1);
    }, resolvedLoopIntervalMs);
  };

  const pickAccentIndex = (targetText: string) => {
    if (!accentLettersEnabled) {
      return null;
    }

    const candidates = targetText
      .split('')
      .map((char, index) => (char === '\n' ? -1 : index))
      .filter((index) => index >= 0);

    if (!candidates.length || Math.random() > ACCENT_LETTER_PROBABILITY) {
      return null;
    }

    return candidates[Math.floor(Math.random() * candidates.length)] ?? null;
  };

  const startScramble = (targetText: string, nextIndex: number) => {
    let iteration = 0;
    clearTimers();

    scrambleIntervalRef.current = window.setInterval(() => {
      setDisplayText(
        targetText
          .split('')
          .map((char, index) => {
            if (char === '\n' || index < iteration) {
              return targetText[index];
            }

            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join('')
      );

      if (iteration >= targetText.length) {
        setDisplayText(targetText);
        clearTimers();
        queueNextLoop(nextIndex);
      }

      iteration += scrambleRevealStep;
    }, scrambleStepMs);
  };

  useEffect(() => {
    wrappedSequenceRef.current = wrappedSequence;
  }, [wrappedSequence]);

  useEffect(() => {
    playbackSequenceRef.current = playbackSequence;
  }, [playbackSequence]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const updateWidth = () => {
      setAvailableWidth(container.clientWidth);

      if (measureRef.current) {
        measureRef.current.textContent = 'M';
        setSingleLineHeight(measureRef.current.getBoundingClientRect().height);
      }
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!wrapToWidthDesktopOnly) {
      return;
    }

    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const handleMediaChange = (event: MediaQueryListEvent) => {
      setIsDesktopViewport(event.matches);
    };

    setIsDesktopViewport(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleMediaChange);

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, [wrapToWidthDesktopOnly]);

  useEffect(() => {
    if (!sequence.length) {
      return;
    }

    const nextWrappedSequence = !shouldWrapToWidth || !availableWidth
      ? sequence
      : sequence.map((word) => wrapWordToWidth(word, availableWidth));

    wrappedSequenceRef.current = nextWrappedSequence;
    setWrappedSequence(nextWrappedSequence);

    setPlaybackSequence((currentPlaybackSequence) => {
      const nextPlaybackSequence = autoLoop && nextWrappedSequence.length > 1 && shuffleLoop
        ? shuffleLoopSequence(nextWrappedSequence, currentPlaybackSequence)
        : [...nextWrappedSequence];

      playbackSequenceRef.current = nextPlaybackSequence;
      return nextPlaybackSequence;
    });

    setActiveIndex(0);
  }, [autoLoop, availableWidth, sequenceKey, shouldWrapToWidth, shuffleLoop]);

  useEffect(() => {
    if (accentLettersEnabled) {
      return;
    }

    setAccentIndex(null);
  }, [accentLettersEnabled]);

  useEffect(() => {
    if (!playbackSequence.length) {
      return;
    }

    const resolvedIndex = activeIndex % playbackSequence.length;
    const nextText = playbackSequence[resolvedIndex] ?? '';
    setAccentIndex(pickAccentIndex(nextText));

    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;

      if (!scrambleOnMount) {
        setDisplayText(nextText);
        queueNextLoop(resolvedIndex);
        return;
      }
    }

    setDisplayText(nextText);
    startScramble(nextText, resolvedIndex);

    return () => {
      clearTimers();
    };
  }, [activeIndex, autoLoop, loopIntervalMs, loopIntervalOverridesMs, playbackSequenceKey, accentLettersEnabled, scrambleOnMount, scrambleRevealStep, scrambleStepMs]);

  useEffect(() => {
    if (scrambleSignal === undefined) {
      return;
    }

    if (previousScrambleSignalRef.current === undefined) {
      previousScrambleSignalRef.current = scrambleSignal;
      return;
    }

    if (previousScrambleSignalRef.current === scrambleSignal || !playbackSequence.length) {
      return;
    }

    previousScrambleSignalRef.current = scrambleSignal;

    const resolvedIndex = activeIndex % playbackSequence.length;
    const nextText = playbackSequence[resolvedIndex] ?? '';
    setAccentIndex(pickAccentIndex(nextText));
    startScramble(nextText, resolvedIndex);
  }, [activeIndex, accentLettersEnabled, playbackSequence, scrambleRevealStep, scrambleSignal, scrambleStepMs]);

  return (
    <Tag
      ref={(node) => {
        containerRef.current = node as HTMLElement | null;
      }}
      className={`${className} relative inline-block max-w-full cursor-default whitespace-pre`}
      style={singleLineHeight ? { height: `${singleLineHeight * visibleLineCount}px` } : undefined}
    >
      <span
        ref={measureRef}
        className="pointer-events-none absolute left-0 top-0 whitespace-pre opacity-0"
        aria-hidden="true"
      />
      <span className="invisible inline-block h-0 overflow-hidden whitespace-pre">{longestText}</span>
      <span className="absolute bottom-0 left-0 right-0 block">
        {displayText.split('').map((char, index) => (
          char === '\n'
            ? <br key={`break-${index}`} />
            : (
              <span
                key={`char-${index}`}
                className={accentLettersEnabled && index === accentIndex ? 'text-[var(--accent-secondary)]' : undefined}
              >
                {char}
              </span>
            )
        ))}
      </span>
    </Tag>
  );
};

export default GlitchText;
