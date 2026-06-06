import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Moon, Save, Sun } from 'lucide-react';
import {
  ALMANAC_ENERGY_COLORS,
  ALMANAC_ENERGY_LABELS,
  ELEMENT_COLORS,
  GENERAL_ALMANAC_DEMO,
  type AlmanacEnergyKey,
} from '../../selectedWorksData';
import { clamp } from '../shared';
import { BaziPressableButton, GlyphSquare } from './BaziControls';
import { ALMANAC_MAX_INDEX, ALMANAC_MIN_INDEX, LUCKY_COLOR_GLITCH_FRAMES, LUCKY_COLOR_GLITCH_STEP_MS } from './constants';
import { elementByGlyph } from './ganzhi';

function AlmanacEnergyBars({ entry }: { entry: (typeof GENERAL_ALMANAC_DEMO)[number] }) {
  return (
    <div className="bazi-energy-bars">
      {entry.energy.map((item) => {
        const key = item.key as AlmanacEnergyKey;
        const color = ALMANAC_ENERGY_COLORS[key];
        const label = ALMANAC_ENERGY_LABELS[key];

        return (
          <div key={`energy-row-${entry.date}-${item.key}`} className="bazi-energy-row">
            <div className="bazi-energy-row-head">
              <span>{label}</span>
              <span>{item.score}</span>
            </div>
            <div className="bazi-energy-track">
              <span
                className="bazi-energy-fill"
                style={{
                  width: `${Math.max(0, Math.min(100, item.score))}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LuckyColorCard({ colorHex }: { colorHex: string }) {
  const [displayColor, setDisplayColor] = useState(colorHex);
  const frameTimeoutRef = useRef<number | null>(null);
  const hasInitializedRef = useRef(false);

  const glitchPalette = useMemo(() => {
    const basePalette = Object.values(ELEMENT_COLORS);
    return Array.from(new Set([...basePalette, 'var(--glitch-warm)', 'var(--glitch-cool)', colorHex]));
  }, [colorHex]);

  const stopBlink = useCallback((settleToFinal = false) => {
    if (frameTimeoutRef.current !== null) {
      window.clearTimeout(frameTimeoutRef.current);
      frameTimeoutRef.current = null;
    }

    if (settleToFinal) {
      setDisplayColor(colorHex);
    }
  }, [colorHex]);

  const startBlink = useCallback(() => {
    stopBlink(false);

    let frame = 0;
    const runFrame = () => {
      if (frame >= LUCKY_COLOR_GLITCH_FRAMES) {
        setDisplayColor(colorHex);
        frameTimeoutRef.current = null;
        return;
      }

      const nextColor = glitchPalette[Math.floor(Math.random() * glitchPalette.length)] ?? colorHex;
      setDisplayColor(nextColor);
      frame += 1;
      frameTimeoutRef.current = window.setTimeout(runFrame, LUCKY_COLOR_GLITCH_STEP_MS);
    };

    runFrame();
  }, [colorHex, glitchPalette, stopBlink]);

  useEffect(() => (
    () => {
      stopBlink(true);
    }
  ), [stopBlink]);

  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      setDisplayColor(colorHex);
      return;
    }

    startBlink();
  }, [colorHex, startBlink]);

  return (
    <BaziPressableButton
      className="bazi-lucky-cell"
      style={{
        backgroundColor: displayColor,
        transition: 'background-color 72ms linear',
      }}
      ariaLabel="Lucky color"
      onPointerDown={startBlink}
    />
  );
}

export function GeneralAlmanacCard({
  index,
  setIndex,
  onStepNavigate,
}: {
  index: number;
  setIndex: (next: number) => void;
  onStepNavigate?: () => void;
}) {
  const entry = GENERAL_ALMANAC_DEMO[index] ?? GENERAL_ALMANAC_DEMO[0];
  const sixWordsStem = [entry.sixWords.year.stem, entry.sixWords.month.stem, entry.sixWords.day.stem];
  const sixWordsBranch = [entry.sixWords.year.branch, entry.sixWords.month.branch, entry.sixWords.day.branch];

  const timeIsNight = (() => {
    const [from] = entry.lucky.timeRange.split('-');
    const hour = Number(from?.split(':')[0] ?? '0');
    return hour >= 18 || hour < 6;
  })();

  const TimeIcon = timeIsNight ? Moon : Sun;

  return (
    <article className="bazi-card bazi-section-card bazi-almanac-card" data-bazi-update-glitch="almanac-card">
      <div className="bazi-almanac-top-row">
        <p className="bazi-almanac-date">Date:{entry.date.replace(/-/g, '/')}</p>
        <BaziPressableButton className="bazi-chip bazi-save-chip" ariaLabel="Save image">
          <Save size={18} />
        </BaziPressableButton>
      </div>

      <div className="bazi-almanac-two-col">
        <div className="bazi-card bazi-almanac-inner-card">
          <h4>Lucky Insights</h4>
          <div className="bazi-lucky-grid">
            <BaziPressableButton className="bazi-lucky-cell number" ariaLabel="Lucky number">
              {entry.lucky.number}
            </BaziPressableButton>
            <LuckyColorCard colorHex={entry.lucky.colorHex} />
            <BaziPressableButton
              className="bazi-lucky-cell direction"
              style={{ backgroundColor: ELEMENT_COLORS[elementByGlyph(entry.lucky.directionBranch)] }}
              ariaLabel="Lucky direction"
            >
              <span className="bazi-lucky-arrow">↗</span>
              <span className="bazi-lucky-glyph">{entry.lucky.directionBranch}</span>
            </BaziPressableButton>
            <BaziPressableButton className="bazi-lucky-cell time" ariaLabel="Lucky time range">
              <TimeIcon size={44} />
              <span>{entry.lucky.timeRange}</span>
            </BaziPressableButton>
          </div>
        </div>

        <div className="bazi-card bazi-almanac-inner-card">
          <h4>Energy Index</h4>
          <AlmanacEnergyBars entry={entry} />
        </div>
      </div>

      <div className="bazi-card bazi-almanac-inner-card bazi-six-glyphs-card">
        <h4>Today Six Glyphs</h4>
        <div className="bazi-six-glyphs-layout">
          <BaziPressableButton
            className="bazi-chip bazi-nav-icon"
            onClick={() => {
              setIndex(clamp(index - 1, ALMANAC_MIN_INDEX, ALMANAC_MAX_INDEX));
              onStepNavigate?.();
            }}
            ariaLabel="Previous Day"
          >
            <ArrowLeft size={20} />
          </BaziPressableButton>

          <div className="bazi-six-glyph-grid">
            {sixWordsStem.map((glyph, idx) => (
              <GlyphSquare key={`six-stem-${entry.date}-${idx}`} glyph={glyph} showPinyin />
            ))}
            {sixWordsBranch.map((glyph, idx) => (
              <GlyphSquare key={`six-branch-${entry.date}-${idx}`} glyph={glyph} showPinyin />
            ))}
          </div>

          <BaziPressableButton
            className="bazi-chip bazi-nav-icon"
            onClick={() => {
              setIndex(clamp(index + 1, ALMANAC_MIN_INDEX, ALMANAC_MAX_INDEX));
              onStepNavigate?.();
            }}
            ariaLabel="Next Day"
          >
            <ArrowRight size={20} />
          </BaziPressableButton>
        </div>
      </div>
    </article>
  );
}
