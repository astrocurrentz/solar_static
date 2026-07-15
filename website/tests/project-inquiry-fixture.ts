import {
  PROJECT_INQUIRY_SCHEMA_VERSION,
  type ProjectInquiryPayloadV1,
} from '../src/data/project-inquiry-types';

export const createValidPayload = (
  now = Date.now(),
): ProjectInquiryPayloadV1 => ({
  schemaVersion: PROJECT_INQUIRY_SCHEMA_VERSION,
  idempotencyKey: '2f0ad98a-4508-4b9e-80cf-908a16c7283a',
  contact: {
    name: 'Avery Signal',
    organizationOrProject: 'North Star',
    email: 'avery@example.com',
    decisionRole: 'final',
  },
  project: {
    idea: 'A new digital service for independent publishers.',
    desiredOutcome: 'A clear brand and a launch-ready website.',
    audience: 'Independent publishers in Canada.',
  },
  scope: {
    services: ['brand', 'website_design'],
    serviceDetails: {
      brand: 'The identity should feel trusted and forward-looking.',
      website: 'A concise marketing site with a clear inquiry path.',
    },
    existingAssets: ['name_brand'],
    references: [{ url: 'https://example.com', note: 'Clear hierarchy.' }],
    contentResponsibility: 'shared',
  },
  logistics: {
    deadlineFixed: false,
    budgetBand: '5k_8k',
    approvalProcess: 'Avery provides final approval.',
  },
  value: {
    successCriteria: 'Qualified leads understand the offer and get in touch.',
    ongoingNeeds: ['none'],
  },
  consent: true,
  startedAt: new Date(now - 10_000).toISOString(),
});
