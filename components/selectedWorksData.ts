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
  { background: '#ffffff', color: '#000000' },
  { background: '#fcaa06', color: '#000000' },
  { background: '#3078ce', color: '#000000' },
  { background: '#44995e', color: '#000000' },
  { background: '#c94b4b', color: '#000000' },
  { background: '#a3692f', color: '#000000' },
  { background: '#000000', color: '#ffffff' },
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
  wood: '#44995E',
  fire: '#C94B4B',
  earth: '#A3692F',
  metal: '#FCAA06',
  water: '#3078CE',
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

export const ALMANAC_ENERGY_LABELS: Record<AlmanacEnergyKey, string> = {
  emotion: 'Emotion',
  wealth: 'Wealth',
  career: 'Career',
  study: 'Study',
  social: 'Social',
};

export const ALMANAC_ENERGY_COLORS: Record<AlmanacEnergyKey, string> = {
  emotion: ELEMENT_COLORS.fire,
  wealth: ELEMENT_COLORS.metal,
  career: ELEMENT_COLORS.water,
  study: ELEMENT_COLORS.wood,
  social: ELEMENT_COLORS.earth,
};

export const GENERAL_ALMANAC_DEMO: AlmanacEntry[] = [
  {
    date: '2025-09-21',
    lucky: {
      number: 10,
      colorNameZh: '沙米',
      colorHex: '#D9C3A5',
      directionZh: '东北',
      directionBranch: '丑',
      timeRange: '01:00-03:00',
    },
    sixWords: {
      year: { stem: '丙', branch: '子' },
      month: { stem: '庚', branch: '辰' },
      day: { stem: '甲', branch: '申' },
    },
    yi: ['开市', '交易', '立券', '纳财', '挂匾', '栽种'],
    ji: ['嫁娶', '破土', '进人口', '出行', '入宅', '移徙'],
    energy: [
      { key: 'emotion', score: 67 },
      { key: 'wealth', score: 49 },
      { key: 'career', score: 46 },
      { key: 'study', score: 54 },
      { key: 'social', score: 50 },
    ],
  },
  {
    date: '2025-09-22',
    lucky: {
      number: 1,
      colorNameZh: '深海蓝',
      colorHex: '#0B4F6C',
      directionZh: '西北',
      directionBranch: '亥',
      timeRange: '21:00-23:00',
    },
    sixWords: {
      year: { stem: '丁', branch: '丑' },
      month: { stem: '辛', branch: '巳' },
      day: { stem: '乙', branch: '酉' },
    },
    yi: ['嫁娶', '祭祀', '理发', '进人口', '作灶', '移柩'],
    ji: ['开仓', '出货财', '伐木', '纳畜', '开市', '上梁'],
    energy: [
      { key: 'emotion', score: 65 },
      { key: 'wealth', score: 43 },
      { key: 'career', score: 36 },
      { key: 'study', score: 58 },
      { key: 'social', score: 53 },
    ],
  },
  {
    date: '2025-09-23',
    lucky: {
      number: 6,
      colorNameZh: '湖水青',
      colorHex: '#1699B8',
      directionZh: '西北',
      directionBranch: '亥',
      timeRange: '21:00-23:00',
    },
    sixWords: {
      year: { stem: '戊', branch: '寅' },
      month: { stem: '壬', branch: '午' },
      day: { stem: '丙', branch: '戌' },
    },
    yi: ['祭祀', '修坟', '除服', '成服', '启钻', '移柩'],
    ji: ['开市', '入宅', '嫁娶', '动土', '破土', '安葬'],
    energy: [
      { key: 'emotion', score: 54 },
      { key: 'wealth', score: 52 },
      { key: 'career', score: 42 },
      { key: 'study', score: 61 },
      { key: 'social', score: 63 },
    ],
  },
  {
    date: '2025-09-24',
    lucky: {
      number: 5,
      colorNameZh: '栗棕',
      colorHex: '#8A531B',
      directionZh: '西南',
      directionBranch: '未',
      timeRange: '13:00-15:00',
    },
    sixWords: {
      year: { stem: '己', branch: '卯' },
      month: { stem: '癸', branch: '未' },
      day: { stem: '丁', branch: '亥' },
    },
    yi: ['嫁娶', '冠笄', '安机械', '解除', '纳畜', '牧养'],
    ji: ['祈福', '开光', '开市', '入宅', '动土', '争执'],
    energy: [
      { key: 'emotion', score: 56 },
      { key: 'wealth', score: 59 },
      { key: 'career', score: 46 },
      { key: 'study', score: 53 },
      { key: 'social', score: 47 },
    ],
  },
  {
    date: '2025-09-25',
    lucky: {
      number: 6,
      colorNameZh: '湖水青',
      colorHex: '#1699B8',
      directionZh: '西北',
      directionBranch: '亥',
      timeRange: '21:00-23:00',
    },
    sixWords: {
      year: { stem: '庚', branch: '辰' },
      month: { stem: '甲', branch: '申' },
      day: { stem: '戊', branch: '子' },
    },
    yi: ['祭祀', '出行', '沐浴', '扫舍', '安葬', '馀事勿取'],
    ji: ['动土', '破土', '置产', '掘井', '争执', '借贷'],
    energy: [
      { key: 'emotion', score: 55 },
      { key: 'wealth', score: 58 },
      { key: 'career', score: 43 },
      { key: 'study', score: 52 },
      { key: 'social', score: 47 },
    ],
  },
  {
    date: '2025-09-26',
    lucky: {
      number: 1,
      colorNameZh: '深海蓝',
      colorHex: '#0B4F6C',
      directionZh: '西北',
      directionBranch: '亥',
      timeRange: '21:00-23:00',
    },
    sixWords: {
      year: { stem: '辛', branch: '巳' },
      month: { stem: '乙', branch: '酉' },
      day: { stem: '己', branch: '丑' },
    },
    yi: ['嫁娶', '纳采', '祭祀', '解除', '出行', '修造'],
    ji: ['造庙', '行丧', '安葬', '伐木', '作灶', '造船'],
    energy: [
      { key: 'emotion', score: 53 },
      { key: 'wealth', score: 60 },
      { key: 'career', score: 47 },
      { key: 'study', score: 52 },
      { key: 'social', score: 65 },
    ],
  },
  {
    date: '2025-09-27',
    lucky: {
      number: 10,
      colorNameZh: '沙米',
      colorHex: '#D9C3A5',
      directionZh: '东北',
      directionBranch: '丑',
      timeRange: '01:00-03:00',
    },
    sixWords: {
      year: { stem: '壬', branch: '午' },
      month: { stem: '丙', branch: '戌' },
      day: { stem: '庚', branch: '寅' },
    },
    yi: ['纳采', '订盟', '开市', '交易', '立券', '挂匾'],
    ji: ['斋醮', '嫁娶', '行丧', '动土', '作灶', '安葬'],
    energy: [
      { key: 'emotion', score: 62 },
      { key: 'wealth', score: 57 },
      { key: 'career', score: 57 },
      { key: 'study', score: 64 },
      { key: 'social', score: 62 },
    ],
  },
  {
    date: '2025-09-28',
    lucky: {
      number: 5,
      colorNameZh: '栗棕',
      colorHex: '#8A531B',
      directionZh: '西南',
      directionBranch: '未',
      timeRange: '13:00-15:00',
    },
    sixWords: {
      year: { stem: '癸', branch: '未' },
      month: { stem: '丁', branch: '亥' },
      day: { stem: '辛', branch: '卯' },
    },
    yi: ['祭祀', '沐浴', '修饰垣墙', '平治道涂', '馀事勿取', '会友'],
    ji: ['嫁娶', '入宅', '安床', '出行', '争执', '借贷'],
    energy: [
      { key: 'emotion', score: 59 },
      { key: 'wealth', score: 61 },
      { key: 'career', score: 57 },
      { key: 'study', score: 62 },
      { key: 'social', score: 48 },
    ],
  },
  {
    date: '2025-09-29',
    lucky: {
      number: 6,
      colorNameZh: '湖水青',
      colorHex: '#1699B8',
      directionZh: '西北',
      directionBranch: '亥',
      timeRange: '21:00-23:00',
    },
    sixWords: {
      year: { stem: '甲', branch: '申' },
      month: { stem: '戊', branch: '子' },
      day: { stem: '壬', branch: '辰' },
    },
    yi: ['开光', '祈福', '求嗣', '斋醮', '修造', '动土'],
    ji: ['作灶', '出火', '进人口', '开渠', '入宅', '移徙'],
    energy: [
      { key: 'emotion', score: 53 },
      { key: 'wealth', score: 64 },
      { key: 'career', score: 50 },
      { key: 'study', score: 55 },
      { key: 'social', score: 57 },
    ],
  },
  {
    date: '2025-09-30',
    lucky: {
      number: 5,
      colorNameZh: '栗棕',
      colorHex: '#8A531B',
      directionZh: '西南',
      directionBranch: '未',
      timeRange: '13:00-15:00',
    },
    sixWords: {
      year: { stem: '乙', branch: '酉' },
      month: { stem: '己', branch: '丑' },
      day: { stem: '癸', branch: '巳' },
    },
    yi: ['开光', '解除', '拆卸', '修造', '动土', '竖柱'],
    ji: ['出火', '入宅', '移徙', '祈福', '祭祀', '安床'],
    energy: [
      { key: 'emotion', score: 59 },
      { key: 'wealth', score: 48 },
      { key: 'career', score: 46 },
      { key: 'study', score: 70 },
      { key: 'social', score: 47 },
    ],
  },
  {
    date: '2025-10-01',
    lucky: {
      number: 10,
      colorNameZh: '沙米',
      colorHex: '#D9C3A5',
      directionZh: '东北',
      directionBranch: '丑',
      timeRange: '01:00-03:00',
    },
    sixWords: {
      year: { stem: '丙', branch: '戌' },
      month: { stem: '庚', branch: '寅' },
      day: { stem: '甲', branch: '午' },
    },
    yi: ['破屋', '坏垣', '求医', '治病', '馀事勿取', '会友'],
    ji: ['移徙', '入宅', '争执', '借贷', '冲动消费', '夜行'],
    energy: [
      { key: 'emotion', score: 57 },
      { key: 'wealth', score: 48 },
      { key: 'career', score: 46 },
      { key: 'study', score: 72 },
      { key: 'social', score: 45 },
    ],
  },
  {
    date: '2025-10-02',
    lucky: {
      number: 1,
      colorNameZh: '深海蓝',
      colorHex: '#0B4F6C',
      directionZh: '西北',
      directionBranch: '亥',
      timeRange: '21:00-23:00',
    },
    sixWords: {
      year: { stem: '丁', branch: '亥' },
      month: { stem: '辛', branch: '卯' },
      day: { stem: '乙', branch: '未' },
    },
    yi: ['嫁娶', '纳采', '订盟', '祭祀', '祈福', '求嗣'],
    ji: ['开市', '开仓', '安门', '安葬', '争执', '借贷'],
    energy: [
      { key: 'emotion', score: 56 },
      { key: 'wealth', score: 53 },
      { key: 'career', score: 43 },
      { key: 'study', score: 64 },
      { key: 'social', score: 58 },
    ],
  },
  {
    date: '2025-10-03',
    lucky: {
      number: 6,
      colorNameZh: '湖水青',
      colorHex: '#1699B8',
      directionZh: '西北',
      directionBranch: '亥',
      timeRange: '21:00-23:00',
    },
    sixWords: {
      year: { stem: '戊', branch: '子' },
      month: { stem: '壬', branch: '辰' },
      day: { stem: '丙', branch: '申' },
    },
    yi: ['嫁娶', '纳采', '订盟', '祭祀', '祈福', '求嗣'],
    ji: ['安葬', '纳畜', '出行', '行丧', '伐木', '栽种'],
    energy: [
      { key: 'emotion', score: 64 },
      { key: 'wealth', score: 45 },
      { key: 'career', score: 36 },
      { key: 'study', score: 58 },
      { key: 'social', score: 51 },
    ],
  },
  {
    date: '2025-10-04',
    lucky: {
      number: 1,
      colorNameZh: '深海蓝',
      colorHex: '#0B4F6C',
      directionZh: '西北',
      directionBranch: '亥',
      timeRange: '21:00-23:00',
    },
    sixWords: {
      year: { stem: '己', branch: '丑' },
      month: { stem: '癸', branch: '巳' },
      day: { stem: '丁', branch: '酉' },
    },
    yi: ['祭祀', '冠笄', '捕捉', '馀事勿取', '会友', '交易'],
    ji: ['嫁娶', '开市', '盖屋', '作梁', '合寿木', '争执'],
    energy: [
      { key: 'emotion', score: 72 },
      { key: 'wealth', score: 41 },
      { key: 'career', score: 35 },
      { key: 'study', score: 46 },
      { key: 'social', score: 54 },
    ],
  },
  {
    date: '2025-10-05',
    lucky: {
      number: 6,
      colorNameZh: '湖水青',
      colorHex: '#1699B8',
      directionZh: '西北',
      directionBranch: '亥',
      timeRange: '21:00-23:00',
    },
    sixWords: {
      year: { stem: '庚', branch: '寅' },
      month: { stem: '甲', branch: '午' },
      day: { stem: '戊', branch: '戌' },
    },
    yi: ['祭祀', '解除', '结网', '畋猎', '取渔', '会亲友'],
    ji: ['开市', '祈福', '动土', '破土', '入殓', '安葬'],
    energy: [
      { key: 'emotion', score: 61 },
      { key: 'wealth', score: 51 },
      { key: 'career', score: 41 },
      { key: 'study', score: 51 },
      { key: 'social', score: 62 },
    ],
  },
  {
    date: '2025-10-06',
    lucky: {
      number: 1,
      colorNameZh: '深海蓝',
      colorHex: '#0B4F6C',
      directionZh: '西北',
      directionBranch: '亥',
      timeRange: '21:00-23:00',
    },
    sixWords: {
      year: { stem: '辛', branch: '卯' },
      month: { stem: '乙', branch: '未' },
      day: { stem: '己', branch: '亥' },
    },
    yi: ['冠笄', '沐浴', '出行', '修造', '动土', '移徙'],
    ji: ['嫁娶', '开市', '祭祀', '祈福', '斋醮', '纳采'],
    energy: [
      { key: 'emotion', score: 47 },
      { key: 'wealth', score: 66 },
      { key: 'career', score: 51 },
      { key: 'study', score: 55 },
      { key: 'social', score: 57 },
    ],
  },
  {
    date: '2025-10-07',
    lucky: {
      number: 6,
      colorNameZh: '湖水青',
      colorHex: '#1699B8',
      directionZh: '西北',
      directionBranch: '亥',
      timeRange: '21:00-23:00',
    },
    sixWords: {
      year: { stem: '壬', branch: '辰' },
      month: { stem: '丙', branch: '申' },
      day: { stem: '庚', branch: '子' },
    },
    yi: ['祭祀', '出行', '会友', '交易', '立券', '签约'],
    ji: ['嫁娶', '入宅', '修造', '动土', '会亲友', '破土'],
    energy: [
      { key: 'emotion', score: 46 },
      { key: 'wealth', score: 65 },
      { key: 'career', score: 48 },
      { key: 'study', score: 54 },
      { key: 'social', score: 52 },
    ],
  },
  {
    date: '2025-10-08',
    lucky: {
      number: 1,
      colorNameZh: '深海蓝',
      colorHex: '#0B4F6C',
      directionZh: '西北',
      directionBranch: '亥',
      timeRange: '21:00-23:00',
    },
    sixWords: {
      year: { stem: '癸', branch: '巳' },
      month: { stem: '丁', branch: '酉' },
      day: { stem: '辛', branch: '丑' },
    },
    yi: ['祭祀', '出行', '裁衣', '冠笄', '会亲友', '造畜稠'],
    ji: ['动土', '伐木', '作梁', '行丧', '安葬', '开生坟'],
    energy: [
      { key: 'emotion', score: 51 },
      { key: 'wealth', score: 64 },
      { key: 'career', score: 48 },
      { key: 'study', score: 53 },
      { key: 'social', score: 57 },
    ],
  },
  {
    date: '2025-10-09',
    lucky: {
      number: 8,
      colorNameZh: '鼠尾草',
      colorHex: '#B7C9A8',
      directionZh: '正东',
      directionBranch: '卯',
      timeRange: '05:00-07:00',
    },
    sixWords: {
      year: { stem: '甲', branch: '午' },
      month: { stem: '戊', branch: '戌' },
      day: { stem: '壬', branch: '寅' },
    },
    yi: ['祭祀', '祈福', '求嗣', '开光', '出行', '解除'],
    ji: ['安葬', '修坟', '作灶', '破土', '造庙', '动土'],
    energy: [
      { key: 'emotion', score: 65 },
      { key: 'wealth', score: 58 },
      { key: 'career', score: 55 },
      { key: 'study', score: 59 },
      { key: 'social', score: 60 },
    ],
  },
  {
    date: '2025-10-10',
    lucky: {
      number: 4,
      colorNameZh: '石墨灰',
      colorHex: '#5A5E66',
      directionZh: '正西',
      directionBranch: '酉',
      timeRange: '17:00-19:00',
    },
    sixWords: {
      year: { stem: '乙', branch: '未' },
      month: { stem: '己', branch: '亥' },
      day: { stem: '癸', branch: '卯' },
    },
    yi: ['开市', '交易', '立券', '纳财', '会亲友', '开光'],
    ji: ['嫁娶', '作灶', '出火', '出行', '入宅', '移徙'],
    energy: [
      { key: 'emotion', score: 70 },
      { key: 'wealth', score: 48 },
      { key: 'career', score: 58 },
      { key: 'study', score: 51 },
      { key: 'social', score: 59 },
    ],
  },
  {
    date: '2025-10-11',
    lucky: {
      number: 9,
      colorNameZh: '珍珠白',
      colorHex: '#E7E2D7',
      directionZh: '正西',
      directionBranch: '酉',
      timeRange: '17:00-19:00',
    },
    sixWords: {
      year: { stem: '丙', branch: '申' },
      month: { stem: '庚', branch: '子' },
      day: { stem: '甲', branch: '辰' },
    },
    yi: ['造畜稠', '平治道涂', '馀事勿取', '会友', '交易', '出行'],
    ji: ['争执', '借贷', '冲动消费', '夜行', '口舌', '失约'],
    energy: [
      { key: 'emotion', score: 62 },
      { key: 'wealth', score: 50 },
      { key: 'career', score: 51 },
      { key: 'study', score: 48 },
      { key: 'social', score: 70 },
    ],
  },
];

export const LATENT_27_TITLE = 'In Development';

export const LATENT_27_BACKSTORY = `After the AI collapse, most digital images became unreadable.
The machines that created them no longer exist.
Modern compression systems and AI-dependent formats turned into sealed black boxes.
Images, videos, and archives written by the old world could no longer be decoded.
Humanity lost the ability to see its own past.
In response, small groups of survivors began building simple devices designed to record light in a slower, more resilient way.
These devices became known as Latent Machines.
Instead of storing images instantly, a Latent Machine writes photographs gradually into a Latent Card.
A Latent Card behaves like a sealed memory roll.
Each card contains a fixed number of frames.
Until the entire sequence is completed, none of the images inside can be viewed.

For example, a 27-frame card requires exactly twenty-four photographs before it can be revealed.
Only when the final frame is written does the machine unlock the card and display the images.
Until then, the memories remain sealed.
This constraint protects the data from corruption and allows the images to survive without complex decoding systems.
Over time, a strange new culture formed around Latent Cards.
Cards can travel between machines, allowing multiple survivors to contribute frames to the same sequence.
A single card may be written slowly across different devices, different moments, and different lives.
No one fully knows the story inside the card until the final frame is recorded.
Some survivors also craft rare optical modules known as Latent Lenses.
Unlike the digital filters of the old world, these lenses physically alter light before it is recorded.
Each lens produces a distinct visual language - signal distortions, strange grids, thermal ghosts, fragmented patterns.
Because they are optical artifacts rather than software, Latent Lenses cannot be copied or shared digitally.
They must be carried, traded, or discovered.
In a world where most memories became unreadable, Latent Machines offer something different.
Images that must be waited for.
Memories that cannot be erased.
Stories that only reveal themselves once they are complete.

The future is written slowly.
One frame at a time.`;
