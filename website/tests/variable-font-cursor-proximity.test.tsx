// @vitest-environment jsdom

import { cleanup, render } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import VariableFontCursorProximity from '../src/components/fancy/text/variable-font-cursor-proximity';

interface TestSubjectProps {
  reserveLayout?: boolean;
}

const TestSubject = ({ reserveLayout }: TestSubjectProps) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  return (
    <VariableFontCursorProximity
      as="span"
      containerRef={containerRef}
      fromFontVariationSettings="'wght' 400"
      ref={containerRef}
      reserveLayout={reserveLayout}
      toFontVariationSettings="'wght' 650"
    >
      Stable text
    </VariableFontCursorProximity>
  );
};

afterEach(cleanup);

describe('VariableFontCursorProximity layout reservation', () => {
  it('reserves target-weight metrics for every animated glyph', () => {
    const { container } = render(<TestSubject reserveLayout />);
    const letters = container.querySelectorAll('.motion-letter');
    const slots = container.querySelectorAll('.motion-letter-slot');
    const reserves = container.querySelectorAll('.motion-letter-reserve');

    expect(slots).toHaveLength(letters.length);
    expect(reserves).toHaveLength(letters.length);

    reserves.forEach((reserve) => {
      expect(reserve).toHaveAttribute('aria-hidden', 'true');
      expect(reserve).toHaveStyle({ fontVariationSettings: "'wght' 650" });
    });
  });

  it('keeps one accessible phrase while visual glyphs stay hidden', () => {
    const { container } = render(<TestSubject reserveLayout />);
    const accessiblePhrase = container.querySelector('.motion-sr-only');

    expect(accessiblePhrase).toHaveTextContent('Stable text');
    expect(container.querySelectorAll('.motion-sr-only')).toHaveLength(1);
    expect(
      container.querySelectorAll('.motion-word[aria-hidden="true"]'),
    ).not.toHaveLength(0);
  });

  it('does not add metric slots unless layout reservation is enabled', () => {
    const { container } = render(<TestSubject />);

    expect(container.querySelectorAll('.motion-letter')).not.toHaveLength(0);
    expect(container.querySelectorAll('.motion-letter-slot')).toHaveLength(0);
    expect(container.querySelectorAll('.motion-letter-reserve')).toHaveLength(
      0,
    );
  });
});
