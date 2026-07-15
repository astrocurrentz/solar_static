import {
  budgetLabelByValue,
  projectInquiryCopy,
  serviceLabelByValue,
} from '../data/project-inquiry-copy';
import type { ProjectInquiryPayloadV1 } from '../data/project-inquiry-types';
import { validateProjectInquiryTransport } from './project-inquiry-validation';

export type ProjectInquiryEnvironment = {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  RESEND_API_KEY?: string;
  PROJECT_INQUIRY_FROM_EMAIL?: string;
  PROJECT_INQUIRY_TO_EMAIL?: string;
};

type HandlerDependencies = {
  input: unknown;
  env: ProjectInquiryEnvironment;
  fetchImpl?: typeof fetch;
  now?: number;
  createReferenceCode?: () => string;
};

export type ProjectInquiryHandlerResult = {
  statusCode: number;
  body:
    | { ok: true; referenceCode: string }
    | { ok: false; error: string; fieldErrors?: Record<string, string> };
};

type StoredInquiry = {
  reference_code: string;
  email_status: 'pending' | 'sent' | 'failed';
};

const createReferenceCode = () =>
  `SSS-${globalThis.crypto.randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase()}`;

const supabaseHeaders = (env: Required<ProjectInquiryEnvironment>) => ({
  apikey: env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
  'Content-Profile': 'public',
  'Accept-Profile': 'public',
});

const getExistingInquiry = async (
  idempotencyKey: string,
  env: Required<ProjectInquiryEnvironment>,
  fetchImpl: typeof fetch,
) => {
  const query = new URLSearchParams({
    idempotency_key: `eq.${idempotencyKey}`,
    select: 'reference_code,email_status',
    limit: '1',
  });
  const response = await fetchImpl(
    `${env.SUPABASE_URL}/rest/v1/project_inquiries?${query}`,
    { headers: supabaseHeaders(env) },
  );

  if (!response.ok)
    throw new Error(`Supabase lookup failed (${response.status})`);
  const records = (await response.json()) as StoredInquiry[];
  return records[0] ?? null;
};

const insertInquiry = async (
  payload: ProjectInquiryPayloadV1,
  referenceCode: string,
  env: Required<ProjectInquiryEnvironment>,
  fetchImpl: typeof fetch,
) => {
  const response = await fetchImpl(
    `${env.SUPABASE_URL}/rest/v1/project_inquiries`,
    {
      method: 'POST',
      headers: {
        ...supabaseHeaders(env),
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        idempotency_key: payload.idempotencyKey,
        reference_code: referenceCode,
        name: payload.contact.name,
        email: payload.contact.email,
        organization_project: payload.contact.organizationOrProject,
        decision_role: payload.contact.decisionRole,
        budget_band: payload.logistics.budgetBand,
        services: payload.scope.services,
        answers: payload,
        consent_at: new Date().toISOString(),
        email_status: 'pending',
      }),
    },
  );

  return response;
};

const updateEmailStatus = async (
  idempotencyKey: string,
  status: 'sent' | 'failed',
  env: Required<ProjectInquiryEnvironment>,
  fetchImpl: typeof fetch,
) => {
  const query = new URLSearchParams({
    idempotency_key: `eq.${idempotencyKey}`,
  });
  const response = await fetchImpl(
    `${env.SUPABASE_URL}/rest/v1/project_inquiries?${query}`,
    {
      method: 'PATCH',
      headers: supabaseHeaders(env),
      body: JSON.stringify({
        email_status: status,
        updated_at: new Date().toISOString(),
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Supabase status update failed (${response.status})`);
  }
};

const optionalLine = (label: string, value?: string) =>
  value ? `${label}\n${value}\n` : '';

const buildEmailText = (
  payload: ProjectInquiryPayloadV1,
  referenceCode: string,
) => {
  const serviceLabels = payload.scope.services.map(
    (service) => serviceLabelByValue[service],
  );
  const referenceLines = payload.scope.references
    .map(
      (reference, index) =>
        `${index + 1}. ${reference.url}${reference.note ? ` — ${reference.note}` : ''}`,
    )
    .join('\n');
  const serviceDetails = Object.entries(payload.scope.serviceDetails)
    .map(([group, detail]) => `${group.toUpperCase()}\n${detail}`)
    .join('\n\n');

  return [
    `SOLAR STATIC STUDIO — PROJECT INQUIRY ${referenceCode}`,
    '',
    projectInquiryCopy.sections.contact.toUpperCase(),
    `Name\n${payload.contact.name}`,
    `Organization / project\n${payload.contact.organizationOrProject}`,
    `Email\n${payload.contact.email}`,
    `Decision role\n${payload.contact.decisionRole}`,
    optionalLine('Final approver', payload.contact.finalApprover),
    projectInquiryCopy.sections.project.toUpperCase(),
    `Idea or project\n${payload.project.idea}`,
    optionalLine('Why now', payload.project.whyNow),
    `Desired outcome\n${payload.project.desiredOutcome}`,
    `Primary audience\n${payload.project.audience}`,
    '',
    projectInquiryCopy.sections.scope.toUpperCase(),
    `Areas of support\n${serviceLabels.join(', ')}`,
    optionalLine('Service details', serviceDetails),
    optionalLine('Required deliverables', payload.scope.requiredDeliverables),
    `Existing assets\n${payload.scope.existingAssets.join(', ')}`,
    optionalLine('Asset notes', payload.scope.assetNotes),
    optionalLine('References', referenceLines),
    optionalLine('Visual direction', payload.scope.visualDirection),
    `Content responsibility\n${payload.scope.contentResponsibility}`,
    optionalLine('Content notes', payload.scope.contentNotes),
    projectInquiryCopy.sections.logistics.toUpperCase(),
    optionalLine('Preferred start', payload.logistics.preferredStart),
    optionalLine('Target launch', payload.logistics.targetLaunch),
    `Fixed deadline\n${payload.logistics.deadlineFixed ? 'Yes' : 'No'}`,
    optionalLine('Deadline constraint', payload.logistics.deadlineConstraint),
    `Investment range\n${budgetLabelByValue[payload.logistics.budgetBand]}`,
    `Approval process\n${payload.logistics.approvalProcess}`,
    '',
    projectInquiryCopy.sections.value.toUpperCase(),
    `Success criteria\n${payload.value.successCriteria}`,
    `Ongoing needs\n${payload.value.ongoingNeeds.join(', ')}`,
    optionalLine('Additional notes', payload.value.additionalNotes),
  ]
    .filter((line) => line !== '')
    .join('\n\n');
};

const hasRequiredEnvironment = (
  env: ProjectInquiryEnvironment,
): env is Required<ProjectInquiryEnvironment> =>
  Boolean(
    env.SUPABASE_URL &&
    env.SUPABASE_SERVICE_ROLE_KEY &&
    env.RESEND_API_KEY &&
    env.PROJECT_INQUIRY_FROM_EMAIL &&
    env.PROJECT_INQUIRY_TO_EMAIL,
  );

export const submitProjectInquiry = async ({
  input,
  env,
  fetchImpl = fetch,
  now = Date.now(),
  createReferenceCode: makeReferenceCode = createReferenceCode,
}: HandlerDependencies): Promise<ProjectInquiryHandlerResult> => {
  const validation = validateProjectInquiryTransport(input, now);
  if (!validation.ok) {
    return {
      statusCode: 400,
      body: {
        ok: false,
        error: 'invalid_request',
        fieldErrors: validation.errors,
      },
    };
  }

  if (validation.suspicious) {
    return {
      statusCode: 202,
      body: { ok: true, referenceCode: 'SSS-RECEIVED' },
    };
  }

  if (!hasRequiredEnvironment(env)) {
    return {
      statusCode: 503,
      body: { ok: false, error: 'service_unavailable' },
    };
  }

  const { payload } = validation;

  try {
    const existing = await getExistingInquiry(
      payload.idempotencyKey,
      env,
      fetchImpl,
    );
    if (existing) {
      return {
        statusCode: 200,
        body: { ok: true, referenceCode: existing.reference_code },
      };
    }

    let referenceCode = makeReferenceCode();
    let insertResponse = await insertInquiry(
      payload,
      referenceCode,
      env,
      fetchImpl,
    );

    if (insertResponse.status === 409) {
      const racedExisting = await getExistingInquiry(
        payload.idempotencyKey,
        env,
        fetchImpl,
      );
      if (racedExisting) {
        return {
          statusCode: 200,
          body: { ok: true, referenceCode: racedExisting.reference_code },
        };
      }
      referenceCode = makeReferenceCode();
      insertResponse = await insertInquiry(
        payload,
        referenceCode,
        env,
        fetchImpl,
      );
    }

    if (!insertResponse.ok) {
      throw new Error(`Supabase insert failed (${insertResponse.status})`);
    }

    const subjectServices = payload.scope.services
      .slice(0, 2)
      .map((service) => serviceLabelByValue[service])
      .join(' + ');
    const emailResponse = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `project-inquiry-${payload.idempotencyKey}`,
      },
      body: JSON.stringify({
        from: env.PROJECT_INQUIRY_FROM_EMAIL,
        to: [env.PROJECT_INQUIRY_TO_EMAIL],
        reply_to: payload.contact.email,
        subject: `${referenceCode} · ${budgetLabelByValue[payload.logistics.budgetBand]} · ${subjectServices}`,
        text: buildEmailText(payload, referenceCode),
        tags: [
          { name: 'category', value: 'project_inquiry' },
          { name: 'budget', value: payload.logistics.budgetBand },
        ],
      }),
    });

    try {
      await updateEmailStatus(
        payload.idempotencyKey,
        emailResponse.ok ? 'sent' : 'failed',
        env,
        fetchImpl,
      );
    } catch (error) {
      console.error(error);
    }

    if (!emailResponse.ok) {
      console.error(`Resend notification failed (${emailResponse.status})`);
    }

    return {
      statusCode: 201,
      body: { ok: true, referenceCode },
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 503,
      body: { ok: false, error: 'service_unavailable' },
    };
  }
};
