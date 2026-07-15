import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import {
  inquirySteps,
  projectInquiryCopy,
} from '../../data/project-inquiry-copy';
import {
  createEmptyInquiryState,
  PROJECT_INQUIRY_DRAFT_KEY,
  type InquiryFieldErrors,
  type ProjectInquiryFormState,
} from '../../data/project-inquiry-types';
import {
  buildInquiryPayload,
  clearInquiryDraft,
  hasMeaningfulInquiryDraft,
  restoreInquiryDraft,
  saveInquiryDraft,
  validateEntireInquiry,
  validateInquiryStep,
} from '../../lib/project-inquiry';
import { InquiryReview } from './InquiryReview';
import { InquiryStep } from './InquirySteps';

type SubmitState = 'idle' | 'submitting' | 'error' | 'success';
type SaveState = 'idle' | 'saving' | 'saved';

const createId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-4000-8000-${Math.random().toString(16).slice(2).padEnd(12, '0')}`;

const createFreshState = (): ProjectInquiryFormState => ({
  ...createEmptyInquiryState(),
  idempotencyKey: createId(),
  startedAt: new Date().toISOString(),
});

const focusFirstError = (errors: InquiryFieldErrors) => {
  const firstField = Object.keys(errors)[0];
  if (!firstField) return;

  window.setTimeout(() => {
    const container = document.querySelector<HTMLElement>(
      `[data-field="${CSS.escape(firstField)}"]`,
    );
    const target = container?.querySelector<HTMLElement>(
      'input, textarea, select, button, [tabindex]:not([tabindex="-1"])',
    );
    (target ?? container)?.focus();
  }, 180);
};

const ErrorSummary = ({ errors }: { errors: InquiryFieldErrors }) =>
  Object.keys(errors).length > 0 ? (
    <div className="inquiry-error-summary" role="alert" tabIndex={-1}>
      {projectInquiryCopy.errorSummary}
    </div>
  ) : null;

export default function ProjectInquiryForm() {
  const [state, setState] = useState(createEmptyInquiryState);
  const [currentStep, setCurrentStep] = useState(0);
  const [reviewing, setReviewing] = useState(false);
  const [errors, setErrors] = useState<InquiryFieldErrors>({});
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [hydrated, setHydrated] = useState(false);
  const [restored, setRestored] = useState(false);
  const [referenceCode, setReferenceCode] = useState('');
  const [website, setWebsite] = useState('');
  const formTopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const restoredDraft = restoreInquiryDraft(
      localStorage.getItem(PROJECT_INQUIRY_DRAFT_KEY),
    );
    const nextState = restoredDraft?.state ?? createFreshState();

    if (!nextState.idempotencyKey || !nextState.startedAt) {
      const fresh = createFreshState();
      nextState.idempotencyKey = fresh.idempotencyKey;
      nextState.startedAt = fresh.startedAt;
    }

    setState(nextState);
    setCurrentStep(restoredDraft?.currentStep ?? 0);
    setReviewing(restoredDraft?.reviewing ?? false);
    setRestored(
      Boolean(restoredDraft && hasMeaningfulInquiryDraft(restoredDraft.state)),
    );
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || submitState === 'success') return;
    setSaveState('saving');
    const timeout = window.setTimeout(() => {
      saveInquiryDraft(state, currentStep, reviewing);
      setSaveState('saved');
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [currentStep, hydrated, reviewing, state, submitState]);

  const updateField = <K extends keyof ProjectInquiryFormState>(
    field: K,
    value: ProjectInquiryFormState[K],
  ) => {
    setState((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    if (submitState === 'error') setSubmitState('idle');
  };

  const moveToTop = () => {
    formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleContinue = () => {
    const nextErrors = validateInquiryStep(state, currentStep);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      focusFirstError(nextErrors);
      return;
    }

    if (currentStep === inquirySteps.length - 1) {
      setReviewing(true);
    } else {
      setCurrentStep((step) => step + 1);
    }
    moveToTop();
  };

  const handleBack = () => {
    setErrors({});
    if (reviewing) {
      setReviewing(false);
      setCurrentStep(inquirySteps.length - 1);
    } else {
      setCurrentStep((step) => Math.max(0, step - 1));
    }
    moveToTop();
  };

  const editStep = (step: number) => {
    setReviewing(false);
    setCurrentStep(step);
    setErrors({});
    moveToTop();
  };

  const resetForm = () => {
    if (!window.confirm(projectInquiryCopy.resetConfirm)) return;
    clearInquiryDraft();
    setState(createFreshState());
    setCurrentStep(0);
    setReviewing(false);
    setErrors({});
    setRestored(false);
    setSubmitState('idle');
    setReferenceCode('');
    moveToTop();
  };

  const handleSubmit = async () => {
    const allErrors = validateEntireInquiry(state);
    if (Object.keys(allErrors).length > 0) {
      for (let step = 0; step < inquirySteps.length; step += 1) {
        const stepErrors = validateInquiryStep(state, step);
        if (Object.keys(stepErrors).length > 0) {
          setCurrentStep(step);
          setReviewing(false);
          setErrors(stepErrors);
          focusFirstError(stepErrors);
          return;
        }
      }
      setErrors(allErrors);
      focusFirstError(allErrors);
      return;
    }

    setSubmitState('submitting');
    setErrors({});

    try {
      const response = await fetch('/api/project-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...buildInquiryPayload(state), website }),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        referenceCode?: string;
      };

      if (!response.ok || !result.ok || !result.referenceCode) {
        throw new Error('Project inquiry submission failed');
      }

      clearInquiryDraft();
      setReferenceCode(result.referenceCode);
      setSubmitState('success');
    } catch (error) {
      console.error(error);
      setSubmitState('error');
    }
  };

  if (submitState === 'success') {
    return (
      <section
        className="inquiry-success"
        aria-labelledby="inquiry-success-title"
      >
        <p className="inquiry-eyebrow">{projectInquiryCopy.successEyebrow}</p>
        <h1 id="inquiry-success-title">{projectInquiryCopy.successHeading}</h1>
        <p>{projectInquiryCopy.successBody}</p>
        <div className="inquiry-success__reference">
          <span>{projectInquiryCopy.referenceLabel}</span>
          <strong>{referenceCode}</strong>
        </div>
        <button
          className="inquiry-primary-button"
          type="button"
          onClick={resetForm}
        >
          {projectInquiryCopy.startAnother}
        </button>
      </section>
    );
  }

  const activeStep = inquirySteps[currentStep];
  const transition = { duration: 0.18, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <div className="project-inquiry" ref={formTopRef}>
      <header className="inquiry-introduction">
        <div>
          <p className="inquiry-eyebrow">{projectInquiryCopy.eyebrow}</p>
          <h1>{projectInquiryCopy.heading}</h1>
        </div>
        <div className="inquiry-introduction__copy">
          <p>{projectInquiryCopy.introduction}</p>
          <p className="inquiry-estimate">{projectInquiryCopy.estimate}</p>
          <p className="inquiry-privacy">{projectInquiryCopy.privacy}</p>
        </div>
      </header>

      {restored ? (
        <div className="inquiry-restored" role="status">
          {projectInquiryCopy.restored}
        </div>
      ) : null}

      <div className="inquiry-layout">
        <aside
          className="inquiry-progress"
          aria-label="Project inquiry progress"
        >
          <ol>
            {inquirySteps.map((step, index) => {
              const isActive = !reviewing && index === currentStep;
              const isComplete = reviewing || index < currentStep;
              return (
                <li
                  className={
                    isActive ? 'is-active' : isComplete ? 'is-complete' : ''
                  }
                  aria-current={isActive ? 'step' : undefined}
                  key={step.number}
                >
                  <span>{step.number}</span>
                  <span>{step.shortTitle}</span>
                </li>
              );
            })}
          </ol>
          <div className="inquiry-save-state" aria-live="polite">
            {saveState === 'saving'
              ? projectInquiryCopy.saving
              : saveState === 'saved'
                ? projectInquiryCopy.saved
                : ''}
          </div>
          <button
            className="inquiry-text-button"
            type="button"
            onClick={resetForm}
          >
            {projectInquiryCopy.reset}
          </button>
        </aside>

        <form
          className="inquiry-form"
          noValidate
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="inquiry-honeypot" aria-hidden="true">
            <label htmlFor="inquiry-website">Website</label>
            <input
              id="inquiry-website"
              name="website"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              autoComplete="off"
              tabIndex={-1}
            />
          </div>
          <ErrorSummary errors={errors} />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={reviewing ? 'review' : activeStep.number}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={transition}
            >
              {reviewing ? (
                <InquiryReview
                  state={state}
                  errors={errors}
                  onEdit={editStep}
                  onConsentChange={(value) => updateField('consent', value)}
                />
              ) : (
                <section
                  className="inquiry-step"
                  aria-labelledby={`inquiry-step-${activeStep.number}`}
                >
                  <div className="inquiry-step__heading">
                    <span>{activeStep.number} / 05</span>
                    <h2 id={`inquiry-step-${activeStep.number}`}>
                      {activeStep.title}
                    </h2>
                  </div>
                  <InquiryStep
                    step={currentStep}
                    state={state}
                    errors={errors}
                    updateField={updateField}
                  />
                </section>
              )}
            </motion.div>
          </AnimatePresence>

          {submitState === 'error' ? (
            <p className="inquiry-submission-error" role="alert">
              {projectInquiryCopy.submissionError}
            </p>
          ) : null}

          <div className="inquiry-actions">
            {currentStep > 0 || reviewing ? (
              <button
                className="inquiry-secondary-button"
                type="button"
                onClick={handleBack}
                disabled={submitState === 'submitting'}
              >
                {projectInquiryCopy.back}
              </button>
            ) : (
              <span />
            )}
            <button
              className="inquiry-primary-button"
              type="button"
              onClick={reviewing ? handleSubmit : handleContinue}
              disabled={!hydrated || submitState === 'submitting'}
            >
              {submitState === 'submitting'
                ? projectInquiryCopy.submitting
                : reviewing
                  ? projectInquiryCopy.submit
                  : currentStep === inquirySteps.length - 1
                    ? projectInquiryCopy.review
                    : projectInquiryCopy.continue}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
