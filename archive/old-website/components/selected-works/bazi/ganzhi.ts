import { BRANCH_OPTIONS, STEM_OPTIONS } from '../../selectedWorksData';
import {
  ACTIVITY_EN_MAP,
  DAY_MASTER_NODE_ID,
  GANZHI_PINYIN,
  SEXAGENARY_BRANCHES,
  SEXAGENARY_STEMS,
  XUN_VOID_BRANCHES,
} from './constants';
import { ELEMENT_ORDER, type ElementKey } from './types';

export function glyphPinyin(glyph: string): string {
  return GANZHI_PINYIN[glyph] ?? '';
}

export function capitalizeFirst(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function elementByGlyph(glyph: string): ElementKey {
  const stem = STEM_OPTIONS.find((entry) => entry.zh === glyph);
  if (stem) return stem.element;

  const branch = BRANCH_OPTIONS.find((entry) => entry.zh === glyph);
  if (branch) return branch.element;

  return 'earth';
}

export function sexagenaryIndex(stemGlyph: string, branchGlyph: string): number | null {
  const stemIndex = SEXAGENARY_STEMS.indexOf(stemGlyph);
  const branchIndex = SEXAGENARY_BRANCHES.indexOf(branchGlyph);
  if (stemIndex < 0 || branchIndex < 0) {
    return null;
  }

  for (let index = 0; index < 60; index += 1) {
    if (index % 10 === stemIndex && index % 12 === branchIndex) {
      return index;
    }
  }

  return null;
}

export function voidDisplayForTransitBranch(transitBranchGlyph: string, anchorDayStemGlyph: string, anchorDayBranchGlyph: string): string {
  const cycleIndex = sexagenaryIndex(anchorDayStemGlyph, anchorDayBranchGlyph);
  if (cycleIndex === null) {
    return '';
  }

  const voidBranches = XUN_VOID_BRANCHES[Math.floor(cycleIndex / 10)] ?? [];
  const voidBranchSet = new Set<string>(voidBranches);
  return voidBranchSet.has(transitBranchGlyph) ? transitBranchGlyph : '';
}

export function generatedElement(element: ElementKey): ElementKey {
  return ELEMENT_ORDER[(ELEMENT_ORDER.indexOf(element) + 1) % ELEMENT_ORDER.length] ?? element;
}

export function controlledElement(element: ElementKey): ElementKey {
  return ELEMENT_ORDER[(ELEMENT_ORDER.indexOf(element) + 2) % ELEMENT_ORDER.length] ?? element;
}

export function generatingElement(element: ElementKey): ElementKey {
  return ELEMENT_ORDER[(ELEMENT_ORDER.indexOf(element) + ELEMENT_ORDER.length - 1) % ELEMENT_ORDER.length] ?? element;
}

export function controllingElement(element: ElementKey): ElementKey {
  return ELEMENT_ORDER[(ELEMENT_ORDER.indexOf(element) + ELEMENT_ORDER.length - 2) % ELEMENT_ORDER.length] ?? element;
}

export function influenceNodeElement(nodeId: string, dayMasterElement: ElementKey): ElementKey {
  if (nodeId === DAY_MASTER_NODE_ID) {
    return dayMasterElement;
  }

  switch (nodeId) {
    case '比肩':
    case '劫财':
      return dayMasterElement;
    case '食神':
    case '伤官':
      return generatedElement(dayMasterElement);
    case '偏财':
    case '正财':
      return controlledElement(dayMasterElement);
    case '七杀':
    case '正官':
      return controllingElement(dayMasterElement);
    case '偏印':
    case '正印':
      return generatingElement(dayMasterElement);
    default:
      return dayMasterElement;
  }
}

export function toEnglishActivity(item: string, fallbackIndex: number): string {
  return ACTIVITY_EN_MAP[item] ?? item ?? `Activity ${fallbackIndex + 1}`;
}

export function normalizeNodeId(id: string): string {
  return id === 'day-master' ? DAY_MASTER_NODE_ID : id;
}
