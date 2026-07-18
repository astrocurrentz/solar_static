import {
  budgetOptions,
  contentResponsibilityOptions,
  deadlineConstraintOptions,
  decisionRoleOptions,
  existingAssetOptions,
  ongoingNeedOptions,
  projectInquiryCopy,
  serviceGroupPrompts,
  serviceOptions,
  successOutcomeOptions,
} from '../../data/project-inquiry-copy';
import type {
  DeadlineConstraintReason,
  ExistingAsset,
  InquiryFieldErrors,
  OngoingNeed,
  ProjectInquiryFormState,
  ServiceType,
  SuccessOutcome,
} from '../../data/project-inquiry-types';
import {
  getActiveServiceGroups,
  toggleExclusiveOption,
  toggleOption,
} from '../../lib/project-inquiry';
import { ChoiceGroup, TextAreaField, TextField } from './InquiryControls';

type Props = {
  step: number;
  state: ProjectInquiryFormState;
  errors: InquiryFieldErrors;
  updateField: <K extends keyof ProjectInquiryFormState>(
    field: K,
    value: ProjectInquiryFormState[K],
  ) => void;
};

const createReferenceId = () =>
  globalThis.crypto?.randomUUID?.() ?? `reference-${Date.now()}`;

const AboutYouStep = ({ state, errors, updateField }: Omit<Props, 'step'>) => (
  <div className="inquiry-step-fields">
    <div className="inquiry-field-grid inquiry-field-grid--two">
      <TextField
        field="name"
        label="Name"
        value={state.name}
        onChange={(value) => updateField('name', value)}
        autoComplete="name"
        error={errors.name}
      />
      <TextField
        field="organizationOrProject"
        label="Organization / project"
        value={state.organizationOrProject}
        onChange={(value) => updateField('organizationOrProject', value)}
        autoComplete="organization"
        error={errors.organizationOrProject}
      />
    </div>
    <TextField
      field="email"
      label="Email"
      value={state.email}
      onChange={(value) => updateField('email', value)}
      type="email"
      autoComplete="email"
      error={errors.email}
    />
    <ChoiceGroup
      field="decisionRole"
      legend="What is your role in the final decision?"
      options={decisionRoleOptions}
      value={state.decisionRole}
      onChange={(value) => {
        updateField(
          'decisionRole',
          value as ProjectInquiryFormState['decisionRole'],
        );
        if (value === 'final') updateField('finalApprover', '');
      }}
      errors={errors}
    />
    {state.decisionRole && state.decisionRole !== 'final' ? (
      <TextField
        field="finalApprover"
        label="Who gives final approval?"
        help="A name, role, or decision-making group is enough."
        value={state.finalApprover}
        onChange={(value) => updateField('finalApprover', value)}
        error={errors.finalApprover}
      />
    ) : null}
  </div>
);

const IdeaStep = ({ state, errors, updateField }: Omit<Props, 'step'>) => (
  <div className="inquiry-step-fields">
    <TextAreaField
      field="idea"
      label="What is the idea or project?"
      help="Describe it in plain language. What are you trying to create?"
      value={state.idea}
      onChange={(value) => updateField('idea', value)}
      rows={5}
      error={errors.idea}
    />
    <TextAreaField
      field="whyNow"
      label="Why does this project need to happen now?"
      value={state.whyNow}
      onChange={(value) => updateField('whyNow', value)}
      rows={3}
      optional
      error={errors.whyNow}
    />
    <TextAreaField
      field="desiredOutcome"
      label="What outcome do you want?"
      help="What should exist, change, or become possible when the project is complete?"
      value={state.desiredOutcome}
      onChange={(value) => updateField('desiredOutcome', value)}
      error={errors.desiredOutcome}
    />
    <TextAreaField
      field="audience"
      label="Who is the primary audience or user?"
      value={state.audience}
      onChange={(value) => updateField('audience', value)}
      rows={3}
      error={errors.audience}
    />
  </div>
);

const ScopeStep = ({ state, errors, updateField }: Omit<Props, 'step'>) => {
  const activeGroups = getActiveServiceGroups(state.services);

  const toggleService = (value: string) => {
    updateField(
      'services',
      toggleExclusiveOption(state.services, value as ServiceType, 'not_sure'),
    );
  };

  const toggleAsset = (value: string) => {
    updateField(
      'existingAssets',
      toggleExclusiveOption(
        state.existingAssets,
        value as ExistingAsset,
        'nothing',
      ),
    );
  };

  return (
    <div className="inquiry-step-fields">
      <ChoiceGroup
        field="services"
        legend="What do you need help with?"
        help="Select everything that may be relevant."
        options={serviceOptions}
        value={state.services}
        multiple
        onChange={toggleService}
        errors={errors}
      />
      {activeGroups.map((group) => {
        const prompt = serviceGroupPrompts[group];
        return (
          <TextAreaField
            field={`serviceDetails-${group}`}
            label={prompt.label}
            help={prompt.help}
            value={state.serviceDetails[group]}
            onChange={(value) =>
              updateField('serviceDetails', {
                ...state.serviceDetails,
                [group]: value,
              })
            }
            rows={3}
            optional
            key={group}
          />
        );
      })}
      <TextAreaField
        field="requiredDeliverables"
        label="What must the final project include?"
        help="List required pages, features, formats, platforms, integrations, or deliverables."
        value={state.requiredDeliverables}
        onChange={(value) => updateField('requiredDeliverables', value)}
        optional
        error={errors.requiredDeliverables}
      />
      <ChoiceGroup
        field="existingAssets"
        legend="What already exists?"
        options={existingAssetOptions}
        value={state.existingAssets}
        multiple
        onChange={toggleAsset}
        errors={errors}
      />
      <TextAreaField
        field="assetNotes"
        label="Relevant asset notes"
        value={state.assetNotes}
        onChange={(value) => updateField('assetNotes', value)}
        rows={3}
        optional
        error={errors.assetNotes}
      />
      <div className="inquiry-reference-section">
        <div className="inquiry-field__heading">
          <h3>Relevant links or references</h3>
          <span>Optional</span>
        </div>
        <p className="inquiry-field__help">
          Add existing sites, visual references, or source material and tell us
          what matters about each one.
        </p>
        {state.references.map((reference, index) => (
          <div className="inquiry-reference" key={reference.id}>
            <TextField
              field={`reference-${index}-url`}
              label={`Reference ${index + 1}`}
              value={reference.url}
              onChange={(value) => {
                const references = [...state.references];
                references[index] = { ...reference, url: value };
                updateField('references', references);
              }}
              type="url"
              placeholder="https://"
              error={errors[`reference-${index}-url`]}
            />
            <TextField
              field={`reference-${index}-note`}
              label="What is useful about it?"
              value={reference.note}
              onChange={(value) => {
                const references = [...state.references];
                references[index] = { ...reference, note: value };
                updateField('references', references);
              }}
              optional
              error={errors[`reference-${index}-note`]}
            />
            <button
              className="inquiry-text-button"
              type="button"
              onClick={() =>
                updateField(
                  'references',
                  state.references.filter((item) => item.id !== reference.id),
                )
              }
            >
              Remove reference
            </button>
          </div>
        ))}
        <button
          className="inquiry-secondary-button"
          type="button"
          onClick={() =>
            updateField('references', [
              ...state.references,
              { id: createReferenceId(), url: '', note: '' },
            ])
          }
        >
          Add a reference
        </button>
      </div>
      <TextAreaField
        field="visualDirection"
        label="What visual or experiential direction are you seeking?"
        help="Explain what you like or dislike about any references you shared."
        value={state.visualDirection}
        onChange={(value) => updateField('visualDirection', value)}
        optional
        error={errors.visualDirection}
      />
      <ChoiceGroup
        field="contentResponsibility"
        legend="Who will provide final text, images, data, and product information?"
        options={contentResponsibilityOptions}
        value={state.contentResponsibility}
        onChange={(value) =>
          updateField(
            'contentResponsibility',
            value as ProjectInquiryFormState['contentResponsibility'],
          )
        }
        errors={errors}
      />
      <TextAreaField
        field="contentNotes"
        label="Content readiness notes"
        value={state.contentNotes}
        onChange={(value) => updateField('contentNotes', value)}
        rows={3}
        optional
        error={errors.contentNotes}
      />
    </div>
  );
};

const TimingStep = ({ state, errors, updateField }: Omit<Props, 'step'>) => {
  const toggleDeadlineConstraint = (value: string) => {
    const constraint = value as DeadlineConstraintReason;
    const removingCustom =
      constraint === 'other' &&
      state.deadlineConstraintReasons.includes('other');

    updateField(
      'deadlineConstraintReasons',
      toggleOption(state.deadlineConstraintReasons, constraint),
    );
    if (removingCustom) updateField('deadlineConstraint', '');
  };

  return (
    <div className="inquiry-step-fields">
      <div className="inquiry-field-grid inquiry-field-grid--two">
        <TextField
          field="preferredStart"
          label="Preferred start"
          value={state.preferredStart}
          onChange={(value) => updateField('preferredStart', value)}
          type="date"
          optional
        />
        <TextField
          field="targetLaunch"
          label="Target completion or launch"
          value={state.targetLaunch}
          onChange={(value) => updateField('targetLaunch', value)}
          type="date"
          optional
        />
      </div>
      <ChoiceGroup
        field="deadlineFixed"
        legend="Is the deadline fixed?"
        options={[
          { value: 'true', label: 'Yes, the date cannot move' },
          { value: 'false', label: 'No, the timing is flexible' },
        ]}
        value={state.deadlineFixed === null ? '' : String(state.deadlineFixed)}
        onChange={(value) => {
          const deadlineFixed = value === 'true';
          updateField('deadlineFixed', deadlineFixed);
          if (!deadlineFixed) {
            updateField('deadlineConstraintReasons', []);
            updateField('deadlineConstraint', '');
          }
        }}
        errors={errors}
      />
      {state.deadlineFixed ? (
        <>
          <ChoiceGroup
            field="deadlineConstraintReasons"
            legend={projectInquiryCopy.deadlineConstraintLegend}
            options={deadlineConstraintOptions}
            value={state.deadlineConstraintReasons}
            multiple
            onChange={toggleDeadlineConstraint}
            errors={errors}
          />
          {state.deadlineConstraintReasons.includes('other') ? (
            <TextField
              field="deadlineConstraint"
              label={projectInquiryCopy.deadlineConstraintCustomLabel}
              help={projectInquiryCopy.deadlineConstraintCustomHelp}
              value={state.deadlineConstraint}
              onChange={(value) => updateField('deadlineConstraint', value)}
              maxLength={500}
              error={errors.deadlineConstraint}
            />
          ) : null}
        </>
      ) : null}
      <ChoiceGroup
        field="budgetBand"
        legend="What investment range is realistically available?"
        help="This helps us recommend a useful scope. It does not automatically accept or reject a project."
        options={budgetOptions}
        value={state.budgetBand}
        onChange={(value) =>
          updateField(
            'budgetBand',
            value as ProjectInquiryFormState['budgetBand'],
          )
        }
        errors={errors}
      />
      <TextAreaField
        field="approvalProcess"
        label="Who will review the work, and who has final approval?"
        value={state.approvalProcess}
        onChange={(value) => updateField('approvalProcess', value)}
        rows={3}
        error={errors.approvalProcess}
      />
    </div>
  );
};

const SuccessStep = ({ state, errors, updateField }: Omit<Props, 'step'>) => {
  const toggleSuccessOutcome = (value: string) => {
    const outcome = value as SuccessOutcome;
    const removingCustom =
      outcome === 'other' && state.successOutcomes.includes('other');

    updateField(
      'successOutcomes',
      toggleOption(state.successOutcomes, outcome),
    );
    if (removingCustom) updateField('successCriteria', state.successCriteria);
  };

  const toggleOngoingNeed = (value: string) => {
    updateField(
      'ongoingNeeds',
      toggleExclusiveOption(state.ongoingNeeds, value as OngoingNeed, 'none'),
    );
  };

  return (
    <div className="inquiry-step-fields">
      <ChoiceGroup
        field="successOutcomes"
        legend={projectInquiryCopy.successOutcomeLegend}
        help={projectInquiryCopy.successOutcomeHelp}
        options={successOutcomeOptions}
        value={state.successOutcomes}
        multiple
        onChange={toggleSuccessOutcome}
        errors={errors}
      />
      <TextAreaField
        field="successCriteria"
        label={projectInquiryCopy.successDetailsLabel}
        help={projectInquiryCopy.successDetailsHelp}
        value={state.successCriteria}
        onChange={(value) => updateField('successCriteria', value)}
        rows={3}
        maxLength={1000}
        optional={!state.successOutcomes.includes('other')}
        error={errors.successCriteria}
      />
      <ChoiceGroup
        field="ongoingNeeds"
        legend="What ongoing needs do you expect?"
        options={ongoingNeedOptions}
        value={state.ongoingNeeds}
        multiple
        onChange={toggleOngoingNeed}
        errors={errors}
      />
      <TextAreaField
        field="additionalNotes"
        label="Anything else we should know?"
        value={state.additionalNotes}
        onChange={(value) => updateField('additionalNotes', value)}
        rows={5}
        optional
        error={errors.additionalNotes}
      />
    </div>
  );
};

export const InquiryStep = ({ step, state, errors, updateField }: Props) => {
  if (step === 0) {
    return (
      <AboutYouStep state={state} errors={errors} updateField={updateField} />
    );
  }
  if (step === 1) {
    return <IdeaStep state={state} errors={errors} updateField={updateField} />;
  }
  if (step === 2) {
    return (
      <ScopeStep state={state} errors={errors} updateField={updateField} />
    );
  }
  if (step === 3) {
    return (
      <TimingStep state={state} errors={errors} updateField={updateField} />
    );
  }
  return (
    <SuccessStep state={state} errors={errors} updateField={updateField} />
  );
};
