import React, { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import GlitchText from '../GlitchText';
import { LATENT_27_BACKSTORY, LATENT_27_TITLE } from '../selectedWorksData';
import { useOccasionalGlitchSignal } from './shared';

export function LatentSelectedWorkPage() {
  const scrambleSignal = useOccasionalGlitchSignal(5200, 9800);
  const paragraphs = LATENT_27_BACKSTORY.split('\n\n');
  const navigateToSelectedWorks = () => {
    if (window.location.pathname === '/selected-works') {
      return;
    }

    window.history.pushState({}, '', '/selected-works');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <main
      className="relative h-[100dvh] min-h-[100dvh] overflow-y-auto px-4 py-20 md:px-8"
      style={{
        background: 'linear-gradient(145deg, var(--bg-primary) 0%, var(--latent-gradient-stop) 65%, var(--bg-secondary) 100%)',
      }}
    >
      <div className="absolute left-3 z-20 md:left-8" style={{ top: 'calc(1rem + env(safe-area-inset-top, 0px))' }}>
        <button
          type="button"
          onClick={navigateToSelectedWorks}
          className="group flex items-center gap-4 text-lg font-bold text-[var(--text-primary)] transition-colors hover:text-[var(--accent-secondary)]"
          aria-label="Back to Selected Works"
        >
          <div className="flex h-12 w-12 items-center justify-center border border-[var(--border-strong)] bg-[var(--surface-tint)] transition-all group-hover:border-[var(--accent-primary)] group-hover:bg-[var(--accent-primary)] group-hover:text-[var(--text-primary)]">
            <ArrowLeft size={18} aria-hidden="true" />
          </div>
          <GlitchText
            text="SW"
            wrapToWidth={false}
            className="font-mono text-sm tracking-widest"
          />
        </button>
      </div>

      <div className="mx-auto w-full max-w-4xl text-center">
        <GlitchText
          text={LATENT_27_TITLE}
          tag="h1"
          wrapToWidth={false}
          scrambleOnMount={false}
          scrambleSignal={scrambleSignal}
          scrambleStepMs={22}
          scrambleRevealStep={1.2}
          className="mx-auto mb-8 font-display text-[clamp(1.8rem,6vw,3.5rem)] font-black tracking-tight text-[var(--text-primary)]"
        />

        <div className="space-y-6">
          {paragraphs.map((paragraph, index) => (
            <LatentParagraphWithSparseGlitch
              key={`latent-paragraph-${index}`}
              paragraph={paragraph}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

function LatentParagraphWithSparseGlitch({ paragraph }: { paragraph: string; key?: React.Key }) {
  const paragraphSignal = useOccasionalGlitchSignal(5400, 10_800);
  const tokens = useMemo(() => paragraph.split(/(\s+)/), [paragraph]);

  const glitchTokenIndices = useMemo(() => {
    const candidateIndices = tokens
      .map((token, index) => ({ token, index }))
      .filter(({ token }) => /\S/.test(token) && /[A-Za-z0-9]/.test(token))
      .map(({ index }) => index);

    if (!candidateIndices.length) {
      return new Set<number>();
    }

    const targetCount = Math.min(
      candidateIndices.length,
      Math.max(1, Math.floor(Math.random() * 3) + 1),
    );

    const selected = new Set<number>();
    while (selected.size < targetCount) {
      const randomIndex = Math.floor(Math.random() * candidateIndices.length);
      const tokenIndex = candidateIndices[randomIndex];
      if (tokenIndex !== undefined) {
        selected.add(tokenIndex);
      }
    }

    return selected;
  }, [tokens]);

  return (
    <p className="mx-auto max-w-3xl whitespace-pre-wrap text-center text-[clamp(0.96rem,2vw,1.1rem)] leading-relaxed text-[var(--text-secondary)]">
      {tokens.map((token, index) => {
        if (!glitchTokenIndices.has(index)) {
          return <React.Fragment key={`latent-token-${index}`}>{token}</React.Fragment>;
        }

        return (
          <GlitchText
            key={`latent-glitch-token-${index}`}
            text={token}
            tag="span"
            wrapToWidth={false}
            scrambleOnMount={false}
            scrambleSignal={paragraphSignal}
            scrambleStepMs={24}
            scrambleRevealStep={1.15}
            className="inline-block"
          />
        );
      })}
    </p>
  );
}
