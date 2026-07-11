import React, { FormEvent, useEffect, useRef, useState } from 'react';
import GlitchText from '../GlitchText';
import { GlitchBackButton } from '../ui/GlitchBackButton';
import { SITE_COPY } from '../../shared/copy/site-copy.mjs';
import type { RoutePath } from '../app/routing';
import {
  BOTTOM_RAIL_STYLE,
  HERO_BACKGROUND,
  HERO_GLOW,
  PANEL_SHADOW,
  REQUEST_PANEL_STYLE,
  REQUEST_TERMINAL_PANEL,
  ROUTE_VIEWPORT_STYLE,
  TOP_LEFT_BACK_BUTTON_STYLE,
  WARM_OVERLAY,
} from './routeStyles';
import {
  buildRequestTelemetryBatch,
  type RequestTelemetryLine,
  type RequestValidationErrors,
  type SubmitState,
} from './requestTelemetry';

const REQUEST_ENDPOINT = import.meta.env.VITE_REQUEST_ENDPOINT || SITE_COPY.request.endpoint;
const isValidEmailAddress = (value: string) => /^[^s@]+@[^s@]+.[^s@]+$/.test(value);

export function RequestPage({ onNavigate }: { onNavigate: (nextRoute: RoutePath) => void }) {
  const [email, setEmail] = useState('');
  const [requestBody, setRequestBody] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [validationErrors, setValidationErrors] = useState<RequestValidationErrors>({});
  const [primaryTelemetryLines, setPrimaryTelemetryLines] = useState<RequestTelemetryLine[]>(() => buildRequestTelemetryBatch(8, 'primary'));
  const [secondaryTelemetryLines, setSecondaryTelemetryLines] = useState<RequestTelemetryLine[]>(() => buildRequestTelemetryBatch(7, 'secondary'));
  const [requestButtonScrambleSignal, setRequestButtonScrambleSignal] = useState(0);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setPrimaryTelemetryLines(buildRequestTelemetryBatch(8, 'primary'));
    setSecondaryTelemetryLines(buildRequestTelemetryBatch(7, 'secondary'));

    const primaryInterval = window.setInterval(() => {
      setPrimaryTelemetryLines((currentLines) => [
        ...currentLines.slice(-7),
        ...buildRequestTelemetryBatch(1, 'primary'),
      ]);
    }, 190);

    const secondaryInterval = window.setInterval(() => {
      setSecondaryTelemetryLines((currentLines) => [
        ...currentLines.slice(-6),
        ...buildRequestTelemetryBatch(1, 'secondary'),
      ]);
    }, 240);

    return () => {
      window.clearInterval(primaryInterval);
      window.clearInterval(secondaryInterval);
    };
  }, []);

  const resetButtonState = () => {
    if (submitState === 'error') {
      setSubmitState('idle');
    }
  };

  const clearValidationError = (field: keyof RequestValidationErrors) => {
    setValidationErrors((currentErrors) => {
      if (!currentErrors[field]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRequestButtonScrambleSignal((currentSignal) => currentSignal + 1);

    const trimmedEmail = email.trim();
    const trimmedRequest = requestBody.trim();
    const nextValidationErrors: RequestValidationErrors = {};

    if (!trimmedEmail) {
      nextValidationErrors.email = SITE_COPY.request.validation.emailRequired;
    } else if (!isValidEmailAddress(trimmedEmail)) {
      nextValidationErrors.email = SITE_COPY.request.validation.emailInvalid;
    }

    if (!trimmedRequest) {
      nextValidationErrors.message = SITE_COPY.request.validation.messageRequired;
    }

    if (Object.keys(nextValidationErrors).length > 0) {
      setValidationErrors(nextValidationErrors);
      if (nextValidationErrors.email) {
        emailInputRef.current?.focus();
      } else if (nextValidationErrors.message) {
        messageInputRef.current?.focus();
      }
      return;
    }

    setValidationErrors({});
    setSubmitState('sending');

    try {
      const response = await fetch(REQUEST_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, message: trimmedRequest }),
      });

      if (!response.ok) {
        throw new Error(SITE_COPY.request.validation.submissionFailed);
      }

      setEmail('');
      setRequestBody('');
      setSubmitState('idle');
      onNavigate('/thanks');
    } catch (error) {
      console.error(error);
      setSubmitState('error');
    }
  };

  const validationMessages = Object.values(validationErrors);
  const hasValidationWarnings = validationMessages.length > 0;
  const submitButtonLabel = submitState === 'sending'
    ? SITE_COPY.request.labels.transmitting
    : hasValidationWarnings
      ? SITE_COPY.request.labels.missing
      : submitState === 'error'
        ? SITE_COPY.request.labels.retry
        : SITE_COPY.request.labels.dispatch;
  const requestStateLabel = hasValidationWarnings
    ? SITE_COPY.request.labels.stateWarning
    : submitState === 'sending'
      ? SITE_COPY.request.labels.stateTransmitting
      : submitState === 'error'
        ? SITE_COPY.request.labels.stateRetry
        : SITE_COPY.request.labels.stateReady;

  return (
<main className="relative h-[100dvh] min-h-[100dvh] overflow-hidden" style={{ ...HERO_BACKGROUND, ...ROUTE_VIEWPORT_STYLE }}>
          <div className="absolute inset-0 opacity-75" style={HERO_GLOW} />
          <div className="absolute inset-0 opacity-70" style={WARM_OVERLAY} />
          <div className="absolute left-3 z-20 md:left-8" style={TOP_LEFT_BACK_BUTTON_STYLE}>
            <GlitchBackButton
              onClick={() => onNavigate('/')}
              ariaLabel={SITE_COPY.navigation.backHome}
              label={SITE_COPY.brand.shortMark}
            />
          </div>

          <div className="request-shell relative z-10 flex h-full items-center justify-center px-3 sm:px-6 md:px-24">
            <form
              onSubmit={handleSubmit}
              className="relative h-full w-full max-w-5xl overflow-hidden border border-[var(--border-strong)] bg-[var(--request-panel-bg)]"
              style={{ ...PANEL_SHADOW, ...REQUEST_TERMINAL_PANEL, ...REQUEST_PANEL_STYLE }}
              noValidate
            >
              <span className="pointer-events-none absolute left-3 top-3 h-3 w-3 border-l border-t border-[var(--accent-secondary)]" />
              <span className="pointer-events-none absolute right-3 top-3 h-3 w-3 border-r border-t border-[var(--accent-secondary)]" />
              <span className="pointer-events-none absolute bottom-3 left-3 h-3 w-3 border-b border-l border-[var(--accent-secondary)]" />
              <span className="pointer-events-none absolute bottom-3 right-3 h-3 w-3 border-b border-r border-[var(--accent-secondary)]" />
              <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-55">
                <div className="absolute inset-0 md:hidden">
                  <div className="absolute left-4 right-4 top-[5.8rem] h-px overflow-hidden bg-[var(--request-copper-020)]">
                    <span className="animate-request-mobile-scan absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-transparent via-[var(--request-copper-094)] to-transparent" />
                  </div>
                  <div className="absolute left-5 right-5 bottom-[10.6rem] h-px overflow-hidden bg-[var(--request-copper-016)]">
                    <span className="animate-request-mobile-scan-delay absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-transparent via-[var(--request-cream-084)] to-transparent" />
                  </div>
                  <div className="absolute right-11 top-[6.9rem] bottom-[8.6rem] w-px overflow-hidden bg-[var(--request-copper-018)]">
                    <span className="animate-request-mobile-pulse absolute left-1/2 top-0 h-16 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[var(--request-copper-096)] to-transparent" />
                  </div>
                  <div className="animate-request-mobile-node absolute left-6 top-[5.6rem] h-2 w-2 rounded-full border border-[var(--request-copper-058)] bg-[var(--request-copper-020)]" />
                  <div className="animate-request-mobile-node-delay absolute right-10 bottom-[10.45rem] h-2 w-2 rounded-full border border-[var(--request-cream-042)] bg-[var(--request-cream-008)]" />
                </div>
                <div className="absolute left-8 top-16 h-px w-[22%] min-w-24 bg-[var(--request-copper-014)]">
                  <span className="animate-request-packet absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-transparent via-[var(--request-copper-090)] to-transparent" />
                </div>
                <div className="absolute right-[11.5rem] top-[7.5rem] h-[11.5rem] w-px bg-[var(--request-copper-012)]">
                  <span className="animate-request-packet-vertical absolute left-1/2 top-0 h-16 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[var(--request-copper-095)] to-transparent" />
                </div>
                <div className="absolute left-[34%] top-[10.75rem] h-px w-[28%] max-w-[20rem] bg-[var(--request-copper-010)]">
                  <span className="animate-request-packet-delay absolute inset-y-0 left-0 w-14 bg-gradient-to-r from-transparent via-[var(--request-cream-085)] to-transparent" />
                </div>
                <div className="animate-request-node absolute left-[calc(34%+20rem)] top-[10.55rem] h-2 w-2 rounded-full border border-[var(--request-copper-060)] bg-[var(--request-copper-018)]" />
                <div className="animate-request-node-delay absolute right-[10.8rem] top-[18.3rem] h-2 w-2 rounded-full border border-[var(--request-cream-042)] bg-[var(--request-cream-008)]" />
                <div className="absolute bottom-36 right-4 h-px w-32 bg-[var(--request-copper-016)] md:hidden">
                  <span className="animate-request-packet absolute inset-y-0 left-0 w-14 bg-gradient-to-r from-transparent via-[var(--request-copper-085)] to-transparent" />
                </div>
                <div className="animate-request-node absolute bottom-[8.6rem] right-[8.5rem] h-2 w-2 rounded-full border border-[var(--request-copper-055)] bg-[var(--request-copper-016)] md:hidden" />
                <div className="absolute bottom-24 right-4 w-40 overflow-hidden border-r border-[var(--request-copper-014)] pr-2 text-right font-mono text-[8px] uppercase tracking-[0.18em] md:hidden">
                  <div className="space-y-1">
                    {secondaryTelemetryLines.slice(-4).map((line) => (
                      <div
                        key={`mobile-${line.id}`}
                        className={`animate-request-typing ml-auto block overflow-hidden whitespace-nowrap border-r border-[var(--request-cream-024)] pr-1 ${
                          line.accent ? 'text-[var(--request-cream-032)]' : 'text-[var(--request-cream-018)]'
                        }`}
                        style={{
                          ['--request-typing-width' as string]: `${Math.max(8, line.text.length)}ch`,
                          ['--request-typing-duration' as string]: `${Math.max(170, Math.round(line.durationMs * 0.8))}ms`,
                          ['--request-typing-steps' as string]: `${Math.max(6, Math.round(line.text.length * 0.68))}`,
                        } as React.CSSProperties}
                      >
                        {line.text}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute bottom-32 right-8 hidden w-64 overflow-hidden border-r border-[var(--request-copper-014)] pr-3 text-right font-mono text-[8px] uppercase tracking-[0.22em] md:block">
                  <div className="space-y-1">
                    {primaryTelemetryLines.map((line) => (
                      <div
                        key={line.id}
                        className={`animate-request-typing ml-auto block overflow-hidden whitespace-nowrap border-r border-[var(--request-copper-040)] pr-2 ${
                          line.accent ? 'text-[var(--request-copper-050)]' : 'text-[var(--request-copper-028)]'
                        }`}
                        style={{
                          ['--request-typing-width' as string]: `${Math.max(10, line.text.length)}ch`,
                          ['--request-typing-duration' as string]: `${line.durationMs}ms`,
                          ['--request-typing-steps' as string]: `${Math.max(8, Math.round(line.text.length * 0.72))}`,
                        } as React.CSSProperties}
                      >
                        {line.text}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute bottom-56 right-8 hidden w-40 overflow-hidden border-r border-[var(--request-copper-014)] pr-3 text-right font-mono text-[8px] uppercase tracking-[0.2em] lg:block">
                  <div className="space-y-1">
                    {secondaryTelemetryLines.map((line) => (
                      <div
                        key={line.id}
                        className={`animate-request-typing ml-auto block overflow-hidden whitespace-nowrap border-r border-[var(--request-cream-028)] pr-2 ${
                          line.accent ? 'text-[var(--request-cream-034)]' : 'text-[var(--request-cream-020)]'
                        }`}
                        style={{
                          ['--request-typing-width' as string]: `${Math.max(8, line.text.length)}ch`,
                          ['--request-typing-duration' as string]: `${line.durationMs}ms`,
                          ['--request-typing-steps' as string]: `${Math.max(6, Math.round(line.text.length * 0.68))}`,
                        } as React.CSSProperties}
                      >
                        {line.text}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative z-10 flex h-full min-h-0 flex-col">
                <div className="flex items-center justify-between gap-3 border-b border-[var(--border-soft)] px-4 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--accent-secondary)] sm:text-[10px] md:px-7 md:py-4 md:text-[11px] md:tracking-[0.28em]">
                  <GlitchText
                    text={SITE_COPY.request.labels.console}
                    wrapToWidth={false}
                    className="block min-w-0 overflow-hidden whitespace-nowrap text-ellipsis text-[8px] tracking-[0.14em] sm:text-[9px] md:text-[10px] md:tracking-[0.2em]"
                  />
                  <span className="shrink-0 text-[var(--text-secondary)]">{SITE_COPY.request.labels.node}</span>
                </div>

                <div className="grid min-h-0 flex-1 gap-4 p-4 md:gap-5 md:px-0 md:py-5">
                  <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_12rem] md:items-start">
                    <div className={`border bg-[var(--request-dark-012)] transition-colors ${validationErrors.email ? 'border-[var(--accent-secondary)]' : 'border-[var(--border-soft)]'}`}>
                      <div className={`flex items-center justify-between border-b px-4 py-2 font-mono text-[10px] uppercase tracking-[0.26em] transition-colors ${validationErrors.email ? 'border-[var(--accent-secondary)] text-[var(--accent-secondary)]' : 'border-[var(--border-soft)] text-[var(--text-secondary)]'}`}>
                        <span>{SITE_COPY.request.labels.emailChannel}</span>
                        <span>{validationErrors.email ? SITE_COPY.request.labels.warning : SITE_COPY.request.labels.input}</span>
                      </div>
                      <label htmlFor="request-email" className="sr-only">{SITE_COPY.request.labels.emailSr}</label>
                      <input
                        ref={emailInputRef}
                        id="request-email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={(event) => {
                          resetButtonState();
                          clearValidationError('email');
                          setEmail(event.target.value);
                        }}
                        autoComplete="email"
                        placeholder={SITE_COPY.request.labels.emailPlaceholder}
                        required
                        aria-invalid={validationErrors.email ? 'true' : 'false'}
                        className="w-full bg-transparent px-4 py-3 font-mono text-sm tracking-[0.14em] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none md:tracking-[0.18em]"
                      />
                    </div>

                    <div className={`flex flex-col justify-between border bg-[var(--request-dark-018)] p-4 font-mono text-[10px] uppercase tracking-[0.24em] transition-colors ${hasValidationWarnings ? 'border-[var(--accent-secondary)] text-[var(--accent-secondary)]' : 'border-[var(--border-soft)] text-[var(--text-secondary)]'}`}>
                      <span>{SITE_COPY.request.labels.route}</span>
                      <span>[ state ] {requestStateLabel}</span>
                      <span>{SITE_COPY.request.labels.mode}</span>
                      {hasValidationWarnings && (
                        <div className="mt-4 border-t border-[var(--request-copper-028)] pt-3 text-[9px] leading-relaxed text-[var(--text-primary)]">
                          {validationMessages.map((message) => (
                            <span key={message} className="block">
                              &gt; {message}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`flex min-h-0 flex-1 flex-col border bg-[var(--request-dark-012)] transition-colors ${validationErrors.message ? 'border-[var(--accent-secondary)]' : 'border-[var(--border-soft)]'}`}>
                    <div className={`flex items-center justify-between border-b px-4 py-2 font-mono text-[10px] uppercase tracking-[0.26em] transition-colors ${validationErrors.message ? 'border-[var(--accent-secondary)] text-[var(--accent-secondary)]' : 'border-[var(--border-soft)] text-[var(--text-secondary)]'}`}>
                      <span>{SITE_COPY.request.labels.requestBuffer}</span>
                      <span>{validationErrors.message ? SITE_COPY.request.labels.warning : SITE_COPY.request.labels.textStream}</span>
                    </div>
                    <label htmlFor="request-message" className="sr-only">{SITE_COPY.request.labels.requestSr}</label>
                    <textarea
                      ref={messageInputRef}
                      id="request-message"
                      name="message"
                      value={requestBody}
                      onChange={(event) => {
                        resetButtonState();
                        clearValidationError('message');
                        setRequestBody(event.target.value);
                      }}
                      placeholder={SITE_COPY.request.labels.requestPlaceholder}
                      required
                      rows={10}
                      aria-invalid={validationErrors.message ? 'true' : 'false'}
                      className="h-full min-h-[12rem] flex-1 resize-none bg-transparent px-4 py-4 font-mono text-sm leading-relaxed tracking-[0.1em] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:bg-[var(--request-copper-005)] focus:outline-none md:min-h-[16rem] md:tracking-[0.12em]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4 border-t border-[var(--border-soft)] px-4 py-3 md:flex-row md:items-center md:justify-between md:px-7 md:py-4">
                  <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--text-secondary)] md:text-[10px] md:tracking-[0.26em]">
                    {SITE_COPY.request.labels.protocol}
                  </div>
                  <button
                    type="submit"
                    disabled={submitState === 'sending'}
                    className="group flex w-full items-center justify-center gap-3 border border-[var(--border-strong)] bg-[var(--request-copper-014)] px-5 py-3 font-mono text-sm font-bold tracking-[0.2em] text-[var(--text-primary)] transition-all hover:border-[var(--accent-secondary)] hover:bg-[var(--accent-primary)] disabled:cursor-wait disabled:opacity-80 md:w-auto md:min-w-[20rem] md:gap-4 md:px-6 md:py-4 md:tracking-[0.24em]"
                  >
                    <span className="font-mono text-base text-[var(--accent-secondary)] transition-colors group-hover:text-[var(--text-primary)]">&gt;</span>
                    <GlitchText
                      text={submitButtonLabel}
                      wrapToWidth={false}
                      scrambleOnMount={false}
                      scrambleSignal={requestButtonScrambleSignal}
                      className="font-mono text-sm font-bold tracking-[0.24em]"
                    />
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="pointer-events-none absolute top-0 right-0 hidden h-full w-1/4 border-l border-[var(--border-soft)] opacity-50 lg:block" />
          <div className="pointer-events-none absolute left-0 h-[1px] w-full bg-[var(--border-soft)]" style={BOTTOM_RAIL_STYLE} />
        </main>
  );
}
