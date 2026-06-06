export const FREEWILL_BACKGROUND = 'var(--freewill-background)';
export const FREEWILL_SPOTIFY_ARTIST_URL = 'https://open.spotify.com/artist/3xREYHFthr71ZxpGbbo20n?si=-o78G5STSHqfA4MRNegayw';
export const FREEWILL_SPOTIFY_RING_URL = 'https://open.spotify.com/track/68soMWMZ84dkWc6udaqORQ?si=34ef287da1a142d4';
export const FREEWILL_SVG_SCALE = 0.54;
export const FREEWILL_DEFAULT_DISPLAY_SCALE = { width: FREEWILL_SVG_SCALE, height: FREEWILL_SVG_SCALE } as const;
export const FREEWILL_WORDMARK_DISPLAY_SCALE = { width: 1.18, height: 0.376 } as const;
export const FREEWILL_TILE_BUFFER_STEPS = 2;
export const FREEWILL_ASSET_STRIDE_X = 5;
export const FREEWILL_ASSET_STRIDE_Y = 3;
export const FREEWILL_CLICK_MOVE_THRESHOLD_PX = 8;
export const FREEWILL_SIGNAL_POP_DURATION_MS = 540;
export const FREEWILL_INITIAL_PAN = { x: -76, y: 0 } as const;

export const FREEWILL_ASSETS = [
  { src: '/assets/freewill/angle.svg', label: 'Angle', wipTitle: 'Angels Are Alien Drones', wipSrc: '/assets/freewill/angle_.svg' },
  { src: '/assets/freewill/eye.svg', label: 'Eye', wipTitle: 'xxx protocol', wipSrc: '/assets/freewill/eye_.svg' },
  { src: '/assets/freewill/freewill.svg', label: 'Freewill', href: FREEWILL_SPOTIFY_ARTIST_URL, displayScale: FREEWILL_WORDMARK_DISPLAY_SCALE },
  { src: '/assets/freewill/hand.svg', label: 'Hand', wipTitle: 'Kill Ill Will', wipSrc: '/assets/freewill/hand_.svg' },
  { src: '/assets/freewill/head-and-dot.svg', label: 'Head and dot', href: FREEWILL_SPOTIFY_ARTIST_URL },
  { src: '/assets/freewill/head.svg', label: 'Head' },
  { src: '/assets/freewill/jar.svg', label: 'Jar', wipTitle: 'Sunday', wipSrc: '/assets/freewill/jar_.svg' },
  { src: '/assets/freewill/lightning.svg', label: 'Lightning' },
  { src: '/assets/freewill/one.svg', label: 'One', wipTitle: 'One', wipSrc: '/assets/freewill/one_.svg' },
  { src: '/assets/freewill/ring.svg', label: 'Ring', href: FREEWILL_SPOTIFY_RING_URL },
  { src: '/assets/freewill/scent.svg', label: 'Scent', wipTitle: 'Extraterrestrial Scents', wipSrc: '/assets/freewill/scent_.svg' },
  { src: '/assets/freewill/upload.svg', label: 'Upload', wipTitle: 'Will U Upload', wipSrc: '/assets/freewill/upload_.svg' },
  { src: '/assets/freewill/water.svg', label: 'Water', wipTitle: 'Shui', wipSrc: '/assets/freewill/water_.svg' },
  { src: '/assets/freewill/wuxing.svg', label: 'Wuxing', wipTitle: 'Wuxing', wipSrc: '/assets/freewill/wuxing_.svg' },
] as const;

export interface FreewillPan {
  x: number;
  y: number;
}

export interface FreewillDragState {
  pointerId: number;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  startTileKey: string | null;
  startTileHref: string | null;
  startTileWipTitle: string | null;
  startTileWipSrc: string | null;
  hasExceededClickThreshold: boolean;
}

export interface FreewillWipPopup {
  title: string;
  src: string;
}

export interface FreewillTile {
  key: string;
  x: number;
  y: number;
  asset: (typeof FREEWILL_ASSETS)[number];
}
