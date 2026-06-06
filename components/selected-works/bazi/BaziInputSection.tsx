import React, { useCallback } from 'react';
import {
  BRANCH_OPTIONS,
  ELEMENT_COLORS,
  PILLAR_SLOTS,
  STEM_OPTIONS,
  type DirectEntryState,
  type PillarSlot,
} from '../../selectedWorksData';
import { SLOT_LABELS } from './constants';
import type { DirectPickerState, InputMode } from './types';
import { BaziPressableButton, GanzhiButtonLabel, GlyphSquare, NativeSelect } from './BaziControls';

export function PillarPickerDialog({
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

export function BaziInputSection({
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
