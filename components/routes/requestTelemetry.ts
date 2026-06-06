import { SITE_COPY } from '../../shared/copy/site-copy.mjs';

export type SubmitState = 'idle' | 'sending' | 'error';
export type RequestValidationErrors = {
  email?: string;
  message?: string;
};
export type RequestTelemetryLine = {
  id: string;
  text: string;
  durationMs: number;
  accent: boolean;
};

const REQUEST_TELEMETRY_ACTIONS = SITE_COPY.request.telemetry.actions;
const REQUEST_TELEMETRY_SUBJECTS = SITE_COPY.request.telemetry.subjects;
const REQUEST_TELEMETRY_STATES = SITE_COPY.request.telemetry.states;

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

export const buildRequestTelemetryBatch = (count: number, variant: 'primary' | 'secondary') => (
  Array.from({ length: count }, () => buildRequestTelemetryLine(variant))
);
