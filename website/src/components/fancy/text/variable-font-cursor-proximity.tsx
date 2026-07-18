'use client';

import React, { type ElementType, forwardRef, useMemo, useRef } from 'react';
import { motion, useAnimationFrame } from 'motion/react';

import { useMousePositionRef } from '@/hooks/use-mouse-position-ref';
import { cn } from '@/lib/utils';

interface TextProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  as?: ElementType;
  fromFontVariationSettings: string;
  toFontVariationSettings: string;
  containerRef: React.RefObject<HTMLElement | null>;
  radius?: number;
  falloff?: 'linear' | 'exponential' | 'gaussian';
  reserveLayout?: boolean;
}

const parseFontVariationSettings = (settings: string) =>
  new Map(
    settings
      .split(',')
      .map((setting) => setting.trim())
      .filter(Boolean)
      .map((setting) => {
        const [name, value] = setting.split(' ');

        return [name.replace(/['"]/g, ''), Number.parseFloat(value)];
      }),
  );

const getDistance = (x1: number, y1: number, x2: number, y2: number) =>
  Math.hypot(x2 - x1, y2 - y1);

const getFalloff = (
  distance: number,
  radius: number,
  falloff: NonNullable<TextProps['falloff']>,
) => {
  const normalizedDistance = Math.min(Math.max(1 - distance / radius, 0), 1);

  if (falloff === 'exponential') {
    return normalizedDistance ** 2;
  }

  if (falloff === 'gaussian') {
    return Math.exp(-((distance / (radius / 2)) ** 2) / 2);
  }

  return normalizedDistance;
};

const VariableFontCursorProximity = forwardRef<HTMLElement, TextProps>(
  (
    {
      children,
      as = 'span',
      fromFontVariationSettings,
      toFontVariationSettings,
      containerRef,
      radius = 50,
      falloff = 'linear',
      reserveLayout = false,
      className,
      ...props
    },
    ref,
  ) => {
    const letterRefs = useRef<Array<HTMLSpanElement | null>>([]);
    const mousePositionRef = useMousePositionRef(containerRef);

    const parsedSettings = useMemo(() => {
      const fromSettings = parseFontVariationSettings(
        fromFontVariationSettings,
      );
      const toSettings = parseFontVariationSettings(toFontVariationSettings);

      return Array.from(fromSettings.entries()).map(([axis, fromValue]) => ({
        axis,
        fromValue,
        toValue: toSettings.get(axis) ?? fromValue,
      }));
    }, [fromFontVariationSettings, toFontVariationSettings]);

    useAnimationFrame(() => {
      if (!containerRef.current) {
        return;
      }

      const mousePosition = mousePositionRef.current;
      const containerRect = containerRef.current.getBoundingClientRect();

      letterRefs.current.forEach((letterRef) => {
        if (!letterRef) {
          return;
        }

        const rect = letterRef.getBoundingClientRect();
        const letterCenterX = rect.left + rect.width / 2 - containerRect.left;
        const letterCenterY = rect.top + rect.height / 2 - containerRect.top;
        const distance = getDistance(
          mousePosition.x,
          mousePosition.y,
          letterCenterX,
          letterCenterY,
        );

        if (distance >= radius) {
          letterRef.style.fontVariationSettings = fromFontVariationSettings;
          return;
        }

        const strength = getFalloff(distance, radius, falloff);
        letterRef.style.fontVariationSettings = parsedSettings
          .map(({ axis, fromValue, toValue }) => {
            const value = fromValue + (toValue - fromValue) * strength;

            return `'${axis}' ${value}`;
          })
          .join(', ');
      });
    });

    const words = String(children).split(' ');
    let letterIndex = 0;
    const ElementTag = as;

    return (
      <ElementTag
        className={cn('motion-proximity-text', className)}
        data-text={children}
        ref={ref}
        {...props}
      >
        {words.map((word, wordIndex) => (
          <span aria-hidden="true" className="motion-word" key={wordIndex}>
            {word.split('').map((letter) => {
              const currentLetterIndex = letterIndex;
              letterIndex += 1;

              const animatedLetter = (
                <motion.span
                  aria-hidden="true"
                  className="motion-letter"
                  ref={(element: HTMLSpanElement | null) => {
                    letterRefs.current[currentLetterIndex] = element;
                  }}
                  style={{
                    fontVariationSettings: fromFontVariationSettings,
                  }}
                >
                  {letter}
                </motion.span>
              );

              if (!reserveLayout) {
                return (
                  <React.Fragment key={currentLetterIndex}>
                    {animatedLetter}
                  </React.Fragment>
                );
              }

              return (
                <span
                  aria-hidden="true"
                  className="motion-letter-slot"
                  key={currentLetterIndex}
                >
                  <span
                    aria-hidden="true"
                    className="motion-letter-reserve"
                    style={{
                      fontVariationSettings: toFontVariationSettings,
                    }}
                  >
                    {letter}
                  </span>
                  {animatedLetter}
                </span>
              );
            })}
            {wordIndex < words.length - 1 && (
              <span aria-hidden="true" className="motion-space">
                &nbsp;
              </span>
            )}
          </span>
        ))}
        <span className="motion-sr-only">{children}</span>
      </ElementTag>
    );
  },
);

VariableFontCursorProximity.displayName = 'VariableFontCursorProximity';

export default VariableFontCursorProximity;
