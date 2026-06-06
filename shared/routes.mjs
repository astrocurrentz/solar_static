import { SITE_COPY } from './copy/site-copy.mjs';

export const SPA_ROUTE_PATHS = [
  '/',
  '/tools',
  '/tools/__text2imgp',
  '/request',
  '/thanks',
  '/selected-works',
  '/selected-works/bazi',
  '/selected-works/latent-27',
  '/freewill',
];

export const PAGE_TITLES = {
  '/': SITE_COPY.titles.root,
  '/tools': SITE_COPY.titles.tools,
  '/tools/__text2imgp': SITE_COPY.titles.textToImagePost,
  '/selected-works': SITE_COPY.titles.selectedWorks,
  '/selected-works/bazi': SITE_COPY.titles.bazi,
  '/selected-works/latent-27': SITE_COPY.titles.latent,
  '/freewill': SITE_COPY.titles.freewill,
  '/request': SITE_COPY.titles.request,
  '/thanks': SITE_COPY.titles.thanks,
};

export const REDIRECT_ROUTES = [
  { from: '/exteral/bazi', to: '/external/bazi/privacy' },
  { from: '/exteral/bazi/privacy', to: '/external/bazi/privacy' },
  { from: '/exteral/exteral/bazi', to: '/external/bazi/privacy' },
  { from: '/exteral/exteral/bazi/privacy', to: '/external/bazi/privacy' },
  { from: '/privacy', to: '/external/bazi/privacy' },
  { from: '/privacy/bazi', to: '/external/bazi/privacy' },
];

export const EXTERNAL_ROUTES = {
  root: '/external',
  bazi: '/external/bazi',
  baziPrivacy: '/external/bazi/privacy',
};

export const normalizeSpaRoutePath = (pathname) => {
  const cleanPath = pathname !== '/' ? pathname.replace(/\/+$/, '') : pathname;
  return SPA_ROUTE_PATHS.includes(cleanPath) ? cleanPath : null;
};
