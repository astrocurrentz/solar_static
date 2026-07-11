import { BAZI_COLORS } from '../../../shared/design/tokens.mjs';

export type BaziDemoThemeMode = 'light' | 'dark';
export type BaziThemeMode = BaziDemoThemeMode;

export type BaziDemoSectionKey =
  | 'greeting'
  | 'input'
  | 'bazi-card'
  | 'gods'
  | 'elements'
  | 'annual-transit'
  | 'almanac'
  | 'store';
export type BaziSectionKey = BaziDemoSectionKey;

export interface BaziSectionDef {
  key: BaziDemoSectionKey;
  label: string;
}

export interface DirectEntryState {
  year: { stem: number | null; branch: number | null };
  month: { stem: number | null; branch: number | null };
  day: { stem: number | null; branch: number | null };
  hour: { stem: number | null; branch: number | null };
}

export interface BaziPillarDemo {
  slot: 'year' | 'month' | 'day' | 'hour';
  slotZh: string;
  slotEn: string;
  stem: string;
  branch: string;
}

export interface TenGodNodeDemo {
  id: string;
  zh: string;
  en: string;
  weight: number;
  x: number;
  y: number;
}

export interface ElementDistributionDemo {
  key: 'wood' | 'fire' | 'earth' | 'metal' | 'water';
  labelZh: string;
  labelEn: string;
  value: number;
  color: string;
}

export interface DemoTransitEntry {
  age: number;
  year: number;
  stem: string;
  branch: string;
}
export type AnnualTransitEntry = DemoTransitEntry;

export type AlmanacEnergyKey = 'emotion' | 'wealth' | 'career' | 'study' | 'social';

export interface AlmanacEnergyItem {
  key: AlmanacEnergyKey;
  score: number;
}

export interface DemoAlmanacEntry {
  date: string;
  lucky: {
    number: number;
    colorNameZh: string;
    colorHex: string;
    directionZh: string;
    directionBranch: string;
    timeRange: string;
  };
  sixWords: {
    year: { stem: string; branch: string };
    month: { stem: string; branch: string };
    day: { stem: string; branch: string };
  };
  yi: string[];
  ji: string[];
  energy: AlmanacEnergyItem[];
}
export type AlmanacEntry = DemoAlmanacEntry;

export interface DemoChart {
  dayMasterStem: string;
  pillars: BaziPillarDemo[];
}

export const BAZI_SECTIONS: BaziSectionDef[] = [
  { key: 'greeting', label: 'Greeting' },
  { key: 'input', label: 'Input Demo' },
  { key: 'bazi-card', label: 'BaZi Card' },
  { key: 'gods', label: 'Gods Card' },
  { key: 'elements', label: 'Elements Card' },
  { key: 'annual-transit', label: 'Annual Transit' },
  { key: 'almanac', label: 'General Almanac' },
  { key: 'store', label: 'App Store' },
];

export const BAZI_INTRO_TEXT =
  '**八字·BāZì** uses a Neo-Brutalist interface and a meaningful color system to remove visual and language barriers, helping learners and practitioners read charts faster, communicate insights more clearly, and explore BaZi in a more intuitive way.';

export const BAZI_UI_DEMO_DISCLAIMER =
  'This is a UI demonstration. Please download the app to access the full functionality.';

export const BAZI_SAMPLE_PILLARS: BaziPillarDemo[] = [
  { slot: 'year', slotZh: '年', slotEn: 'Year', stem: '辛', branch: '亥' },
  { slot: 'month', slotZh: '月', slotEn: 'Month', stem: '甲', branch: '午' },
  { slot: 'day', slotZh: '日', slotEn: 'Day', stem: '甲', branch: '申' },
  { slot: 'hour', slotZh: '时', slotEn: 'Hour', stem: '戊', branch: '辰' },
];

export const BAZI_DEMO_CHART: DemoChart = {
  dayMasterStem: '甲',
  pillars: BAZI_SAMPLE_PILLARS,
};

export const PILLAR_SLOTS = ['year', 'month', 'day', 'hour'] as const;
export type PillarSlot = (typeof PILLAR_SLOTS)[number];

export const STEM_OPTIONS = [
  { zh: '甲', en: 'Jia', element: 'wood' },
  { zh: '乙', en: 'Yi', element: 'wood' },
  { zh: '丙', en: 'Bing', element: 'fire' },
  { zh: '丁', en: 'Ding', element: 'fire' },
  { zh: '戊', en: 'Wu', element: 'earth' },
  { zh: '己', en: 'Ji', element: 'earth' },
  { zh: '庚', en: 'Geng', element: 'metal' },
  { zh: '辛', en: 'Xin', element: 'metal' },
  { zh: '壬', en: 'Ren', element: 'water' },
  { zh: '癸', en: 'Gui', element: 'water' },
] as const;

export const BRANCH_OPTIONS = [
  { zh: '子', en: 'Zi', element: 'water' },
  { zh: '丑', en: 'Chou', element: 'earth' },
  { zh: '寅', en: 'Yin', element: 'wood' },
  { zh: '卯', en: 'Mao', element: 'wood' },
  { zh: '辰', en: 'Chen', element: 'earth' },
  { zh: '巳', en: 'Si', element: 'fire' },
  { zh: '午', en: 'Wu', element: 'fire' },
  { zh: '未', en: 'Wei', element: 'earth' },
  { zh: '申', en: 'Shen', element: 'metal' },
  { zh: '酉', en: 'You', element: 'metal' },
  { zh: '戌', en: 'Xu', element: 'earth' },
  { zh: '亥', en: 'Hai', element: 'water' },
] as const;

export const BAZI_HOME_COLOR_SEQUENCE = [
  { background: BAZI_COLORS.white, color: BAZI_COLORS.black },
  { background: BAZI_COLORS.metal, color: BAZI_COLORS.black },
  { background: BAZI_COLORS.water, color: BAZI_COLORS.black },
  { background: BAZI_COLORS.wood, color: BAZI_COLORS.black },
  { background: BAZI_COLORS.fire, color: BAZI_COLORS.black },
  { background: BAZI_COLORS.earth, color: BAZI_COLORS.black },
  { background: BAZI_COLORS.black, color: BAZI_COLORS.white },
] as const;

export const BAZI_HOME_COLOR_STORAGE_KEY = 'bazi.home.bazi-color-index.v1';

export function normalizeColorCycleIndex(value: number): number {
  return (
    ((value % BAZI_HOME_COLOR_SEQUENCE.length) + BAZI_HOME_COLOR_SEQUENCE.length) %
    BAZI_HOME_COLOR_SEQUENCE.length
  );
}

export function createEmptyDirectEntryState(): DirectEntryState {
  return {
    year: { stem: null, branch: null },
    month: { stem: null, branch: null },
    day: { stem: null, branch: null },
    hour: { stem: null, branch: null },
  };
}

export const DEMO_CITY_SUGGESTIONS = [
  { id: 'ny', name: 'New York, US', longitude: -74.006, timeZoneID: 'America/New_York' },
  { id: 'la', name: 'Los Angeles, US', longitude: -118.2437, timeZoneID: 'America/Los_Angeles' },
  { id: 'lon', name: 'London, GB', longitude: -0.1278, timeZoneID: 'Europe/London' },
  { id: 'tok', name: 'Tokyo, JP', longitude: 139.6917, timeZoneID: 'Asia/Tokyo' },
  { id: 'syd', name: 'Sydney, AU', longitude: 151.2093, timeZoneID: 'Australia/Sydney' },
  { id: 'van', name: 'Vancouver, CA', longitude: -123.1207, timeZoneID: 'America/Vancouver' },
] as const;

export const ELEMENT_COLORS: Record<'wood' | 'fire' | 'earth' | 'metal' | 'water', string> = {
  wood: BAZI_COLORS.wood,
  fire: BAZI_COLORS.fire,
  earth: BAZI_COLORS.earth,
  metal: BAZI_COLORS.metal,
  water: BAZI_COLORS.water,
};

export const BAZI_GODS_NODES: TenGodNodeDemo[] = [
  { id: 'day-master', zh: '日主', en: 'Day Master', weight: 9.575, x: 50, y: 50 },
  { id: '比肩', zh: '比肩', en: 'Comp', weight: 3.17, x: 50, y: 14 },
  { id: '劫财', zh: '劫财', en: 'Rob', weight: 0.33, x: 67, y: 20 },
  { id: '食神', zh: '食神', en: 'Eat', weight: 0, x: 80, y: 32 },
  { id: '伤官', zh: '伤官', en: 'Hurt', weight: 0.81, x: 86, y: 50 },
  { id: '偏财', zh: '偏财', en: 'I.Wlt', weight: 1.915, x: 80, y: 68 },
  { id: '正财', zh: '正财', en: 'D.Wlt', weight: 0.405, x: 67, y: 80 },
  { id: '七杀', zh: '七杀', en: '7K', weight: 0.93, x: 50, y: 86 },
  { id: '正官', zh: '正官', en: 'Off', weight: 0.9, x: 33, y: 80 },
  { id: '偏印', zh: '偏印', en: 'I.Res', weight: 1.005, x: 20, y: 68 },
  { id: '正印', zh: '正印', en: 'D.Res', weight: 0.11, x: 14, y: 50 },
];

export const BAZI_ELEMENT_DISTRIBUTION: ElementDistributionDemo[] = [
  { key: 'wood', labelZh: '木', labelEn: 'Wood', value: 22.0339, color: ELEMENT_COLORS.wood },
  { key: 'fire', labelZh: '火', labelEn: 'Fire', value: 13.5593, color: ELEMENT_COLORS.fire },
  { key: 'earth', labelZh: '土', labelEn: 'Earth', value: 25.4237, color: ELEMENT_COLORS.earth },
  { key: 'metal', labelZh: '金', labelEn: 'Metal', value: 22.0339, color: ELEMENT_COLORS.metal },
  { key: 'water', labelZh: '水', labelEn: 'Water', value: 16.9492, color: ELEMENT_COLORS.water },
];

const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;
const BIRTH_YEAR = 1971;
const BASE_STEM_INDEX = 7; // 辛
const BASE_BRANCH_INDEX = 11; // 亥

export const ANNUAL_TRANSIT_DEMO_RANGE: AnnualTransitEntry[] = Array.from(
  { length: 151 },
  (_, age): AnnualTransitEntry => ({
    age,
    year: BIRTH_YEAR + age,
    stem: STEMS[(BASE_STEM_INDEX + age) % STEMS.length],
    branch: BRANCHES[(BASE_BRANCH_INDEX + age) % BRANCHES.length],
  })
);
