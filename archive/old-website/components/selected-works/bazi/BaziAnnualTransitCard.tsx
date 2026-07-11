import React, { CSSProperties, useCallback, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { ANNUAL_TRANSIT_DEMO_RANGE, BAZI_SAMPLE_PILLARS, ELEMENT_COLORS } from '../../selectedWorksData';
import { clamp } from '../shared';
import { BaziPressableButton, GlyphSquare } from './BaziControls';
import { DAY_PILLAR, TRANSIT_NA_YIN, TRANSIT_STAGE } from './constants';
import { elementByGlyph, voidDisplayForTransitBranch } from './ganzhi';

function TransitPillarGrid({
  transitStem,
  transitBranch,
  pressed,
  glitchSignal,
}: {
  transitStem: string;
  transitBranch: string;
  pressed: boolean;
  glitchSignal?: number | string;
}) {
  const natalStems = BAZI_SAMPLE_PILLARS.map((pillar) => pillar.stem);
  const natalBranches = BAZI_SAMPLE_PILLARS.map((pillar) => pillar.branch);

  return (
    <div className="bazi-transit-grid">
      <GlyphSquare glyph={transitStem} showPinyin pressed={pressed} glitchSignal={glitchSignal} />
      <div aria-hidden />
      {natalStems.map((stem, index) => (
        <GlyphSquare key={`natal-stem-${index}`} glyph={stem} showPinyin />
      ))}

      <GlyphSquare glyph={transitBranch} showPinyin pressed={pressed} glitchSignal={glitchSignal} />
      <div aria-hidden />
      {natalBranches.map((branch, index) => (
        <GlyphSquare key={`natal-branch-${index}`} glyph={branch} showPinyin />
      ))}
    </div>
  );
}

function TransitInfoField({
  label,
  value,
  emphasis,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  emphasis?: boolean;
  accent?: CSSProperties;
}) {
  return (
    <div className="bazi-transit-field-wrap">
      <p className="bazi-transit-field-label">{label}</p>
      <BaziPressableButton
        className={`bazi-transit-field ${emphasis ? 'is-emphasis' : ''}`}
        style={accent}
        ariaLabel={`${label} value`}
      >
        {value}
      </BaziPressableButton>
    </div>
  );
}

export function AnnualTransitCard({
  transitIndex,
  setTransitIndex,
  onStepNavigate,
}: {
  transitIndex: number;
  setTransitIndex: (next: number) => void;
  onStepNavigate?: () => void;
}) {
  const [nowPressed, setNowPressed] = useState(false);
  const [linkedTransitGlyphGlitchSignal, setLinkedTransitGlyphGlitchSignal] = useState(0);
  const [linkedTransitNavGlitchSignal, setLinkedTransitNavGlitchSignal] = useState(0);

  const entry = ANNUAL_TRANSIT_DEMO_RANGE[transitIndex] ?? ANNUAL_TRANSIT_DEMO_RANGE[0];
  const age = entry.age;

  const stage = TRANSIT_STAGE[entry.age % TRANSIT_STAGE.length] ?? TRANSIT_STAGE[0];
  const naYin = TRANSIT_NA_YIN[entry.age % TRANSIT_NA_YIN.length] ?? TRANSIT_NA_YIN[0];
  const voidValue = DAY_PILLAR
    ? voidDisplayForTransitBranch(entry.branch, DAY_PILLAR.stem, DAY_PILLAR.branch)
    : '';
  const transitBranchColor = ELEMENT_COLORS[elementByGlyph(entry.branch)];
  const voidAccent: CSSProperties = voidValue
    ? {
        borderColor: transitBranchColor,
        backgroundColor: 'var(--bazi-secondary-background)',
        color: transitBranchColor,
      }
    : {
        borderColor: transitBranchColor,
        backgroundColor: transitBranchColor,
        color: 'var(--bazi-main-foreground)',
      };

  const triggerNowLinkedButtonGlitch = useCallback(() => {
    setLinkedTransitGlyphGlitchSignal((currentSignal) => currentSignal + 1);
    setLinkedTransitNavGlitchSignal((currentSignal) => currentSignal + 1);
  }, []);

  return (
    <article className="bazi-card bazi-section-card bazi-transit-card" data-bazi-update-glitch="transit-card">
      <div className="bazi-transit-header">
        <h3>Annual Transit {entry.year}, Age {age}</h3>
        <BaziPressableButton
          className="bazi-chip bazi-now-chip"
          onPointerDown={() => {
            setNowPressed(true);
            triggerNowLinkedButtonGlitch();
          }}
          onPointerUp={() => setNowPressed(false)}
          onPointerLeave={() => setNowPressed(false)}
          onPointerCancel={() => setNowPressed(false)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              triggerNowLinkedButtonGlitch();
            }
          }}
          onClick={() => {
            setNowPressed(false);
            const currentAge = new Date().getFullYear() - 1971;
            setTransitIndex(clamp(currentAge, 0, ANNUAL_TRANSIT_DEMO_RANGE.length - 1));
          }}
        >
          Now
        </BaziPressableButton>
      </div>

      <TransitPillarGrid
        transitStem={entry.stem}
        transitBranch={entry.branch}
        pressed={nowPressed}
        glitchSignal={linkedTransitGlyphGlitchSignal}
      />

      <div className="bazi-transit-info-row top-row">
        <TransitInfoField label="Stage" value={stage} />
        <TransitInfoField
          label="Void"
          value={voidValue}
          emphasis
          accent={voidAccent}
        />
        <TransitInfoField label="Tone" value={naYin} />
      </div>

      <div className="bazi-transit-nav">
        <BaziPressableButton
          className="bazi-chip bazi-nav-icon"
          glitchSignal={linkedTransitNavGlitchSignal}
          onClick={() => {
            setTransitIndex(clamp(transitIndex - 1, 0, ANNUAL_TRANSIT_DEMO_RANGE.length - 1));
            onStepNavigate?.();
          }}
          ariaLabel="Previous year"
        >
          <ArrowLeft size={20} />
        </BaziPressableButton>

        <input
          type="range"
          min={0}
          max={ANNUAL_TRANSIT_DEMO_RANGE.length - 1}
          step={1}
          value={transitIndex}
          onChange={(event) => setTransitIndex(Number(event.target.value))}
          className="bazi-range"
          aria-label="Annual transit year"
        />

        <BaziPressableButton
          className="bazi-chip bazi-nav-icon"
          glitchSignal={linkedTransitNavGlitchSignal}
          onClick={() => {
            setTransitIndex(clamp(transitIndex + 1, 0, ANNUAL_TRANSIT_DEMO_RANGE.length - 1));
            onStepNavigate?.();
          }}
          ariaLabel="Next year"
        >
          <ArrowRight size={20} />
        </BaziPressableButton>
      </div>
    </article>
  );
}
