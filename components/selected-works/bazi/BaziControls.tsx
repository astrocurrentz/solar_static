import React, { CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  BAZI_UI_DEMO_DISCLAIMER,
  BRANCH_OPTIONS,
  ELEMENT_COLORS,
  STEM_OPTIONS,
} from '../../selectedWorksData';
import {
  BAZI_BUTTON_GLITCH_REVEAL_STEP,
  BAZI_BUTTON_GLITCH_STEP_MS,
} from './constants';
import {
  applyButtonIconGlitchFrame,
  collectButtonIconTargets,
  collectSectionTextTargets,
  scrambleSectionText,
  type ButtonIconTarget,
  type SectionTextTarget,
} from './glitch';
import { elementByGlyph, glyphPinyin } from './ganzhi';
import { clamp } from '../shared';

export function BaziPressableButton({
  children,
  className,
  style,
  glitchSignal,
  onClick,
  type = 'button',
  ariaLabel,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  onPointerCancel,
  onKeyDown,
}: React.PropsWithChildren<{
  className?: string;
  style?: CSSProperties;
  glitchSignal?: number | string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
  ariaLabel?: string;
  onPointerDown?: React.PointerEventHandler<HTMLButtonElement>;
  onPointerUp?: React.PointerEventHandler<HTMLButtonElement>;
  onPointerLeave?: React.PointerEventHandler<HTMLButtonElement>;
  onPointerCancel?: React.PointerEventHandler<HTMLButtonElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLButtonElement>;
}>) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const buttonGlitchIntervalRef = useRef<number | null>(null);
  const buttonGlitchTargetsRef = useRef<SectionTextTarget[]>([]);
  const buttonIconTargetsRef = useRef<ButtonIconTarget[]>([]);
  const previousButtonGlitchSignalRef = useRef<number | string | undefined>(undefined);

  const stopButtonTextGlitch = useCallback((restoreOriginalText = false) => {
    if (buttonGlitchIntervalRef.current !== null) {
      window.clearInterval(buttonGlitchIntervalRef.current);
      buttonGlitchIntervalRef.current = null;
    }

    if (restoreOriginalText) {
      buttonGlitchTargetsRef.current.forEach((target) => {
        if (target.node.isConnected) {
          target.node.data = target.originalText;
        }
      });

      buttonIconTargetsRef.current.forEach((target) => {
        if (!target.node.isConnected) {
          return;
        }

        target.node.style.transform = target.originalTransform;
        target.node.style.opacity = target.originalOpacity;
        target.node.style.filter = target.originalFilter;
        target.node.style.clipPath = target.originalClipPath;
      });
    }

    buttonGlitchTargetsRef.current = [];
    buttonIconTargetsRef.current = [];
  }, []);

  const startButtonTextGlitch = useCallback(() => {
    const buttonElement = buttonRef.current;
    if (!buttonElement) {
      return;
    }

    stopButtonTextGlitch(true);

    const targets = collectSectionTextTargets(buttonElement);
    const iconTargets = collectButtonIconTargets(buttonElement);
    if (!targets.length && !iconTargets.length) {
      return;
    }

    buttonGlitchTargetsRef.current = targets;
    buttonIconTargetsRef.current = iconTargets;

    let revealIndex = 0;
    const maxTextLength = targets.length
      ? Math.max(...targets.map((target) => target.originalText.length))
      : 0;
    const maxGlitchLength = Math.max(maxTextLength, iconTargets.length ? 24 : 0);

    buttonGlitchIntervalRef.current = window.setInterval(() => {
      targets.forEach((target) => {
        if (!target.node.isConnected) {
          return;
        }

        target.node.data = scrambleSectionText(target.originalText, revealIndex);
      });

      if (iconTargets.length) {
        const intensity = clamp(1 - revealIndex / Math.max(1, maxGlitchLength), 0, 1);
        applyButtonIconGlitchFrame(iconTargets, intensity);
      }

      if (revealIndex >= maxGlitchLength) {
        stopButtonTextGlitch(true);
        return;
      }

      revealIndex += BAZI_BUTTON_GLITCH_REVEAL_STEP;
    }, BAZI_BUTTON_GLITCH_STEP_MS);
  }, [stopButtonTextGlitch]);

  useEffect(() => (
    () => {
      stopButtonTextGlitch(true);
    }
  ), [stopButtonTextGlitch]);

  useEffect(() => {
    if (glitchSignal === undefined) {
      return;
    }

    if (previousButtonGlitchSignalRef.current === undefined) {
      previousButtonGlitchSignalRef.current = glitchSignal;
      return;
    }

    if (previousButtonGlitchSignalRef.current === glitchSignal) {
      return;
    }

    previousButtonGlitchSignalRef.current = glitchSignal;
    startButtonTextGlitch();
  }, [glitchSignal, startButtonTextGlitch]);

  const handlePointerDown: React.PointerEventHandler<HTMLButtonElement> = (event) => {
    startButtonTextGlitch();
    onPointerDown?.(event);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      startButtonTextGlitch();
    }

    onKeyDown?.(event);
  };

  return (
    <button
      ref={buttonRef}
      type={type}
      aria-label={ariaLabel}
      className={`bazi-pressable ${className ?? ''}`}
      style={style}
      onClick={onClick}
      onPointerDown={handlePointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      onPointerCancel={onPointerCancel}
      onKeyDown={handleKeyDown}
    >
      {children}
    </button>
  );
}

export function BaziDemoDisclaimer() {
  return <p className="bazi-demo-disclaimer">{BAZI_UI_DEMO_DISCLAIMER}</p>;
}

export function GanzhiButtonLabel({
  glyph,
  showPinyin,
  glyphClassName,
  pinyinClassName,
}: {
  glyph: string;
  showPinyin?: boolean;
  glyphClassName?: string;
  pinyinClassName?: string;
}) {
  if (!glyph) {
    return null;
  }

  const pinyin = glyphPinyin(glyph);
  if (!showPinyin || !pinyin) {
    return <span className={glyphClassName}>{glyph}</span>;
  }

  return (
    <span className="inline-flex flex-col items-center justify-center gap-1">
      <span className={pinyinClassName}>({pinyin})</span>
      <span className={glyphClassName}>{glyph}</span>
    </span>
  );
}

export type GlyphSquareProps = {
  glyph: string;
  showPinyin?: boolean;
  className?: string;
  style?: CSSProperties;
  glitchSignal?: number | string;
  onClick?: () => void;
  pressed?: boolean;
  ariaLabel?: string;
} & React.Attributes;

export function GlyphSquare({
  glyph,
  showPinyin,
  className,
  style,
  glitchSignal,
  onClick,
  pressed,
  ariaLabel,
}: GlyphSquareProps) {
  const element = glyph ? elementByGlyph(glyph) : null;

  return (
    <BaziPressableButton
      ariaLabel={ariaLabel}
      className={`bazi-glyph-square ${className ?? ''}`}
      glitchSignal={glitchSignal}
      style={{
        backgroundColor: element ? ELEMENT_COLORS[element] : 'var(--bazi-secondary-background)',
        color: element ? 'var(--bazi-main-foreground)' : 'var(--bazi-foreground)',
        ...(pressed
          ? {
              transform: 'translate(var(--bazi-press-x), var(--bazi-press-y))',
              boxShadow: 'none',
            }
          : undefined),
        ...style,
      }}
      onClick={onClick}
    >
      {glyph ? (
        <GanzhiButtonLabel
          glyph={glyph}
          showPinyin={showPinyin}
          glyphClassName="bazi-glyph-text"
          pinyinClassName="bazi-pinyin-text"
        />
      ) : null}
    </BaziPressableButton>
  );
}

export function NativeSelect({
  value,
  options,
  placeholder,
  onChange,
}: {
  value: string;
  options: string[];
  placeholder: string;
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target || !rootRef.current || rootRef.current.contains(target)) {
        return;
      }
      setIsOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setIsOpen(false);
  };

  const triggerLabel = value || placeholder;

  return (
    <div className="bazi-native-select-wrap">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="bazi-input-field bazi-input-select bazi-native-select bazi-native-select-mobile"
      >
        <option value="">{placeholder}</option>
        {options.map((optionValue) => (
          <option key={`select-option-${optionValue}`} value={optionValue}>
            {optionValue}
          </option>
        ))}
      </select>
      <ChevronDown className="bazi-select-chevron bazi-select-chevron-mobile" size={20} />

      <div ref={rootRef} className="bazi-custom-select-desktop">
        <button
          type="button"
          className={`bazi-input-field bazi-input-select bazi-custom-select-trigger ${value ? 'has-value' : 'is-placeholder'} ${isOpen ? 'is-open' : ''}`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
        >
          <span>{triggerLabel}</span>
          <ChevronDown className="bazi-select-chevron bazi-select-chevron-desktop" size={20} />
        </button>

        {isOpen && (
          <div className="bazi-custom-select-menu" role="listbox" aria-label={placeholder}>
            {options.map((optionValue) => (
              <button
                key={`custom-select-option-${optionValue}`}
                type="button"
                role="option"
                aria-selected={optionValue === value}
                className={`bazi-custom-select-option ${optionValue === value ? 'is-selected' : ''}`}
                onClick={() => handleSelect(optionValue)}
              >
                {optionValue}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
