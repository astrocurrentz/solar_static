import React, { FormEvent, KeyboardEvent, startTransition, useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import CustomCursor from './components/CustomCursor';
import GlitchText from './components/GlitchText';
import NoiseOverlay from './components/NoiseOverlay';

type RoutePath = '/' | '/request' | '/thanks';
type SubmitState = 'idle' | 'sending' | 'error';
type RequestValidationErrors = {
  email?: string;
  message?: string;
};
type RequestTelemetryLine = {
  id: string;
  text: string;
  durationMs: number;
  accent: boolean;
};

const LOOPING_WORDS = [
  'MUSIC',
  'GRAPHICS',
  'SOFTWARE',
  'SOUND',
  'VISUAL',
  'APPS',
  'AUDIO',
  'ILLUSION',
  'WEB',
  'MEDIA',
  'DESIGN',
  'CODE',
  'SYSTEMS',
  'DIGITAL',
  'GENERATIVE',
  'SOLAR STATIC',
];
const GLITCH_LOOP_INTERVAL_OVERRIDES_MS = {
  'SOLAR STATIC': 980,
};

const ETHOS_PARAGRAPHS = [
  'As living beings in the universe, we constantly receive countless signals - light, radiation, sound, and invisible transmissions. What we see, hear, and feel are fragments of these signals, absorbed and interpreted through our own perception.',
  'As inhabitants orbiting the sun, we exist within a unique field of energy, noise, and static. Solar Static is born from this condition. Our work captures, transforms, and reshapes these signals into creative forms - design, sound, visuals, and software.',
  'Everything we create is a reflection of the signals we receive from the universe.',
];

const REQUEST_ENDPOINT = import.meta.env.VITE_REQUEST_ENDPOINT || '/.netlify/functions/request';

const HERO_BACKGROUND = {
  background: 'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-primary) 48%, var(--bg-secondary) 100%)',
};

const WARM_OVERLAY = {
  background:
    'radial-gradient(circle at center, rgba(201, 115, 56, 0.18) 0%, rgba(165, 77, 39, 0.08) 35%, rgba(40, 33, 25, 0) 70%)',
};

const HERO_GLOW = {
  background:
    'radial-gradient(circle at 76% 24%, rgba(201, 115, 56, 0.2) 0%, rgba(165, 77, 39, 0.06) 34%, rgba(40, 33, 25, 0) 72%)',
};

const PANEL_SHADOW = {
  boxShadow: '0 20px 40px var(--shadow-deep)',
};

const REQUEST_TERMINAL_PANEL = {
  backgroundImage: [
    'linear-gradient(180deg, rgba(8, 8, 8, 0.2) 0%, rgba(8, 8, 8, 0.04) 100%)',
    'linear-gradient(rgba(201, 115, 56, 0.08) 1px, transparent 1px)',
    'linear-gradient(90deg, rgba(201, 115, 56, 0.08) 1px, transparent 1px)',
  ].join(','),
  backgroundSize: '100% 100%, 100% 26px, 26px 100%',
  backgroundPosition: '0 0, 0 0, 0 0',
};

const GLITCH_LOOP_INTERVAL_MS = 540;
const NOISE_ANIMATION_DURATION_MS = 450;
const NOISE_ANIMATION_STEP_COUNT = 5;
const ETHOS_FOREGROUND_IDLE_MS = 60_000;
const BUTTON_GLITCH_NAV_DELAY_MS = 180;
const isValidEmailAddress = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const REQUEST_TELEMETRY_ACTIONS = ['build', 'route', 'trace', 'sync', 'cache', 'link', 'queue', 'emit', 'compile', 'index', 'relay', 'signal'];
const REQUEST_TELEMETRY_SUBJECTS = ['mesh', 'uplink', 'node', 'buffer', 'stack', 'graph', 'asset', 'signal', 'frame', 'kernel', 'vector', 'field'];
const REQUEST_TELEMETRY_STATES = ['warm', 'stable', 'active', 'ready', 'sealed', 'hot', 'open', 'mapped', 'latched', 'linked', 'queued', 'live'];

const randomFrom = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)] ?? items[0];
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const buildRequestTelemetryLine = (variant: 'primary' | 'secondary'): RequestTelemetryLine => {
  const segmentCount = variant === 'primary' ? randomInt(2, 4) : randomInt(1, 3);
  const parts = Array.from({ length: segmentCount }, (_, index) => {
    const connector = index === 0 ? '' : randomFrom([' :: ', ' -> ', ' => ']);
    const action = `${randomFrom(REQUEST_TELEMETRY_ACTIONS)}.${randomFrom(REQUEST_TELEMETRY_SUBJECTS)}`;
    return `${connector}${action}`;
  }).join('');
  const suffix = variant === 'primary'
    ? ` :: ${randomFrom(REQUEST_TELEMETRY_STATES)} [${randomInt(2, 99).toString(16)}${randomInt(2, 99).toString(16)}]`
    : ` + ${randomFrom(REQUEST_TELEMETRY_STATES)}`;

  const text = `${parts}${suffix}`.toUpperCase();

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text,
    durationMs: variant === 'primary' ? randomInt(260, 520) : randomInt(220, 420),
    accent: Math.random() > (variant === 'primary' ? 0.68 : 0.8),
  };
};

const buildRequestTelemetryBatch = (count: number, variant: 'primary' | 'secondary') => (
  Array.from({ length: count }, () => buildRequestTelemetryLine(variant))
);

const normalizeRoute = (pathname: string): RoutePath => {
  const cleanPath = pathname !== '/' ? pathname.replace(/\/+$/, '') : pathname;

  switch (cleanPath) {
    case '/request':
      return '/request';
    case '/thanks':
      return '/thanks';
    default:
      return '/';
  }
};

const App: React.FC = () => {
  const [route, setRoute] = useState<RoutePath>(() => normalizeRoute(window.location.pathname));
  const [email, setEmail] = useState('');
  const [requestBody, setRequestBody] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [validationErrors, setValidationErrors] = useState<RequestValidationErrors>({});
  const [primaryTelemetryLines, setPrimaryTelemetryLines] = useState<RequestTelemetryLine[]>(() => buildRequestTelemetryBatch(8, 'primary'));
  const [secondaryTelemetryLines, setSecondaryTelemetryLines] = useState<RequestTelemetryLine[]>(() => buildRequestTelemetryBatch(7, 'secondary'));
  const [isEthosInFront, setIsEthosInFront] = useState(false);
  const [landingButtonScrambleSignal, setLandingButtonScrambleSignal] = useState(0);
  const [requestButtonScrambleSignal, setRequestButtonScrambleSignal] = useState(0);
  const ethosIdleTimeoutRef = useRef<number | null>(null);
  const landingNavigationTimeoutRef = useRef<number | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const normalizedRoute = normalizeRoute(window.location.pathname);
    if (normalizedRoute !== window.location.pathname) {
      window.history.replaceState({}, '', normalizedRoute);
      setRoute(normalizedRoute);
    }

    const handlePopState = () => {
      startTransition(() => {
        setRoute(normalizeRoute(window.location.pathname));
      });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const pageTitles: Record<RoutePath, string> = {
      '/': 'SOLAR STATIC // CALCULATING DESTINY',
      '/request': 'SOLAR STATIC // TRANSMIT REQUEST',
      '/thanks': 'SOLAR STATIC // SIGNAL RECEIVED',
    };

    document.title = pageTitles[route];
  }, [route]);

  useEffect(() => {
    if (route === '/') {
      return;
    }

    setIsEthosInFront(false);

    if (ethosIdleTimeoutRef.current !== null) {
      window.clearTimeout(ethosIdleTimeoutRef.current);
      ethosIdleTimeoutRef.current = null;
    }
  }, [route]);

  useEffect(() => (
    () => {
      if (landingNavigationTimeoutRef.current !== null) {
        window.clearTimeout(landingNavigationTimeoutRef.current);
      }
    }
  ), []);

  useEffect(() => {
    if (route !== '/request') {
      return;
    }

    setPrimaryTelemetryLines(buildRequestTelemetryBatch(8, 'primary'));
    setSecondaryTelemetryLines(buildRequestTelemetryBatch(7, 'secondary'));

    const primaryInterval = window.setInterval(() => {
      setPrimaryTelemetryLines((currentLines) => [
        ...currentLines.slice(-7),
        buildRequestTelemetryLine('primary'),
      ]);
    }, 190);

    const secondaryInterval = window.setInterval(() => {
      setSecondaryTelemetryLines((currentLines) => [
        ...currentLines.slice(-6),
        buildRequestTelemetryLine('secondary'),
      ]);
    }, 240);

    return () => {
      window.clearInterval(primaryInterval);
      window.clearInterval(secondaryInterval);
    };
  }, [route]);

  useEffect(() => {
    if (route !== '/' || !isEthosInFront) {
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
  }, [route, isEthosInFront]);

  const navigate = (nextRoute: RoutePath) => {
    if (route === nextRoute) {
      return;
    }

    window.history.pushState({}, '', nextRoute);
    startTransition(() => {
      setRoute(nextRoute);
    });
  };

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

  const activateEthosForeground = () => {
    setIsEthosInFront(true);
  };

  const restoreEthosBackground = () => {
    setIsEthosInFront(false);
  };

  const handleEthosKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    activateEthosForeground();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRequestButtonScrambleSignal((currentSignal) => currentSignal + 1);

    const trimmedEmail = email.trim();
    const trimmedRequest = requestBody.trim();

    const nextValidationErrors: RequestValidationErrors = {};

    if (!trimmedEmail) {
      nextValidationErrors.email = 'EMAIL CHANNEL REQUIRED';
    } else if (!isValidEmailAddress(trimmedEmail)) {
      nextValidationErrors.email = 'EMAIL CHANNEL FORMAT INVALID';
    }

    if (!trimmedRequest) {
      nextValidationErrors.message = 'REQUEST BUFFER EMPTY';
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: trimmedEmail,
          message: trimmedRequest,
        }),
      });

      if (!response.ok) {
        throw new Error('Request submission failed');
      }

      setEmail('');
      setRequestBody('');
      setSubmitState('idle');
      navigate('/thanks');
    } catch (error) {
      console.error(error);
      setSubmitState('error');
    }
  };

  const validationMessages = Object.values(validationErrors);
  const hasValidationWarnings = validationMessages.length > 0;
  const submitButtonLabel = submitState === 'sending'
    ? 'TRANSMITTING'
    : hasValidationWarnings
      ? 'DATA MISSING'
      : submitState === 'error'
        ? 'RETRY TRANSMISSION'
        : 'DISPATCH SIGNAL';
  const requestStateLabel = hasValidationWarnings
    ? 'warning'
    : submitState === 'sending'
      ? 'transmitting'
      : submitState === 'error'
        ? 'retry_required'
        : 'ready';

  return (
    <div className="relative h-screen overflow-hidden cursor-none bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <CustomCursor />
      <NoiseOverlay />

      {route === '/' && (
        <main className="relative h-screen overflow-hidden" style={HERO_BACKGROUND}>
          <div className="absolute inset-0 opacity-80" style={HERO_GLOW} />
          <div className="absolute inset-0 opacity-70" style={WARM_OVERLAY} />

          <div className="relative z-10 h-full px-6 pb-10 pt-20 md:px-24 md:pb-12">
            <div
              className="relative mx-auto h-full w-full max-w-7xl"
              onClick={() => {
                if (!isEthosInFront) {
                  return;
                }

                restoreEthosBackground();
              }}
            >
              <div className="absolute left-0 top-0 flex items-center gap-4 font-mono text-xs font-bold tracking-[0.2em] text-[var(--accent-secondary)]">
                <div className="h-2 w-2 animate-pulse rounded-none bg-[var(--accent-secondary)]" />
                <span>SYSTEM_ONLINE // V.2026</span>
              </div>

              <div
                className={`pointer-events-none relative z-10 flex h-full items-center pb-44 pt-16 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] md:pb-32 ${
                  isEthosInFront ? 'scale-[0.92] opacity-30 md:scale-[0.94]' : 'scale-100 opacity-100'
                }`}
              >
                <h1
                  className={`w-full select-none font-display font-black leading-[0.82] tracking-tighter text-[var(--text-primary)] transition-[font-size] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isEthosInFront ? 'text-[12.8vw] md:text-[12vw]' : 'text-[14vw]'
                  }`}
                >
                  <span className="relative z-10 block max-w-full pl-[8vw] pr-[2vw]">
                    <span className="absolute -left-12 top-1/2 hidden -translate-y-1/2 -rotate-90 origin-right font-mono text-sm font-normal tracking-widest text-[var(--text-secondary)] opacity-60 md:block">
                      (CYBER_METAPHYSICS)
                    </span>
                    <GlitchText
                      texts={LOOPING_WORDS}
                      autoLoop
                      loopIntervalMs={GLITCH_LOOP_INTERVAL_MS}
                      loopIntervalOverridesMs={GLITCH_LOOP_INTERVAL_OVERRIDES_MS}
                      accentLettersEnabled={!isEthosInFront}
                      className="block w-full max-w-full"
                    />
                  </span>
                </h1>
              </div>

              <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
                <div
                  role="button"
                  tabIndex={0}
                  aria-pressed={isEthosInFront}
                  onClick={(event) => {
                    event.stopPropagation();
                    activateEthosForeground();
                  }}
                  onKeyDown={handleEthosKeyDown}
                  className={`relative max-w-lg origin-bottom-left outline-none transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:opacity-100 ${
                    isEthosInFront ? 'z-30 scale-[1.06] opacity-100 md:scale-[1.08]' : 'z-0 scale-100 opacity-60'
                  }`}
                >
                  <p
                    className={`font-mono font-medium leading-relaxed transition-[color,font-size] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      isEthosInFront ? 'text-base text-[var(--accent-secondary)] md:text-lg' : 'text-sm text-[var(--text-secondary)] md:text-base'
                    }`}
                  >
                    <span className={`px-1 transition-colors ${isEthosInFront ? 'bg-[var(--accent-secondary)] text-[var(--bg-primary)]' : 'bg-[var(--bg-light)] text-[var(--text-dark)]'}`}>////// SOLAR_STATIC_ETHOS:</span>
                    {ETHOS_PARAGRAPHS.map((paragraph, index) => (
                      <React.Fragment key={paragraph}>
                        <br />
                        {paragraph}
                        {index < ETHOS_PARAGRAPHS.length - 1 && (
                          <>
                            <br />
                            <br />
                          </>
                        )}
                      </React.Fragment>
                    ))}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setLandingButtonScrambleSignal((currentSignal) => currentSignal + 1);

                    if (landingNavigationTimeoutRef.current !== null) {
                      window.clearTimeout(landingNavigationTimeoutRef.current);
                    }

                    landingNavigationTimeoutRef.current = window.setTimeout(() => {
                      navigate('/request');
                      landingNavigationTimeoutRef.current = null;
                    }, BUTTON_GLITCH_NAV_DELAY_MS);
                  }}
                  className="group relative z-20 flex self-start items-center gap-4 text-lg font-bold text-[var(--text-primary)] transition-colors hover:text-[var(--accent-secondary)] md:self-auto"
                >
                  <div className="flex h-12 w-12 items-center justify-center border border-[var(--border-strong)] bg-[var(--surface-tint)] transition-all group-hover:border-[var(--accent-primary)] group-hover:bg-[var(--accent-primary)] group-hover:text-[var(--text-primary)]">
                    <ArrowUpRight size={20} />
                  </div>
                  <GlitchText
                    text="TRANSMIT REQUEST"
                    wrapToWidth={false}
                    scrambleOnMount={false}
                    scrambleSignal={landingButtonScrambleSignal}
                    className="font-mono text-sm tracking-widest"
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute top-0 right-0 hidden h-full w-1/4 border-l border-[var(--border-soft)] opacity-50 lg:block" />
          <div className="pointer-events-none absolute bottom-20 left-0 h-[1px] w-full bg-[var(--border-soft)]" />
        </main>
      )}

      {route === '/request' && (
        <main className="relative h-screen overflow-hidden" style={HERO_BACKGROUND}>
          <div className="absolute inset-0 opacity-75" style={HERO_GLOW} />
          <div className="absolute inset-0 opacity-70" style={WARM_OVERLAY} />

          <div className="relative z-10 flex h-full items-center justify-center px-6 py-10 md:px-24 md:py-12">
            <form
              onSubmit={handleSubmit}
              className="relative w-full max-w-5xl overflow-hidden border border-[var(--border-strong)] bg-[rgba(40,33,25,0.88)]"
              style={{ ...PANEL_SHADOW, ...REQUEST_TERMINAL_PANEL }}
              noValidate
            >
              <span className="pointer-events-none absolute left-3 top-3 h-3 w-3 border-l border-t border-[var(--accent-secondary)]" />
              <span className="pointer-events-none absolute right-3 top-3 h-3 w-3 border-r border-t border-[var(--accent-secondary)]" />
              <span className="pointer-events-none absolute bottom-3 left-3 h-3 w-3 border-b border-l border-[var(--accent-secondary)]" />
              <span className="pointer-events-none absolute bottom-3 right-3 h-3 w-3 border-b border-r border-[var(--accent-secondary)]" />
              <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-55">
                <div className="absolute left-8 top-16 h-px w-[22%] min-w-24 bg-[rgba(201,115,56,0.14)]">
                  <span className="animate-request-packet absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-transparent via-[rgba(201,115,56,0.9)] to-transparent" />
                </div>
                <div className="absolute right-[11.5rem] top-[7.5rem] h-[11.5rem] w-px bg-[rgba(201,115,56,0.12)]">
                  <span className="animate-request-packet-vertical absolute left-1/2 top-0 h-16 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[rgba(201,115,56,0.95)] to-transparent" />
                </div>
                <div className="absolute left-[34%] top-[10.75rem] h-px w-[28%] max-w-[20rem] bg-[rgba(201,115,56,0.1)]">
                  <span className="animate-request-packet-delay absolute inset-y-0 left-0 w-14 bg-gradient-to-r from-transparent via-[rgba(229,216,189,0.85)] to-transparent" />
                </div>
                <div className="animate-request-node absolute left-[calc(34%+20rem)] top-[10.55rem] h-2 w-2 rounded-full border border-[rgba(201,115,56,0.6)] bg-[rgba(201,115,56,0.18)]" />
                <div className="animate-request-node-delay absolute right-[10.8rem] top-[18.3rem] h-2 w-2 rounded-full border border-[rgba(229,216,189,0.42)] bg-[rgba(229,216,189,0.08)]" />
                <div className="absolute bottom-32 right-8 hidden w-64 overflow-hidden border-r border-[rgba(201,115,56,0.14)] pr-3 text-right font-mono text-[8px] uppercase tracking-[0.22em] md:block">
                  <div className="space-y-1">
                    {primaryTelemetryLines.map((line) => (
                      <div
                        key={line.id}
                        className={`animate-request-typing ml-auto block overflow-hidden whitespace-nowrap border-r border-[rgba(201,115,56,0.4)] pr-2 ${
                          line.accent ? 'text-[rgba(201,115,56,0.5)]' : 'text-[rgba(201,115,56,0.28)]'
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
                <div className="absolute bottom-56 right-8 hidden w-40 overflow-hidden border-r border-[rgba(201,115,56,0.14)] pr-3 text-right font-mono text-[8px] uppercase tracking-[0.2em] lg:block">
                  <div className="space-y-1">
                    {secondaryTelemetryLines.map((line) => (
                      <div
                        key={line.id}
                        className={`animate-request-typing ml-auto block overflow-hidden whitespace-nowrap border-r border-[rgba(229,216,189,0.28)] pr-2 ${
                          line.accent ? 'text-[rgba(229,216,189,0.34)]' : 'text-[rgba(229,216,189,0.2)]'
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

              <div className="relative z-10 flex min-h-[calc(100vh-5rem)] flex-col md:min-h-[min(46rem,calc(100vh-6rem))]">
                <div className="flex items-center justify-between gap-4 border-b border-[var(--border-soft)] px-5 py-4 font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--accent-secondary)] md:px-7">
                  <GlitchText
                    text="TRANSMISSION_CONSOLE"
                    wrapToWidth={false}
                    className="block min-w-0 overflow-hidden whitespace-nowrap text-ellipsis text-[9px] tracking-[0.16em] md:text-[10px] md:tracking-[0.2em]"
                  />
                  <span className="shrink-0 text-[var(--text-secondary)]">NODE // REQUEST</span>
                </div>

                <div className="grid flex-1 gap-4 p-5 md:gap-6 md:p-7">
                  <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_12rem] md:items-start">
                    <div className={`border bg-[rgba(8,8,8,0.12)] transition-colors ${validationErrors.email ? 'border-[var(--accent-secondary)]' : 'border-[var(--border-soft)]'}`}>
                      <div className={`flex items-center justify-between border-b px-4 py-2 font-mono text-[10px] uppercase tracking-[0.26em] transition-colors ${validationErrors.email ? 'border-[var(--accent-secondary)] text-[var(--accent-secondary)]' : 'border-[var(--border-soft)] text-[var(--text-secondary)]'}`}>
                        <span>Email_Channel</span>
                        <span>{validationErrors.email ? '[ warning ]' : '[ input ]'}</span>
                      </div>
                      <label htmlFor="request-email" className="sr-only">Email</label>
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
                        placeholder="YOUR EMAIL"
                        required
                        aria-invalid={validationErrors.email ? 'true' : 'false'}
                        className="w-full bg-transparent px-4 py-3 font-mono text-sm tracking-[0.18em] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none"
                      />
                    </div>

                    <div className={`flex flex-col justify-between border bg-[rgba(8,8,8,0.18)] p-4 font-mono text-[10px] uppercase tracking-[0.24em] transition-colors ${hasValidationWarnings ? 'border-[var(--accent-secondary)] text-[var(--accent-secondary)]' : 'border-[var(--border-soft)] text-[var(--text-secondary)]'}`}>
                      <span>[ route ] uplink://solar-static</span>
                      <span>[ state ] {requestStateLabel}</span>
                      <span>[ mode ] human_input</span>
                      {hasValidationWarnings && (
                        <div className="mt-4 border-t border-[rgba(201,115,56,0.28)] pt-3 text-[9px] leading-relaxed text-[var(--text-primary)]">
                          {validationMessages.map((message) => (
                            <span key={message} className="block">
                              &gt; {message}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`flex min-h-0 flex-1 flex-col border bg-[rgba(8,8,8,0.12)] transition-colors ${validationErrors.message ? 'border-[var(--accent-secondary)]' : 'border-[var(--border-soft)]'}`}>
                    <div className={`flex items-center justify-between border-b px-4 py-2 font-mono text-[10px] uppercase tracking-[0.26em] transition-colors ${validationErrors.message ? 'border-[var(--accent-secondary)] text-[var(--accent-secondary)]' : 'border-[var(--border-soft)] text-[var(--text-secondary)]'}`}>
                      <span>Request_Buffer</span>
                      <span>{validationErrors.message ? '[ warning ]' : '[ text_stream ]'}</span>
                    </div>
                    <label htmlFor="request-message" className="sr-only">Request</label>
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
                      placeholder="TRANSMIT YOUR REQUEST"
                      required
                      rows={10}
                      aria-invalid={validationErrors.message ? 'true' : 'false'}
                      className="h-full min-h-[16rem] flex-1 resize-none bg-transparent px-4 py-4 font-mono text-sm leading-relaxed tracking-[0.12em] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:bg-[rgba(201,115,56,0.05)] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4 border-t border-[var(--border-soft)] px-5 py-4 md:flex-row md:items-center md:justify-between md:px-7">
                  <div className="font-mono text-[10px] uppercase tracking-[0.26em] text-[var(--text-secondary)]">
                    [ protocol ] solar-static uplink / encrypted static / single dispatch
                  </div>
                  <button
                    type="submit"
                    disabled={submitState === 'sending'}
                    className="group flex w-full items-center justify-center gap-4 border border-[var(--border-strong)] bg-[rgba(201,115,56,0.14)] px-6 py-4 font-mono text-sm font-bold tracking-[0.24em] text-[var(--text-primary)] transition-all hover:border-[var(--accent-secondary)] hover:bg-[var(--accent-primary)] disabled:cursor-wait disabled:opacity-80 md:w-auto md:min-w-[20rem]"
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
          <div className="pointer-events-none absolute bottom-20 left-0 h-[1px] w-full bg-[var(--border-soft)]" />
        </main>
      )}

      {route === '/thanks' && (
        <main className="relative h-screen overflow-hidden" style={HERO_BACKGROUND}>
          <div className="absolute inset-0 opacity-75" style={HERO_GLOW} />
          <div className="absolute inset-0 opacity-70" style={WARM_OVERLAY} />

          <div className="relative z-10 flex h-full items-center justify-center px-6 md:px-24">
            <div className="flex max-w-xl flex-col items-center gap-8 text-center">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="transition-transform duration-300 hover:scale-110"
                aria-label="Return home"
              >
                <img
                  src="/assets/brand/sss-mark-96.png"
                  alt="Solar Static logo"
                  className="h-12 w-12 md:h-16 md:w-16"
                  style={{ imageRendering: 'pixelated' }}
                />
              </button>
              <p className="font-mono text-base leading-relaxed text-[var(--text-secondary)] md:text-lg">
                thanks for submitting your request, we will get back to you soon.
              </p>
            </div>
          </div>

          <div className="pointer-events-none absolute top-0 right-0 hidden h-full w-1/4 border-l border-[var(--border-soft)] opacity-50 lg:block" />
          <div className="pointer-events-none absolute bottom-20 left-0 h-[1px] w-full bg-[var(--border-soft)]" />
        </main>
      )}

      <style>{`
        @keyframes noise {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-5%, -5%); }
          20% { transform: translate(-10%, 5%); }
          30% { transform: translate(5%, -10%); }
          40% { transform: translate(-5%, 15%); }
          50% { transform: translate(-10%, 5%); }
          60% { transform: translate(15%, 0); }
          70% { transform: translate(0, 10%); }
          80% { transform: translate(-15%, 0); }
          90% { transform: translate(10%, 5%); }
        }
        @keyframes request-packet {
          0% { transform: translateX(-120%); opacity: 0; }
          12% { opacity: 0.78; }
          72% { opacity: 0.5; }
          100% { transform: translateX(420%); opacity: 0; }
        }
        @keyframes request-packet-vertical {
          0% { transform: translate(-50%, -120%); opacity: 0; }
          16% { opacity: 0.7; }
          72% { opacity: 0.42; }
          100% { transform: translate(-50%, 520%); opacity: 0; }
        }
        @keyframes request-node {
          0%, 100% { transform: scale(0.85); opacity: 0.18; }
          45% { transform: scale(1.3); opacity: 0.72; }
          60% { transform: scale(1); opacity: 0.38; }
        }
        @keyframes request-typing {
          0% {
            width: 0ch;
            opacity: 0;
            border-right-color: rgba(201, 115, 56, 0.85);
          }
          8% {
            opacity: 0.82;
          }
          82% {
            opacity: 0.52;
            border-right-color: rgba(201, 115, 56, 0.78);
          }
          100% {
            width: var(--request-typing-width);
            opacity: 0.28;
            border-right-color: transparent;
          }
        }
        .animate-noise {
          animation: noise ${NOISE_ANIMATION_DURATION_MS}ms steps(${NOISE_ANIMATION_STEP_COUNT}) infinite;
        }
        .animate-request-packet {
          animation: request-packet 3.4s linear infinite;
        }
        .animate-request-packet-delay {
          animation: request-packet 2.8s linear infinite 0.55s;
        }
        .animate-request-packet-vertical {
          animation: request-packet-vertical 3.2s linear infinite 0.3s;
        }
        .animate-request-node {
          animation: request-node 1.8s ease-in-out infinite;
        }
        .animate-request-node-delay {
          animation: request-node 2.2s ease-in-out infinite 0.4s;
        }
        .animate-request-typing {
          width: var(--request-typing-width);
          animation: request-typing var(--request-typing-duration) steps(var(--request-typing-steps), end) 1;
        }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        textarea:-webkit-autofill,
        textarea:-webkit-autofill:hover,
        textarea:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0px 1000px transparent inset;
          -webkit-text-fill-color: var(--text-primary);
          transition: background-color 9999s ease-out 0s;
        }
      `}</style>
    </div>
  );
};

export default App;
