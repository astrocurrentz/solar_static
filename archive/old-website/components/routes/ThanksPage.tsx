import React from 'react';
import GlitchText from '../GlitchText';
import { SITE_COPY } from '../../shared/copy/site-copy.mjs';
import type { RoutePath } from '../app/routing';
import {
  BOTTOM_RAIL_STYLE,
  HERO_BACKGROUND,
  HERO_GLOW,
  ROUTE_VIEWPORT_STYLE,
  THANKS_CONTENT_STYLE,
  WARM_OVERLAY,
} from './routeStyles';

const THANKS_MESSAGE_SENTENCES = SITE_COPY.thanks.sentences;
const THANKS_MESSAGE_LOOP_INTERVAL_MS = 3200;

export function ThanksPage({ onNavigate }: { onNavigate: (nextRoute: RoutePath) => void }) {
  return (
<main className="relative h-[100dvh] min-h-[100dvh] overflow-hidden" style={{ ...HERO_BACKGROUND, ...ROUTE_VIEWPORT_STYLE }}>
          <div className="absolute inset-0 opacity-75" style={HERO_GLOW} />
          <div className="absolute inset-0 opacity-70" style={WARM_OVERLAY} />

          <div className="relative z-10 h-full" style={THANKS_CONTENT_STYLE}>
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-4 md:px-24">
              <div className="mx-auto w-full max-w-[44rem] min-h-[4.4rem] text-center md:min-h-[4.8rem]">
                <GlitchText
                  texts={THANKS_MESSAGE_SENTENCES}
                  autoLoop
                  shuffleLoop={false}
                  wrapToWidth={false}
                  loopIntervalMs={THANKS_MESSAGE_LOOP_INTERVAL_MS}
                  scrambleStepMs={22}
                  scrambleRevealStep={1.8}
                  className="block font-mono text-[clamp(0.82rem,2.9vw,1.2rem)] leading-[1.45] tracking-[0.05em] text-[var(--text-secondary)] md:text-[clamp(0.88rem,1.45vw,1.2rem)]"
                />
              </div>
            </div>

            <div className="thanks-bottom-group absolute inset-x-0 bottom-0 px-4 md:px-24">
              <div className="mx-auto flex w-full max-w-[34rem] flex-col items-center gap-2 text-center">
                <button
                  type="button"
                  onClick={() => onNavigate('/')}
                  className="transition-transform duration-300 hover:scale-110"
                  aria-label="Return home"
                >
                  <div
                    className="h-[8.25rem] w-[8.25rem] md:h-[10.5rem] md:w-[10.5rem]"
                    style={{
                      backgroundColor: 'var(--accent-secondary)',
                      WebkitMaskImage: 'url(/assets/brand/sss-mark-favicon.png)',
                      maskImage: 'url(/assets/brand/sss-mark-favicon.png)',
                      WebkitMaskRepeat: 'no-repeat',
                      maskRepeat: 'no-repeat',
                      WebkitMaskPosition: 'center',
                      maskPosition: 'center',
                      WebkitMaskSize: 'contain',
                      maskSize: 'contain',
                    }}
                  />
                </button>
                <p className="font-mono text-[0.69rem] uppercase tracking-[0.3em] text-[var(--accent-secondary)] md:text-[0.75rem]">
                  Solar Static Creative Studio
                </p>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute top-0 right-0 hidden h-full w-1/4 border-l border-[var(--border-soft)] opacity-50 lg:block" />
          <div className="pointer-events-none absolute left-0 h-[1px] w-full bg-[var(--border-soft)]" style={BOTTOM_RAIL_STYLE} />
        </main>
  );
}
