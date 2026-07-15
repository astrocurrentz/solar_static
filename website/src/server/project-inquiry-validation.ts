import {
  budgetBands,
  contentResponsibilities,
  decisionRoles,
  existingAssets,
  ongoingNeeds,
  PROJECT_INQUIRY_SCHEMA_VERSION,
  serviceGroups,
  serviceTypes,
  type InquiryFieldErrors,
  type ProjectInquiryPayloadV1,
  type ProjectInquiryTransport,
} from '../data/project-inquiry-types';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const isText = (value: unknown, max: number, allowEmpty = false) =>
  typeof value === 'string' &&
  (allowEmpty || value.trim().length > 0) &&
  value.trim().length <= max;
const isOptionalText = (value: unknown, max: number) =>
  value === undefined || isText(value, max);
const isEnum = <T extends string>(value: unknown, values: readonly T[]) =>
  typeof value === 'string' && values.includes(value as T);
const isEnumArray = <T extends string>(
  value: unknown,
  values: readonly T[],
  { exclusive }: { exclusive?: T } = {},
) => {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.length > values.length
  ) {
    return false;
  }
  const unique = new Set(value);
  if (unique.size !== value.length) return false;
  if (![...unique].every((item) => isEnum(item, values))) return false;
  return !exclusive || !unique.has(exclusive) || unique.size === 1;
};

export type TransportValidationResult =
  | { ok: true; payload: ProjectInquiryPayloadV1; suspicious: boolean }
  | { ok: false; errors: InquiryFieldErrors };

export const validateProjectInquiryTransport = (
  input: unknown,
  now = Date.now(),
): TransportValidationResult => {
  const errors: InquiryFieldErrors = {};
  if (!isRecord(input))
    return { ok: false, errors: { form: 'Invalid payload.' } };

  const contact = isRecord(input.contact) ? input.contact : {};
  const project = isRecord(input.project) ? input.project : {};
  const scope = isRecord(input.scope) ? input.scope : {};
  const logistics = isRecord(input.logistics) ? input.logistics : {};
  const value = isRecord(input.value) ? input.value : {};

  if (input.schemaVersion !== PROJECT_INQUIRY_SCHEMA_VERSION) {
    errors.schemaVersion = 'Unsupported form version.';
  }
  if (!uuidPattern.test(String(input.idempotencyKey ?? ''))) {
    errors.idempotencyKey = 'Invalid idempotency key.';
  }
  if (!isText(contact.name, 120)) errors.name = 'Invalid name.';
  if (!isText(contact.organizationOrProject, 160)) {
    errors.organizationOrProject = 'Invalid organization or project.';
  }
  if (
    !isText(contact.email, 254) ||
    !emailPattern.test(String(contact.email))
  ) {
    errors.email = 'Invalid email.';
  }
  if (!isEnum(contact.decisionRole, decisionRoles)) {
    errors.decisionRole = 'Invalid decision role.';
  }
  if (contact.decisionRole !== 'final' && !isText(contact.finalApprover, 200)) {
    errors.finalApprover = 'Final approver is required.';
  } else if (!isOptionalText(contact.finalApprover, 200)) {
    errors.finalApprover = 'Invalid final approver.';
  }

  if (!isText(project.idea, 4000)) errors.idea = 'Invalid project description.';
  if (!isOptionalText(project.whyNow, 2000))
    errors.whyNow = 'Invalid timing context.';
  if (!isText(project.desiredOutcome, 3000)) {
    errors.desiredOutcome = 'Invalid desired outcome.';
  }
  if (!isText(project.audience, 2000)) errors.audience = 'Invalid audience.';

  if (!isEnumArray(scope.services, serviceTypes, { exclusive: 'not_sure' })) {
    errors.services = 'Invalid service selection.';
  }
  if (!isRecord(scope.serviceDetails)) {
    errors.serviceDetails = 'Invalid service details.';
  } else {
    Object.entries(scope.serviceDetails).forEach(([key, detail]) => {
      if (
        !serviceGroups.includes(key as (typeof serviceGroups)[number]) ||
        !isText(detail, 2000)
      ) {
        errors.serviceDetails = 'Invalid service details.';
      }
    });
  }
  if (!isOptionalText(scope.requiredDeliverables, 3000)) {
    errors.requiredDeliverables = 'Invalid deliverables.';
  }
  if (
    !isEnumArray(scope.existingAssets, existingAssets, { exclusive: 'nothing' })
  ) {
    errors.existingAssets = 'Invalid existing assets.';
  }
  if (!isOptionalText(scope.assetNotes, 2000))
    errors.assetNotes = 'Invalid asset notes.';
  if (!Array.isArray(scope.references) || scope.references.length > 10) {
    errors.references = 'Invalid references.';
  } else {
    scope.references.forEach((reference, index) => {
      if (!isRecord(reference) || !isText(reference.url, 2000)) {
        errors[`reference-${index}-url`] = 'Invalid reference URL.';
        return;
      }
      try {
        const url = new URL(String(reference.url));
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
      } catch {
        errors[`reference-${index}-url`] = 'Invalid reference URL.';
      }
      if (!isOptionalText(reference.note, 500)) {
        errors[`reference-${index}-note`] = 'Invalid reference note.';
      }
    });
  }
  if (!isOptionalText(scope.visualDirection, 3000)) {
    errors.visualDirection = 'Invalid visual direction.';
  }
  if (!isEnum(scope.contentResponsibility, contentResponsibilities)) {
    errors.contentResponsibility = 'Invalid content responsibility.';
  }
  if (!isOptionalText(scope.contentNotes, 2000)) {
    errors.contentNotes = 'Invalid content notes.';
  }

  if (!isOptionalText(logistics.preferredStart, 30)) {
    errors.preferredStart = 'Invalid preferred start.';
  }
  if (!isOptionalText(logistics.targetLaunch, 30)) {
    errors.targetLaunch = 'Invalid target launch.';
  }
  if (typeof logistics.deadlineFixed !== 'boolean') {
    errors.deadlineFixed = 'Invalid deadline selection.';
  }
  if (logistics.deadlineFixed && !isText(logistics.deadlineConstraint, 1500)) {
    errors.deadlineConstraint = 'Deadline constraint is required.';
  } else if (!isOptionalText(logistics.deadlineConstraint, 1500)) {
    errors.deadlineConstraint = 'Invalid deadline constraint.';
  }
  if (!isEnum(logistics.budgetBand, budgetBands)) {
    errors.budgetBand = 'Invalid budget band.';
  }
  if (!isText(logistics.approvalProcess, 2000)) {
    errors.approvalProcess = 'Invalid approval process.';
  }

  if (!isText(value.successCriteria, 2500)) {
    errors.successCriteria = 'Invalid success criteria.';
  }
  if (!isEnumArray(value.ongoingNeeds, ongoingNeeds, { exclusive: 'none' })) {
    errors.ongoingNeeds = 'Invalid ongoing needs.';
  }
  if (!isOptionalText(value.additionalNotes, 3000)) {
    errors.additionalNotes = 'Invalid additional notes.';
  }
  if (input.consent !== true) errors.consent = 'Consent is required.';

  const startedAt = Date.parse(String(input.startedAt ?? ''));
  if (Number.isNaN(startedAt) || startedAt > now + 60_000) {
    errors.startedAt = 'Invalid form start time.';
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const transport = input as unknown as ProjectInquiryTransport;
  const payload = { ...transport };
  delete payload.website;
  return {
    ok: true,
    payload,
    suspicious: Boolean(transport.website?.trim()) || now - startedAt < 3_000,
  };
};
