import GlitchText from '../GlitchText';
import { useOccasionalGlitchSignal } from './shared';

export function SelectedWorksIndexPage({
  onNavigate,
}: {
  onNavigate: (nextRoute: '/selected-works/bazi' | '/selected-works/latent-27' | '/freewill') => void;
}) {
  const meshSignalA = useOccasionalGlitchSignal(3900, 7600);
  const meshSignalB = useOccasionalGlitchSignal(4300, 8000);
  const meshSignalC = useOccasionalGlitchSignal(4700, 8400);
  const meshSignalD = useOccasionalGlitchSignal(5100, 8800);

  return (
    <main
      className="selected-works-index relative flex h-[100dvh] min-h-[100dvh] items-center justify-center overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-primary) 54%, var(--bg-secondary) 100%)',
      }}
    >
      <div className="flex w-full max-w-6xl flex-col items-center justify-center gap-10 text-center md:gap-12">
        <button
          type="button"
          aria-label="Open BāZì project"
          onClick={() => onNavigate('/selected-works/bazi')}
          className="group text-[var(--text-primary)] transition-colors duration-300 hover:text-[var(--accent-secondary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent-secondary)]"
        >
          <GlitchText
            text="BāZì"
            tag="span"
            wrapToWidth={false}
            scrambleOnMount={false}
            scrambleSignal={meshSignalA}
            scrambleStepMs={22}
            scrambleRevealStep={1.2}
            className="font-display text-[clamp(2rem,8vw,5rem)] font-black tracking-wide"
          />
        </button>

        <button
          type="button"
          aria-label="Open Latent 27 project"
          onClick={() => onNavigate('/selected-works/latent-27')}
          className="group text-[var(--text-primary)] transition-colors duration-300 hover:text-[var(--accent-secondary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent-secondary)]"
        >
          <GlitchText
            text="Latent 27"
            tag="span"
            wrapToWidth={false}
            scrambleOnMount={false}
            scrambleSignal={meshSignalB}
            scrambleStepMs={22}
            scrambleRevealStep={1.2}
            className="font-display text-[clamp(2rem,8vw,5rem)] font-black tracking-wide"
          />
        </button>

        <a
          href="https://www.fuzzchorus.org/"
          target="_blank"
          rel="noreferrer noopener"
          aria-label="Open FCMS project website"
          className="group text-[var(--text-primary)] transition-colors duration-300 hover:text-[var(--accent-secondary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent-secondary)]"
        >
          <GlitchText
            text="FCMS"
            tag="span"
            wrapToWidth={false}
            scrambleOnMount={false}
            scrambleSignal={meshSignalC}
            scrambleStepMs={22}
            scrambleRevealStep={1.2}
            className="font-display text-[clamp(2rem,8vw,5rem)] font-black tracking-wide"
          />
        </a>

        <button
          type="button"
          aria-label="Open The Freewill project"
          onClick={() => onNavigate('/freewill')}
          className="group text-[var(--text-primary)] transition-colors duration-300 hover:text-[var(--accent-secondary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent-secondary)]"
        >
          <GlitchText
            text="The Freewill"
            tag="span"
            wrapToWidth={false}
            scrambleOnMount={false}
            scrambleSignal={meshSignalD}
            scrambleStepMs={22}
            scrambleRevealStep={1.2}
            className="font-display text-[clamp(2rem,8vw,5rem)] font-black tracking-wide"
          />
        </button>
      </div>
    </main>
  );
}
