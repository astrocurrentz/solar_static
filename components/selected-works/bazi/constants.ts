import {
  BAZI_SAMPLE_PILLARS,
  BRANCH_OPTIONS,
  GENERAL_ALMANAC_DEMO,
  STEM_OPTIONS,
  type PillarSlot,
} from '../../selectedWorksData';

export const SECTION_MIN_HEIGHT_STYLE = { minHeight: '100dvh' };
export const SECTION_CONTENT_MIN_HEIGHT_STYLE = {
  minHeight: 'calc(100dvh - var(--bazi-top-safe) - var(--bazi-bottom-safe))',
};

type InputMode = 'birthProfile' | 'directBaZi';
type DirectPickerState = { slot: PillarSlot; kind: 'stem' | 'branch' } | null;
type ElementKey = 'wood' | 'fire' | 'earth' | 'metal' | 'water';
const ELEMENT_ORDER: ElementKey[] = ['wood', 'fire', 'earth', 'metal', 'water'];

interface NetworkNode {
  id: string;
  zh: string;
  en: string;
  weight: number;
  isDayMaster: boolean;
}

interface NetworkEdge {
  id: string;
  from: string;
  to: string;
  strength: number;
  targetDistance: number;
  isCoreLink: boolean;
}

interface Point {
  x: number;
  y: number;
}

interface Velocity {
  dx: number;
  dy: number;
}

export const DAY_MASTER_NODE_ID = 'day-master';
export const NETWORK_ORDER = ['比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印'] as const;
export const NETWORK_CORE_EDGE = {
  targetBase: 117,
  targetRange: 45,
  strengthBase: 0.6,
  strengthRange: 0.8,
};
export const NETWORK_ORBIT_EDGE = {
  targetDistance: 99,
  strength: 0.35,
};
export const NETWORK_NODE_RADIUS = {
  min: 24,
  max: 36,
};
export const NETWORK_BUTTON_PAD = 1;
export const NETWORK_BUTTON_PAD_HALF = NETWORK_BUTTON_PAD / 2;
export const NETWORK_LAYOUT = {
  outerPadding: 16,
  overlapGap: NETWORK_BUTTON_PAD + 1,
  overlapIterations: 7,
  dragCollisionIterations: 4,
};
export const NETWORK_SIM = {
  pairRepulsion: 4600,
  centerRepulsion: 3200,
  minDist: 18,
  anchorStiffness: 0.055,
  dayMasterAnchorStiffness: 0.14,
  refDtMs: 1000 / 60,
  boundaryCollisionLimit: 3,
  timeStep: 0.42,
  damping: 0.86,
  maxForce: 86,
  maxVel: 16,
};

export const GANZHI_PINYIN: Record<string, string> = {
  甲: 'jiǎ',
  乙: 'yǐ',
  丙: 'bǐng',
  丁: 'dīng',
  戊: 'wù',
  己: 'jǐ',
  庚: 'gēng',
  辛: 'xīn',
  壬: 'rén',
  癸: 'guǐ',
  子: 'zǐ',
  丑: 'chǒu',
  寅: 'yín',
  卯: 'mǎo',
  辰: 'chén',
  巳: 'sì',
  午: 'wǔ',
  未: 'wèi',
  申: 'shēn',
  酉: 'yǒu',
  戌: 'xū',
  亥: 'hài',
};

export const SLOT_LABELS: Record<PillarSlot, string> = {
  year: 'Year',
  month: 'Month',
  day: 'Day',
  hour: 'Hour',
};

export const TRANSIT_STAGE = [
  'Birth',
  'Bath',
  'Crown',
  'Officer',
  'Prosper',
  'Decline',
  'Sick',
  'Death',
  'Tomb',
  'Extinct',
  'Embryo',
  'Nurture',
] as const;

export const TRANSIT_NA_YIN = [
  'Sea Metal',
  'Furnace Fire',
  'Great Forest Wood',
  'Roadside Earth',
  'Sword Edge Metal',
  'Mountain Fire',
  'Stream Water',
  'Wall Earth',
  'Wax Metal',
  'Willow Wood',
  'Spring Water',
  'Roof Earth',
] as const;
export const DAY_PILLAR = BAZI_SAMPLE_PILLARS.find((pillar) => pillar.slot === 'day');
export const SEXAGENARY_STEMS: readonly string[] = STEM_OPTIONS.map((item) => item.zh);
export const SEXAGENARY_BRANCHES: readonly string[] = BRANCH_OPTIONS.map((item) => item.zh);
export const XUN_VOID_BRANCHES = [
  ['戌', '亥'],
  ['申', '酉'],
  ['午', '未'],
  ['辰', '巳'],
  ['寅', '卯'],
  ['子', '丑'],
] as const;

export const ALMANAC_MIN_INDEX = 0;
export const ALMANAC_MAX_INDEX = GENERAL_ALMANAC_DEMO.length - 1;
export const BAZI_SECTION_GLITCH_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&?!<>';
export const BAZI_SECTION_GLITCH_STEP_MS = 72;
export const BAZI_SECTION_GLITCH_REVEAL_STEP = 6;
export const BAZI_BUTTON_GLITCH_STEP_MS = 72;
export const BAZI_BUTTON_GLITCH_REVEAL_STEP = 6;
export const LUCKY_COLOR_GLITCH_STEP_MS = 68;
export const LUCKY_COLOR_GLITCH_FRAMES = 7;

export const ACTIVITY_EN_MAP: Record<string, string> = {
  破屋: 'Ritual',
  坏垣: 'Marriage',
  求医: 'Receive Son-in-law',
  治病: 'Burial',
  馀事勿取: 'Meet Friends',
  会友: 'Trade',
  移徙: 'Planting',
  入宅: 'Roofing',
  争执: 'Install Stove',
  借贷: 'Move In',
  冲动消费: 'Conflict',
  夜行: 'Borrowing',
};
