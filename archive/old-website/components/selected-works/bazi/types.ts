import type { PillarSlot } from '../../selectedWorksData';

export type InputMode = 'birthProfile' | 'directBaZi';
export type DirectPickerState = { slot: PillarSlot; kind: 'stem' | 'branch' } | null;
export type ElementKey = 'wood' | 'fire' | 'earth' | 'metal' | 'water';
export const ELEMENT_ORDER: ElementKey[] = ['wood', 'fire', 'earth', 'metal', 'water'];

export interface NetworkNode {
  id: string;
  zh: string;
  en: string;
  weight: number;
  isDayMaster: boolean;
}

export interface NetworkEdge {
  id: string;
  from: string;
  to: string;
  strength: number;
  targetDistance: number;
  isCoreLink: boolean;
}

export interface Point {
  x: number;
  y: number;
}

export interface Velocity {
  dx: number;
  dy: number;
}
