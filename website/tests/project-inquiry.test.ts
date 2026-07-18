import { describe, expect, it } from 'vitest';

import {
  createEmptyInquiryState,
  PROJECT_INQUIRY_SCHEMA_VERSION,
} from '../src/data/project-inquiry-types';
import {
  buildInquiryPayload,
  formatSelectedOptionSummary,
  getActiveServiceGroups,
  restoreInquiryDraft,
  toggleExclusiveOption,
  toggleOption,
  validateInquiryStep,
} from '../src/lib/project-inquiry';
import {
  deadlineConstraintOptions,
  successOutcomeOptions,
} from '../src/data/project-inquiry-copy';

describe('project inquiry model', () => {
  it('deduplicates service groups for related service selections', () => {
    expect(
      getActiveServiceGroups([
        'website_strategy',
        'website_design',
        'mobile_mvp',
      ]),
    ).toEqual(['website', 'product']);
  });

  it('keeps exclusive options mutually exclusive', () => {
    expect(toggleExclusiveOption(['brand'], 'not_sure', 'not_sure')).toEqual([
      'not_sure',
    ]);
    expect(toggleExclusiveOption(['not_sure'], 'brand', 'not_sure')).toEqual([
      'brand',
    ]);
  });

  it('toggles non-exclusive structured options independently', () => {
    expect(toggleOption(['brand'], 'website')).toEqual(['brand', 'website']);
    expect(toggleOption(['brand', 'website'], 'brand')).toEqual(['website']);
  });

  it('requires structured deadline reasons and custom deadline text', () => {
    const fixedDeadline = {
      ...createEmptyInquiryState(),
      deadlineFixed: true,
    };

    expect(
      validateInquiryStep(fixedDeadline, 3).deadlineConstraintReasons,
    ).toBeTruthy();
    expect(
      validateInquiryStep(
        {
          ...fixedDeadline,
          deadlineConstraintReasons: ['launch_event'],
        },
        3,
      ).deadlineConstraint,
    ).toBeUndefined();
    expect(
      validateInquiryStep(
        { ...fixedDeadline, deadlineConstraintReasons: ['other'] },
        3,
      ).deadlineConstraint,
    ).toBeTruthy();
    expect(
      validateInquiryStep(
        {
          ...fixedDeadline,
          deadlineConstraintReasons: ['other'],
          deadlineConstraint: 'x'.repeat(501),
        },
        3,
      ).deadlineConstraint,
    ).toContain('500');
  });

  it('requires success details only for the custom success outcome', () => {
    const state = createEmptyInquiryState();

    expect(validateInquiryStep(state, 4).successOutcomes).toBeTruthy();
    expect(
      validateInquiryStep({ ...state, successOutcomes: ['brand'] }, 4)
        .successCriteria,
    ).toBeUndefined();
    expect(
      validateInquiryStep({ ...state, successOutcomes: ['other'] }, 4)
        .successCriteria,
    ).toBeTruthy();
    expect(
      validateInquiryStep(
        {
          ...state,
          successOutcomes: ['brand'],
          successCriteria: 'x'.repeat(1001),
        },
        4,
      ).successCriteria,
    ).toContain('1,000');
  });

  it('formats selected options in display order with readable details', () => {
    expect(
      formatSelectedOptionSummary({
        options: successOutcomeOptions,
        selected: ['website', 'brand', 'other'],
        customValue: 'other',
        details: 'Increase qualified inquiries by 20%.',
        detailLabel: 'Details',
      }),
    ).toBe(
      'Brand — stronger recognition, trust, or consistency; Website — clearer communication and more of the right inquiries, sign-ups, or sales; Details: Increase qualified inquiries by 20%.',
    );
  });

  it('serializes structured deadline and success answers into V1 fields', () => {
    const state = {
      ...createEmptyInquiryState(),
      deadlineFixed: true,
      deadlineConstraintReasons: ['business_kpi', 'other'] as const,
      deadlineConstraint: 'The annual KPI review is in September.',
      successOutcomes: ['brand', 'operations'] as const,
      successCriteria: 'The team can publish without developer support.',
    };
    const payload = buildInquiryPayload({
      ...state,
      deadlineConstraintReasons: [...state.deadlineConstraintReasons],
      successOutcomes: [...state.successOutcomes],
    });

    expect(payload.logistics.deadlineConstraint).toBe(
      'Business milestone or KPI; Something else: The annual KPI review is in September.',
    );
    expect(payload.value.successCriteria).toBe(
      'Brand — stronger recognition, trust, or consistency; Operations — easier management, publishing, maintenance, or future extension; Details: The team can publish without developer support.',
    );
  });

  it('requires the final approver only when the submitter is not final', () => {
    const state = {
      ...createEmptyInquiryState(),
      name: 'Avery',
      organizationOrProject: 'North Star',
      email: 'avery@example.com',
      decisionRole: 'shared' as const,
    };

    expect(validateInquiryStep(state, 0).finalApprover).toBeTruthy();
    expect(
      validateInquiryStep({ ...state, decisionRole: 'final' }, 0).finalApprover,
    ).toBeUndefined();
  });

  it('rejects drafts from a different schema version', () => {
    expect(
      restoreInquiryDraft(
        JSON.stringify({ schemaVersion: PROJECT_INQUIRY_SCHEMA_VERSION + 1 }),
      ),
    ).toBeNull();
  });

  it('restores a current draft without restoring consent', () => {
    const state = {
      ...createEmptyInquiryState(),
      name: 'Avery',
      consent: true,
    };
    const restored = restoreInquiryDraft(JSON.stringify(state));

    expect(restored?.state.name).toBe('Avery');
    expect(restored?.state.consent).toBe(false);
  });

  it('migrates legacy free-text answers into custom structured options', () => {
    const restored = restoreInquiryDraft(
      JSON.stringify({
        ...createEmptyInquiryState(),
        deadlineFixed: true,
        deadlineConstraintReasons: undefined,
        deadlineConstraint: 'A partner launch date.',
        successOutcomes: undefined,
        successCriteria: 'Reach 1,000 sign-ups.',
      }),
    );

    expect(restored?.state.deadlineConstraintReasons).toEqual(['other']);
    expect(restored?.state.deadlineConstraint).toBe('A partner launch date.');
    expect(restored?.state.successOutcomes).toEqual(['other']);
    expect(restored?.state.successCriteria).toBe('Reach 1,000 sign-ups.');
  });

  it('sanitizes structured values restored from local storage', () => {
    const restored = restoreInquiryDraft(
      JSON.stringify({
        ...createEmptyInquiryState(),
        deadlineConstraintReasons: ['launch_event', 'invalid'],
        successOutcomes: ['brand', 'invalid'],
      }),
    );

    expect(restored?.state.deadlineConstraintReasons).toEqual([
      deadlineConstraintOptions[0]?.value,
    ]);
    expect(restored?.state.successOutcomes).toEqual([
      successOutcomeOptions[0]?.value,
    ]);
  });
});
