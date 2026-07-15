import { describe, expect, it } from 'vitest';

import {
  createEmptyInquiryState,
  PROJECT_INQUIRY_SCHEMA_VERSION,
} from '../src/data/project-inquiry-types';
import {
  getActiveServiceGroups,
  restoreInquiryDraft,
  toggleExclusiveOption,
  validateInquiryStep,
} from '../src/lib/project-inquiry';

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
});
