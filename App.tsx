import React, { FormEvent, KeyboardEvent, startTransition, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import CustomCursor from './components/CustomCursor';
import GlitchText from './components/GlitchText';
import NoiseOverlay from './components/NoiseOverlay';
import {
  BaziSelectedWorkPage,
  LatentSelectedWorkPage,
  SelectedWorksIndexPage,
} from './components/SelectedWorksPages';
import {
  TextToImagePostToolPage,
  ToolsLauncherCard,
} from './components/ToolsPages';

type RoutePath = '/' | '/tools' | '/tools/__text2imgp' | '/request' | '/thanks' | '/selected-works' | '/selected-works/bazi' | '/selected-works/latent-27';
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
  'As living beings in the universe, we constantly receive countless signals — light, radiation, sound, and invisible transmissions. What we see, hear, and feel are fragments of these signals, absorbed and interpreted through our own perception.',
  'As inhabitants orbiting the sun, we exist within a unique field of energy, noise, and static. Solar Static emerges from this condition. Our work captures, transforms, and reshapes these signals into creative forms — design, sound, visuals, and software.',
  'Through this process, the ordinary becomes something else. Familiar objects and everyday interactions are reimagined as playful encounters with the signals surrounding us — small moments of curiosity, discovery, and quiet reflection.',
  'Everything we create is a reflection of the signals we receive from the universe.',
];
const ETHOS_FULL_TEXT = ETHOS_PARAGRAPHS.join('\n\n');

const REQUEST_ENDPOINT = import.meta.env.VITE_REQUEST_ENDPOINT || '/api/request';

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
const TOOLS_MESH_STYLE_PRIMARY = {
  backgroundImage: [
    'linear-gradient(to right, rgba(229, 216, 189, 0.12) 1px, transparent 1px)',
    'linear-gradient(to bottom, rgba(229, 216, 189, 0.12) 1px, transparent 1px)',
  ].join(','),
  backgroundSize: '68px 68px, 68px 68px',
};
const TOOLS_MESH_STYLE_SECONDARY = {
  backgroundImage: [
    'linear-gradient(to right, rgba(201, 115, 56, 0.16) 1px, transparent 1px)',
    'linear-gradient(to bottom, rgba(201, 115, 56, 0.16) 1px, transparent 1px)',
  ].join(','),
  backgroundSize: '18px 18px, 18px 18px',
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
const ETHOS_GLITCH_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&?!<>';
const ETHOS_REVEAL_STEP_MS = 8;
const ETHOS_REVEAL_STEP = 6;
const THANKS_MESSAGE_SENTENCES = [
  'signal received.',
  'your request is now\nin the static.',
  'we will transmit\na return signal soon.',
];
const THANKS_MESSAGE_LOOP_INTERVAL_MS = 3200;
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
const ROUTE_VIEWPORT_STYLE = { minHeight: '100dvh' };
const BOTTOM_RAIL_STYLE = { bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' };
const LANDING_CONTENT_STYLE = {
  paddingTop: 'calc(5rem + env(safe-area-inset-top, 0px))',
  paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))',
};
const REQUEST_PANEL_STYLE = {
  maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 2rem)',
};
const THANKS_CONTENT_STYLE = {
  paddingTop: 'calc(2rem + env(safe-area-inset-top, 0px))',
  paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))',
};
const TOP_LEFT_BACK_BUTTON_STYLE = {
  top: 'calc(1rem + env(safe-area-inset-top, 0px))',
};

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
    case '/selected-works':
      return '/selected-works';
    case '/selected-works/bazi':
      return '/selected-works/bazi';
    case '/selected-works/latent-27':
      return '/selected-works/latent-27';
    case '/tools':
      return '/tools';
    case '/tools/__text2imgp':
      return '/tools/__text2imgp';
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
  const [ethosDisplayText, setEthosDisplayText] = useState('');
  const [landingButtonScrambleSignal, setLandingButtonScrambleSignal] = useState(0);
  const [selectedWorksButtonScrambleSignal, setSelectedWorksButtonScrambleSignal] = useState(0);
  const [requestButtonScrambleSignal, setRequestButtonScrambleSignal] = useState(0);
  const ethosIdleTimeoutRef = useRef<number | null>(null);
  const ethosScrambleIntervalRef = useRef<number | null>(null);
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
      '/': '// SOLAT STATIC // /',
      '/tools': 'TOOLS',
      '/tools/__text2imgp': 'SOLAR STATIC // TEXT_TO_IMG_POST',
      '/selected-works': 'SOLAR STATIC // SELECTED WORKS',
      '/selected-works/bazi': 'SOLAR STATIC // 八字·BĀZÌ',
      '/selected-works/latent-27': 'SOLAR STATIC // LATENT 27',
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
    setEthosDisplayText('');

    if (ethosIdleTimeoutRef.current !== null) {
      window.clearTimeout(ethosIdleTimeoutRef.current);
      ethosIdleTimeoutRef.current = null;
    }

    if (ethosScrambleIntervalRef.current !== null) {
      window.clearInterval(ethosScrambleIntervalRef.current);
      ethosScrambleIntervalRef.current = null;
    }
  }, [route]);

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
    <div className="relative h-[100dvh] min-h-[100dvh] overflow-hidden cursor-none bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <CustomCursor />
      <NoiseOverlay />

      {route === '/' && (
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
                  CREATIVE_STUDIO // V.2026
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
                      navigate('/selected-works');
                      landingNavigationTimeoutRef.current = null;
                    }, BUTTON_GLITCH_NAV_DELAY_MS);
                  }}
                  className="group flex items-center gap-4 text-lg font-bold text-[var(--text-primary)] transition-colors hover:text-[var(--accent-secondary)]"
                >
                  <div className="flex h-12 w-12 items-center justify-center border border-[var(--border-strong)] bg-[var(--surface-tint)] transition-all group-hover:border-[var(--accent-primary)] group-hover:bg-[var(--accent-primary)] group-hover:text-[var(--text-primary)]">
                    <ArrowUpRight size={20} />
                  </div>
                  <GlitchText
                    text="SELECTED WORKS"
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
                      navigate('/request');
                      landingNavigationTimeoutRef.current = null;
                    }, BUTTON_GLITCH_NAV_DELAY_MS);
                  }}
                  className="group flex items-center gap-4 text-lg font-bold text-[var(--text-primary)] transition-colors hover:text-[var(--accent-secondary)]"
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
                    <span className={`px-1 transition-colors ${isEthosInFront ? 'bg-[var(--accent-secondary)] text-[var(--bg-primary)]' : 'bg-[var(--bg-light)] text-[var(--text-dark)]'}`}>////// SOLAR_STATIC_ETHOS:</span>
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
      )}

      {route === '/tools' && (
        <main className="relative h-[100dvh] min-h-[100dvh] overflow-hidden" style={{ ...HERO_BACKGROUND, ...ROUTE_VIEWPORT_STYLE }}>
          <div className="absolute inset-0 opacity-80" style={HERO_GLOW} />
          <div className="absolute inset-0 opacity-70" style={WARM_OVERLAY} />
          <div className="animate-tools-mesh-drift pointer-events-none absolute inset-0 opacity-34" style={TOOLS_MESH_STYLE_PRIMARY} />
          <div className="pointer-events-none absolute inset-0 opacity-24" style={TOOLS_MESH_STYLE_SECONDARY} />

          <div className="absolute left-3 z-20 md:left-8" style={TOP_LEFT_BACK_BUTTON_STYLE}>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="group flex items-center gap-4 text-lg font-bold text-[var(--text-primary)] transition-colors hover:text-[var(--accent-secondary)]"
              aria-label="Back to Solar Static home"
            >
              <div className="flex h-12 w-12 items-center justify-center border border-[var(--border-strong)] bg-[var(--surface-tint)] transition-all group-hover:border-[var(--accent-primary)] group-hover:bg-[var(--accent-primary)] group-hover:text-[var(--text-primary)]">
                <ArrowLeft size={18} aria-hidden="true" />
              </div>
              <GlitchText
                text="SS"
                wrapToWidth={false}
                className="font-mono text-sm tracking-widest"
              />
            </button>
          </div>

          <ToolsLauncherCard
            onOpenTextToImagePost={() => navigate('/tools/__text2imgp')}
          />

          <div className="pointer-events-none absolute top-0 right-0 hidden h-full w-[clamp(12rem,18vw,24rem)] border-l border-[var(--border-soft)] opacity-50 lg:block" />
          <div className="pointer-events-none absolute left-0 h-[1px] w-full bg-[var(--border-soft)]" style={BOTTOM_RAIL_STYLE} />
        </main>
      )}

      {route === '/tools/__text2imgp' && (
        <main className="relative h-[100dvh] min-h-[100dvh] overflow-x-hidden overflow-y-auto" style={{ ...HERO_BACKGROUND, ...ROUTE_VIEWPORT_STYLE }}>
          <div className="absolute inset-0 opacity-80" style={HERO_GLOW} />
          <div className="absolute inset-0 opacity-70" style={WARM_OVERLAY} />
          <div className="animate-tools-mesh-drift pointer-events-none absolute inset-0 opacity-34" style={TOOLS_MESH_STYLE_PRIMARY} />
          <div className="pointer-events-none absolute inset-0 opacity-24" style={TOOLS_MESH_STYLE_SECONDARY} />

          <div className="absolute left-3 z-20 md:left-8" style={TOP_LEFT_BACK_BUTTON_STYLE}>
            <button
              type="button"
              onClick={() => navigate('/tools')}
              className="group flex items-center gap-4 text-lg font-bold text-[var(--text-primary)] transition-colors hover:text-[var(--accent-secondary)]"
              aria-label="Back to tools"
            >
              <div className="flex h-12 w-12 items-center justify-center border border-[var(--border-strong)] bg-[var(--surface-tint)] transition-all group-hover:border-[var(--accent-primary)] group-hover:bg-[var(--accent-primary)] group-hover:text-[var(--text-primary)]">
                <ArrowLeft size={18} aria-hidden="true" />
              </div>
              <GlitchText
                text="TOOLS"
                wrapToWidth={false}
                className="hidden font-mono text-sm tracking-widest md:block"
              />
            </button>
          </div>

          <TextToImagePostToolPage />

          <div className="pointer-events-none absolute top-0 right-0 hidden h-full w-[clamp(12rem,18vw,24rem)] border-l border-[var(--border-soft)] opacity-50 lg:block" />
          <div className="pointer-events-none absolute left-0 hidden h-[1px] w-full bg-[var(--border-soft)] md:block" style={BOTTOM_RAIL_STYLE} />
        </main>
      )}

      {route === '/selected-works' && (
        <div className="relative h-[100dvh] min-h-[100dvh]">
          <SelectedWorksIndexPage onNavigate={(nextRoute) => navigate(nextRoute)} />
          <div className="absolute left-3 z-20 md:left-8" style={TOP_LEFT_BACK_BUTTON_STYLE}>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="group flex items-center gap-4 text-lg font-bold text-[var(--text-primary)] transition-colors hover:text-[var(--accent-secondary)]"
              aria-label="Back to Solar Static home"
            >
              <div className="flex h-12 w-12 items-center justify-center border border-[var(--border-strong)] bg-[var(--surface-tint)] transition-all group-hover:border-[var(--accent-primary)] group-hover:bg-[var(--accent-primary)] group-hover:text-[var(--text-primary)]">
                <ArrowLeft size={18} aria-hidden="true" />
              </div>
              <GlitchText
                text="SS"
                wrapToWidth={false}
                className="font-mono text-sm tracking-widest"
              />
            </button>
          </div>
        </div>
      )}

      {route === '/selected-works/bazi' && (
        <BaziSelectedWorkPage />
      )}

      {route === '/selected-works/latent-27' && (
        <LatentSelectedWorkPage />
      )}

      {route === '/request' && (
        <main className="relative h-[100dvh] min-h-[100dvh] overflow-hidden" style={{ ...HERO_BACKGROUND, ...ROUTE_VIEWPORT_STYLE }}>
          <div className="absolute inset-0 opacity-75" style={HERO_GLOW} />
          <div className="absolute inset-0 opacity-70" style={WARM_OVERLAY} />
          <div className="absolute left-3 z-20 md:left-8" style={TOP_LEFT_BACK_BUTTON_STYLE}>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="group flex items-center gap-4 text-lg font-bold text-[var(--text-primary)] transition-colors hover:text-[var(--accent-secondary)]"
              aria-label="Back to Solar Static home"
            >
              <div className="flex h-12 w-12 items-center justify-center border border-[var(--border-strong)] bg-[var(--surface-tint)] transition-all group-hover:border-[var(--accent-primary)] group-hover:bg-[var(--accent-primary)] group-hover:text-[var(--text-primary)]">
                <ArrowLeft size={18} aria-hidden="true" />
              </div>
              <GlitchText
                text="SS"
                wrapToWidth={false}
                className="font-mono text-sm tracking-widest"
              />
            </button>
          </div>

          <div className="request-shell relative z-10 flex h-full items-center justify-center px-3 sm:px-6 md:px-24">
            <form
              onSubmit={handleSubmit}
              className="relative h-full w-full max-w-5xl overflow-hidden border border-[var(--border-strong)] bg-[rgba(40,33,25,0.88)]"
              style={{ ...PANEL_SHADOW, ...REQUEST_TERMINAL_PANEL, ...REQUEST_PANEL_STYLE }}
              noValidate
            >
              <span className="pointer-events-none absolute left-3 top-3 h-3 w-3 border-l border-t border-[var(--accent-secondary)]" />
              <span className="pointer-events-none absolute right-3 top-3 h-3 w-3 border-r border-t border-[var(--accent-secondary)]" />
              <span className="pointer-events-none absolute bottom-3 left-3 h-3 w-3 border-b border-l border-[var(--accent-secondary)]" />
              <span className="pointer-events-none absolute bottom-3 right-3 h-3 w-3 border-b border-r border-[var(--accent-secondary)]" />
              <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-55">
                <div className="absolute inset-0 md:hidden">
                  <div className="absolute left-4 right-4 top-[5.8rem] h-px overflow-hidden bg-[rgba(201,115,56,0.2)]">
                    <span className="animate-request-mobile-scan absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-transparent via-[rgba(201,115,56,0.94)] to-transparent" />
                  </div>
                  <div className="absolute left-5 right-5 bottom-[10.6rem] h-px overflow-hidden bg-[rgba(201,115,56,0.16)]">
                    <span className="animate-request-mobile-scan-delay absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-transparent via-[rgba(229,216,189,0.84)] to-transparent" />
                  </div>
                  <div className="absolute right-11 top-[6.9rem] bottom-[8.6rem] w-px overflow-hidden bg-[rgba(201,115,56,0.18)]">
                    <span className="animate-request-mobile-pulse absolute left-1/2 top-0 h-16 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[rgba(201,115,56,0.96)] to-transparent" />
                  </div>
                  <div className="animate-request-mobile-node absolute left-6 top-[5.6rem] h-2 w-2 rounded-full border border-[rgba(201,115,56,0.58)] bg-[rgba(201,115,56,0.2)]" />
                  <div className="animate-request-mobile-node-delay absolute right-10 bottom-[10.45rem] h-2 w-2 rounded-full border border-[rgba(229,216,189,0.42)] bg-[rgba(229,216,189,0.08)]" />
                </div>
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
                <div className="absolute bottom-36 right-4 h-px w-32 bg-[rgba(201,115,56,0.16)] md:hidden">
                  <span className="animate-request-packet absolute inset-y-0 left-0 w-14 bg-gradient-to-r from-transparent via-[rgba(201,115,56,0.85)] to-transparent" />
                </div>
                <div className="animate-request-node absolute bottom-[8.6rem] right-[8.5rem] h-2 w-2 rounded-full border border-[rgba(201,115,56,0.55)] bg-[rgba(201,115,56,0.16)] md:hidden" />
                <div className="absolute bottom-24 right-4 w-40 overflow-hidden border-r border-[rgba(201,115,56,0.14)] pr-2 text-right font-mono text-[8px] uppercase tracking-[0.18em] md:hidden">
                  <div className="space-y-1">
                    {secondaryTelemetryLines.slice(-4).map((line) => (
                      <div
                        key={`mobile-${line.id}`}
                        className={`animate-request-typing ml-auto block overflow-hidden whitespace-nowrap border-r border-[rgba(229,216,189,0.24)] pr-1 ${
                          line.accent ? 'text-[rgba(229,216,189,0.32)]' : 'text-[rgba(229,216,189,0.18)]'
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

              <div className="relative z-10 flex h-full min-h-0 flex-col">
                <div className="flex items-center justify-between gap-3 border-b border-[var(--border-soft)] px-4 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--accent-secondary)] sm:text-[10px] md:px-7 md:py-4 md:text-[11px] md:tracking-[0.28em]">
                  <GlitchText
                    text="TRANSMISSION_CONSOLE"
                    wrapToWidth={false}
                    className="block min-w-0 overflow-hidden whitespace-nowrap text-ellipsis text-[8px] tracking-[0.14em] sm:text-[9px] md:text-[10px] md:tracking-[0.2em]"
                  />
                  <span className="shrink-0 text-[var(--text-secondary)]">NODE // REQUEST</span>
                </div>

                <div className="grid min-h-0 flex-1 gap-4 p-4 md:gap-5 md:px-0 md:py-5">
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
                        className="w-full bg-transparent px-4 py-3 font-mono text-sm tracking-[0.14em] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none md:tracking-[0.18em]"
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
                      className="h-full min-h-[12rem] flex-1 resize-none bg-transparent px-4 py-4 font-mono text-sm leading-relaxed tracking-[0.1em] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:bg-[rgba(201,115,56,0.05)] focus:outline-none md:min-h-[16rem] md:tracking-[0.12em]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4 border-t border-[var(--border-soft)] px-4 py-3 md:flex-row md:items-center md:justify-between md:px-7 md:py-4">
                  <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--text-secondary)] md:text-[10px] md:tracking-[0.26em]">
                    [ protocol ] solar-static uplink / encrypted static / single dispatch
                  </div>
                  <button
                    type="submit"
                    disabled={submitState === 'sending'}
                    className="group flex w-full items-center justify-center gap-3 border border-[var(--border-strong)] bg-[rgba(201,115,56,0.14)] px-5 py-3 font-mono text-sm font-bold tracking-[0.2em] text-[var(--text-primary)] transition-all hover:border-[var(--accent-secondary)] hover:bg-[var(--accent-primary)] disabled:cursor-wait disabled:opacity-80 md:w-auto md:min-w-[20rem] md:gap-4 md:px-6 md:py-4 md:tracking-[0.24em]"
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
      )}

      {route === '/thanks' && (
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
                  onClick={() => navigate('/')}
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
        @keyframes request-mobile-scan {
          0% { transform: translateX(-140%); opacity: 0; }
          16% { opacity: 0.88; }
          72% { opacity: 0.44; }
          100% { transform: translateX(460%); opacity: 0; }
        }
        @keyframes request-mobile-pulse {
          0% { transform: translate(-50%, -120%); opacity: 0; }
          12% { opacity: 0.84; }
          74% { opacity: 0.46; }
          100% { transform: translate(-50%, 560%); opacity: 0; }
        }
        @keyframes request-mobile-node {
          0%, 100% { transform: scale(0.78); opacity: 0.2; }
          40% { transform: scale(1.2); opacity: 0.76; }
          64% { transform: scale(1); opacity: 0.34; }
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
        @keyframes tools-mesh-drift {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(68px, 68px, 0);
          }
        }
        .request-shell {
          padding-top: calc(1rem + env(safe-area-inset-top, 0px));
          padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
        }
        .thanks-bottom-group {
          padding-bottom: calc(2.75rem + env(safe-area-inset-bottom, 0px));
        }
        @media (min-width: 768px) {
          .request-shell {
            padding-top: calc(4.75rem + env(safe-area-inset-top, 0px));
            padding-bottom: calc(4.75rem + env(safe-area-inset-bottom, 0px));
          }
          .thanks-bottom-group {
            padding-bottom: calc(3.25rem + env(safe-area-inset-bottom, 0px));
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
        .animate-request-mobile-scan {
          animation: request-mobile-scan 2.6s linear infinite;
        }
        .animate-request-mobile-scan-delay {
          animation: request-mobile-scan 2.2s linear infinite 0.45s;
        }
        .animate-request-mobile-pulse {
          animation: request-mobile-pulse 2.4s linear infinite 0.2s;
        }
        .animate-request-mobile-node {
          animation: request-mobile-node 1.7s ease-in-out infinite;
        }
        .animate-request-mobile-node-delay {
          animation: request-mobile-node 2s ease-in-out infinite 0.35s;
        }
        .animate-request-typing {
          width: var(--request-typing-width);
          animation: request-typing var(--request-typing-duration) steps(var(--request-typing-steps), end) 1;
        }
        .animate-tools-mesh-drift {
          animation: tools-mesh-drift 24s linear infinite;
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
