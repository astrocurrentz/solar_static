import React from 'react';
import { ArrowLeft } from 'lucide-react';
import GlitchText from '../GlitchText';

type GlitchBackButtonProps = {
  ariaLabel: string;
  label: string;
  onClick: () => void;
  labelClassName?: string;
};

export function GlitchBackButton({
  ariaLabel,
  label,
  onClick,
  labelClassName = 'font-mono text-sm tracking-widest',
}: GlitchBackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-4 text-lg font-bold text-[var(--text-primary)] transition-colors hover:text-[var(--accent-secondary)]"
      aria-label={ariaLabel}
    >
      <div className="flex h-12 w-12 items-center justify-center border border-[var(--border-strong)] bg-[var(--surface-tint)] transition-all group-hover:border-[var(--accent-primary)] group-hover:bg-[var(--accent-primary)] group-hover:text-[var(--text-primary)]">
        <ArrowLeft size={18} aria-hidden="true" />
      </div>
      <GlitchText
        text={label}
        wrapToWidth={false}
        className={labelClassName}
      />
    </button>
  );
}
