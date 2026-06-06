import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Moon, Sun } from 'lucide-react';
import {
  BAZI_HOME_COLOR_SEQUENCE,
  BAZI_HOME_COLOR_STORAGE_KEY,
  BAZI_INTRO_TEXT,
  createEmptyDirectEntryState,
  normalizeColorCycleIndex,
  type BaziDemoThemeMode,
  type DirectEntryState,
  type PillarSlot,
} from '../selectedWorksData';
import { clamp, OccasionalGlitchText } from './shared';
import { GeneralAlmanacCard } from './bazi/BaziAlmanacCard';
import { AnnualTransitCard } from './bazi/BaziAnnualTransitCard';
import { BaziChartSection } from './bazi/BaziChartSection';
import { BaziDemoDisclaimer, BaziPressableButton } from './bazi/BaziControls';
import { ElementsDistributionCard } from './bazi/BaziElementsCard';
import { BaziInputSection, PillarPickerDialog } from './bazi/BaziInputSection';
import { InfluenceNetworkCard } from './bazi/BaziNetworkCard';
import {
  ALMANAC_MAX_INDEX,
  ALMANAC_MIN_INDEX,
  BAZI_SECTION_GLITCH_REVEAL_STEP,
  BAZI_SECTION_GLITCH_STEP_MS,
  SECTION_CONTENT_MIN_HEIGHT_STYLE,
  SECTION_MIN_HEIGHT_STYLE,
} from './bazi/constants';
import { collectSectionTextTargets, scrambleSectionText, type SectionTextTarget } from './bazi/glitch';
import type { DirectPickerState, InputMode } from './bazi/types';

function BaziIntroParagraph() {
  const parts = BAZI_INTRO_TEXT.split('**');
  if (parts.length < 3) {
    return <span>{BAZI_INTRO_TEXT.replace(/\*\*/g, '')}</span>;
  }

  return (
    <>
      <strong>{parts[1]}</strong>
      {parts.slice(2).join('')}
    </>
  );
}

export function BaziSelectedWorkPage() {
  const [themeMode, setThemeMode] = useState<BaziDemoThemeMode>('dark');
  const [inputMode, setInputMode] = useState<InputMode>('birthProfile');
  const [baziButtonColorIndex, setBaziButtonColorIndex] = useState(0);
  const [picker, setPicker] = useState<DirectPickerState>(null);
  const [directEntry, setDirectEntry] = useState<DirectEntryState>(createEmptyDirectEntryState);
  const [directEntryBirthYear, setDirectEntryBirthYear] = useState('');
  const [clearPressed, setClearPressed] = useState(false);

  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthHour, setBirthHour] = useState('');
  const [birthMinute, setBirthMinute] = useState('');
  const [birthPeriod, setBirthPeriod] = useState('');
  const [cityQuery, setCityQuery] = useState('');

  const [transitIndex, setTransitIndex] = useState(55);
  const [almanacIndex, setAlmanacIndex] = useState(10);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [transitStepScrambleSignal, setTransitStepScrambleSignal] = useState(0);
  const [almanacStepScrambleSignal, setAlmanacStepScrambleSignal] = useState(0);
  const [networkCaptionGlitchSignal, setNetworkCaptionGlitchSignal] = useState(0);
  const [elementsCaptionGlitchSignal, setElementsCaptionGlitchSignal] = useState(0);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const activeSectionRef = useRef<string | null>(null);
  const sectionGlitchIntervalRef = useRef<number | null>(null);
  const sectionGlitchTargetsRef = useRef<SectionTextTarget[]>([]);

  useEffect(() => {
    const stored = Number.parseInt(window.localStorage.getItem(BAZI_HOME_COLOR_STORAGE_KEY) ?? '0', 10);
    setBaziButtonColorIndex(normalizeColorCycleIndex(Number.isFinite(stored) ? stored : 0));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(BAZI_HOME_COLOR_STORAGE_KEY, String(baziButtonColorIndex));
  }, [baziButtonColorIndex]);

  const stopSectionTextGlitch = useCallback((restoreOriginalText = false) => {
    if (sectionGlitchIntervalRef.current !== null) {
      window.clearInterval(sectionGlitchIntervalRef.current);
      sectionGlitchIntervalRef.current = null;
    }

    if (restoreOriginalText) {
      sectionGlitchTargetsRef.current.forEach((target) => {
        if (target.node.isConnected) {
          target.node.data = target.originalText;
        }
      });
    }

    sectionGlitchTargetsRef.current = [];
  }, []);

  const startSectionTextGlitch = useCallback((sectionElement: HTMLElement) => {
    stopSectionTextGlitch(true);

    const targets = collectSectionTextTargets(sectionElement);
    if (!targets.length) {
      return;
    }

    sectionGlitchTargetsRef.current = targets;

    let revealIndex = 0;
    const maxTextLength = Math.max(...targets.map((target) => target.originalText.length));

    sectionGlitchIntervalRef.current = window.setInterval(() => {
      targets.forEach((target) => {
        if (!target.node.isConnected) {
          return;
        }

        target.node.data = scrambleSectionText(target.originalText, revealIndex);
      });

      if (revealIndex >= maxTextLength) {
        stopSectionTextGlitch(true);
        return;
      }

      revealIndex += BAZI_SECTION_GLITCH_REVEAL_STEP;
    }, BAZI_SECTION_GLITCH_STEP_MS);
  }, [stopSectionTextGlitch]);

  const triggerTextGlitchBySelector = useCallback((selector: string) => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) {
      return;
    }

    const targetElement = scrollContainer.querySelector<HTMLElement>(selector);
    if (!targetElement) {
      return;
    }

    startSectionTextGlitch(targetElement);
  }, [startSectionTextGlitch]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) {
      return;
    }

    const sectionElements: HTMLElement[] = Array.from(scrollContainer.querySelectorAll('[data-bazi-section-id]'));
    if (!sectionElements.length) {
      return;
    }

    let frameId: number | null = null;

    const updateActiveSection = () => {
      const containerTop = scrollContainer.getBoundingClientRect().top;
      let nextSectionId: string | null = null;
      let nearestOffset = Number.POSITIVE_INFINITY;

      sectionElements.forEach((sectionElement) => {
        const sectionId = sectionElement.dataset.baziSectionId;
        if (!sectionId) {
          return;
        }

        const offset = Math.abs(sectionElement.getBoundingClientRect().top - containerTop);
        if (offset < nearestOffset) {
          nearestOffset = offset;
          nextSectionId = sectionId;
        }
      });

      if (!nextSectionId || nextSectionId === activeSectionRef.current) {
        return;
      }

      activeSectionRef.current = nextSectionId;
      setActiveSectionId(nextSectionId);
    };

    const scheduleActiveSectionUpdate = () => {
      if (frameId !== null) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        updateActiveSection();
      });
    };

    scheduleActiveSectionUpdate();
    scrollContainer.addEventListener('scroll', scheduleActiveSectionUpdate, { passive: true });
    window.addEventListener('resize', scheduleActiveSectionUpdate);

    return () => {
      scrollContainer.removeEventListener('scroll', scheduleActiveSectionUpdate);
      window.removeEventListener('resize', scheduleActiveSectionUpdate);

      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || !activeSectionId) {
      return;
    }

    const sectionElement = scrollContainer.querySelector<HTMLElement>(`[data-bazi-section-id="${activeSectionId}"]`);
    if (!sectionElement) {
      return;
    }

    startSectionTextGlitch(sectionElement);
  }, [activeSectionId, startSectionTextGlitch]);

  useEffect(() => {
    if (activeSectionId === 'network') {
      setNetworkCaptionGlitchSignal((currentSignal) => currentSignal + 1);
      return;
    }

    if (activeSectionId === 'elements') {
      setElementsCaptionGlitchSignal((currentSignal) => currentSignal + 1);
    }
  }, [activeSectionId]);

  useEffect(() => (
    () => {
      stopSectionTextGlitch(true);
    }
  ), [stopSectionTextGlitch]);

  useEffect(() => {
    if (transitStepScrambleSignal === 0) {
      return;
    }

    triggerTextGlitchBySelector('[data-bazi-update-glitch="transit-card"]');
  }, [transitStepScrambleSignal, triggerTextGlitchBySelector]);

  useEffect(() => {
    if (almanacStepScrambleSignal === 0) {
      return;
    }

    triggerTextGlitchBySelector('[data-bazi-update-glitch="almanac-card"]');
  }, [almanacStepScrambleSignal, triggerTextGlitchBySelector]);

  const baziButtonColor = BAZI_HOME_COLOR_SEQUENCE[baziButtonColorIndex] ?? BAZI_HOME_COLOR_SEQUENCE[0];
  const baziButtonTransitionClass = baziButtonColorIndex > 0 ? 'bazi-color-transition' : '';

  const setDirectCell = (slot: PillarSlot, kind: 'stem' | 'branch', index: number) => {
    setDirectEntry((current) => ({
      ...current,
      [slot]: {
        ...current[slot],
        [kind]: index,
      },
    }));
  };

  const clearDirectEntry = () => {
    setDirectEntry(createEmptyDirectEntryState());
    setDirectEntryBirthYear('');
  };

  const navigateToSelectedWorks = () => {
    if (window.location.pathname === '/selected-works') {
      return;
    }
    window.history.pushState({}, '', '/selected-works');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <main className={`bazi-demo bazi-page-shell relative h-[100dvh] min-h-[100dvh] overflow-hidden ${themeMode === 'dark' ? 'dark' : ''}`}>
      <div className="bazi-demo-grid pointer-events-none absolute inset-0" />

      <div className="bazi-fixed-chip bazi-fixed-left absolute z-30">
        <BaziPressableButton
          className="bazi-chip bazi-chip-small bazi-back-chip"
          onClick={navigateToSelectedWorks}
          ariaLabel="Back to Selected Works"
        >
          <ArrowLeft size={14} className="bazi-back-chip-icon" />
          <span>SW</span>
        </BaziPressableButton>
      </div>

      <div className="bazi-fixed-chip bazi-fixed-right absolute z-30">
        <BaziPressableButton
          className="bazi-chip bazi-chip-small bazi-theme-icon-chip"
          onClick={() => setThemeMode((currentMode) => (currentMode === 'light' ? 'dark' : 'light'))}
          ariaLabel="Toggle BaZi theme"
        >
          {themeMode === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </BaziPressableButton>
      </div>

      <div ref={scrollContainerRef} className="bazi-scroll-hidden relative h-full overflow-y-auto snap-y snap-mandatory">
        <section
          className="bazi-section bazi-section-shell bazi-section-s8 snap-start"
          style={SECTION_MIN_HEIGHT_STYLE}
          data-bazi-section-id="intro"
        >
          <div className="bazi-section-inner mx-auto flex w-full max-w-4xl flex-col items-center justify-center gap-8 pb-12 pt-6 text-center" style={SECTION_CONTENT_MIN_HEIGHT_STYLE}>
            <BaziPressableButton
              className={`bazi-home-button ${baziButtonTransitionClass}`}
              style={{
                backgroundColor: baziButtonColor.background,
                color: baziButtonColor.color,
              }}
              onClick={() => {
                setBaziButtonColorIndex((current) => normalizeColorCycleIndex(current + 1));
              }}
              ariaLabel="Bā Zì"
            >
              <span className="bazi-home-button-stack">
                <span className="bazi-home-button-line">Bā</span>
                <span className="bazi-home-button-line">Zì</span>
              </span>
            </BaziPressableButton>

            <p className="bazi-intro-text">
              <BaziIntroParagraph />
            </p>
          </div>
        </section>

        <section
          className="bazi-section bazi-section-shell bazi-input-section bazi-section-s2 snap-start"
          style={SECTION_MIN_HEIGHT_STYLE}
          data-bazi-section-id="input"
        >
          <div className="bazi-section-inner bazi-input-section-inner mx-auto grid w-full max-w-5xl items-start gap-4 pb-12 pt-2" style={SECTION_CONTENT_MIN_HEIGHT_STYLE}>
            <BaziInputSection
              inputMode={inputMode}
              setInputMode={setInputMode}
              birthYear={birthYear}
              setBirthYear={setBirthYear}
              birthMonth={birthMonth}
              setBirthMonth={setBirthMonth}
              birthDay={birthDay}
              setBirthDay={setBirthDay}
              birthHour={birthHour}
              setBirthHour={setBirthHour}
              birthMinute={birthMinute}
              setBirthMinute={setBirthMinute}
              birthPeriod={birthPeriod}
              setBirthPeriod={setBirthPeriod}
              cityQuery={cityQuery}
              setCityQuery={setCityQuery}
              directEntry={directEntry}
              directEntryBirthYear={directEntryBirthYear}
              setDirectEntryBirthYear={setDirectEntryBirthYear}
              clearDirectEntry={clearDirectEntry}
              clearPressed={clearPressed}
              setClearPressed={setClearPressed}
              onOpenPicker={(slot, kind) => setPicker({ slot, kind })}
            />

            <PillarPickerDialog
              picker={picker}
              onClose={() => setPicker(null)}
              onSelect={(index) => {
                if (!picker) return;
                setDirectCell(picker.slot, picker.kind, index);
                setPicker(null);
              }}
            />

            <BaziDemoDisclaimer />
          </div>
        </section>

        <section
          className="bazi-section bazi-section-shell bazi-section-s3 snap-start"
          style={SECTION_MIN_HEIGHT_STYLE}
          data-bazi-section-id="chart"
        >
          <div className="bazi-section-inner bazi-disclaimer-section mx-auto w-full max-w-5xl gap-4 pb-12 pt-4" style={SECTION_CONTENT_MIN_HEIGHT_STYLE}>
            <div className="bazi-disclaimer-main">
              <BaziChartSection />
            </div>
            <BaziDemoDisclaimer />
          </div>
        </section>

        <section
          className="bazi-section bazi-section-shell bazi-network-section bazi-section-s4 snap-start"
          style={SECTION_MIN_HEIGHT_STYLE}
          data-disable-custom-cursor="true"
          data-bazi-section-id="network"
        >
          <div
            className="bazi-section-inner bazi-disclaimer-section bazi-network-section-inner mx-auto w-full max-w-5xl gap-4 pb-12 pt-4"
            style={SECTION_CONTENT_MIN_HEIGHT_STYLE}
            data-disable-custom-cursor="true"
          >
            <div className="bazi-disclaimer-main">
              <InfluenceNetworkCard captionGlitchSignal={networkCaptionGlitchSignal} />
            </div>
            <BaziDemoDisclaimer />
          </div>
        </section>

        <section
          className="bazi-section bazi-section-shell bazi-section-s5 snap-start"
          style={SECTION_MIN_HEIGHT_STYLE}
          data-bazi-section-id="elements"
        >
          <div className="bazi-section-inner bazi-disclaimer-section mx-auto w-full max-w-5xl gap-4 pb-12 pt-4" style={SECTION_CONTENT_MIN_HEIGHT_STYLE}>
            <div className="bazi-disclaimer-main">
              <ElementsDistributionCard captionGlitchSignal={elementsCaptionGlitchSignal} />
            </div>
            <BaziDemoDisclaimer />
          </div>
        </section>

        <section
          className="bazi-section bazi-section-shell bazi-section-s6 snap-start"
          style={SECTION_MIN_HEIGHT_STYLE}
          data-bazi-section-id="transit"
        >
          <div className="bazi-section-inner bazi-disclaimer-section mx-auto w-full max-w-5xl gap-4 pb-12 pt-4" style={SECTION_CONTENT_MIN_HEIGHT_STYLE}>
            <div className="bazi-disclaimer-main">
              <AnnualTransitCard
                transitIndex={transitIndex}
                setTransitIndex={setTransitIndex}
                onStepNavigate={() => setTransitStepScrambleSignal((currentSignal) => currentSignal + 1)}
              />
            </div>
            <BaziDemoDisclaimer />
          </div>
        </section>

        <section
          className="bazi-section bazi-section-shell bazi-section-s7 snap-start"
          style={SECTION_MIN_HEIGHT_STYLE}
          data-bazi-section-id="almanac"
        >
          <div className="bazi-section-inner bazi-disclaimer-section mx-auto w-full max-w-5xl gap-4 pb-12 pt-4" style={SECTION_CONTENT_MIN_HEIGHT_STYLE}>
            <div className="bazi-disclaimer-main">
              <GeneralAlmanacCard
                index={almanacIndex}
                setIndex={(next) => setAlmanacIndex(clamp(next, ALMANAC_MIN_INDEX, ALMANAC_MAX_INDEX))}
                onStepNavigate={() => setAlmanacStepScrambleSignal((currentSignal) => currentSignal + 1)}
              />
            </div>
            <BaziDemoDisclaimer />
          </div>
        </section>

        <section
          className="bazi-section bazi-section-shell bazi-section-s8 snap-start"
          style={SECTION_MIN_HEIGHT_STYLE}
          data-bazi-section-id="outro"
        >
          <div className="bazi-section-inner mx-auto flex w-full max-w-4xl flex-col items-center justify-center text-center" style={SECTION_CONTENT_MIN_HEIGHT_STYLE}>
            <OccasionalGlitchText
              text="Available in app store soon."
              tag="p"
              className="bazi-store-text font-display font-black"
              scrambleStepMs={20}
              scrambleRevealStep={1.25}
              minDelayMs={3800}
              maxDelayMs={7600}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
