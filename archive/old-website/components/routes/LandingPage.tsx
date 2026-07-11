import React, { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import GlitchText from '../GlitchText';
import { SITE_COPY } from '../../shared/copy/site-copy.mjs';
import type { RoutePath } from '../app/routing';
import {
  BOTTOM_RAIL_STYLE,
  HERO_BACKGROUND,
  HERO_GLOW,
  LANDING_CONTENT_STYLE,
  ROUTE_VIEWPORT_STYLE,
  WARM_OVERLAY,
} from './routeStyles';

const LOOPING_WORDS = SITE_COPY.landing.loopingWords;
const GLITCH_LOOP_INTERVAL_OVERRIDES_MS = {
  'SOLAR STATIC': 980,
};
const ETHOS_FULL_TEXT = SITE_COPY.landing.ethosParagraphs.join('\n\n');
const GLITCH_LOOP_INTERVAL_MS = 540;
const ETHOS_GLITCH_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&?!<>';
const ETHOS_REVEAL_STEP_MS = 8;
const ETHOS_REVEAL_STEP = 6;
const ETHOS_FOREGROUND_IDLE_MS = 60_000;
const BUTTON_GLITCH_NAV_DELAY_MS = 180;

export function LandingPage({ onNavigate }: { onNavigate: (nextRoute: RoutePath) => void }) {
  const [isEthosInFront, setIsEthosInFront] = useState(false);
  const [ethosDisplayText, setEthosDisplayText] = useState('');
  const [landingButtonScrambleSignal, setLandingButtonScrambleSignal] = useState(0);
  const [selectedWorksButtonScrambleSignal, setSelectedWorksButtonScrambleSignal] = useState(0);
  const ethosIdleTimeoutRef = useRef<number | null>(null);
  const ethosScrambleIntervalRef = useRef<number | null>(null);
  const landingNavigationTimeoutRef = useRef<number | null>(null);

  useEffect(() => (
    () => {
      if (landingNavigationTimeoutRef.current !== null) {
        window.clearTimeout(landingNavigationTimeoutRef.current);
      }

      if (ethosScrambleIntervalRef.current !== null) {
        window.clearInterval(ethosScrambleIntervalRef.current);
      }
    }
  ), []);

  useEffect(() => {
    if (!isEthosInFront) {
      if (ethosIdleTimeoutRef.current !== null) {
        window.clearTimeout(ethosIdleTimeoutRef.current);
        ethosIdleTimeoutRef.current = null;
      }
      return;
    }

    const resetIdleTimeout = () => {
      if (ethosIdleTimeoutRef.current !== null) {
        window.clearTimeout(ethosIdleTimeoutRef.current);
      }

      ethosIdleTimeoutRef.current = window.setTimeout(() => {
        setIsEthosInFront(false);
        ethosIdleTimeoutRef.current = null;
      }, ETHOS_FOREGROUND_IDLE_MS);
    };

    const activityEvents: Array<keyof WindowEventMap> = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart'];

    resetIdleTimeout();
    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, resetIdleTimeout);
    });

    return () => {
      if (ethosIdleTimeoutRef.current !== null) {
        window.clearTimeout(ethosIdleTimeoutRef.current);
        ethosIdleTimeoutRef.current = null;
      }

      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, resetIdleTimeout);
      });
    };
  }, [isEthosInFront]);

  const startEthosRevealScramble = () => {
    if (ethosScrambleIntervalRef.current !== null) {
      window.clearInterval(ethosScrambleIntervalRef.current);
      ethosScrambleIntervalRef.current = null;
    }

    let iteration = 0;

    ethosScrambleIntervalRef.current = window.setInterval(() => {
      const nextText = ETHOS_FULL_TEXT
        .split('')
        .map((character, index) => {
          if (character === '\n' || character === ' ' || index < iteration) {
            return character;
          }

          return ETHOS_GLITCH_CHARS[Math.floor(Math.random() * ETHOS_GLITCH_CHARS.length)] ?? character;
        })
        .join('');

      setEthosDisplayText(nextText);

      if (iteration >= ETHOS_FULL_TEXT.length) {
        setEthosDisplayText(ETHOS_FULL_TEXT);
        if (ethosScrambleIntervalRef.current !== null) {
          window.clearInterval(ethosScrambleIntervalRef.current);
          ethosScrambleIntervalRef.current = null;
        }
      }

      iteration += ETHOS_REVEAL_STEP;
    }, ETHOS_REVEAL_STEP_MS);
  };

  const activateEthosForeground = () => {
    setIsEthosInFront(true);
    startEthosRevealScramble();
  };

  const restoreEthosBackground = () => {
    setIsEthosInFront(false);
    setEthosDisplayText('');

    if (ethosScrambleIntervalRef.current !== null) {
      window.clearInterval(ethosScrambleIntervalRef.current);
      ethosScrambleIntervalRef.current = null;
    }
  };

  const handleEthosKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    activateEthosForeground();
  };

  return (
<main className="relative h-[100dvh] min-h-[100dvh] overflow-hidden" style={{ ...HERO_BACKGROUND, ...ROUTE_VIEWPORT_STYLE }}>
          <div className="absolute inset-0 opacity-80" style={HERO_GLOW} />
          <div className="absolute inset-0 opacity-70" style={WARM_OVERLAY} />

          <div className="relative z-10 h-full px-4 md:px-12 xl:px-14" style={LANDING_CONTENT_STYLE}>
            <div
              className="relative h-full w-full"
              onClick={() => {
                if (!isEthosInFront) {
                  return;
                }

                restoreEthosBackground();
              }}
            >
              <div className="absolute left-0 top-0 flex items-center gap-4 font-mono text-xs font-bold tracking-[0.2em] text-[var(--accent-secondary)]">
                <div className="h-2 w-2 animate-pulse rounded-none bg-[var(--accent-secondary)]" />
                <span
                  className={`inline-block origin-left transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isEthosInFront
                      ? 'scale-[0.88] opacity-40 md:scale-100 md:opacity-100'
                      : 'scale-100 opacity-100'
                  }`}
                >
                  {SITE_COPY.brand.studioVersion}
                </span>
              </div>

              <div
                className={`pointer-events-none relative z-10 flex h-full items-center pb-44 pt-16 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] md:pb-32 ${
                  isEthosInFront
                    ? 'translate-x-[14vw] translate-y-[22vh] scale-[0.78] opacity-30 md:translate-x-0 md:translate-y-0 md:scale-[0.94]'
                    : 'translate-x-0 translate-y-0 scale-100 opacity-100'
                }`}
              >
                <h1
                  className={`w-full select-none font-display font-black leading-[0.86] tracking-tight text-[var(--text-primary)] transition-[font-size] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isEthosInFront
                      ? 'text-[clamp(2.8rem,12vw,5rem)] md:text-[clamp(4.9rem,8vw,11.5rem)]'
                      : 'text-[clamp(3rem,12.8vw,5.4rem)] md:text-[clamp(5.2rem,9vw,12.5rem)]'
                  }`}
                >
                  <span className="relative z-10 block max-w-full pl-[2.5vw] pr-[1.5vw] md:pl-[3vw] md:pr-[1.2vw]">
                    <GlitchText
                      texts={LOOPING_WORDS}
                      autoLoop
                      wrapToWidth
                      loopIntervalMs={GLITCH_LOOP_INTERVAL_MS}
                      loopIntervalOverridesMs={GLITCH_LOOP_INTERVAL_OVERRIDES_MS}
                      accentLettersEnabled={!isEthosInFront}
                      className="block w-full max-w-full"
                    />
                  </span>
                </h1>
              </div>

              <div
                className={`absolute right-0 bottom-[calc(8rem+env(safe-area-inset-bottom,0px))] z-20 flex origin-top-right flex-col gap-3 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:fixed md:bottom-[calc(3.45rem+env(safe-area-inset-bottom,0px))] md:right-[6vw] md:top-auto ${
                  isEthosInFront
                    ? 'translate-y-2 scale-[0.86] opacity-35 md:translate-y-0 md:scale-100 md:opacity-100'
                    : 'translate-y-0 scale-100 opacity-100'
                }`}
              >
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedWorksButtonScrambleSignal((currentSignal) => currentSignal + 1);

                    if (landingNavigationTimeoutRef.current !== null) {
                      window.clearTimeout(landingNavigationTimeoutRef.current);
                    }

                    landingNavigationTimeoutRef.current = window.setTimeout(() => {
                      onNavigate('/selected-works');
                      landingNavigationTimeoutRef.current = null;
                    }, BUTTON_GLITCH_NAV_DELAY_MS);
                  }}
                  className="group flex items-center gap-4 text-lg font-bold text-[var(--text-primary)] transition-colors hover:text-[var(--accent-secondary)]"
                >
                  <div className="flex h-12 w-12 items-center justify-center border border-[var(--border-strong)] bg-[var(--surface-tint)] transition-all group-hover:border-[var(--accent-primary)] group-hover:bg-[var(--accent-primary)] group-hover:text-[var(--text-primary)]">
                    <ArrowUpRight size={20} />
                  </div>
                  <GlitchText
                    text={SITE_COPY.landing.selectedWorksLabel}
                    wrapToWidth={false}
                    scrambleOnMount={false}
                    scrambleSignal={selectedWorksButtonScrambleSignal}
                    className="font-mono text-sm tracking-widest"
                  />
                </button>

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setLandingButtonScrambleSignal((currentSignal) => currentSignal + 1);

                    if (landingNavigationTimeoutRef.current !== null) {
                      window.clearTimeout(landingNavigationTimeoutRef.current);
                    }

                    landingNavigationTimeoutRef.current = window.setTimeout(() => {
                      onNavigate('/request');
                      landingNavigationTimeoutRef.current = null;
                    }, BUTTON_GLITCH_NAV_DELAY_MS);
                  }}
                  className="group flex items-center gap-4 text-lg font-bold text-[var(--text-primary)] transition-colors hover:text-[var(--accent-secondary)]"
                >
                  <div className="flex h-12 w-12 items-center justify-center border border-[var(--border-strong)] bg-[var(--surface-tint)] transition-all group-hover:border-[var(--accent-primary)] group-hover:bg-[var(--accent-primary)] group-hover:text-[var(--text-primary)]">
                    <ArrowUpRight size={20} />
                  </div>
                  <GlitchText
                    text={SITE_COPY.landing.transmitRequestLabel}
                    wrapToWidth={false}
                    scrambleOnMount={false}
                    scrambleSignal={landingButtonScrambleSignal}
                    className="font-mono text-sm tracking-widest"
                  />
                </button>
              </div>

              <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
                <div
                  role="button"
                  tabIndex={0}
                  aria-pressed={isEthosInFront}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (isEthosInFront) {
                      restoreEthosBackground();
                      return;
                    }

                    activateEthosForeground();
                  }}
                  onKeyDown={handleEthosKeyDown}
                  className={`relative max-w-lg origin-bottom-left outline-none transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:opacity-100 ${
                    isEthosInFront ? 'z-30 opacity-100' : 'z-0 opacity-65'
                  }`}
                >
                  <p
                    className={`font-mono text-sm font-medium leading-relaxed transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:text-base ${
                      isEthosInFront ? 'text-[var(--accent-secondary)]' : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    <span className={`px-1 transition-colors ${isEthosInFront ? 'bg-[var(--accent-secondary)] text-[var(--bg-primary)]' : 'bg-[var(--bg-light)] text-[var(--text-dark)]'}`}>{SITE_COPY.brand.ethosLabel}</span>
                    {isEthosInFront && (
                      <span className="mt-2 block whitespace-pre-line">
                        {ethosDisplayText}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute top-0 right-0 hidden h-full w-[clamp(12rem,18vw,24rem)] border-l border-[var(--border-soft)] opacity-50 lg:block" />
          <div className="pointer-events-none absolute left-0 h-[1px] w-full bg-[var(--border-soft)]" style={BOTTOM_RAIL_STYLE} />
        </main>
  );
}
