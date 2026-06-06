import React, { Suspense, lazy, startTransition, useEffect, useState } from 'react';
import CustomCursor from './components/CustomCursor';
import NoiseOverlay from './components/NoiseOverlay';
import { SITE_COPY } from './shared/copy/site-copy.mjs';
import { PAGE_TITLES } from './shared/routes.mjs';
import { normalizeRoute, resolveRoute, type AppRoute, type RoutePath } from './components/app/routing';

const BaziSelectedWorkPage = lazy(() => import('./components/selected-works/BaziSelectedWorkPage').then((module) => ({ default: module.BaziSelectedWorkPage })));
const FreewillSelectedWorkPage = lazy(() => import('./components/selected-works/FreewillSelectedWorkPage').then((module) => ({ default: module.FreewillSelectedWorkPage })));
const LandingPage = lazy(() => import('./components/routes/LandingPage').then((module) => ({ default: module.LandingPage })));
const LatentSelectedWorkPage = lazy(() => import('./components/selected-works/LatentSelectedWorkPage').then((module) => ({ default: module.LatentSelectedWorkPage })));
const NotFoundPage = lazy(() => import('./components/routes/NotFoundPage').then((module) => ({ default: module.NotFoundPage })));
const RequestPage = lazy(() => import('./components/routes/RequestPage').then((module) => ({ default: module.RequestPage })));
const SelectedWorksRouteShell = lazy(() => import('./components/routes/SelectedWorksRouteShell').then((module) => ({ default: module.SelectedWorksRouteShell })));
const ThanksPage = lazy(() => import('./components/routes/ThanksPage').then((module) => ({ default: module.ThanksPage })));
const TextToImageToolRouteShell = lazy(() => import('./components/routes/ToolsRouteShell').then((module) => ({ default: module.TextToImageToolRouteShell })));
const ToolsRouteShell = lazy(() => import('./components/routes/ToolsRouteShell').then((module) => ({ default: module.ToolsRouteShell })));

const App: React.FC = () => {
  const [route, setRoute] = useState<AppRoute>(() => resolveRoute(window.location.pathname));

  useEffect(() => {
    const normalizedRoute = normalizeRoute(window.location.pathname);
    if (normalizedRoute && normalizedRoute !== window.location.pathname) {
      window.history.replaceState({}, '', normalizedRoute);
    }

    setRoute(resolveRoute(window.location.pathname));

    const handlePopState = () => {
      startTransition(() => {
        setRoute(resolveRoute(window.location.pathname));
      });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (route === 'not-found') {
      document.title = SITE_COPY.titles.notFound;
      return;
    }

    document.title = PAGE_TITLES[route];
  }, [route]);

  const navigate = (nextRoute: RoutePath) => {
    if (route === nextRoute) {
      return;
    }

    window.history.pushState({}, '', nextRoute);
    startTransition(() => {
      setRoute(nextRoute);
    });
  };

  return (
    <div className="relative h-[100dvh] min-h-[100dvh] overflow-hidden cursor-none bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <CustomCursor />
      <NoiseOverlay />
      <Suspense fallback={null}>
        {route === 'not-found' && <NotFoundPage />}
        {route === '/' && <LandingPage onNavigate={navigate} />}
        {route === '/tools' && <ToolsRouteShell onNavigate={navigate} />}
        {route === '/tools/__text2imgp' && <TextToImageToolRouteShell onNavigate={navigate} />}
        {route === '/selected-works' && <SelectedWorksRouteShell onNavigate={navigate} />}
        {route === '/selected-works/bazi' && <BaziSelectedWorkPage />}
        {route === '/selected-works/latent-27' && <LatentSelectedWorkPage />}
        {route === '/freewill' && <FreewillSelectedWorkPage />}
        {route === '/request' && <RequestPage onNavigate={navigate} />}
        {route === '/thanks' && <ThanksPage onNavigate={navigate} />}
      </Suspense>
    </div>
  );
};

export default App;
