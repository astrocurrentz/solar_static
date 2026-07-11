import React, { Suspense, lazy } from 'react';
import { GlitchBackButton } from '../ui/GlitchBackButton';
import { SITE_COPY } from '../../shared/copy/site-copy.mjs';
import type { RoutePath } from '../app/routing';
import {
  BOTTOM_RAIL_STYLE,
  HERO_BACKGROUND,
  HERO_GLOW,
  ROUTE_VIEWPORT_STYLE,
  TOOLS_MESH_STYLE_PRIMARY,
  TOOLS_MESH_STYLE_SECONDARY,
  TOP_LEFT_BACK_BUTTON_STYLE,
  WARM_OVERLAY,
} from './routeStyles';

const TextToImagePostToolPage = lazy(() => import('../ToolsPages').then((module) => ({ default: module.TextToImagePostToolPage })));
const ToolsLauncherCard = lazy(() => import('../ToolsPages').then((module) => ({ default: module.ToolsLauncherCard })));

export function ToolsRouteShell({ onNavigate }: { onNavigate: (nextRoute: RoutePath) => void }) {
  return (
    <main className="relative h-[100dvh] min-h-[100dvh] overflow-hidden" style={{ ...HERO_BACKGROUND, ...ROUTE_VIEWPORT_STYLE }}>
      <div className="absolute inset-0 opacity-80" style={HERO_GLOW} />
      <div className="absolute inset-0 opacity-70" style={WARM_OVERLAY} />
      <div className="animate-tools-mesh-drift pointer-events-none absolute inset-0 opacity-34" style={TOOLS_MESH_STYLE_PRIMARY} />
      <div className="pointer-events-none absolute inset-0 opacity-24" style={TOOLS_MESH_STYLE_SECONDARY} />
      <div className="absolute left-3 z-20 md:left-8" style={TOP_LEFT_BACK_BUTTON_STYLE}>
        <GlitchBackButton onClick={() => onNavigate('/')} ariaLabel={SITE_COPY.navigation.backHome} label={SITE_COPY.brand.shortMark} />
      </div>
      <Suspense fallback={null}>
        <ToolsLauncherCard onOpenTextToImagePost={() => onNavigate('/tools/__text2imgp')} />
      </Suspense>
      <div className="pointer-events-none absolute top-0 right-0 hidden h-full w-[clamp(12rem,18vw,24rem)] border-l border-[var(--border-soft)] opacity-50 lg:block" />
      <div className="pointer-events-none absolute left-0 h-[1px] w-full bg-[var(--border-soft)]" style={BOTTOM_RAIL_STYLE} />
    </main>
  );
}

export function TextToImageToolRouteShell({ onNavigate }: { onNavigate: (nextRoute: RoutePath) => void }) {
  return (
    <main className="relative h-[100dvh] min-h-[100dvh] overflow-x-hidden overflow-y-auto" style={{ ...HERO_BACKGROUND, ...ROUTE_VIEWPORT_STYLE }}>
      <div className="absolute inset-0 opacity-80" style={HERO_GLOW} />
      <div className="absolute inset-0 opacity-70" style={WARM_OVERLAY} />
      <div className="animate-tools-mesh-drift pointer-events-none absolute inset-0 opacity-34" style={TOOLS_MESH_STYLE_PRIMARY} />
      <div className="pointer-events-none absolute inset-0 opacity-24" style={TOOLS_MESH_STYLE_SECONDARY} />
      <div className="absolute left-3 z-20 md:left-8" style={TOP_LEFT_BACK_BUTTON_STYLE}>
        <GlitchBackButton
          onClick={() => onNavigate('/tools')}
          ariaLabel={SITE_COPY.navigation.backTools}
          label={SITE_COPY.titles.tools}
          labelClassName="hidden font-mono text-sm tracking-widest md:block"
        />
      </div>
      <Suspense fallback={null}>
        <TextToImagePostToolPage />
      </Suspense>
      <div className="pointer-events-none absolute top-0 right-0 hidden h-full w-[clamp(12rem,18vw,24rem)] border-l border-[var(--border-soft)] opacity-50 lg:block" />
      <div className="pointer-events-none absolute left-0 hidden h-[1px] w-full bg-[var(--border-soft)] md:block" style={BOTTOM_RAIL_STYLE} />
    </main>
  );
}
