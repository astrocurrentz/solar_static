import type {
  BudgetBand,
  ContentResponsibility,
  DecisionRole,
  ExistingAsset,
  OngoingNeed,
  ServiceGroup,
  ServiceType,
} from './project-inquiry-types';

type Option<T extends string> = { value: T; label: string };

export const inquirySteps = [
  { number: '01', title: 'About You', shortTitle: 'You' },
  { number: '02', title: 'The Idea', shortTitle: 'Idea' },
  { number: '03', title: 'Scope & Readiness', shortTitle: 'Scope' },
  { number: '04', title: 'Timing & Investment', shortTitle: 'Timing' },
  { number: '05', title: 'Success & Support', shortTitle: 'Success' },
] as const;

export const decisionRoleOptions: Option<DecisionRole>[] = [
  { value: 'final', label: 'I am the final decision-maker' },
  { value: 'shared', label: 'I share the final decision' },
  { value: 'not_final', label: 'Someone else gives final approval' },
];

export const serviceOptions: Option<ServiceType>[] = [
  { value: 'brand', label: 'Brand direction or visual identity' },
  { value: 'website_strategy', label: 'Website strategy and structure' },
  { value: 'website_design', label: 'Website design' },
  {
    value: 'website_development',
    label: 'Website development and deployment',
  },
  { value: 'product_design', label: 'Product clarification or UI/UX' },
  { value: 'mobile_mvp', label: 'Selected mobile application / MVP' },
  { value: 'editorial', label: 'Editorial or publication design' },
  { value: 'not_sure', label: 'Not sure yet — help define the solution' },
];

export const serviceGroupPrompts: Record<
  ServiceGroup,
  { label: string; help: string }
> = {
  brand: {
    label: 'What should the identity help people recognize, trust, or feel?',
    help: 'A short description is enough.',
  },
  website: {
    label: 'Which pages, functions, CMS, integrations, or launch needs matter?',
    help: 'Include only what you already know.',
  },
  product: {
    label: 'What is the smallest useful version and its core user action?',
    help: 'Mention the target platform if it is known.',
  },
  editorial: {
    label: 'Is this print, digital, or both, and what format is expected?',
    help: 'Approximate length or page count is useful if available.',
  },
  not_sure: {
    label: 'What do you most need help deciding?',
    help: 'We can help turn the objective into the right scope.',
  },
};

export const existingAssetOptions: Option<ExistingAsset>[] = [
  { value: 'name_brand', label: 'Existing name or brand' },
  { value: 'logo_visual_assets', label: 'Logo or visual assets' },
  { value: 'website_domain', label: 'Website or domain' },
  { value: 'written_content', label: 'Written content' },
  {
    value: 'photo_video_illustration',
    label: 'Photography, video, or illustrations',
  },
  {
    value: 'product_documentation',
    label: 'Product requirements or technical documentation',
  },
  {
    value: 'application_codebase',
    label: 'Existing application, codebase, or platform',
  },
  { value: 'nothing', label: 'Nothing yet' },
];

export const contentResponsibilityOptions: Option<ContentResponsibility>[] = [
  { value: 'client', label: 'We will provide final content' },
  { value: 'studio', label: 'We need the studio to help create it' },
  { value: 'shared', label: 'Content will be a shared responsibility' },
  { value: 'not_sure', label: 'Not sure yet' },
];

export const budgetOptions: Option<BudgetBand>[] = [
  { value: 'under_5k', label: 'Under CAD 5k' },
  { value: '5k_8k', label: 'CAD 5–8k' },
  { value: '8k_15k', label: 'CAD 8–15k' },
  { value: '15k_plus', label: 'CAD 15k+' },
];

export const ongoingNeedOptions: Option<OngoingNeed>[] = [
  { value: 'none', label: 'No ongoing support expected' },
  { value: 'website_maintenance', label: 'Website or content maintenance' },
  { value: 'technical_support', label: 'Technical support' },
  { value: 'design_support', label: 'Ongoing design support' },
  { value: 'future_phases', label: 'Future product phases' },
  { value: 'not_sure', label: 'Not sure yet' },
];

export const projectInquiryCopy = {
  meta: {
    title: 'Start a Project - Solar Static Studio',
    description:
      'Tell Solar Static Studio about your idea, project goals, scope, timing, and investment range.',
  },
  eyebrow: 'Project inquiry',
  heading: 'Start a Project',
  introduction:
    'Tell us enough to understand the idea, the fit, and the next useful step. Brief, direct answers are enough.',
  estimate: 'Five short sections · about 8–10 minutes',
  privacy:
    'Your answers are used only to review and respond to this inquiry. Submitted inquiries are retained for 12 months.',
  required: 'Required',
  optional: 'Optional',
  restored: 'Draft restored from this device.',
  saved: 'Saved on this device',
  saving: 'Saving…',
  reset: 'Reset form',
  resetConfirm: 'Reset this inquiry and remove the saved draft?',
  back: 'Back',
  continue: 'Continue',
  review: 'Review inquiry',
  submit: 'Send inquiry',
  submitting: 'Sending…',
  edit: 'Edit',
  addReference: 'Add another reference',
  removeReference: 'Remove',
  reviewHeading: 'Review your inquiry',
  reviewBody:
    'Check the details below. You can return to any section before sending.',
  consent:
    'I agree that Solar Static Studio may use this information to review and respond to my inquiry.',
  successEyebrow: 'Inquiry received',
  successHeading: 'Thank you for the signal.',
  successBody:
    'Every inquiry is reviewed personally. You can usually expect a reply within two business days.',
  referenceLabel: 'Reference',
  startAnother: 'Start another inquiry',
  errorSummary: 'Please review the highlighted fields before continuing.',
  submissionError:
    'We could not send your inquiry. Your draft is still saved on this device, so you can try again.',
  sections: {
    contact: 'About You',
    project: 'The Idea',
    scope: 'Scope & Readiness',
    logistics: 'Timing & Investment',
    value: 'Success & Support',
  },
} as const;

export const budgetLabelByValue = Object.fromEntries(
  budgetOptions.map((option) => [option.value, option.label]),
) as Record<BudgetBand, string>;

export const serviceLabelByValue = Object.fromEntries(
  serviceOptions.map((option) => [option.value, option.label]),
) as Record<ServiceType, string>;
