import React, { useEffect, useState } from 'react';
import GlitchText from '../GlitchText';
import { SITE_COPY } from '../../shared/copy/site-copy.mjs';

const NOT_FOUND_GLITCH_INTERVAL_MS = 3600;

export const NotFoundPage: React.FC = () => {
  const [scrambleSignal, setScrambleSignal] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setScrambleSignal((currentSignal) => currentSignal + 1);
    }, NOT_FOUND_GLITCH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <main className="grid min-h-[100dvh] place-items-center overflow-hidden bg-white px-4 text-black">
      <div className="mx-auto w-fit max-w-[min(32rem,calc(100vw-3rem))] text-center">
        <GlitchText
          text={SITE_COPY.notFound.heading}
          scrambleSignal={scrambleSignal}
          accentLettersEnabled={false}
          className="font-display text-[clamp(2.4rem,7vw,5rem)] font-black uppercase leading-[0.92] tracking-[0.12em]"
          tag="h1"
        />
      </div>
    </main>
  );
};
