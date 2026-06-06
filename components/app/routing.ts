import { normalizeSpaRoutePath } from '../../shared/routes.mjs';

export type RoutePath = '/' | '/tools' | '/tools/__text2imgp' | '/request' | '/thanks' | '/selected-works' | '/selected-works/bazi' | '/selected-works/latent-27' | '/freewill';
export type AppRoute = RoutePath | 'not-found';

export const normalizeRoute = (pathname: string): RoutePath | null => {
  return normalizeSpaRoutePath(pathname) as RoutePath | null;
};

export const resolveRoute = (pathname: string): AppRoute => normalizeRoute(pathname) ?? 'not-found';
