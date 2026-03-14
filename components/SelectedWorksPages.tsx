import React, {
  CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ArrowLeft, ArrowRight, ChevronDown, Moon, Save, Sun } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import GlitchText from './GlitchText';
import {
  ALMANAC_ENERGY_COLORS,
  ALMANAC_ENERGY_LABELS,
  ANNUAL_TRANSIT_DEMO_RANGE,
  BAZI_DEMO_CHART,
  BAZI_ELEMENT_DISTRIBUTION,
  BAZI_GODS_NODES,
  BAZI_HOME_COLOR_SEQUENCE,
  BAZI_HOME_COLOR_STORAGE_KEY,
  BAZI_INTRO_TEXT,
  BAZI_SAMPLE_PILLARS,
  BAZI_UI_DEMO_DISCLAIMER,
  BRANCH_OPTIONS,
  createEmptyDirectEntryState,
  ELEMENT_COLORS,
  GENERAL_ALMANAC_DEMO,
  LATENT_27_BACKSTORY,
  LATENT_27_TITLE,
  normalizeColorCycleIndex,
  PILLAR_SLOTS,
  STEM_OPTIONS,
  type AlmanacEnergyKey,
  type BaziDemoThemeMode,
  type DirectEntryState,
  type PillarSlot,
} from './selectedWorksData';

const SECTION_MIN_HEIGHT_STYLE = { minHeight: '100dvh' };
const SECTION_CONTENT_MIN_HEIGHT_STYLE = {
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

const DAY_MASTER_NODE_ID = 'day-master';
const NETWORK_ORDER = ['比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印'] as const;
const NETWORK_CORE_EDGE = {
  targetBase: 117,
  targetRange: 45,
  strengthBase: 0.6,
  strengthRange: 0.8,
};
const NETWORK_ORBIT_EDGE = {
  targetDistance: 99,
  strength: 0.35,
};
const NETWORK_NODE_RADIUS = {
  min: 24,
  max: 36,
};
const NETWORK_BUTTON_PAD = 1;
const NETWORK_BUTTON_PAD_HALF = NETWORK_BUTTON_PAD / 2;
const NETWORK_LAYOUT = {
  outerPadding: 16,
  overlapGap: NETWORK_BUTTON_PAD + 1,
  overlapIterations: 7,
  dragCollisionIterations: 4,
};
const NETWORK_SIM = {
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

const GANZHI_PINYIN: Record<string, string> = {
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

const SLOT_LABELS: Record<PillarSlot, string> = {
  year: 'Year',
  month: 'Month',
  day: 'Day',
  hour: 'Hour',
};

const TRANSIT_STAGE = [
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

const TRANSIT_NA_YIN = [
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
const DAY_PILLAR = BAZI_SAMPLE_PILLARS.find((pillar) => pillar.slot === 'day');
const SEXAGENARY_STEMS = STEM_OPTIONS.map((item) => item.zh);
const SEXAGENARY_BRANCHES = BRANCH_OPTIONS.map((item) => item.zh);
const XUN_VOID_BRANCHES = [
  ['戌', '亥'],
  ['申', '酉'],
  ['午', '未'],
  ['辰', '巳'],
  ['寅', '卯'],
  ['子', '丑'],
] as const;

const ALMANAC_MIN_INDEX = 0;
const ALMANAC_MAX_INDEX = GENERAL_ALMANAC_DEMO.length - 1;
const BAZI_SECTION_GLITCH_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&?!<>';
const BAZI_SECTION_GLITCH_STEP_MS = 72;
const BAZI_SECTION_GLITCH_REVEAL_STEP = 6;
const BAZI_BUTTON_GLITCH_STEP_MS = 72;
const BAZI_BUTTON_GLITCH_REVEAL_STEP = 6;
const LUCKY_COLOR_GLITCH_STEP_MS = 68;
const LUCKY_COLOR_GLITCH_FRAMES = 7;

type SectionTextTarget = {
  node: Text;
  originalText: string;
};

type ButtonIconTarget = {
  node: SVGSVGElement;
  originalTransform: string;
  originalOpacity: string;
  originalFilter: string;
  originalClipPath: string;
};

const collectSectionTextTargets = (sectionElement: HTMLElement): SectionTextTarget[] => {
  const walker = document.createTreeWalker(
    sectionElement,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        if (!(node instanceof Text)) {
          return NodeFilter.FILTER_REJECT;
        }

        if (!node.data.trim()) {
          return NodeFilter.FILTER_REJECT;
        }

        const parentElement = node.parentElement;
        if (!parentElement) {
          return NodeFilter.FILTER_REJECT;
        }

        if (parentElement.closest('script, style, svg, input, textarea, select, option, [contenteditable="true"], [aria-hidden="true"]')) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      },
    },
  );

  const targets: SectionTextTarget[] = [];
  let currentNode = walker.nextNode();

  while (currentNode) {
    const textNode = currentNode as Text;
    targets.push({
      node: textNode,
      originalText: textNode.data,
    });
    currentNode = walker.nextNode();
  }

  return targets;
};

const scrambleSectionText = (sourceText: string, revealIndex: number) => (
  sourceText
    .split('')
    .map((character, index) => {
      if (index < revealIndex || !character.trim()) {
        return character;
      }

      return BAZI_SECTION_GLITCH_CHARS[Math.floor(Math.random() * BAZI_SECTION_GLITCH_CHARS.length)] ?? character;
    })
    .join('')
);

const collectButtonIconTargets = (buttonElement: HTMLElement): ButtonIconTarget[] => (
  Array.from(buttonElement.querySelectorAll<SVGSVGElement>('svg')).map((iconNode) => ({
    node: iconNode,
    originalTransform: iconNode.style.transform,
    originalOpacity: iconNode.style.opacity,
    originalFilter: iconNode.style.filter,
    originalClipPath: iconNode.style.clipPath,
  }))
);

const applyButtonIconGlitchFrame = (targets: ButtonIconTarget[], intensity: number) => {
  targets.forEach((target) => {
    if (!target.node.isConnected) {
      return;
    }

    const maxShiftPx = 2.8 * intensity;
    const shiftX = (Math.random() * 2 - 1) * maxShiftPx;
    const shiftY = (Math.random() * 2 - 1) * maxShiftPx;
    const topInset = Math.random() * 18 * intensity;
    const bottomInset = Math.random() * 18 * intensity;

    target.node.style.transform = `translate(${shiftX.toFixed(2)}px, ${shiftY.toFixed(2)}px)`;
    target.node.style.opacity = `${clamp(1 - Math.random() * 0.14 * intensity, 0.72, 1).toFixed(3)}`;
    target.node.style.filter = `brightness(${(1 + Math.random() * 0.32 * intensity).toFixed(3)}) contrast(${(1 + Math.random() * 0.5 * intensity).toFixed(3)})`;
    target.node.style.clipPath = intensity > 0.06 ? `inset(${topInset.toFixed(2)}% 0 ${bottomInset.toFixed(2)}% 0)` : '';
  });
};

const ACTIVITY_EN_MAP: Record<string, string> = {
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

const randomFrom = <T,>(items: readonly T[]): T => {
  const fallback = items[0];
  if (fallback === undefined) {
    throw new Error('randomFrom called with empty array');
  }
  return items[Math.floor(Math.random() * items.length)] ?? fallback;
};

function useOccasionalGlitchSignal(minDelayMs = 4200, maxDelayMs = 9200) {
  const [signal, setSignal] = useState(0);

  useEffect(() => {
    let timeoutId: number | null = null;
    let active = true;

    const schedule = () => {
      const nextDelay = Math.floor(Math.random() * (maxDelayMs - minDelayMs + 1)) + minDelayMs;
      timeoutId = window.setTimeout(() => {
        if (!active) {
          return;
        }
        setSignal((currentSignal) => currentSignal + 1);
        schedule();
      }, nextDelay);
    };

    schedule();

    return () => {
      active = false;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [maxDelayMs, minDelayMs]);

  return signal;
}

function OccasionalGlitchText({
  text,
  className,
  tag = 'span',
  minDelayMs,
  maxDelayMs,
  scrambleStepMs = 24,
  scrambleRevealStep = 1.2,
  wrapToWidth = false,
  wrapToWidthDesktopOnly = false,
}: {
  text: string;
  className?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';
  minDelayMs?: number;
  maxDelayMs?: number;
  scrambleStepMs?: number;
  scrambleRevealStep?: number;
  wrapToWidth?: boolean;
  wrapToWidthDesktopOnly?: boolean;
}) {
  const scrambleSignal = useOccasionalGlitchSignal(minDelayMs, maxDelayMs);

  return (
    <GlitchText
      text={text}
      tag={tag}
      wrapToWidth={wrapToWidth}
      wrapToWidthDesktopOnly={wrapToWidthDesktopOnly}
      scrambleOnMount={false}
      scrambleSignal={scrambleSignal}
      scrambleStepMs={scrambleStepMs}
      scrambleRevealStep={scrambleRevealStep}
      className={className}
    />
  );
}

function glyphPinyin(glyph: string): string {
  return GANZHI_PINYIN[glyph] ?? '';
}

function capitalizeFirst(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function elementByGlyph(glyph: string): ElementKey {
  const stem = STEM_OPTIONS.find((entry) => entry.zh === glyph);
  if (stem) return stem.element;

  const branch = BRANCH_OPTIONS.find((entry) => entry.zh === glyph);
  if (branch) return branch.element;

  return 'earth';
}

function sexagenaryIndex(stemGlyph: string, branchGlyph: string): number | null {
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

function voidDisplayForTransitBranch(transitBranchGlyph: string, anchorDayStemGlyph: string, anchorDayBranchGlyph: string): string {
  const cycleIndex = sexagenaryIndex(anchorDayStemGlyph, anchorDayBranchGlyph);
  if (cycleIndex === null) {
    return '';
  }

  const voidBranches = XUN_VOID_BRANCHES[Math.floor(cycleIndex / 10)] ?? [];
  const voidBranchSet = new Set<string>(voidBranches);
  return voidBranchSet.has(transitBranchGlyph) ? transitBranchGlyph : '';
}

function generatedElement(element: ElementKey): ElementKey {
  return ELEMENT_ORDER[(ELEMENT_ORDER.indexOf(element) + 1) % ELEMENT_ORDER.length] ?? element;
}

function controlledElement(element: ElementKey): ElementKey {
  return ELEMENT_ORDER[(ELEMENT_ORDER.indexOf(element) + 2) % ELEMENT_ORDER.length] ?? element;
}

function generatingElement(element: ElementKey): ElementKey {
  return ELEMENT_ORDER[(ELEMENT_ORDER.indexOf(element) + ELEMENT_ORDER.length - 1) % ELEMENT_ORDER.length] ?? element;
}

function controllingElement(element: ElementKey): ElementKey {
  return ELEMENT_ORDER[(ELEMENT_ORDER.indexOf(element) + ELEMENT_ORDER.length - 2) % ELEMENT_ORDER.length] ?? element;
}

function influenceNodeElement(nodeId: string, dayMasterElement: ElementKey): ElementKey {
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

function toEnglishActivity(item: string, fallbackIndex: number): string {
  return ACTIVITY_EN_MAP[item] ?? item ?? `Activity ${fallbackIndex + 1}`;
}

function normalizeNodeId(id: string): string {
  return id === 'day-master' ? DAY_MASTER_NODE_ID : id;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function nodeRadius(node: NetworkNode, maxGodWeight: number): number {
  if (node.isDayMaster) return NETWORK_NODE_RADIUS.min;
  const normalized = node.weight / Math.max(0.01, maxGodWeight);
  return NETWORK_NODE_RADIUS.min + normalized * (NETWORK_NODE_RADIUS.max - NETWORK_NODE_RADIUS.min);
}

function fieldCenter(width: number, height: number): Point {
  return { x: width / 2, y: height / 2 };
}

function defaultRingPoint(nodeId: string, width: number, height: number, nodes: NetworkNode[]): Point {
  const gods = nodes.filter((node) => !node.isDayMaster);
  const index = gods.findIndex((node) => node.id === nodeId);
  if (index < 0) return fieldCenter(width, height);

  const node = gods[index];
  const weights = gods.map((god) => god.weight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights, 0.01);
  const weightRange = maxWeight - minWeight;
  const normalized = weightRange > 0 ? (node.weight - minWeight) / weightRange : 1;

  const center = fieldCenter(width, height);
  const radius = NETWORK_CORE_EDGE.targetBase - normalized * NETWORK_CORE_EDGE.targetRange;
  const angle = (index / Math.max(gods.length, 1)) * Math.PI * 2 - Math.PI * 0.5;

  return {
    x: center.x + Math.cos(angle) * radius,
    y: center.y + Math.sin(angle) * radius,
  };
}

function clampPoint(point: Point, width: number, height: number, radius: number): Point {
  const inset = radius + NETWORK_LAYOUT.outerPadding;
  return {
    x: clamp(point.x, inset, width - inset),
    y: clamp(point.y, inset, height - inset),
  };
}

function clampPointToViewport(
  point: Point,
  rect: { left: number; top: number },
  viewportWidth: number,
  viewportHeight: number,
  radius: number,
): Point {
  const inset = radius + NETWORK_LAYOUT.outerPadding;
  const viewportX = point.x + rect.left;
  const viewportY = point.y + rect.top;

  return {
    x: clamp(viewportX, inset, viewportWidth - inset) - rect.left,
    y: clamp(viewportY, inset, viewportHeight - inset) - rect.top,
  };
}

function buildNetworkNodes(): NetworkNode[] {
  const mapped = BAZI_GODS_NODES.map((node) => ({
    id: normalizeNodeId(node.id),
    zh: node.zh,
    en: node.en,
    weight: node.weight,
    isDayMaster: normalizeNodeId(node.id) === DAY_MASTER_NODE_ID,
  }));

  const dayMaster = mapped.find((node) => node.id === DAY_MASTER_NODE_ID);
  const others = NETWORK_ORDER
    .map((id) => mapped.find((node) => node.id === id))
    .filter((node): node is NetworkNode => Boolean(node));

  return dayMaster ? [dayMaster, ...others] : others;
}

function buildNetworkEdges(nodes: NetworkNode[]): NetworkEdge[] {
  const gods = nodes.filter((node) => !node.isDayMaster);
  if (gods.length === 0) return [];

  const maxWeight = Math.max(...gods.map((node) => node.weight), 0.01);
  const edges: NetworkEdge[] = [];

  for (const god of gods) {
    const normalized = god.weight / maxWeight;
    edges.push({
      id: `core-${god.id}`,
      from: DAY_MASTER_NODE_ID,
      to: god.id,
      strength: NETWORK_CORE_EDGE.strengthBase + normalized * NETWORK_CORE_EDGE.strengthRange,
      targetDistance: NETWORK_CORE_EDGE.targetBase - normalized * NETWORK_CORE_EDGE.targetRange,
      isCoreLink: true,
    });
  }

  for (let index = 0; index < gods.length; index += 1) {
    const current = gods[index];
    const next = gods[(index + 1) % gods.length];
    edges.push({
      id: `orbit-${current.id}-${next.id}`,
      from: current.id,
      to: next.id,
      strength: NETWORK_ORBIT_EDGE.strength,
      targetDistance: NETWORK_ORBIT_EDGE.targetDistance,
      isCoreLink: false,
    });
  }

  return edges;
}

function resolveOverlaps(
  positions: Record<string, Point>,
  nodes: NetworkNode[],
  maxGodWeight: number,
  width: number,
  height: number,
): Record<string, Point> {
  const result = { ...positions };
  const radii: Record<string, number> = {};

  for (const node of nodes) {
    radii[node.id] = nodeRadius(node, maxGodWeight);
  }

  for (let iter = 0; iter < NETWORK_LAYOUT.overlapIterations; iter += 1) {
    let changed = false;

    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const left = nodes[i];
        const right = nodes[j];
        const leftPos = result[left.id] ?? fieldCenter(width, height);
        const rightPos = result[right.id] ?? fieldCenter(width, height);
        const leftRad = (radii[left.id] ?? NETWORK_NODE_RADIUS.min) + NETWORK_BUTTON_PAD_HALF;
        const rightRad = (radii[right.id] ?? NETWORK_NODE_RADIUS.min) + NETWORK_BUTTON_PAD_HALF;
        const minDist = leftRad + rightRad + NETWORK_LAYOUT.overlapGap;
        const dx = rightPos.x - leftPos.x;
        const dy = rightPos.y - leftPos.y;
        const dist = Math.hypot(dx, dy) || 1;

        if (dist < minDist) {
          const push = (minDist - dist) / 2;
          const ux = dx / dist;
          const uy = dy / dist;

          if (left.id === DAY_MASTER_NODE_ID) {
            result[right.id] = clampPoint(
              { x: rightPos.x + ux * (minDist - dist), y: rightPos.y + uy * (minDist - dist) },
              width,
              height,
              rightRad,
            );
          } else if (right.id === DAY_MASTER_NODE_ID) {
            result[left.id] = clampPoint(
              { x: leftPos.x - ux * (minDist - dist), y: leftPos.y - uy * (minDist - dist) },
              width,
              height,
              leftRad,
            );
          } else {
            result[left.id] = clampPoint(
              { x: leftPos.x - ux * push, y: leftPos.y - uy * push },
              width,
              height,
              leftRad,
            );
            result[right.id] = clampPoint(
              { x: rightPos.x + ux * push, y: rightPos.y + uy * push },
              width,
              height,
              rightRad,
            );
          }

          changed = true;
        }
      }
    }

    if (!changed) break;
  }

  for (const node of nodes) {
    const pos = result[node.id];
    if (pos) {
      const radius = (radii[node.id] ?? NETWORK_NODE_RADIUS.min) + NETWORK_BUTTON_PAD_HALF;
      result[node.id] = clampPoint(pos, width, height, radius);
    }
  }

  return result;
}

function resolveDragCollisionWithOthers(
  pos: Point,
  draggedId: string,
  positions: Record<string, Point>,
  nodes: NetworkNode[],
  maxGodWeight: number,
  width: number,
  height: number,
): Record<string, Point> {
  const result = { ...positions, [draggedId]: pos };
  const radii: Record<string, number> = {};

  for (const node of nodes) {
    radii[node.id] = nodeRadius(node, maxGodWeight);
  }

  for (let iter = 0; iter < NETWORK_LAYOUT.dragCollisionIterations; iter += 1) {
    let changed = false;
    const dragRadius = (radii[draggedId] ?? NETWORK_NODE_RADIUS.min) + NETWORK_BUTTON_PAD_HALF;

    for (const other of nodes) {
      const draggedPos = result[draggedId] ?? pos;
      if (other.id === draggedId) continue;

      const otherPos = result[other.id] ?? fieldCenter(width, height);
      const otherRadius = (radii[other.id] ?? NETWORK_NODE_RADIUS.min) + NETWORK_BUTTON_PAD_HALF;
      const minDist = dragRadius + otherRadius + NETWORK_LAYOUT.overlapGap;
      const dx = draggedPos.x - otherPos.x;
      const dy = draggedPos.y - otherPos.y;
      const dist = Math.hypot(dx, dy) || 1;

      if (dist < minDist) {
        const push = (minDist - dist) / 2;
        const ux = dx / dist;
        const uy = dy / dist;
        const nextDragged = clampPoint(
          { x: draggedPos.x + ux * push, y: draggedPos.y + uy * push },
          width,
          height,
          dragRadius,
        );
        const nextOther = other.id === DAY_MASTER_NODE_ID
          ? otherPos
          : clampPoint(
              { x: otherPos.x - ux * push, y: otherPos.y - uy * push },
              width,
              height,
              otherRadius,
            );

        result[draggedId] = nextDragged;
        result[other.id] = nextOther;
        changed = true;
      }
    }

    if (!changed) break;
  }

  return result;
}

function applyPhysicsTriple(
  positions: Record<string, Point>,
  nodes: NetworkNode[],
  edges: NetworkEdge[],
  maxGodWeight: number,
  width: number,
  height: number,
  options: {
    draggedId?: string | null;
    draggedPos?: Point;
    velocities?: Record<string, Velocity>;
    simulationSteps?: number;
    dtMs?: number;
    boundaryCollisions?: Record<string, number>;
    viewportBounds?: { rect: { left: number; top: number }; viewportWidth: number; viewportHeight: number };
  } = {},
): { positions: Record<string, Point>; velocities: Record<string, Velocity> } {
  let result = { ...positions };
  let velocities = options.velocities ?? {};
  const boundaryCollisions = options.boundaryCollisions ?? {};
  const dtMs = options.dtMs ?? NETWORK_SIM.refDtMs;
  const viewportBounds = options.viewportBounds;
  const radii: Record<string, number> = {};

  for (const node of nodes) {
    radii[node.id] = nodeRadius(node, maxGodWeight);
  }

  const boundsWidth = viewportBounds ? viewportBounds.viewportWidth : width;
  const boundsHeight = viewportBounds ? viewportBounds.viewportHeight : height;
  const rect = viewportBounds?.rect ?? { left: 0, top: 0 };

  const toViewport = (point: Point): Point => ({ x: point.x + rect.left, y: point.y + rect.top });
  const toContainer = (point: Point): Point => ({ x: point.x - rect.left, y: point.y - rect.top });

  const applyCollision = (current: Record<string, Point>, dragId: string | null, dragPos?: Point) => {
    if (dragId && dragPos) {
      return resolveDragCollisionWithOthers(
        dragPos,
        dragId,
        current,
        nodes,
        maxGodWeight,
        boundsWidth,
        boundsHeight,
      );
    }

    return resolveOverlaps(current, nodes, maxGodWeight, boundsWidth, boundsHeight);
  };

  const applyPadding = (current: Record<string, Point>) => {
    const padded = { ...current };

    for (const node of nodes) {
      const point = padded[node.id];
      if (point) {
        const radius = (radii[node.id] ?? NETWORK_NODE_RADIUS.min) + NETWORK_BUTTON_PAD_HALF;
        padded[node.id] = clampPoint(point, boundsWidth, boundsHeight, radius);
      }
    }

    return padded;
  };

  const draggedId = options.draggedId ?? null;
  const steps = options.simulationSteps ?? 0;

  if (viewportBounds) {
    result = Object.fromEntries(Object.entries(result).map(([id, point]) => [id, toViewport(point)])) as Record<string, Point>;

    if (draggedId && options.draggedPos) {
      result[draggedId] = toViewport(options.draggedPos);
    }
  }

  result = applyCollision(result, draggedId, draggedId ? result[draggedId] : undefined);
  result = applyPadding(result);

  const containerCenter = fieldCenter(width, height);
  const dayMasterCenter = viewportBounds ? toViewport(containerCenter) : containerCenter;

  for (let index = 0; index < steps; index += 1) {
    result[DAY_MASTER_NODE_ID] = dayMasterCenter;
    const { positions: nextPositions, velocities: nextVelocities } = stepSimulation(
      nodes,
      edges,
      result,
      velocities,
      boundsWidth,
      boundsHeight,
      draggedId,
      dtMs,
      boundaryCollisions,
      dayMasterCenter,
    );
    result = nextPositions;
    velocities = nextVelocities;
    result = applyCollision(result, draggedId, draggedId ? result[draggedId] : undefined);
    result = applyPadding(result);
  }

  if (viewportBounds) {
    result = Object.fromEntries(Object.entries(result).map(([id, point]) => [id, toContainer(point)])) as Record<string, Point>;
  }

  const dayMasterRadius = (radii[DAY_MASTER_NODE_ID] ?? NETWORK_NODE_RADIUS.min) + NETWORK_BUTTON_PAD_HALF;
  result[DAY_MASTER_NODE_ID] = viewportBounds
    ? clampPointToViewport(containerCenter, rect, boundsWidth, boundsHeight, dayMasterRadius)
    : clampPoint(containerCenter, width, height, dayMasterRadius);

  return { positions: result, velocities };
}

function stepSimulation(
  nodes: NetworkNode[],
  edges: NetworkEdge[],
  positions: Record<string, Point>,
  velocities: Record<string, Velocity>,
  width: number,
  height: number,
  draggedId: string | null,
  dtMs: number = NETWORK_SIM.refDtMs,
  boundaryCollisions: Record<string, number> = {},
  dayMasterCenter?: Point,
): { positions: Record<string, Point>; velocities: Record<string, Velocity>; boundaryCollisions: Record<string, number> } {
  const dt = Math.min(Math.max(dtMs, 4), 50) / NETWORK_SIM.refDtMs;
  const nextPositions = { ...positions };
  const nextVelocities = { ...velocities };
  const center = dayMasterCenter ?? fieldCenter(width, height);
  const godNodes = nodes.filter((node) => !node.isDayMaster);
  const simulatedNodes = [...nodes];
  const maxGodWeight = Math.max(...godNodes.map((node) => node.weight), 0.01);

  nextPositions[DAY_MASTER_NODE_ID] = center;
  nextVelocities[DAY_MASTER_NODE_ID] = nextVelocities[DAY_MASTER_NODE_ID] ?? { dx: 0, dy: 0 };

  const forces: Record<string, Velocity> = {};
  for (const node of simulatedNodes) {
    forces[node.id] = { dx: 0, dy: 0 };
  }

  const dayMasterPoint = nextPositions[DAY_MASTER_NODE_ID] ?? center;

  for (let i = 0; i < simulatedNodes.length; i += 1) {
    const left = simulatedNodes[i];
    const leftPoint = nextPositions[left.id] ?? (left.isDayMaster ? center : defaultRingPoint(left.id, width, height, nodes));
    const leftHome = left.isDayMaster ? center : defaultRingPoint(left.id, width, height, nodes);

    const anchor = left.isDayMaster ? NETWORK_SIM.dayMasterAnchorStiffness : NETWORK_SIM.anchorStiffness;
    forces[left.id].dx += (leftHome.x - leftPoint.x) * anchor;
    forces[left.id].dy += (leftHome.y - leftPoint.y) * anchor;

    if (!left.isDayMaster) {
      const centerDx = leftPoint.x - dayMasterPoint.x;
      const centerDy = leftPoint.y - dayMasterPoint.y;
      const centerDist = Math.max(Math.hypot(centerDx, centerDy), NETWORK_SIM.minDist);
      const centerForce = NETWORK_SIM.centerRepulsion / (centerDist * centerDist);
      forces[left.id].dx += (centerDx / centerDist) * centerForce;
      forces[left.id].dy += (centerDy / centerDist) * centerForce;
    }

    for (let j = i + 1; j < simulatedNodes.length; j += 1) {
      const right = simulatedNodes[j];
      const rightPoint = nextPositions[right.id] ?? (right.isDayMaster ? center : defaultRingPoint(right.id, width, height, nodes));
      const dx = leftPoint.x - rightPoint.x;
      const dy = leftPoint.y - rightPoint.y;
      const dist = Math.max(Math.hypot(dx, dy), NETWORK_SIM.minDist);
      const repulsion = NETWORK_SIM.pairRepulsion / (dist * dist);
      const fx = (dx / dist) * repulsion;
      const fy = (dy / dist) * repulsion;

      forces[left.id].dx += fx;
      forces[left.id].dy += fy;
      forces[right.id].dx -= fx;
      forces[right.id].dy -= fy;
    }
  }

  for (const edge of edges) {
    const fromPoint = nextPositions[edge.from];
    const toPoint = nextPositions[edge.to];
    if (!fromPoint || !toPoint) continue;

    const dx = toPoint.x - fromPoint.x;
    const dy = toPoint.y - fromPoint.y;
    const dist = Math.max(Math.hypot(dx, dy), 1);
    const delta = dist - edge.targetDistance;
    const spring = edge.isCoreLink ? 0.1 + edge.strength * 0.05 : 0.06 + edge.strength * 0.04;
    const magnitude = delta * spring;
    const fx = (dx / dist) * magnitude;
    const fy = (dy / dist) * magnitude;

    forces[edge.from].dx += fx;
    forces[edge.from].dy += fy;
    forces[edge.to].dx -= fx;
    forces[edge.to].dy -= fy;
  }

  const damping = Math.pow(NETWORK_SIM.damping, dt);

  for (const node of simulatedNodes) {
    if (draggedId === node.id) continue;
    if (node.id === DAY_MASTER_NODE_ID) continue;

    const force = forces[node.id];
    force.dx = clamp(force.dx, -NETWORK_SIM.maxForce, NETWORK_SIM.maxForce);
    force.dy = clamp(force.dy, -NETWORK_SIM.maxForce, NETWORK_SIM.maxForce);

    const velocity = nextVelocities[node.id] ?? { dx: 0, dy: 0 };
    velocity.dx = (velocity.dx + force.dx * NETWORK_SIM.timeStep * dt) * damping;
    velocity.dy = (velocity.dy + force.dy * NETWORK_SIM.timeStep * dt) * damping;
    velocity.dx = clamp(velocity.dx, -NETWORK_SIM.maxVel, NETWORK_SIM.maxVel);
    velocity.dy = clamp(velocity.dy, -NETWORK_SIM.maxVel, NETWORK_SIM.maxVel);

    let point = nextPositions[node.id] ?? defaultRingPoint(node.id, width, height, nodes);
    point = { x: point.x + velocity.dx * dt, y: point.y + velocity.dy * dt };

    const radius = node.isDayMaster ? nodeRadius(node, maxGodWeight) + 2 : nodeRadius(node, maxGodWeight);
    const effectiveRadius = radius + NETWORK_BUTTON_PAD_HALF;
    const bounded = clampPoint(point, width, height, effectiveRadius);

    if (bounded.x !== point.x || bounded.y !== point.y) {
      const count = (boundaryCollisions[node.id] ?? 0) + 1;
      boundaryCollisions[node.id] = count;

      if (count <= NETWORK_SIM.boundaryCollisionLimit) {
        velocity.dx *= 0.45;
        velocity.dy *= 0.45;
      }
    }

    nextPositions[node.id] = bounded;
    nextVelocities[node.id] = velocity;
  }

  return { positions: nextPositions, velocities: nextVelocities, boundaryCollisions };
}

function BaziPressableButton({
  children,
  className,
  style,
  glitchSignal,
  onClick,
  type = 'button',
  ariaLabel,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  onPointerCancel,
  onKeyDown,
}: React.PropsWithChildren<{
  className?: string;
  style?: CSSProperties;
  glitchSignal?: number | string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
  ariaLabel?: string;
  onPointerDown?: React.PointerEventHandler<HTMLButtonElement>;
  onPointerUp?: React.PointerEventHandler<HTMLButtonElement>;
  onPointerLeave?: React.PointerEventHandler<HTMLButtonElement>;
  onPointerCancel?: React.PointerEventHandler<HTMLButtonElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLButtonElement>;
}>) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const buttonGlitchIntervalRef = useRef<number | null>(null);
  const buttonGlitchTargetsRef = useRef<SectionTextTarget[]>([]);
  const buttonIconTargetsRef = useRef<ButtonIconTarget[]>([]);
  const previousButtonGlitchSignalRef = useRef<number | string | undefined>(undefined);

  const stopButtonTextGlitch = useCallback((restoreOriginalText = false) => {
    if (buttonGlitchIntervalRef.current !== null) {
      window.clearInterval(buttonGlitchIntervalRef.current);
      buttonGlitchIntervalRef.current = null;
    }

    if (restoreOriginalText) {
      buttonGlitchTargetsRef.current.forEach((target) => {
        if (target.node.isConnected) {
          target.node.data = target.originalText;
        }
      });

      buttonIconTargetsRef.current.forEach((target) => {
        if (!target.node.isConnected) {
          return;
        }

        target.node.style.transform = target.originalTransform;
        target.node.style.opacity = target.originalOpacity;
        target.node.style.filter = target.originalFilter;
        target.node.style.clipPath = target.originalClipPath;
      });
    }

    buttonGlitchTargetsRef.current = [];
    buttonIconTargetsRef.current = [];
  }, []);

  const startButtonTextGlitch = useCallback(() => {
    const buttonElement = buttonRef.current;
    if (!buttonElement) {
      return;
    }

    stopButtonTextGlitch(true);

    const targets = collectSectionTextTargets(buttonElement);
    const iconTargets = collectButtonIconTargets(buttonElement);
    if (!targets.length && !iconTargets.length) {
      return;
    }

    buttonGlitchTargetsRef.current = targets;
    buttonIconTargetsRef.current = iconTargets;

    let revealIndex = 0;
    const maxTextLength = targets.length
      ? Math.max(...targets.map((target) => target.originalText.length))
      : 0;
    const maxGlitchLength = Math.max(maxTextLength, iconTargets.length ? 24 : 0);

    buttonGlitchIntervalRef.current = window.setInterval(() => {
      targets.forEach((target) => {
        if (!target.node.isConnected) {
          return;
        }

        target.node.data = scrambleSectionText(target.originalText, revealIndex);
      });

      if (iconTargets.length) {
        const intensity = clamp(1 - revealIndex / Math.max(1, maxGlitchLength), 0, 1);
        applyButtonIconGlitchFrame(iconTargets, intensity);
      }

      if (revealIndex >= maxGlitchLength) {
        stopButtonTextGlitch(true);
        return;
      }

      revealIndex += BAZI_BUTTON_GLITCH_REVEAL_STEP;
    }, BAZI_BUTTON_GLITCH_STEP_MS);
  }, [stopButtonTextGlitch]);

  useEffect(() => (
    () => {
      stopButtonTextGlitch(true);
    }
  ), [stopButtonTextGlitch]);

  useEffect(() => {
    if (glitchSignal === undefined) {
      return;
    }

    if (previousButtonGlitchSignalRef.current === undefined) {
      previousButtonGlitchSignalRef.current = glitchSignal;
      return;
    }

    if (previousButtonGlitchSignalRef.current === glitchSignal) {
      return;
    }

    previousButtonGlitchSignalRef.current = glitchSignal;
    startButtonTextGlitch();
  }, [glitchSignal, startButtonTextGlitch]);

  const handlePointerDown: React.PointerEventHandler<HTMLButtonElement> = (event) => {
    startButtonTextGlitch();
    onPointerDown?.(event);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      startButtonTextGlitch();
    }

    onKeyDown?.(event);
  };

  return (
    <button
      ref={buttonRef}
      type={type}
      aria-label={ariaLabel}
      className={`bazi-pressable ${className ?? ''}`}
      style={style}
      onClick={onClick}
      onPointerDown={handlePointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      onPointerCancel={onPointerCancel}
      onKeyDown={handleKeyDown}
    >
      {children}
    </button>
  );
}

function BaziDemoDisclaimer() {
  return <p className="bazi-demo-disclaimer">{BAZI_UI_DEMO_DISCLAIMER}</p>;
}

function GanzhiButtonLabel({
  glyph,
  showPinyin,
  glyphClassName,
  pinyinClassName,
}: {
  glyph: string;
  showPinyin?: boolean;
  glyphClassName?: string;
  pinyinClassName?: string;
}) {
  if (!glyph) {
    return null;
  }

  const pinyin = glyphPinyin(glyph);
  if (!showPinyin || !pinyin) {
    return <span className={glyphClassName}>{glyph}</span>;
  }

  return (
    <span className="inline-flex flex-col items-center justify-center gap-1">
      <span className={pinyinClassName}>({pinyin})</span>
      <span className={glyphClassName}>{glyph}</span>
    </span>
  );
}

type GlyphSquareProps = {
  glyph: string;
  showPinyin?: boolean;
  className?: string;
  style?: CSSProperties;
  glitchSignal?: number | string;
  onClick?: () => void;
  pressed?: boolean;
  ariaLabel?: string;
} & React.Attributes;

function GlyphSquare({
  glyph,
  showPinyin,
  className,
  style,
  glitchSignal,
  onClick,
  pressed,
  ariaLabel,
}: GlyphSquareProps) {
  const element = glyph ? elementByGlyph(glyph) : null;

  return (
    <BaziPressableButton
      ariaLabel={ariaLabel}
      className={`bazi-glyph-square ${className ?? ''}`}
      glitchSignal={glitchSignal}
      style={{
        backgroundColor: element ? ELEMENT_COLORS[element] : 'var(--bazi-secondary-background)',
        color: element ? 'var(--bazi-main-foreground)' : 'var(--bazi-foreground)',
        ...(pressed
          ? {
              transform: 'translate(var(--bazi-press-x), var(--bazi-press-y))',
              boxShadow: 'none',
            }
          : undefined),
        ...style,
      }}
      onClick={onClick}
    >
      {glyph ? (
        <GanzhiButtonLabel
          glyph={glyph}
          showPinyin={showPinyin}
          glyphClassName="bazi-glyph-text"
          pinyinClassName="bazi-pinyin-text"
        />
      ) : null}
    </BaziPressableButton>
  );
}

function NativeSelect({
  value,
  options,
  placeholder,
  onChange,
}: {
  value: string;
  options: string[];
  placeholder: string;
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target || !rootRef.current || rootRef.current.contains(target)) {
        return;
      }
      setIsOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setIsOpen(false);
  };

  const triggerLabel = value || placeholder;

  return (
    <div className="bazi-native-select-wrap">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="bazi-input-field bazi-input-select bazi-native-select bazi-native-select-mobile"
      >
        <option value="">{placeholder}</option>
        {options.map((optionValue) => (
          <option key={`select-option-${optionValue}`} value={optionValue}>
            {optionValue}
          </option>
        ))}
      </select>
      <ChevronDown className="bazi-select-chevron bazi-select-chevron-mobile" size={20} />

      <div ref={rootRef} className="bazi-custom-select-desktop">
        <button
          type="button"
          className={`bazi-input-field bazi-input-select bazi-custom-select-trigger ${value ? 'has-value' : 'is-placeholder'} ${isOpen ? 'is-open' : ''}`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
        >
          <span>{triggerLabel}</span>
          <ChevronDown className="bazi-select-chevron bazi-select-chevron-desktop" size={20} />
        </button>

        {isOpen && (
          <div className="bazi-custom-select-menu" role="listbox" aria-label={placeholder}>
            {options.map((optionValue) => (
              <button
                key={`custom-select-option-${optionValue}`}
                type="button"
                role="option"
                aria-selected={optionValue === value}
                className={`bazi-custom-select-option ${optionValue === value ? 'is-selected' : ''}`}
                onClick={() => handleSelect(optionValue)}
              >
                {optionValue}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PillarPickerDialog({
  picker,
  onClose,
  onSelect,
}: {
  picker: DirectPickerState;
  onClose: () => void;
  onSelect: (index: number) => void;
}) {
  if (!picker) {
    return null;
  }

  const options = picker.kind === 'stem' ? STEM_OPTIONS : BRANCH_OPTIONS;

  return (
    <div className="bazi-picker-overlay" onClick={onClose}>
      <div className="bazi-picker-panel" onClick={(event) => event.stopPropagation()}>
        <div className="bazi-picker-header">
          <h4>
            {picker.kind === 'stem' ? 'Select Stem' : 'Select Branch'} - {SLOT_LABELS[picker.slot]}
          </h4>
          <BaziPressableButton className="bazi-chip bazi-chip-small" onClick={onClose}>
            Close
          </BaziPressableButton>
        </div>

        <div className="bazi-picker-grid">
          {options.map((entry, index) => (
            <BaziPressableButton
              key={`picker-${picker.kind}-${entry.zh}`}
              className="bazi-picker-glyph"
              style={{
                backgroundColor: ELEMENT_COLORS[entry.element],
                color: 'var(--bazi-main-foreground)',
              }}
              onClick={() => onSelect(index)}
            >
              <GanzhiButtonLabel
                glyph={entry.zh}
                showPinyin
                glyphClassName="bazi-picker-glyph-text"
                pinyinClassName="bazi-picker-pinyin-text"
              />
            </BaziPressableButton>
          ))}
        </div>
      </div>
    </div>
  );
}

function BaziInputSection({
  inputMode,
  setInputMode,
  birthYear,
  setBirthYear,
  birthMonth,
  setBirthMonth,
  birthDay,
  setBirthDay,
  birthHour,
  setBirthHour,
  birthMinute,
  setBirthMinute,
  birthPeriod,
  setBirthPeriod,
  cityQuery,
  setCityQuery,
  directEntry,
  directEntryBirthYear,
  setDirectEntryBirthYear,
  clearDirectEntry,
  onOpenPicker,
  clearPressed,
  setClearPressed,
}: {
  inputMode: InputMode;
  setInputMode: (mode: InputMode) => void;
  birthYear: string;
  setBirthYear: (value: string) => void;
  birthMonth: string;
  setBirthMonth: (value: string) => void;
  birthDay: string;
  setBirthDay: (value: string) => void;
  birthHour: string;
  setBirthHour: (value: string) => void;
  birthMinute: string;
  setBirthMinute: (value: string) => void;
  birthPeriod: string;
  setBirthPeriod: (value: string) => void;
  cityQuery: string;
  setCityQuery: (value: string) => void;
  directEntry: DirectEntryState;
  directEntryBirthYear: string;
  setDirectEntryBirthYear: (value: string) => void;
  clearDirectEntry: () => void;
  onOpenPicker: (slot: PillarSlot, kind: 'stem' | 'branch') => void;
  clearPressed: boolean;
  setClearPressed: (pressed: boolean) => void;
}) {
  const hourOptions = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'));
  const minuteOptions = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));

  const slotStemGlyph = useCallback(
    (slot: PillarSlot) => {
      const index = directEntry[slot].stem;
      if (index == null) return '';
      return STEM_OPTIONS[index]?.zh ?? '';
    },
    [directEntry],
  );

  const slotBranchGlyph = useCallback(
    (slot: PillarSlot) => {
      const index = directEntry[slot].branch;
      if (index == null) return '';
      return BRANCH_OPTIONS[index]?.zh ?? '';
    },
    [directEntry],
  );

  return (
    <div className="bazi-input-shell">
      <div className="bazi-tabs-wrap">
        <BaziPressableButton
          className={`bazi-tab ${inputMode === 'birthProfile' ? 'is-active' : ''}`}
          onClick={() => setInputMode('birthProfile')}
        >
          Birth Input
        </BaziPressableButton>
        <BaziPressableButton
          className={`bazi-tab ${inputMode === 'directBaZi' ? 'is-active' : ''}`}
          onClick={() => setInputMode('directBaZi')}
        >
          Direct BaZi Entry
        </BaziPressableButton>
      </div>

      {inputMode === 'birthProfile' && (
        <div className="bazi-input-stack">
          <div className="bazi-card bazi-subcard">
            <h3 className="bazi-subcard-title">Birth Time</h3>
            <div className="bazi-grid-3">
              <input className="bazi-input-field" value={birthYear} onChange={(event) => setBirthYear(event.target.value)} placeholder="Year" />
              <input className="bazi-input-field" value={birthMonth} onChange={(event) => setBirthMonth(event.target.value)} placeholder="Month" />
              <input className="bazi-input-field" value={birthDay} onChange={(event) => setBirthDay(event.target.value)} placeholder="Day" />
            </div>
            <div className="bazi-grid-3 bazi-time-row">
              <NativeSelect value={birthHour} options={hourOptions} placeholder="Hour" onChange={setBirthHour} />
              <NativeSelect value={birthMinute} options={minuteOptions} placeholder="Min" onChange={setBirthMinute} />
              <NativeSelect value={birthPeriod} options={['AM', 'PM']} placeholder="AM/PM" onChange={setBirthPeriod} />
            </div>
          </div>

          <div className="bazi-card bazi-subcard">
            <h3 className="bazi-subcard-title">Birth Place</h3>
            <input
              className="bazi-input-field"
              value={cityQuery}
              onChange={(event) => setCityQuery(event.target.value)}
              placeholder="Search city (e.g. Wuhan, Tokyo, New York)"
            />
          </div>
        </div>
      )}

      {inputMode === 'directBaZi' && (
        <div className="bazi-input-stack">
          <div className="bazi-card bazi-subcard">
            <h3 className="bazi-subcard-title">Direct BaZi Entry</h3>
            <div className="bazi-direct-grid-header">
              {PILLAR_SLOTS.map((slot) => (
                <span key={`direct-header-${slot}`}>{SLOT_LABELS[slot]}</span>
              ))}
            </div>

            <div className="bazi-direct-grid">
              {PILLAR_SLOTS.map((slot) => (
                <GlyphSquare
                  key={`direct-stem-${slot}`}
                  glyph={slotStemGlyph(slot)}
                  showPinyin
                  pressed={clearPressed}
                  onClick={() => onOpenPicker(slot, 'stem')}
                  ariaLabel={`Select stem for ${SLOT_LABELS[slot]}`}
                />
              ))}
            </div>

            <div className="bazi-direct-grid">
              {PILLAR_SLOTS.map((slot) => (
                <GlyphSquare
                  key={`direct-branch-${slot}`}
                  glyph={slotBranchGlyph(slot)}
                  showPinyin
                  pressed={clearPressed}
                  onClick={() => onOpenPicker(slot, 'branch')}
                  ariaLabel={`Select branch for ${SLOT_LABELS[slot]}`}
                />
              ))}
            </div>

            <input
              className="bazi-input-field bazi-direct-birth-year"
              value={directEntryBirthYear}
              onChange={(event) => setDirectEntryBirthYear(event.target.value)}
              placeholder="Birth year (optional, for fortune-cycle start year)"
            />

            <div className="bazi-clear-wrap">
              <BaziPressableButton
                className="bazi-chip bazi-clear-button"
                onPointerDown={() => setClearPressed(true)}
                onPointerUp={() => setClearPressed(false)}
                onPointerLeave={() => setClearPressed(false)}
                onPointerCancel={() => setClearPressed(false)}
                onClick={() => {
                  setClearPressed(false);
                  clearDirectEntry();
                }}
              >
                Clear BaZi
              </BaziPressableButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BaziChartSection() {
  return (
    <article className="bazi-card bazi-section-card bazi-chart-card">
      <div className="bazi-row-label">Stem</div>
      <div className="bazi-glyph-grid-4">
        {BAZI_SAMPLE_PILLARS.map((pillar) => (
          <GlyphSquare
            key={`chart-stem-${pillar.slot}`}
            glyph={pillar.stem}
            showPinyin
            ariaLabel={`${pillar.slotEn} stem`}
          />
        ))}
      </div>

      <div className="bazi-row-label">Branch</div>
      <div className="bazi-glyph-grid-4">
        {BAZI_SAMPLE_PILLARS.map((pillar) => (
          <GlyphSquare
            key={`chart-branch-${pillar.slot}`}
            glyph={pillar.branch}
            showPinyin
            ariaLabel={`${pillar.slotEn} branch`}
          />
        ))}
      </div>
    </article>
  );
}

function InfluenceNetworkCard({ captionGlitchSignal }: { captionGlitchSignal?: number | string }) {
  const nodes = useMemo(() => buildNetworkNodes(), []);
  const edges = useMemo(() => buildNetworkEdges(nodes), [nodes]);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [positions, setPositions] = useState<Record<string, Point>>({});
  const [draggedIds, setDraggedIds] = useState<Set<string>>(new Set());
  const [isSimulating, setIsSimulating] = useState(false);
  const velocitiesRef = useRef<Record<string, Velocity>>({});
  const lastTickRef = useRef<number | null>(null);
  const initPositionsRef = useRef<Record<string, Point>>({});
  const positionsRef = useRef<Record<string, Point>>({});
  const dragStateRef = useRef<Map<number, { nodeId: string; startX: number; startY: number; startPos: Point; pointerType: string }>>(new Map());
  const hasMovedRef = useRef(false);
  const prevDraggedCountRef = useRef(0);
  const prevDraggedRef = useRef<string | null>(null);
  const lastReleasedNodeRef = useRef<string | null>(null);
  const docListenersRef = useRef<{ move: (event: PointerEvent) => void; up: (event: PointerEvent) => void } | null>(null);

  const maxGodWeight = useMemo(
    () => Math.max(...nodes.filter((node) => !node.isDayMaster).map((node) => node.weight), 0.01),
    [nodes],
  );
  const dayMasterElement = elementByGlyph(BAZI_DEMO_CHART.dayMasterStem);
  positionsRef.current = positions;

  const getViewportBounds = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) {
      return undefined;
    }

    const inView = rect.bottom > 0 && rect.right > 0 && rect.left < window.innerWidth && rect.top < window.innerHeight;
    if (!inView) {
      return undefined;
    }

    return {
      rect: { left: rect.left, top: rect.top },
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    };
  }, []);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      const width = Math.max(0, entry.contentRect.width);
      const height = Math.max(0, entry.contentRect.height);
      setSize({ width, height });
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  const withDayMasterCentered = useCallback(
    (nextPositions: Record<string, Point>) => {
      if (size.width <= 0 || size.height <= 0) return nextPositions;
      const center = { x: size.width / 2, y: size.height / 2 };
      return { ...nextPositions, [DAY_MASTER_NODE_ID]: center };
    },
    [size.height, size.width],
  );

  useEffect(() => {
    if (size.width <= 0 || size.height <= 0) {
      return;
    }

    const initial: Record<string, Point> = {
      [DAY_MASTER_NODE_ID]: { x: size.width / 2, y: size.height / 2 },
    };

    for (const node of nodes) {
      if (!node.isDayMaster) {
        initial[node.id] = defaultRingPoint(node.id, size.width, size.height, nodes);
      }
    }

    const viewportBounds = getViewportBounds();
    const { positions: resolved } = applyPhysicsTriple(
      initial,
      nodes,
      edges,
      maxGodWeight,
      size.width,
      size.height,
      { simulationSteps: 0, viewportBounds },
    );

    initPositionsRef.current = resolved;
    setPositions(withDayMasterCentered({ ...positionsRef.current, ...resolved }));
    velocitiesRef.current = {};
  }, [edges, getViewportBounds, maxGodWeight, nodes, size.height, size.width, withDayMasterCentered]);

  const runSimulation = useCallback(() => {
    if (rafRef.current) return;
    if (Object.keys(initPositionsRef.current).length === 0) return;

    const releasedNodeId = prevDraggedRef.current;
    const simPositions = { ...initPositionsRef.current };

    if (releasedNodeId && releasedNodeId !== DAY_MASTER_NODE_ID) {
      const releasedPosition = positionsRef.current[releasedNodeId];
      if (releasedPosition) {
        simPositions[releasedNodeId] = releasedPosition;
      }
    }

    const boundaryCollisions: Record<string, number> = {};
    lastTickRef.current = null;
    let bounceCount = 0;
    let previousToward = 0;
    const BOUNCE_LIMIT = 3;
    setIsSimulating(true);

    const tick = (now: number) => {
      const dtMs = lastTickRef.current !== null ? now - lastTickRef.current : 1000 / 60;
      lastTickRef.current = now;

      const viewportBounds = getViewportBounds();
      const { positions: next, velocities } = applyPhysicsTriple(
        simPositions,
        nodes,
        edges,
        maxGodWeight,
        size.width,
        size.height,
        {
          velocities: velocitiesRef.current,
          simulationSteps: 1,
          dtMs,
          boundaryCollisions,
          viewportBounds,
        },
      );

      Object.assign(simPositions, next);
      velocitiesRef.current = velocities;

      if (releasedNodeId && releasedNodeId !== DAY_MASTER_NODE_ID) {
        const current = next[releasedNodeId];
        const velocity = velocities[releasedNodeId] ?? { dx: 0, dy: 0 };
        const target = initPositionsRef.current[releasedNodeId];

        if (current && target) {
          const dx = target.x - current.x;
          const dy = target.y - current.y;
          const toward = velocity.dx * dx + velocity.dy * dy;
          if (previousToward > 0.5 && toward < -0.5) {
            bounceCount += 1;
          }
          previousToward = toward;
        }
      }

      if (bounceCount >= BOUNCE_LIMIT) {
        velocitiesRef.current = {};
        setPositions(withDayMasterCentered(initPositionsRef.current));
        setIsSimulating(false);
        rafRef.current = null;
        return;
      }

      setPositions(withDayMasterCentered(next));
      const maxVelocity = Math.max(...Object.values(velocities).map((entry) => Math.hypot(entry.dx, entry.dy)), 0);

      if (maxVelocity > 0.5) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        velocitiesRef.current = {};
        setPositions(withDayMasterCentered(initPositionsRef.current));
        setIsSimulating(false);
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [edges, getViewportBounds, maxGodWeight, nodes, size.height, size.width, withDayMasterCentered]);

  useEffect(() => {
    if (draggedIds.size === 0 && prevDraggedCountRef.current > 0 && Object.keys(positionsRef.current).length > 0) {
      prevDraggedRef.current = lastReleasedNodeRef.current;
      runSimulation();
      lastReleasedNodeRef.current = null;
    }
    prevDraggedCountRef.current = draggedIds.size;
  }, [draggedIds.size, runSimulation]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }

      const listeners = docListenersRef.current;
      if (listeners) {
        document.removeEventListener('pointermove', listeners.move);
        document.removeEventListener('pointerup', listeners.up);
        document.removeEventListener('pointercancel', listeners.up);
        docListenersRef.current = null;
      }
    };
  }, []);

  const handleDocPointerMove = useCallback(
    (event: PointerEvent) => {
      const dragState = dragStateRef.current.get(event.pointerId);
      if (!dragState || !containerRef.current) {
        return;
      }
      const { nodeId, startX, startY, startPos, pointerType } = dragState;
      hasMovedRef.current = true;

      const raw = {
        x: startPos.x + (event.clientX - startX),
        y: startPos.y + (event.clientY - startY),
      };
      const targetNode = nodes.find((node) => node.id === nodeId);
      const radius = targetNode ? nodeRadius(targetNode, maxGodWeight) : NETWORK_NODE_RADIUS.min;
      const rect = containerRef.current.getBoundingClientRect();
      const viewportPos = { x: raw.x + rect.left, y: raw.y + rect.top };
      const clampedViewport = clampPoint(
        viewportPos,
        window.innerWidth,
        window.innerHeight,
        radius + NETWORK_BUTTON_PAD_HALF,
      );
      const final = { x: clampedViewport.x - rect.left, y: clampedViewport.y - rect.top };
      const viewportBounds = getViewportBounds() ?? {
        rect: { left: rect.left, top: rect.top },
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      };
      const isMobileDrag = pointerType === 'touch' || window.innerWidth <= 768;
      const { positions: simulatedPositions, velocities } = applyPhysicsTriple(
        { ...positionsRef.current, [nodeId]: final },
        nodes,
        edges,
        maxGodWeight,
        size.width,
        size.height,
        {
          draggedId: nodeId,
          draggedPos: final,
          velocities: isMobileDrag ? {} : velocitiesRef.current,
          simulationSteps: isMobileDrag ? 0 : 5,
          viewportBounds,
        },
      );
      velocitiesRef.current = isMobileDrag ? {} : velocities;
      setPositions(withDayMasterCentered({ ...positionsRef.current, ...simulatedPositions }));
    },
    [edges, getViewportBounds, maxGodWeight, nodes, size.height, size.width, withDayMasterCentered],
  );

  const handleDocPointerUp = useCallback((event: PointerEvent) => {
    const dragState = dragStateRef.current.get(event.pointerId);
    if (!dragState) {
      return;
    }

    const { nodeId } = dragState;
    velocitiesRef.current[nodeId] = { dx: 0, dy: 0 };
    dragStateRef.current.delete(event.pointerId);
    lastReleasedNodeRef.current = nodeId;
    setDraggedIds((previous) => {
      const next = new Set(previous);
      next.delete(nodeId);
      return next;
    });

    if (dragStateRef.current.size === 0) {
      const listeners = docListenersRef.current;
      if (listeners) {
        document.removeEventListener('pointermove', listeners.move);
        document.removeEventListener('pointerup', listeners.up);
        document.removeEventListener('pointercancel', listeners.up);
        docListenersRef.current = null;
      }
    }
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>, nodeId: string) => {
      if (nodeId === DAY_MASTER_NODE_ID) {
        return;
      }

      event.preventDefault();
      hasMovedRef.current = false;

      if (rafRef.current && dragStateRef.current.size === 0) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        setIsSimulating(false);
      }
      velocitiesRef.current = {};

      const position = positions[nodeId] ?? defaultRingPoint(nodeId, size.width, size.height, nodes);
      dragStateRef.current.set(event.pointerId, {
        nodeId,
        startX: event.clientX,
        startY: event.clientY,
        startPos: position,
        pointerType: event.pointerType,
      });
      setDraggedIds((previous) => new Set(previous).add(nodeId));

      if (!docListenersRef.current) {
        const listeners = {
          move: (docEvent: PointerEvent) => handleDocPointerMove(docEvent),
          up: (docEvent: PointerEvent) => handleDocPointerUp(docEvent),
        };
        docListenersRef.current = listeners;
        document.addEventListener('pointermove', listeners.move);
        document.addEventListener('pointerup', listeners.up);
        document.addEventListener('pointercancel', listeners.up);
      }
    },
    [handleDocPointerMove, handleDocPointerUp, nodes, positions, size.height, size.width],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (!dragStateRef.current.has(event.pointerId)) {
        return;
      }
      handleDocPointerMove(event.nativeEvent);
    },
    [handleDocPointerMove],
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>, nodeId: string) => {
      if (nodeId === DAY_MASTER_NODE_ID) {
        return;
      }
      if (dragStateRef.current.has(event.pointerId)) {
        handleDocPointerUp(event.nativeEvent);
      }
    },
    [handleDocPointerUp],
  );

  const handleClick = useCallback(() => {
    if (hasMovedRef.current) {
      return;
    }
  }, []);

  const getPosition = useCallback(
    (id: string): Point => {
      if (id === DAY_MASTER_NODE_ID) {
        return { x: size.width / 2, y: size.height / 2 };
      }
      return positions[id] ?? defaultRingPoint(id, size.width, size.height, nodes);
    },
    [nodes, positions, size.height, size.width],
  );

  return (
    <article className="bazi-card bazi-section-card bazi-network-card" data-disable-custom-cursor="true">
      <h3 className="bazi-card-title bazi-card-title-left">Influence Network</h3>
      <GlitchText
        text="Drag circles"
        tag="p"
        wrapToWidth={false}
        scrambleOnMount={false}
        scrambleSignal={captionGlitchSignal}
        className="bazi-card-caption"
      />

      <div ref={containerRef} className="bazi-network-stage">
        {nodes.map((node) => {
          const point = getPosition(node.id);
          const radius = nodeRadius(node, maxGodWeight);
          const sizePx = radius * 2;
          const buttonSize = sizePx + NETWORK_BUTTON_PAD;
          const elementColor = ELEMENT_COLORS[influenceNodeElement(node.id, dayMasterElement)];
          const secondaryLabel = String(Math.round(node.weight * 10));
          const isDayMaster = node.id === DAY_MASTER_NODE_ID;

          return (
            <BaziPressableButton
              key={node.id}
              className={`bazi-network-node ${draggedIds.has(node.id) ? 'is-dragging' : ''}`}
              onClick={handleClick}
              onPointerDown={(event) => handlePointerDown(event, node.id)}
              onPointerMove={handlePointerMove}
              onPointerUp={(event) => handlePointerUp(event, node.id)}
              onPointerCancel={(event) => handlePointerUp(event, node.id)}
              style={{
                left: '0px',
                top: '0px',
                width: `${buttonSize}px`,
                height: `${buttonSize}px`,
                minWidth: `${buttonSize}px`,
                minHeight: `${buttonSize}px`,
                padding: `${Math.max(0.5, sizePx * 0.05)}px`,
                transform: `translate3d(${point.x - buttonSize / 2}px, ${point.y - buttonSize / 2}px, 0)`,
                backgroundColor: elementColor,
                color: 'var(--bazi-main-foreground)',
                transition: draggedIds.has(node.id) || isSimulating ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              }}
            >
              <span
                role="presentation"
                className={`bazi-network-node-content ${node.id !== DAY_MASTER_NODE_ID ? 'is-draggable' : ''}`}
              >
                {!isDayMaster ? (
                  <span className="bazi-network-node-value">
                    {secondaryLabel}
                  </span>
                ) : null}
              </span>
            </BaziPressableButton>
          );
        })}
      </div>
    </article>
  );
}

function ElementsDistributionCard({ captionGlitchSignal }: { captionGlitchSignal?: number | string }) {
  const [pressedElementKey, setPressedElementKey] = useState<string | null>(null);
  const [selectedElementKey, setSelectedElementKey] = useState<string>('wood');
  const [donutRotation, setDonutRotation] = useState(0);
  const [donutInteraction, setDonutInteraction] = useState<'idle' | 'dragging' | 'settling'>('idle');
  const donutRef = useRef<HTMLDivElement | null>(null);
  const spinStateRef = useRef<{ pointerId: number; startAngle: number; startRotation: number; moved: boolean } | null>(null);
  const settleTimeoutRef = useRef<number | null>(null);

  const chartData = useMemo(() => (
    BAZI_ELEMENT_DISTRIBUTION.map((item) => ({
      key: item.key,
      name: item.labelEn,
      value: item.value,
      fill: item.color,
    }))
  ), []);

  const selectedElement = chartData.find((entry) => entry.key === selectedElementKey) ?? chartData[0];

  const clearSettleTimeout = useCallback(() => {
    if (settleTimeoutRef.current !== null) {
      window.clearTimeout(settleTimeoutRef.current);
      settleTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearSettleTimeout();
    };
  }, [clearSettleTimeout]);

  const angleFromPointer = (clientX: number, clientY: number, rect: DOMRect): number => {
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    return (Math.atan2(clientY - centerY, clientX - centerX) * 180) / Math.PI;
  };

  const normalizeAngle = (angle: number) => {
    let normalized = angle;
    while (normalized > 180) normalized -= 360;
    while (normalized < -180) normalized += 360;
    return normalized;
  };

  const angleToSectorIndex = (angleDeg: number) => {
    const total = chartData.reduce((sum, entry) => sum + entry.value, 0);
    if (total <= 0) return 0;

    const angle = (((-angleDeg) % 360) + 360) % 360;
    let cumulative = 0;

    for (let index = 0; index < chartData.length; index += 1) {
      cumulative += ((chartData[index]?.value ?? 0) / total) * 360;
      if (angle < cumulative) return index;
    }

    return chartData.length - 1;
  };

  const onPointerDown = (event: React.PointerEvent) => {
    event.preventDefault();
    const rect = donutRef.current?.getBoundingClientRect();
    if (!rect) return;

    const angle = angleFromPointer(event.clientX, event.clientY, rect);
    const logicalAngle = angle - donutRotation;
    const sectorIndex = angleToSectorIndex(logicalAngle);
    setPressedElementKey(chartData[sectorIndex]?.key ?? null);

    clearSettleTimeout();
    spinStateRef.current = {
      pointerId: event.pointerId,
      startAngle: angle,
      startRotation: donutRotation,
      moved: false,
    };

    setDonutInteraction('dragging');
    donutRef.current?.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const drag = spinStateRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const rect = donutRef.current?.getBoundingClientRect();
    if (!rect) return;

    const angle = angleFromPointer(event.clientX, event.clientY, rect);
    const delta = normalizeAngle(angle - drag.startAngle);

    if (Math.abs(delta) > 3) {
      drag.moved = true;
      setPressedElementKey(null);
    }

    setDonutRotation(drag.startRotation + delta);
  };

  const finishPointerByClientPosition = useCallback((pointerId: number, clientX: number, clientY: number) => {
    const drag = spinStateRef.current;
    if (!drag || drag.pointerId !== pointerId) return;

    if (donutRef.current?.hasPointerCapture(pointerId)) {
      donutRef.current.releasePointerCapture(pointerId);
    }
    spinStateRef.current = null;

    if (drag.moved) {
      setPressedElementKey(null);
      setDonutInteraction('settling');
      setDonutRotation(0);
      clearSettleTimeout();
      settleTimeoutRef.current = window.setTimeout(() => {
        setDonutInteraction('idle');
        settleTimeoutRef.current = null;
      }, 500);
      return;
    }

    setDonutInteraction('idle');
    const rect = donutRef.current?.getBoundingClientRect();
    if (!rect) {
      setPressedElementKey(null);
      return;
    }

    const angle = angleFromPointer(clientX, clientY, rect);
    const finalRotation = drag.startRotation + normalizeAngle(angle - drag.startAngle);
    const sectorIndex = angleToSectorIndex(angle - finalRotation);
    const target = chartData[sectorIndex];

    if (target) {
      setSelectedElementKey(target.key);
    }

    setPressedElementKey(null);
  }, [angleToSectorIndex, chartData, clearSettleTimeout, normalizeAngle]);

  const finishPointer = (event: React.PointerEvent) => {
    finishPointerByClientPosition(event.pointerId, event.clientX, event.clientY);
  };

  useEffect(() => {
    const handleGlobalPointerRelease = (event: PointerEvent) => {
      finishPointerByClientPosition(event.pointerId, event.clientX, event.clientY);
    };

    window.addEventListener('pointerup', handleGlobalPointerRelease);
    window.addEventListener('pointercancel', handleGlobalPointerRelease);

    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerRelease);
      window.removeEventListener('pointercancel', handleGlobalPointerRelease);
    };
  }, [finishPointerByClientPosition]);

  return (
    <article className="bazi-card bazi-section-card bazi-elements-card">
      <h3 className="bazi-card-title bazi-card-title-left">Element Distribution</h3>
      <GlitchText
        text="Spin donut"
        tag="p"
        wrapToWidth={false}
        scrambleOnMount={false}
        scrambleSignal={captionGlitchSignal}
        className="bazi-card-caption"
      />

      <div
        ref={donutRef}
        className="bazi-elements-donut-wrap"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishPointer}
        onPointerCancel={finishPointer}
      >
        <div
          className="bazi-elements-donut-inner"
          style={{
            transform: `rotate(${donutRotation}deg)`,
            transition: donutInteraction === 'settling' ? 'transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart className="bazi-elements-pie">
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="key"
                innerRadius="53%"
                outerRadius="91%"
                cx="50%"
                cy="50%"
                stroke="var(--bazi-border)"
                strokeWidth={3}
                animationDuration={270}
                paddingAngle={0}
                onClick={(payload) => {
                  if (payload?.key) {
                    setSelectedElementKey(String(payload.key));
                  }
                }}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.key}
                    fill={entry.fill}
                    stroke="var(--bazi-border)"
                    strokeWidth={3}
                    style={{
                      transform: pressedElementKey === entry.key ? 'translate(4px, 4px)' : undefined,
                      transition: 'transform 100ms ease-out',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <span className="bazi-elements-selected" aria-hidden>
        {selectedElement?.name}
      </span>
    </article>
  );
}

function TransitPillarGrid({
  transitStem,
  transitBranch,
  pressed,
  glitchSignal,
}: {
  transitStem: string;
  transitBranch: string;
  pressed: boolean;
  glitchSignal?: number | string;
}) {
  const natalStems = BAZI_SAMPLE_PILLARS.map((pillar) => pillar.stem);
  const natalBranches = BAZI_SAMPLE_PILLARS.map((pillar) => pillar.branch);

  return (
    <div className="bazi-transit-grid">
      <GlyphSquare glyph={transitStem} showPinyin pressed={pressed} glitchSignal={glitchSignal} />
      <div aria-hidden />
      {natalStems.map((stem, index) => (
        <GlyphSquare key={`natal-stem-${index}`} glyph={stem} showPinyin />
      ))}

      <GlyphSquare glyph={transitBranch} showPinyin pressed={pressed} glitchSignal={glitchSignal} />
      <div aria-hidden />
      {natalBranches.map((branch, index) => (
        <GlyphSquare key={`natal-branch-${index}`} glyph={branch} showPinyin />
      ))}
    </div>
  );
}

function TransitInfoField({
  label,
  value,
  emphasis,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  emphasis?: boolean;
  accent?: CSSProperties;
}) {
  return (
    <div className="bazi-transit-field-wrap">
      <p className="bazi-transit-field-label">{label}</p>
      <BaziPressableButton
        className={`bazi-transit-field ${emphasis ? 'is-emphasis' : ''}`}
        style={accent}
        ariaLabel={`${label} value`}
      >
        {value}
      </BaziPressableButton>
    </div>
  );
}

function AnnualTransitCard({
  transitIndex,
  setTransitIndex,
  onStepNavigate,
}: {
  transitIndex: number;
  setTransitIndex: (next: number) => void;
  onStepNavigate?: () => void;
}) {
  const [nowPressed, setNowPressed] = useState(false);
  const [linkedTransitGlyphGlitchSignal, setLinkedTransitGlyphGlitchSignal] = useState(0);
  const [linkedTransitNavGlitchSignal, setLinkedTransitNavGlitchSignal] = useState(0);

  const entry = ANNUAL_TRANSIT_DEMO_RANGE[transitIndex] ?? ANNUAL_TRANSIT_DEMO_RANGE[0];
  const age = entry.age;

  const stage = TRANSIT_STAGE[entry.age % TRANSIT_STAGE.length] ?? TRANSIT_STAGE[0];
  const naYin = TRANSIT_NA_YIN[entry.age % TRANSIT_NA_YIN.length] ?? TRANSIT_NA_YIN[0];
  const voidValue = DAY_PILLAR
    ? voidDisplayForTransitBranch(entry.branch, DAY_PILLAR.stem, DAY_PILLAR.branch)
    : '';
  const transitBranchColor = ELEMENT_COLORS[elementByGlyph(entry.branch)];
  const voidAccent: CSSProperties = voidValue
    ? {
        borderColor: transitBranchColor,
        backgroundColor: 'var(--bazi-secondary-background)',
        color: transitBranchColor,
      }
    : {
        borderColor: transitBranchColor,
        backgroundColor: transitBranchColor,
        color: 'var(--bazi-main-foreground)',
      };

  const triggerNowLinkedButtonGlitch = useCallback(() => {
    setLinkedTransitGlyphGlitchSignal((currentSignal) => currentSignal + 1);
    setLinkedTransitNavGlitchSignal((currentSignal) => currentSignal + 1);
  }, []);

  return (
    <article className="bazi-card bazi-section-card bazi-transit-card" data-bazi-update-glitch="transit-card">
      <div className="bazi-transit-header">
        <h3>Annual Transit {entry.year}, Age {age}</h3>
        <BaziPressableButton
          className="bazi-chip bazi-now-chip"
          onPointerDown={() => {
            setNowPressed(true);
            triggerNowLinkedButtonGlitch();
          }}
          onPointerUp={() => setNowPressed(false)}
          onPointerLeave={() => setNowPressed(false)}
          onPointerCancel={() => setNowPressed(false)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              triggerNowLinkedButtonGlitch();
            }
          }}
          onClick={() => {
            setNowPressed(false);
            const currentAge = new Date().getFullYear() - 1971;
            setTransitIndex(clamp(currentAge, 0, ANNUAL_TRANSIT_DEMO_RANGE.length - 1));
          }}
        >
          Now
        </BaziPressableButton>
      </div>

      <TransitPillarGrid
        transitStem={entry.stem}
        transitBranch={entry.branch}
        pressed={nowPressed}
        glitchSignal={linkedTransitGlyphGlitchSignal}
      />

      <div className="bazi-transit-info-row top-row">
        <TransitInfoField label="Stage" value={stage} />
        <TransitInfoField
          label="Void"
          value={voidValue}
          emphasis
          accent={voidAccent}
        />
        <TransitInfoField label="Tone" value={naYin} />
      </div>

      <div className="bazi-transit-nav">
        <BaziPressableButton
          className="bazi-chip bazi-nav-icon"
          glitchSignal={linkedTransitNavGlitchSignal}
          onClick={() => {
            setTransitIndex(clamp(transitIndex - 1, 0, ANNUAL_TRANSIT_DEMO_RANGE.length - 1));
            onStepNavigate?.();
          }}
          ariaLabel="Previous year"
        >
          <ArrowLeft size={20} />
        </BaziPressableButton>

        <input
          type="range"
          min={0}
          max={ANNUAL_TRANSIT_DEMO_RANGE.length - 1}
          step={1}
          value={transitIndex}
          onChange={(event) => setTransitIndex(Number(event.target.value))}
          className="bazi-range"
          aria-label="Annual transit year"
        />

        <BaziPressableButton
          className="bazi-chip bazi-nav-icon"
          glitchSignal={linkedTransitNavGlitchSignal}
          onClick={() => {
            setTransitIndex(clamp(transitIndex + 1, 0, ANNUAL_TRANSIT_DEMO_RANGE.length - 1));
            onStepNavigate?.();
          }}
          ariaLabel="Next year"
        >
          <ArrowRight size={20} />
        </BaziPressableButton>
      </div>
    </article>
  );
}

function AlmanacEnergyBars({ entry }: { entry: (typeof GENERAL_ALMANAC_DEMO)[number] }) {
  return (
    <div className="bazi-energy-bars">
      {entry.energy.map((item) => {
        const key = item.key as AlmanacEnergyKey;
        const color = ALMANAC_ENERGY_COLORS[key];
        const label = ALMANAC_ENERGY_LABELS[key];

        return (
          <div key={`energy-row-${entry.date}-${item.key}`} className="bazi-energy-row">
            <div className="bazi-energy-row-head">
              <span>{label}</span>
              <span>{item.score}</span>
            </div>
            <div className="bazi-energy-track">
              <span
                className="bazi-energy-fill"
                style={{
                  width: `${Math.max(0, Math.min(100, item.score))}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LuckyColorCard({ colorHex }: { colorHex: string }) {
  const [displayColor, setDisplayColor] = useState(colorHex);
  const frameTimeoutRef = useRef<number | null>(null);
  const hasInitializedRef = useRef(false);

  const glitchPalette = useMemo(() => {
    const basePalette = Object.values(ELEMENT_COLORS);
    return Array.from(new Set([...basePalette, '#d85b5b', '#31a8c4', colorHex]));
  }, [colorHex]);

  const stopBlink = useCallback((settleToFinal = false) => {
    if (frameTimeoutRef.current !== null) {
      window.clearTimeout(frameTimeoutRef.current);
      frameTimeoutRef.current = null;
    }

    if (settleToFinal) {
      setDisplayColor(colorHex);
    }
  }, [colorHex]);

  const startBlink = useCallback(() => {
    stopBlink(false);

    let frame = 0;
    const runFrame = () => {
      if (frame >= LUCKY_COLOR_GLITCH_FRAMES) {
        setDisplayColor(colorHex);
        frameTimeoutRef.current = null;
        return;
      }

      const nextColor = glitchPalette[Math.floor(Math.random() * glitchPalette.length)] ?? colorHex;
      setDisplayColor(nextColor);
      frame += 1;
      frameTimeoutRef.current = window.setTimeout(runFrame, LUCKY_COLOR_GLITCH_STEP_MS);
    };

    runFrame();
  }, [colorHex, glitchPalette, stopBlink]);

  useEffect(() => (
    () => {
      stopBlink(true);
    }
  ), [stopBlink]);

  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      setDisplayColor(colorHex);
      return;
    }

    startBlink();
  }, [colorHex, startBlink]);

  return (
    <BaziPressableButton
      className="bazi-lucky-cell"
      style={{
        backgroundColor: displayColor,
        transition: 'background-color 72ms linear',
      }}
      ariaLabel="Lucky color"
      onPointerDown={startBlink}
    />
  );
}

function GeneralAlmanacCard({
  index,
  setIndex,
  onStepNavigate,
}: {
  index: number;
  setIndex: (next: number) => void;
  onStepNavigate?: () => void;
}) {
  const entry = GENERAL_ALMANAC_DEMO[index] ?? GENERAL_ALMANAC_DEMO[0];
  const sixWordsStem = [entry.sixWords.year.stem, entry.sixWords.month.stem, entry.sixWords.day.stem];
  const sixWordsBranch = [entry.sixWords.year.branch, entry.sixWords.month.branch, entry.sixWords.day.branch];

  const timeIsNight = (() => {
    const [from] = entry.lucky.timeRange.split('-');
    const hour = Number(from?.split(':')[0] ?? '0');
    return hour >= 18 || hour < 6;
  })();

  const TimeIcon = timeIsNight ? Moon : Sun;

  return (
    <article className="bazi-card bazi-section-card bazi-almanac-card" data-bazi-update-glitch="almanac-card">
      <div className="bazi-almanac-top-row">
        <p className="bazi-almanac-date">Date:{entry.date.replace(/-/g, '/')}</p>
        <BaziPressableButton className="bazi-chip bazi-save-chip" ariaLabel="Save image">
          <Save size={18} />
        </BaziPressableButton>
      </div>

      <div className="bazi-almanac-two-col">
        <div className="bazi-card bazi-almanac-inner-card">
          <h4>Lucky Insights</h4>
          <div className="bazi-lucky-grid">
            <BaziPressableButton className="bazi-lucky-cell number" ariaLabel="Lucky number">
              {entry.lucky.number}
            </BaziPressableButton>
            <LuckyColorCard colorHex={entry.lucky.colorHex} />
            <BaziPressableButton
              className="bazi-lucky-cell direction"
              style={{ backgroundColor: ELEMENT_COLORS[elementByGlyph(entry.lucky.directionBranch)] }}
              ariaLabel="Lucky direction"
            >
              <span className="bazi-lucky-arrow">↗</span>
              <span className="bazi-lucky-glyph">{entry.lucky.directionBranch}</span>
            </BaziPressableButton>
            <BaziPressableButton className="bazi-lucky-cell time" ariaLabel="Lucky time range">
              <TimeIcon size={44} />
              <span>{entry.lucky.timeRange}</span>
            </BaziPressableButton>
          </div>
        </div>

        <div className="bazi-card bazi-almanac-inner-card">
          <h4>Energy Index</h4>
          <AlmanacEnergyBars entry={entry} />
        </div>
      </div>

      <div className="bazi-card bazi-almanac-inner-card bazi-six-glyphs-card">
        <h4>Today Six Glyphs</h4>
        <div className="bazi-six-glyphs-layout">
          <BaziPressableButton
            className="bazi-chip bazi-nav-icon"
            onClick={() => {
              setIndex(clamp(index - 1, ALMANAC_MIN_INDEX, ALMANAC_MAX_INDEX));
              onStepNavigate?.();
            }}
            ariaLabel="Previous Day"
          >
            <ArrowLeft size={20} />
          </BaziPressableButton>

          <div className="bazi-six-glyph-grid">
            {sixWordsStem.map((glyph, idx) => (
              <GlyphSquare key={`six-stem-${entry.date}-${idx}`} glyph={glyph} showPinyin />
            ))}
            {sixWordsBranch.map((glyph, idx) => (
              <GlyphSquare key={`six-branch-${entry.date}-${idx}`} glyph={glyph} showPinyin />
            ))}
          </div>

          <BaziPressableButton
            className="bazi-chip bazi-nav-icon"
            onClick={() => {
              setIndex(clamp(index + 1, ALMANAC_MIN_INDEX, ALMANAC_MAX_INDEX));
              onStepNavigate?.();
            }}
            ariaLabel="Next Day"
          >
            <ArrowRight size={20} />
          </BaziPressableButton>
        </div>
      </div>
    </article>
  );
}

function BaziIntroParagraph() {
  const parts = BAZI_INTRO_TEXT.split('**');
  if (parts.length < 3) {
    return <span>{BAZI_INTRO_TEXT.replace(/\*\*/g, '')}</span>;
  }

  return (
    <>
      <strong>{parts[1]}</strong>
      {parts.slice(2).join('')}
    </>
  );
}

export function SelectedWorksIndexPage({
  onNavigate,
}: {
  onNavigate: (nextRoute: '/selected-works/bazi' | '/selected-works/latent-27') => void;
}) {
  const meshSignalA = useOccasionalGlitchSignal(3900, 7600);
  const meshSignalB = useOccasionalGlitchSignal(4300, 8000);
  const meshSignalC = useOccasionalGlitchSignal(4700, 8400);

  return (
    <main
      className="selected-works-index relative flex h-[100dvh] min-h-[100dvh] items-center justify-center overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-primary) 54%, var(--bg-secondary) 100%)',
      }}
    >
      <div className="flex w-full max-w-6xl flex-col items-center justify-center gap-10 text-center md:gap-12">
        <button
          type="button"
          aria-label="Open BāZì project"
          onClick={() => onNavigate('/selected-works/bazi')}
          className="group text-[var(--text-primary)] transition-colors duration-300 hover:text-[var(--accent-secondary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent-secondary)]"
        >
          <GlitchText
            text="BāZì"
            tag="span"
            wrapToWidth={false}
            scrambleOnMount={false}
            scrambleSignal={meshSignalA}
            scrambleStepMs={22}
            scrambleRevealStep={1.2}
            className="font-display text-[clamp(2rem,8vw,5rem)] font-black tracking-wide"
          />
        </button>

        <button
          type="button"
          aria-label="Open Latent 27 project"
          onClick={() => onNavigate('/selected-works/latent-27')}
          className="group text-[var(--text-primary)] transition-colors duration-300 hover:text-[var(--accent-secondary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent-secondary)]"
        >
          <GlitchText
            text="Latent 27"
            tag="span"
            wrapToWidth={false}
            scrambleOnMount={false}
            scrambleSignal={meshSignalB}
            scrambleStepMs={22}
            scrambleRevealStep={1.2}
            className="font-display text-[clamp(2rem,8vw,5rem)] font-black tracking-wide"
          />
        </button>

        <a
          href="https://www.fuzzchorus.org/"
          target="_blank"
          rel="noreferrer noopener"
          aria-label="Open FCMS project website"
          className="group text-[var(--text-primary)] transition-colors duration-300 hover:text-[var(--accent-secondary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent-secondary)]"
        >
          <GlitchText
            text="FCMS"
            tag="span"
            wrapToWidth={false}
            scrambleOnMount={false}
            scrambleSignal={meshSignalC}
            scrambleStepMs={22}
            scrambleRevealStep={1.2}
            className="font-display text-[clamp(2rem,8vw,5rem)] font-black tracking-wide"
          />
        </a>
      </div>
    </main>
  );
}

export function BaziSelectedWorkPage() {
  const [themeMode, setThemeMode] = useState<BaziDemoThemeMode>('dark');
  const [inputMode, setInputMode] = useState<InputMode>('birthProfile');
  const [baziButtonColorIndex, setBaziButtonColorIndex] = useState(0);
  const [picker, setPicker] = useState<DirectPickerState>(null);
  const [directEntry, setDirectEntry] = useState<DirectEntryState>(createEmptyDirectEntryState);
  const [directEntryBirthYear, setDirectEntryBirthYear] = useState('');
  const [clearPressed, setClearPressed] = useState(false);

  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthHour, setBirthHour] = useState('');
  const [birthMinute, setBirthMinute] = useState('');
  const [birthPeriod, setBirthPeriod] = useState('');
  const [cityQuery, setCityQuery] = useState('');

  const [transitIndex, setTransitIndex] = useState(55);
  const [almanacIndex, setAlmanacIndex] = useState(10);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [transitStepScrambleSignal, setTransitStepScrambleSignal] = useState(0);
  const [almanacStepScrambleSignal, setAlmanacStepScrambleSignal] = useState(0);
  const [networkCaptionGlitchSignal, setNetworkCaptionGlitchSignal] = useState(0);
  const [elementsCaptionGlitchSignal, setElementsCaptionGlitchSignal] = useState(0);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const activeSectionRef = useRef<string | null>(null);
  const sectionGlitchIntervalRef = useRef<number | null>(null);
  const sectionGlitchTargetsRef = useRef<SectionTextTarget[]>([]);

  useEffect(() => {
    const stored = Number.parseInt(window.localStorage.getItem(BAZI_HOME_COLOR_STORAGE_KEY) ?? '0', 10);
    setBaziButtonColorIndex(normalizeColorCycleIndex(Number.isFinite(stored) ? stored : 0));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(BAZI_HOME_COLOR_STORAGE_KEY, String(baziButtonColorIndex));
  }, [baziButtonColorIndex]);

  const stopSectionTextGlitch = useCallback((restoreOriginalText = false) => {
    if (sectionGlitchIntervalRef.current !== null) {
      window.clearInterval(sectionGlitchIntervalRef.current);
      sectionGlitchIntervalRef.current = null;
    }

    if (restoreOriginalText) {
      sectionGlitchTargetsRef.current.forEach((target) => {
        if (target.node.isConnected) {
          target.node.data = target.originalText;
        }
      });
    }

    sectionGlitchTargetsRef.current = [];
  }, []);

  const startSectionTextGlitch = useCallback((sectionElement: HTMLElement) => {
    stopSectionTextGlitch(true);

    const targets = collectSectionTextTargets(sectionElement);
    if (!targets.length) {
      return;
    }

    sectionGlitchTargetsRef.current = targets;

    let revealIndex = 0;
    const maxTextLength = Math.max(...targets.map((target) => target.originalText.length));

    sectionGlitchIntervalRef.current = window.setInterval(() => {
      targets.forEach((target) => {
        if (!target.node.isConnected) {
          return;
        }

        target.node.data = scrambleSectionText(target.originalText, revealIndex);
      });

      if (revealIndex >= maxTextLength) {
        stopSectionTextGlitch(true);
        return;
      }

      revealIndex += BAZI_SECTION_GLITCH_REVEAL_STEP;
    }, BAZI_SECTION_GLITCH_STEP_MS);
  }, [stopSectionTextGlitch]);

  const triggerTextGlitchBySelector = useCallback((selector: string) => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) {
      return;
    }

    const targetElement = scrollContainer.querySelector<HTMLElement>(selector);
    if (!targetElement) {
      return;
    }

    startSectionTextGlitch(targetElement);
  }, [startSectionTextGlitch]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) {
      return;
    }

    const sectionElements: HTMLElement[] = Array.from(scrollContainer.querySelectorAll('[data-bazi-section-id]'));
    if (!sectionElements.length) {
      return;
    }

    let frameId: number | null = null;

    const updateActiveSection = () => {
      const containerTop = scrollContainer.getBoundingClientRect().top;
      let nextSectionId: string | null = null;
      let nearestOffset = Number.POSITIVE_INFINITY;

      sectionElements.forEach((sectionElement) => {
        const sectionId = sectionElement.dataset.baziSectionId;
        if (!sectionId) {
          return;
        }

        const offset = Math.abs(sectionElement.getBoundingClientRect().top - containerTop);
        if (offset < nearestOffset) {
          nearestOffset = offset;
          nextSectionId = sectionId;
        }
      });

      if (!nextSectionId || nextSectionId === activeSectionRef.current) {
        return;
      }

      activeSectionRef.current = nextSectionId;
      setActiveSectionId(nextSectionId);
    };

    const scheduleActiveSectionUpdate = () => {
      if (frameId !== null) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        updateActiveSection();
      });
    };

    scheduleActiveSectionUpdate();
    scrollContainer.addEventListener('scroll', scheduleActiveSectionUpdate, { passive: true });
    window.addEventListener('resize', scheduleActiveSectionUpdate);

    return () => {
      scrollContainer.removeEventListener('scroll', scheduleActiveSectionUpdate);
      window.removeEventListener('resize', scheduleActiveSectionUpdate);

      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || !activeSectionId) {
      return;
    }

    const sectionElement = scrollContainer.querySelector<HTMLElement>(`[data-bazi-section-id="${activeSectionId}"]`);
    if (!sectionElement) {
      return;
    }

    startSectionTextGlitch(sectionElement);
  }, [activeSectionId, startSectionTextGlitch]);

  useEffect(() => {
    if (activeSectionId === 'network') {
      setNetworkCaptionGlitchSignal((currentSignal) => currentSignal + 1);
      return;
    }

    if (activeSectionId === 'elements') {
      setElementsCaptionGlitchSignal((currentSignal) => currentSignal + 1);
    }
  }, [activeSectionId]);

  useEffect(() => (
    () => {
      stopSectionTextGlitch(true);
    }
  ), [stopSectionTextGlitch]);

  useEffect(() => {
    if (transitStepScrambleSignal === 0) {
      return;
    }

    triggerTextGlitchBySelector('[data-bazi-update-glitch="transit-card"]');
  }, [transitStepScrambleSignal, triggerTextGlitchBySelector]);

  useEffect(() => {
    if (almanacStepScrambleSignal === 0) {
      return;
    }

    triggerTextGlitchBySelector('[data-bazi-update-glitch="almanac-card"]');
  }, [almanacStepScrambleSignal, triggerTextGlitchBySelector]);

  const baziButtonColor = BAZI_HOME_COLOR_SEQUENCE[baziButtonColorIndex] ?? BAZI_HOME_COLOR_SEQUENCE[0];
  const baziButtonTransitionClass = baziButtonColorIndex > 0 ? 'bazi-color-transition' : '';

  const setDirectCell = (slot: PillarSlot, kind: 'stem' | 'branch', index: number) => {
    setDirectEntry((current) => ({
      ...current,
      [slot]: {
        ...current[slot],
        [kind]: index,
      },
    }));
  };

  const clearDirectEntry = () => {
    setDirectEntry(createEmptyDirectEntryState());
    setDirectEntryBirthYear('');
  };

  const navigateToSelectedWorks = () => {
    if (window.location.pathname === '/selected-works') {
      return;
    }
    window.history.pushState({}, '', '/selected-works');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <main className={`bazi-demo bazi-page-shell relative h-[100dvh] min-h-[100dvh] overflow-hidden ${themeMode === 'dark' ? 'dark' : ''}`}>
      <div className="bazi-demo-grid pointer-events-none absolute inset-0" />

      <div className="bazi-fixed-chip bazi-fixed-left absolute z-30">
        <BaziPressableButton
          className="bazi-chip bazi-chip-small bazi-back-chip"
          onClick={navigateToSelectedWorks}
          ariaLabel="Back to Selected Works"
        >
          <ArrowLeft size={14} className="bazi-back-chip-icon" />
          <span>SW</span>
        </BaziPressableButton>
      </div>

      <div className="bazi-fixed-chip bazi-fixed-right absolute z-30">
        <BaziPressableButton
          className="bazi-chip bazi-chip-small bazi-theme-icon-chip"
          onClick={() => setThemeMode((currentMode) => (currentMode === 'light' ? 'dark' : 'light'))}
          ariaLabel="Toggle BaZi theme"
        >
          {themeMode === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </BaziPressableButton>
      </div>

      <div ref={scrollContainerRef} className="bazi-scroll-hidden relative h-full overflow-y-auto snap-y snap-mandatory">
        <section
          className="bazi-section bazi-section-shell bazi-section-s8 snap-start"
          style={SECTION_MIN_HEIGHT_STYLE}
          data-bazi-section-id="intro"
        >
          <div className="bazi-section-inner mx-auto flex w-full max-w-4xl flex-col items-center justify-center gap-8 pb-12 pt-6 text-center" style={SECTION_CONTENT_MIN_HEIGHT_STYLE}>
            <BaziPressableButton
              className={`bazi-home-button ${baziButtonTransitionClass}`}
              style={{
                backgroundColor: baziButtonColor.background,
                color: baziButtonColor.color,
              }}
              onClick={() => {
                setBaziButtonColorIndex((current) => normalizeColorCycleIndex(current + 1));
              }}
              ariaLabel="Bā Zì"
            >
              <span className="bazi-home-button-stack">
                <span className="bazi-home-button-line">Bā</span>
                <span className="bazi-home-button-line">Zì</span>
              </span>
            </BaziPressableButton>

            <p className="bazi-intro-text">
              <BaziIntroParagraph />
            </p>
          </div>
        </section>

        <section
          className="bazi-section bazi-section-shell bazi-input-section bazi-section-s2 snap-start"
          style={SECTION_MIN_HEIGHT_STYLE}
          data-bazi-section-id="input"
        >
          <div className="bazi-section-inner bazi-input-section-inner mx-auto grid w-full max-w-5xl items-start gap-4 pb-12 pt-2" style={SECTION_CONTENT_MIN_HEIGHT_STYLE}>
            <BaziInputSection
              inputMode={inputMode}
              setInputMode={setInputMode}
              birthYear={birthYear}
              setBirthYear={setBirthYear}
              birthMonth={birthMonth}
              setBirthMonth={setBirthMonth}
              birthDay={birthDay}
              setBirthDay={setBirthDay}
              birthHour={birthHour}
              setBirthHour={setBirthHour}
              birthMinute={birthMinute}
              setBirthMinute={setBirthMinute}
              birthPeriod={birthPeriod}
              setBirthPeriod={setBirthPeriod}
              cityQuery={cityQuery}
              setCityQuery={setCityQuery}
              directEntry={directEntry}
              directEntryBirthYear={directEntryBirthYear}
              setDirectEntryBirthYear={setDirectEntryBirthYear}
              clearDirectEntry={clearDirectEntry}
              clearPressed={clearPressed}
              setClearPressed={setClearPressed}
              onOpenPicker={(slot, kind) => setPicker({ slot, kind })}
            />

            <PillarPickerDialog
              picker={picker}
              onClose={() => setPicker(null)}
              onSelect={(index) => {
                if (!picker) return;
                setDirectCell(picker.slot, picker.kind, index);
                setPicker(null);
              }}
            />

            <BaziDemoDisclaimer />
          </div>
        </section>

        <section
          className="bazi-section bazi-section-shell bazi-section-s3 snap-start"
          style={SECTION_MIN_HEIGHT_STYLE}
          data-bazi-section-id="chart"
        >
          <div className="bazi-section-inner bazi-disclaimer-section mx-auto w-full max-w-5xl gap-4 pb-12 pt-4" style={SECTION_CONTENT_MIN_HEIGHT_STYLE}>
            <div className="bazi-disclaimer-main">
              <BaziChartSection />
            </div>
            <BaziDemoDisclaimer />
          </div>
        </section>

        <section
          className="bazi-section bazi-section-shell bazi-network-section bazi-section-s4 snap-start"
          style={SECTION_MIN_HEIGHT_STYLE}
          data-disable-custom-cursor="true"
          data-bazi-section-id="network"
        >
          <div
            className="bazi-section-inner bazi-disclaimer-section bazi-network-section-inner mx-auto w-full max-w-5xl gap-4 pb-12 pt-4"
            style={SECTION_CONTENT_MIN_HEIGHT_STYLE}
            data-disable-custom-cursor="true"
          >
            <div className="bazi-disclaimer-main">
              <InfluenceNetworkCard captionGlitchSignal={networkCaptionGlitchSignal} />
            </div>
            <BaziDemoDisclaimer />
          </div>
        </section>

        <section
          className="bazi-section bazi-section-shell bazi-section-s5 snap-start"
          style={SECTION_MIN_HEIGHT_STYLE}
          data-bazi-section-id="elements"
        >
          <div className="bazi-section-inner bazi-disclaimer-section mx-auto w-full max-w-5xl gap-4 pb-12 pt-4" style={SECTION_CONTENT_MIN_HEIGHT_STYLE}>
            <div className="bazi-disclaimer-main">
              <ElementsDistributionCard captionGlitchSignal={elementsCaptionGlitchSignal} />
            </div>
            <BaziDemoDisclaimer />
          </div>
        </section>

        <section
          className="bazi-section bazi-section-shell bazi-section-s6 snap-start"
          style={SECTION_MIN_HEIGHT_STYLE}
          data-bazi-section-id="transit"
        >
          <div className="bazi-section-inner bazi-disclaimer-section mx-auto w-full max-w-5xl gap-4 pb-12 pt-4" style={SECTION_CONTENT_MIN_HEIGHT_STYLE}>
            <div className="bazi-disclaimer-main">
              <AnnualTransitCard
                transitIndex={transitIndex}
                setTransitIndex={setTransitIndex}
                onStepNavigate={() => setTransitStepScrambleSignal((currentSignal) => currentSignal + 1)}
              />
            </div>
            <BaziDemoDisclaimer />
          </div>
        </section>

        <section
          className="bazi-section bazi-section-shell bazi-section-s7 snap-start"
          style={SECTION_MIN_HEIGHT_STYLE}
          data-bazi-section-id="almanac"
        >
          <div className="bazi-section-inner bazi-disclaimer-section mx-auto w-full max-w-5xl gap-4 pb-12 pt-4" style={SECTION_CONTENT_MIN_HEIGHT_STYLE}>
            <div className="bazi-disclaimer-main">
              <GeneralAlmanacCard
                index={almanacIndex}
                setIndex={(next) => setAlmanacIndex(clamp(next, ALMANAC_MIN_INDEX, ALMANAC_MAX_INDEX))}
                onStepNavigate={() => setAlmanacStepScrambleSignal((currentSignal) => currentSignal + 1)}
              />
            </div>
            <BaziDemoDisclaimer />
          </div>
        </section>

        <section
          className="bazi-section bazi-section-shell bazi-section-s8 snap-start"
          style={SECTION_MIN_HEIGHT_STYLE}
          data-bazi-section-id="outro"
        >
          <div className="bazi-section-inner mx-auto flex w-full max-w-4xl flex-col items-center justify-center text-center" style={SECTION_CONTENT_MIN_HEIGHT_STYLE}>
            <OccasionalGlitchText
              text="Available in app store soon."
              tag="p"
              className="bazi-store-text font-display font-black"
              scrambleStepMs={20}
              scrambleRevealStep={1.25}
              minDelayMs={3800}
              maxDelayMs={7600}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

export function LatentSelectedWorkPage() {
  const scrambleSignal = useOccasionalGlitchSignal(5200, 9800);
  const paragraphs = LATENT_27_BACKSTORY.split('\n\n');
  const navigateToSelectedWorks = () => {
    if (window.location.pathname === '/selected-works') {
      return;
    }

    window.history.pushState({}, '', '/selected-works');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <main
      className="relative h-[100dvh] min-h-[100dvh] overflow-y-auto px-4 py-20 md:px-8"
      style={{
        background: 'linear-gradient(145deg, var(--bg-primary) 0%, #1f1a15 65%, var(--bg-secondary) 100%)',
      }}
    >
      <div className="absolute left-3 z-20 md:left-8" style={{ top: 'calc(1rem + env(safe-area-inset-top, 0px))' }}>
        <button
          type="button"
          onClick={navigateToSelectedWorks}
          className="group flex items-center gap-4 text-lg font-bold text-[var(--text-primary)] transition-colors hover:text-[var(--accent-secondary)]"
          aria-label="Back to Selected Works"
        >
          <div className="flex h-12 w-12 items-center justify-center border border-[var(--border-strong)] bg-[var(--surface-tint)] transition-all group-hover:border-[var(--accent-primary)] group-hover:bg-[var(--accent-primary)] group-hover:text-[var(--text-primary)]">
            <ArrowLeft size={18} aria-hidden="true" />
          </div>
          <GlitchText
            text="SW"
            wrapToWidth={false}
            className="font-mono text-sm tracking-widest"
          />
        </button>
      </div>

      <div className="mx-auto w-full max-w-4xl text-center">
        <GlitchText
          text={LATENT_27_TITLE}
          tag="h1"
          wrapToWidth={false}
          scrambleOnMount={false}
          scrambleSignal={scrambleSignal}
          scrambleStepMs={22}
          scrambleRevealStep={1.2}
          className="mx-auto mb-8 font-display text-[clamp(1.8rem,6vw,3.5rem)] font-black tracking-tight text-[var(--text-primary)]"
        />

        <div className="space-y-6">
          {paragraphs.map((paragraph, index) => (
            <LatentParagraphWithSparseGlitch
              key={`latent-paragraph-${index}`}
              paragraph={paragraph}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

function LatentParagraphWithSparseGlitch({ paragraph }: { paragraph: string }) {
  const paragraphSignal = useOccasionalGlitchSignal(5400, 10_800);
  const tokens = useMemo(() => paragraph.split(/(\s+)/), [paragraph]);

  const glitchTokenIndices = useMemo(() => {
    const candidateIndices = tokens
      .map((token, index) => ({ token, index }))
      .filter(({ token }) => /\S/.test(token) && /[A-Za-z0-9]/.test(token))
      .map(({ index }) => index);

    if (!candidateIndices.length) {
      return new Set<number>();
    }

    const targetCount = Math.min(
      candidateIndices.length,
      Math.max(1, Math.floor(Math.random() * 3) + 1),
    );

    const selected = new Set<number>();
    while (selected.size < targetCount) {
      const randomIndex = Math.floor(Math.random() * candidateIndices.length);
      const tokenIndex = candidateIndices[randomIndex];
      if (tokenIndex !== undefined) {
        selected.add(tokenIndex);
      }
    }

    return selected;
  }, [tokens]);

  return (
    <p className="mx-auto max-w-3xl whitespace-pre-wrap text-center text-[clamp(0.96rem,2vw,1.1rem)] leading-relaxed text-[var(--text-secondary)]">
      {tokens.map((token, index) => {
        if (!glitchTokenIndices.has(index)) {
          return <React.Fragment key={`latent-token-${index}`}>{token}</React.Fragment>;
        }

        return (
          <GlitchText
            key={`latent-glitch-token-${index}`}
            text={token}
            tag="span"
            wrapToWidth={false}
            scrambleOnMount={false}
            scrambleSignal={paragraphSignal}
            scrambleStepMs={24}
            scrambleRevealStep={1.15}
            className="inline-block"
          />
        );
      })}
    </p>
  );
}
