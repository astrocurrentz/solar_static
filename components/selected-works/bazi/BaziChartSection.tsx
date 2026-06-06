import { BAZI_SAMPLE_PILLARS } from '../../selectedWorksData';
import { GlyphSquare } from './BaziControls';

export function BaziChartSection() {
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
