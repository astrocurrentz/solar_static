import { BAZI_SECTION_GLITCH_CHARS } from './constants';
import { clamp } from '../shared';

export type SectionTextTarget = {
  node: Text;
  originalText: string;
};

export type ButtonIconTarget = {
  node: SVGSVGElement;
  originalTransform: string;
  originalOpacity: string;
  originalFilter: string;
  originalClipPath: string;
};

export const collectSectionTextTargets = (sectionElement: HTMLElement): SectionTextTarget[] => {
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

export const scrambleSectionText = (sourceText: string, revealIndex: number) => (
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

export const collectButtonIconTargets = (buttonElement: HTMLElement): ButtonIconTarget[] => (
  Array.from(buttonElement.querySelectorAll<SVGSVGElement>('svg')).map((iconNode) => ({
    node: iconNode,
    originalTransform: iconNode.style.transform,
    originalOpacity: iconNode.style.opacity,
    originalFilter: iconNode.style.filter,
    originalClipPath: iconNode.style.clipPath,
  }))
);

export const applyButtonIconGlitchFrame = (targets: ButtonIconTarget[], intensity: number) => {
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
