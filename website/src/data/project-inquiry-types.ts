export const PROJECT_INQUIRY_SCHEMA_VERSION = 1 as const;
export const PROJECT_INQUIRY_DRAFT_KEY = 'sss.projectInquiry.v1';

export type DecisionRole = 'final' | 'shared' | 'not_final';
export type ServiceType =
  | 'brand'
  | 'website_strategy'
  | 'website_design'
  | 'website_development'
  | 'product_design'
  | 'mobile_mvp'
  | 'editorial'
  | 'not_sure';
export type ServiceGroup =
  'brand' | 'website' | 'product' | 'editorial' | 'not_sure';
export type ExistingAsset =
  | 'name_brand'
  | 'logo_visual_assets'
  | 'website_domain'
  | 'written_content'
  | 'photo_video_illustration'
  | 'product_documentation'
  | 'application_codebase'
  | 'nothing';
export type ContentResponsibility = 'client' | 'studio' | 'shared' | 'not_sure';
export type BudgetBand = 'under_5k' | '5k_8k' | '8k_15k' | '15k_plus';
export type DeadlineConstraintReason =
  | 'launch_event'
  | 'campaign_seasonal'
  | 'business_kpi'
  | 'funding_contract'
  | 'legal_compliance'
  | 'external_dependency'
  | 'other';
export type SuccessOutcome =
  | 'brand'
  | 'website'
  | 'product'
  | 'editorial'
  | 'launch'
  | 'operations'
  | 'other';
export type OngoingNeed =
  | 'none'
  | 'website_maintenance'
  | 'technical_support'
  | 'design_support'
  | 'future_phases'
  | 'not_sure';

export const decisionRoles = ['final', 'shared', 'not_final'] as const;
export const serviceTypes = [
  'brand',
  'website_strategy',
  'website_design',
  'website_development',
  'product_design',
  'mobile_mvp',
  'editorial',
  'not_sure',
] as const satisfies readonly ServiceType[];
export const serviceGroups = [
  'brand',
  'website',
  'product',
  'editorial',
  'not_sure',
] as const satisfies readonly ServiceGroup[];
export const existingAssets = [
  'name_brand',
  'logo_visual_assets',
  'website_domain',
  'written_content',
  'photo_video_illustration',
  'product_documentation',
  'application_codebase',
  'nothing',
] as const satisfies readonly ExistingAsset[];
export const contentResponsibilities = [
  'client',
  'studio',
  'shared',
  'not_sure',
] as const satisfies readonly ContentResponsibility[];
export const budgetBands = [
  'under_5k',
  '5k_8k',
  '8k_15k',
  '15k_plus',
] as const satisfies readonly BudgetBand[];
export const deadlineConstraintReasons = [
  'launch_event',
  'campaign_seasonal',
  'business_kpi',
  'funding_contract',
  'legal_compliance',
  'external_dependency',
  'other',
] as const satisfies readonly DeadlineConstraintReason[];
export const successOutcomes = [
  'brand',
  'website',
  'product',
  'editorial',
  'launch',
  'operations',
  'other',
] as const satisfies readonly SuccessOutcome[];
export const ongoingNeeds = [
  'none',
  'website_maintenance',
  'technical_support',
  'design_support',
  'future_phases',
  'not_sure',
] as const satisfies readonly OngoingNeed[];

export type InquiryReference = {
  id: string;
  url: string;
  note: string;
};

export type ProjectInquiryFormState = {
  schemaVersion: typeof PROJECT_INQUIRY_SCHEMA_VERSION;
  idempotencyKey: string;
  startedAt: string;
  name: string;
  organizationOrProject: string;
  email: string;
  decisionRole: DecisionRole | '';
  finalApprover: string;
  idea: string;
  whyNow: string;
  desiredOutcome: string;
  audience: string;
  services: ServiceType[];
  serviceDetails: Record<ServiceGroup, string>;
  requiredDeliverables: string;
  existingAssets: ExistingAsset[];
  assetNotes: string;
  references: InquiryReference[];
  visualDirection: string;
  contentResponsibility: ContentResponsibility | '';
  contentNotes: string;
  preferredStart: string;
  targetLaunch: string;
  deadlineFixed: boolean | null;
  deadlineConstraintReasons: DeadlineConstraintReason[];
  deadlineConstraint: string;
  budgetBand: BudgetBand | '';
  approvalProcess: string;
  successOutcomes: SuccessOutcome[];
  successCriteria: string;
  ongoingNeeds: OngoingNeed[];
  additionalNotes: string;
  consent: boolean;
};

export type ProjectInquiryPayloadV1 = {
  schemaVersion: typeof PROJECT_INQUIRY_SCHEMA_VERSION;
  idempotencyKey: string;
  contact: {
    name: string;
    organizationOrProject: string;
    email: string;
    decisionRole: DecisionRole;
    finalApprover?: string;
  };
  project: {
    idea: string;
    whyNow?: string;
    desiredOutcome: string;
    audience: string;
  };
  scope: {
    services: ServiceType[];
    serviceDetails: Partial<Record<ServiceGroup, string>>;
    requiredDeliverables?: string;
    existingAssets: ExistingAsset[];
    assetNotes?: string;
    references: Array<{ url: string; note?: string }>;
    visualDirection?: string;
    contentResponsibility: ContentResponsibility;
    contentNotes?: string;
  };
  logistics: {
    preferredStart?: string;
    targetLaunch?: string;
    deadlineFixed: boolean;
    deadlineConstraint?: string;
    budgetBand: BudgetBand;
    approvalProcess: string;
  };
  value: {
    successCriteria: string;
    ongoingNeeds: OngoingNeed[];
    additionalNotes?: string;
  };
  consent: true;
  startedAt: string;
};

export type ProjectInquiryTransport = ProjectInquiryPayloadV1 & {
  website?: string;
};

export type InquiryFieldErrors = Record<string, string>;

const emptyServiceDetails = (): Record<ServiceGroup, string> => ({
  brand: '',
  website: '',
  product: '',
  editorial: '',
  not_sure: '',
});

export const createEmptyInquiryState = (): ProjectInquiryFormState => ({
  schemaVersion: PROJECT_INQUIRY_SCHEMA_VERSION,
  idempotencyKey: '',
  startedAt: '',
  name: '',
  organizationOrProject: '',
  email: '',
  decisionRole: '',
  finalApprover: '',
  idea: '',
  whyNow: '',
  desiredOutcome: '',
  audience: '',
  services: [],
  serviceDetails: emptyServiceDetails(),
  requiredDeliverables: '',
  existingAssets: [],
  assetNotes: '',
  references: [],
  visualDirection: '',
  contentResponsibility: '',
  contentNotes: '',
  preferredStart: '',
  targetLaunch: '',
  deadlineFixed: null,
  deadlineConstraintReasons: [],
  deadlineConstraint: '',
  budgetBand: '',
  approvalProcess: '',
  successOutcomes: [],
  successCriteria: '',
  ongoingNeeds: [],
  additionalNotes: '',
  consent: false,
});
