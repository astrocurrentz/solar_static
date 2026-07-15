import {
  PROJECT_INQUIRY_DRAFT_KEY,
  PROJECT_INQUIRY_SCHEMA_VERSION,
  createEmptyInquiryState,
  type ExistingAsset,
  type InquiryFieldErrors,
  type OngoingNeed,
  type ProjectInquiryFormState,
  type ProjectInquiryPayloadV1,
  type ServiceGroup,
  type ServiceType,
} from '../data/project-inquiry-types';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const required = (value: string) => value.trim().length > 0;
const within = (value: string, max: number) => value.trim().length <= max;

export const getActiveServiceGroups = (
  services: ServiceType[],
): ServiceGroup[] => {
  const groups = new Set<ServiceGroup>();

  services.forEach((service) => {
    if (service === 'brand') groups.add('brand');
    if (service.startsWith('website_')) groups.add('website');
    if (service === 'product_design' || service === 'mobile_mvp') {
      groups.add('product');
    }
    if (service === 'editorial') groups.add('editorial');
    if (service === 'not_sure') groups.add('not_sure');
  });

  return [...groups];
};

export const toggleExclusiveOption = <T extends string>(
  current: T[],
  value: T,
  exclusive: T,
) => {
  if (value === exclusive) {
    return current.includes(exclusive) ? [] : [exclusive];
  }

  const withoutExclusive = current.filter((item) => item !== exclusive);
  return withoutExclusive.includes(value)
    ? withoutExclusive.filter((item) => item !== value)
    : [...withoutExclusive, value];
};

const validateLengths = (
  state: ProjectInquiryFormState,
  errors: InquiryFieldErrors,
) => {
  const limits: Array<[keyof ProjectInquiryFormState, number]> = [
    ['name', 120],
    ['organizationOrProject', 160],
    ['email', 254],
    ['finalApprover', 200],
    ['idea', 4000],
    ['whyNow', 2000],
    ['desiredOutcome', 3000],
    ['audience', 2000],
    ['requiredDeliverables', 3000],
    ['assetNotes', 2000],
    ['visualDirection', 3000],
    ['contentNotes', 2000],
    ['deadlineConstraint', 1500],
    ['approvalProcess', 2000],
    ['successCriteria', 2500],
    ['additionalNotes', 3000],
  ];

  limits.forEach(([field, max]) => {
    const value = state[field];
    if (typeof value === 'string' && !within(value, max)) {
      errors[field] =
        `Keep this answer under ${max.toLocaleString()} characters.`;
    }
  });
};

export const validateInquiryStep = (
  state: ProjectInquiryFormState,
  step: number,
): InquiryFieldErrors => {
  const errors: InquiryFieldErrors = {};

  if (step === 0) {
    if (!required(state.name)) errors.name = 'Enter your name.';
    if (!required(state.organizationOrProject)) {
      errors.organizationOrProject = 'Enter the organization or project name.';
    }
    if (!required(state.email)) errors.email = 'Enter your email address.';
    else if (!emailPattern.test(state.email.trim())) {
      errors.email = 'Enter a valid email address.';
    }
    if (!state.decisionRole) errors.decisionRole = 'Select your decision role.';
    if (state.decisionRole !== 'final' && !required(state.finalApprover)) {
      errors.finalApprover = 'Tell us who gives final approval.';
    }
  }

  if (step === 1) {
    if (!required(state.idea)) errors.idea = 'Describe the idea or project.';
    if (!required(state.desiredOutcome)) {
      errors.desiredOutcome = 'Describe the outcome you want.';
    }
    if (!required(state.audience)) {
      errors.audience = 'Describe the primary audience or user.';
    }
  }

  if (step === 2) {
    if (state.services.length === 0) {
      errors.services = 'Select at least one area of support.';
    }
    if (state.existingAssets.length === 0) {
      errors.existingAssets = 'Select what already exists.';
    }
    if (!state.contentResponsibility) {
      errors.contentResponsibility = 'Select who will provide final content.';
    }
    state.references.forEach((reference, index) => {
      if (!required(reference.url)) {
        errors[`reference-${index}-url`] = 'Enter a URL or remove this row.';
        return;
      }
      try {
        const url = new URL(reference.url);
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
      } catch {
        errors[`reference-${index}-url`] = 'Enter a valid http or https URL.';
      }
      if (!within(reference.note, 500)) {
        errors[`reference-${index}-note`] =
          'Keep this note under 500 characters.';
      }
    });
  }

  if (step === 3) {
    if (state.deadlineFixed === null) {
      errors.deadlineFixed = 'Tell us whether the deadline is fixed.';
    }
    if (state.deadlineFixed && !required(state.deadlineConstraint)) {
      errors.deadlineConstraint = 'Explain what creates the fixed deadline.';
    }
    if (!state.budgetBand) errors.budgetBand = 'Select an investment range.';
    if (!required(state.approvalProcess)) {
      errors.approvalProcess = 'Describe who reviews and approves the work.';
    }
  }

  if (step === 4) {
    if (!required(state.successCriteria)) {
      errors.successCriteria = 'Tell us how success will be judged.';
    }
    if (state.ongoingNeeds.length === 0) {
      errors.ongoingNeeds = 'Select the ongoing support you expect.';
    }
  }

  validateLengths(state, errors);
  return errors;
};

export const validateEntireInquiry = (
  state: ProjectInquiryFormState,
): InquiryFieldErrors => {
  const errors = Object.assign(
    {},
    ...Array.from({ length: 5 }, (_, step) => validateInquiryStep(state, step)),
  ) as InquiryFieldErrors;

  if (!state.consent)
    errors.consent = 'Confirm that we may review your inquiry.';
  if (!uuidPattern.test(state.idempotencyKey)) {
    errors.idempotencyKey = 'Refresh the page and try again.';
  }
  if (!state.startedAt || Number.isNaN(Date.parse(state.startedAt))) {
    errors.startedAt = 'Refresh the page and try again.';
  }

  return errors;
};

const optional = (value: string) => {
  const trimmed = value.trim();
  return trimmed || undefined;
};

export const buildInquiryPayload = (
  state: ProjectInquiryFormState,
): ProjectInquiryPayloadV1 => {
  const activeGroups = getActiveServiceGroups(state.services);
  const serviceDetails = Object.fromEntries(
    activeGroups
      .map((group) => [group, optional(state.serviceDetails[group])])
      .filter((entry): entry is [ServiceGroup, string] => Boolean(entry[1])),
  );

  return {
    schemaVersion: PROJECT_INQUIRY_SCHEMA_VERSION,
    idempotencyKey: state.idempotencyKey,
    contact: {
      name: state.name.trim(),
      organizationOrProject: state.organizationOrProject.trim(),
      email: state.email.trim(),
      decisionRole: state.decisionRole as NonNullable<
        ProjectInquiryPayloadV1['contact']['decisionRole']
      >,
      finalApprover: optional(state.finalApprover),
    },
    project: {
      idea: state.idea.trim(),
      whyNow: optional(state.whyNow),
      desiredOutcome: state.desiredOutcome.trim(),
      audience: state.audience.trim(),
    },
    scope: {
      services: state.services,
      serviceDetails,
      requiredDeliverables: optional(state.requiredDeliverables),
      existingAssets: state.existingAssets,
      assetNotes: optional(state.assetNotes),
      references: state.references.map(({ url, note }) => ({
        url: url.trim(),
        note: optional(note),
      })),
      visualDirection: optional(state.visualDirection),
      contentResponsibility:
        state.contentResponsibility as ProjectInquiryPayloadV1['scope']['contentResponsibility'],
      contentNotes: optional(state.contentNotes),
    },
    logistics: {
      preferredStart: optional(state.preferredStart),
      targetLaunch: optional(state.targetLaunch),
      deadlineFixed: Boolean(state.deadlineFixed),
      deadlineConstraint: optional(state.deadlineConstraint),
      budgetBand:
        state.budgetBand as ProjectInquiryPayloadV1['logistics']['budgetBand'],
      approvalProcess: state.approvalProcess.trim(),
    },
    value: {
      successCriteria: state.successCriteria.trim(),
      ongoingNeeds: state.ongoingNeeds,
      additionalNotes: optional(state.additionalNotes),
    },
    consent: true,
    startedAt: state.startedAt,
  };
};

export type ProjectInquiryDraft = {
  state: ProjectInquiryFormState;
  currentStep: number;
  reviewing: boolean;
};

export const hasMeaningfulInquiryDraft = (state: ProjectInquiryFormState) =>
  [
    state.name,
    state.organizationOrProject,
    state.email,
    state.idea,
    state.desiredOutcome,
    state.audience,
    state.approvalProcess,
    state.successCriteria,
  ].some((value) => value.trim().length > 0) ||
  state.services.length > 0 ||
  state.existingAssets.length > 0 ||
  state.ongoingNeeds.length > 0;

export const restoreInquiryDraft = (
  raw: string | null,
): ProjectInquiryDraft | null => {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as {
      state?: unknown;
      currentStep?: number;
      reviewing?: boolean;
    };
    const savedState = (
      parsed.state && typeof parsed.state === 'object' ? parsed.state : parsed
    ) as Partial<ProjectInquiryFormState>;
    if (savedState.schemaVersion !== PROJECT_INQUIRY_SCHEMA_VERSION) {
      return null;
    }
    const empty = createEmptyInquiryState();
    const state: ProjectInquiryFormState = {
      ...empty,
      ...savedState,
      schemaVersion: PROJECT_INQUIRY_SCHEMA_VERSION,
      serviceDetails: {
        ...empty.serviceDetails,
        ...savedState.serviceDetails,
      },
      references: Array.isArray(savedState.references)
        ? savedState.references
        : [],
      services: Array.isArray(savedState.services) ? savedState.services : [],
      existingAssets: Array.isArray(savedState.existingAssets)
        ? (savedState.existingAssets as ExistingAsset[])
        : [],
      ongoingNeeds: Array.isArray(savedState.ongoingNeeds)
        ? (savedState.ongoingNeeds as OngoingNeed[])
        : [],
      consent: false,
    };
    const currentStep = Number.isInteger(parsed.currentStep)
      ? Math.min(4, Math.max(0, parsed.currentStep ?? 0))
      : 0;

    return {
      state,
      currentStep,
      reviewing: Boolean(parsed.reviewing),
    };
  } catch {
    return null;
  }
};

export const saveInquiryDraft = (
  state: ProjectInquiryFormState,
  currentStep: number,
  reviewing: boolean,
) => {
  localStorage.setItem(
    PROJECT_INQUIRY_DRAFT_KEY,
    JSON.stringify({
      schemaVersion: PROJECT_INQUIRY_SCHEMA_VERSION,
      state: { ...state, consent: false },
      currentStep,
      reviewing,
    }),
  );
};

export const clearInquiryDraft = () => {
  localStorage.removeItem(PROJECT_INQUIRY_DRAFT_KEY);
};
