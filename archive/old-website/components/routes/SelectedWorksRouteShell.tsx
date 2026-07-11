import React, { Suspense, lazy } from 'react';
import { GlitchBackButton } from '../ui/GlitchBackButton';
import { SITE_COPY } from '../../shared/copy/site-copy.mjs';
import type { RoutePath } from '../app/routing';
import { TOP_LEFT_BACK_BUTTON_STYLE } from './routeStyles';

const SelectedWorksIndexPage = lazy(() => import('../selected-works/SelectedWorksIndexPage').then((module) => ({ default: module.SelectedWorksIndexPage })));

export function SelectedWorksRouteShell({ onNavigate }: { onNavigate: (nextRoute: RoutePath) => void }) {
  return (
    <div className="relative h-[100dvh] min-h-[100dvh]">
      <Suspense fallback={null}>
        <SelectedWorksIndexPage onNavigate={onNavigate} />
      </Suspense>
      <div className="absolute left-3 z-20 md:left-8" style={TOP_LEFT_BACK_BUTTON_STYLE}>
        <GlitchBackButton
          onClick={() => onNavigate('/')}
          ariaLabel={SITE_COPY.navigation.backHome}
          label={SITE_COPY.brand.shortMark}
        />
      </div>
    </div>
  );
}
