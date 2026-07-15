import {
  budgetLabelByValue,
  contentResponsibilityOptions,
  decisionRoleOptions,
  existingAssetOptions,
  ongoingNeedOptions,
  projectInquiryCopy,
  serviceGroupPrompts,
  serviceLabelByValue,
} from '../../data/project-inquiry-copy';
import type {
  InquiryFieldErrors,
  ProjectInquiryFormState,
} from '../../data/project-inquiry-types';
import { getActiveServiceGroups } from '../../lib/project-inquiry';

type Props = {
  state: ProjectInquiryFormState;
  errors: InquiryFieldErrors;
  onEdit: (step: number) => void;
  onConsentChange: (value: boolean) => void;
};

const labelFor = (
  options: ReadonlyArray<{ value: string; label: string }>,
  value: string,
) => options.find((option) => option.value === value)?.label ?? value;

const ReviewRow = ({
  label,
  value,
}: {
  label: string;
  value?: string | string[];
}) => {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  const content = Array.isArray(value) ? value.join(' · ') : value;

  return (
    <div className="inquiry-review-row">
      <dt>{label}</dt>
      <dd>{content}</dd>
    </div>
  );
};

const ReviewSection = ({
  title,
  step,
  onEdit,
  children,
}: {
  title: string;
  step: number;
  onEdit: (step: number) => void;
  children: React.ReactNode;
}) => (
  <section className="inquiry-review-section">
    <div className="inquiry-review-section__heading">
      <h3>{title}</h3>
      <button type="button" onClick={() => onEdit(step)}>
        Edit
      </button>
    </div>
    <dl>{children}</dl>
  </section>
);

export const InquiryReview = ({
  state,
  errors,
  onEdit,
  onConsentChange,
}: Props) => {
  const serviceGroups = getActiveServiceGroups(state.services);

  return (
    <div className="inquiry-review">
      <div className="inquiry-review__introduction">
        <h2>{projectInquiryCopy.reviewHeading}</h2>
        <p>{projectInquiryCopy.reviewBody}</p>
      </div>
      <ReviewSection title="About You" step={0} onEdit={onEdit}>
        <ReviewRow label="Name" value={state.name} />
        <ReviewRow
          label="Organization / project"
          value={state.organizationOrProject}
        />
        <ReviewRow label="Email" value={state.email} />
        <ReviewRow
          label="Decision role"
          value={labelFor(decisionRoleOptions, state.decisionRole)}
        />
        <ReviewRow label="Final approver" value={state.finalApprover} />
      </ReviewSection>
      <ReviewSection title="The Idea" step={1} onEdit={onEdit}>
        <ReviewRow label="Idea or project" value={state.idea} />
        <ReviewRow label="Why now" value={state.whyNow} />
        <ReviewRow label="Desired outcome" value={state.desiredOutcome} />
        <ReviewRow label="Primary audience" value={state.audience} />
      </ReviewSection>
      <ReviewSection title="Scope & Readiness" step={2} onEdit={onEdit}>
        <ReviewRow
          label="Areas of support"
          value={state.services.map((service) => serviceLabelByValue[service])}
        />
        {serviceGroups.map((group) => (
          <ReviewRow
            key={group}
            label={serviceGroupPrompts[group].label}
            value={state.serviceDetails[group]}
          />
        ))}
        <ReviewRow
          label="Required deliverables"
          value={state.requiredDeliverables}
        />
        <ReviewRow
          label="Existing assets"
          value={state.existingAssets.map((asset) =>
            labelFor(existingAssetOptions, asset),
          )}
        />
        <ReviewRow label="Asset notes" value={state.assetNotes} />
        {state.references.map((reference, index) => (
          <ReviewRow
            key={reference.id}
            label={`Reference ${index + 1}`}
            value={
              reference.note
                ? `${reference.url} — ${reference.note}`
                : reference.url
            }
          />
        ))}
        <ReviewRow label="Visual direction" value={state.visualDirection} />
        <ReviewRow
          label="Content responsibility"
          value={labelFor(
            contentResponsibilityOptions,
            state.contentResponsibility,
          )}
        />
        <ReviewRow label="Content notes" value={state.contentNotes} />
      </ReviewSection>
      <ReviewSection title="Timing & Investment" step={3} onEdit={onEdit}>
        <ReviewRow label="Preferred start" value={state.preferredStart} />
        <ReviewRow label="Target launch" value={state.targetLaunch} />
        <ReviewRow
          label="Fixed deadline"
          value={state.deadlineFixed ? 'Yes' : 'No'}
        />
        <ReviewRow
          label="Deadline constraint"
          value={state.deadlineConstraint}
        />
        <ReviewRow
          label="Investment range"
          value={state.budgetBand ? budgetLabelByValue[state.budgetBand] : ''}
        />
        <ReviewRow label="Approval process" value={state.approvalProcess} />
      </ReviewSection>
      <ReviewSection title="Success & Support" step={4} onEdit={onEdit}>
        <ReviewRow label="Success criteria" value={state.successCriteria} />
        <ReviewRow
          label="Ongoing needs"
          value={state.ongoingNeeds.map((need) =>
            labelFor(ongoingNeedOptions, need),
          )}
        />
        <ReviewRow label="Additional notes" value={state.additionalNotes} />
      </ReviewSection>
      <div className="inquiry-consent" data-field="consent">
        <label>
          <input
            type="checkbox"
            checked={state.consent}
            onChange={(event) => onConsentChange(event.target.checked)}
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={
              errors.consent ? 'inquiry-consent-error' : undefined
            }
          />
          <span className="inquiry-choice__marker" aria-hidden="true" />
          <span>{projectInquiryCopy.consent}</span>
        </label>
        {errors.consent ? (
          <p className="inquiry-field__error" id="inquiry-consent-error">
            {errors.consent}
          </p>
        ) : null}
      </div>
    </div>
  );
};
