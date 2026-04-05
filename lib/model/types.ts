export type ScenarioPreset = "Conservative" | "Expected" | "Ambitious" | "Custom";
export type SchoolTypePreset = "Primary" | "Secondary";
export type AiCostingMode = "SimplePricing" | "UsageBasedEstimate";
export type SubjectPreset = "MostlyHumanities" | "Mixed" | "MostlySTEM";
export type QaCheckStatus = "pass" | "warn" | "fail";
export type AssumptionControlType = "number" | "percent" | "select";
export type AssumptionGroupId =
  | "school-profile"
  | "assessment-usage"
  | "impact-assumptions"
  | "workload-time"
  | "absence-cover"
  | "retention-recruitment"
  | "commercial-onboarding"
  | "ai-usage-costing";

export type Inputs = {
  students: number;
  teachersFTE: number;
  adoptionRate: number;
  avgSalary: number;
  weeksPerYear: number;
  weeklyHoursTotal: number;
  weeklyMarkingHours: number;
  weeklyAiAdminHours: number;
  preset: ScenarioPreset;
  schoolTypePreset: SchoolTypePreset;
  markingReductionCustom: number;
  otherReductionCustom: number;
  sickdayReductionCustom: number;
  attritionReductionCustom: number;
  sickDaysPerTeacher: number;
  supplyDailyCost: number;
  attritionRate: number;
  replacementCost: number;
  aiBasePrice: number;
  aiPricePerTeacher: number;
  tier1StudentLimit: number;
  tier2StudentLimit: number;
  tier1PricePerStudent: number;
  tier2PricePerStudent: number;
  tier3PricePerStudent: number;
  trainingOneTime: number;
  setupOneTime: number;
  aiCostingMode: AiCostingMode;
  baseInputTokensPerAssessment: number;
  baseOutputTokensPerAssessment: number;
  tokenMultMaths: number;
  tokenMultEnglish: number;
  tokenMultScience: number;
  tokenMultHumanities: number;
  tokenMultOther: number;
  gbpPer1MInputTokens: number;
  gbpPer1MOutputTokens: number;
  licenceFeeAnnual: number;
  examParticipationRate: number;
  assessmentsPerStudentPerYear: number;
  subjectPreset: SubjectPreset;
  presetHumanitiesWeight: number;
  presetStemWeight: number;
};

export type YearRow = {
  year: number;
  costs: number;
  savings: number;
  netBenefit: number;
  cumulativeNetBenefit: number;
  cumulativeRoi: number | null;
};

export type MonthlyCumulativeNetPoint = {
  month: number;
  cumulativeNet: number;
};

export type ProjectionSummary = {
  projection5y: YearRow[];
  roiByYear: (number | null)[];
  monthlyCumulativeNetData: MonthlyCumulativeNetPoint[];
  breakEvenMonth: number | null;
};

export type SensitivityPoint = {
  label: string;
  rate: number;
  annualSupplySavings: number;
};

export type Outputs = {
  adoptedStudents: number;
  adoptedTeachers: number;
  aiSubscriptionAnnual: number;
  licenceFeeAnnual: number;
  aiInferenceCostAnnual: number;
  aiCostingMode: AiCostingMode;
  schoolRecurringAnnualCost: number;
  schoolTotalCostYear1: number;
  internalRecurringAnnualCost: number;
  internalTotalCostYear1: number;
  estimatedAssessmentsAnnual: number;
  estimatedInputTokensAnnual: number;
  estimatedOutputTokensAnnual: number;
  annualSupplySavings: number;
  annualAttritionSavings: number;
  annualSavingsCash: number;
  schoolNetBenefitYear1: number;
  schoolRoiYear1: number | null;
  internalNetBenefitYear1: number;
  internalRoiYear1: number | null;
  breakEvenAiAnnual: number;
  weeklyHoursSavedPerTeacher: number;
  weeklyMarkingHoursSavedPerTeacher: number;
  weeklyAiAdminHoursSavedPerTeacher: number;
  annualHoursSavedTotal: number;
  annualValueOfReallocatedTimeGBP: number;
  aiCostPerAdoptedStudent: number | null;
  netBenefitPerAdoptedStudentYear1: number | null;
  schoolProjection5y: YearRow[];
  schoolRoiByYear: (number | null)[];
  internalProjection5y: YearRow[];
  internalRoiByYear: (number | null)[];
  absenceSensitivity: SensitivityPoint[];
  retentionImpact5Annual: number;
};

export type Reductions = {
  marking: number;
  other: number;
  sick: number;
  attrition: number;
};

export type SubjectWeights = {
  maths: number;
  english: number;
  science: number;
  humanities: number;
  other: number;
};

export type AdoptionSummary = {
  students: number;
  teachers: number;
  adoptionRate: number;
  adoptedStudents: number;
  adoptedTeachers: number;
};

export type UsageSummary = {
  estimatedAssessmentsAnnual: number;
  estimatedInputTokensAnnual: number;
  estimatedOutputTokensAnnual: number;
  subjectWeights: SubjectWeights;
  weightedTokenMultiplier: number;
};

export type EducationalValueSummary = {
  weeklyMarkingHours: number;
  weeklyAiAdminHours: number;
  weeklyMarkingHoursSavedPerTeacher: number;
  weeklyAiAdminHoursSavedPerTeacher: number;
  weeklyHoursSavedPerTeacher: number;
  annualHoursSavedTotal: number;
  hourlyRate: number;
  annualValueOfReallocatedTimeGBP: number;
};

export type CashSavingsSummary = {
  supplySavings: number;
  retentionSavings: number;
  recruitmentSavings: number;
  annualAttritionSavings: number;
  annualSavingsCash: number;
  baselineLeavers: number;
  leaversAvoided: number;
};

export type CostSummary = {
  aiCostingMode: AiCostingMode;
  licenceFeeAnnual: number;
  aiInferenceCostAnnualEstimate: number;
  aiInferenceCostAnnualInModel: number;
  trainingOneTime: number;
  setupOneTime: number;
  school: CostBasis;
  internal: CostBasis;
};

export type CostBasis = {
  recurringAnnualCost: number;
  totalCostYear1: number;
};

export type Year1Metrics = {
  netBenefitYear1: number;
  roiYear1: number | null;
  breakEvenAiAnnual: number;
  aiCostPerAdoptedStudent: number | null;
  netBenefitPerAdoptedStudentYear1: number | null;
};

export type SensitivitySummary = {
  absenceSensitivity: SensitivityPoint[];
  retentionImpact5Annual: number;
};

export type BreakdownRow = {
  key: string;
  label: string;
  value: number;
  displayUnit?: "currency" | "hours" | "count" | "percentage";
  note?: string;
};

export type AssumptionOption = {
  value: string;
  label: string;
};

export type AssumptionGuardrails = {
  min?: number;
  max?: number;
  note?: string;
};

export type GovernedAssumption = {
  id: keyof Inputs;
  label: string;
  group: AssumptionGroupId;
  value: number | string;
  unit: string;
  controlType: AssumptionControlType;
  definition: string;
  sourceNote: string;
  schoolTypes: SchoolTypePreset[];
  scenarioPresets?: ScenarioPreset[];
  visibleInSchoolView: boolean;
  visibleInInternalView: boolean;
  includedInCashRoi?: boolean;
  guardrails?: AssumptionGuardrails;
  assumptionVersion: string;
  lastUpdated?: string;
  options?: AssumptionOption[];
  editable: boolean;
  helperText?: string;
  presetValue?: number | null;
  presetControlled?: boolean;
};

export type GovernedAssumptionGroup = {
  id: AssumptionGroupId;
  label: string;
  description: string;
  assumptions: GovernedAssumption[];
};

export type ScenarioPresetDefinition = {
  id: ScenarioPreset;
  label: string;
  description: string;
  affectedAssumptionIds: (keyof Inputs)[];
  reductions?: Reductions;
};

export type SchoolTypePresetDefinition = {
  id: SchoolTypePreset;
  label: string;
  description: string;
  defaultsNote: string;
  defaults: Partial<Inputs>;
};

export type AssumptionsGovernanceMetadata = {
  assumptionSetVersion: string;
  generatedDate: string;
  lastUpdated: string;
  defaultsSourceNote: string;
  propagationNote: string;
};

export type AssumptionsGovernanceSummary = {
  activeScenarioPreset: ScenarioPreset;
  activeSchoolTypePreset: SchoolTypePreset;
  groups: GovernedAssumptionGroup[];
  scenarioPresets: ScenarioPresetDefinition[];
  schoolTypePresets: SchoolTypePresetDefinition[];
  metadata: AssumptionsGovernanceMetadata;
};

export type UsageContext = {
  teachers: number;
  students: number;
  adoptionRate: number;
  adoptedTeachers: number;
  adoptedStudents: number;
  estimatedAssessmentsAnnual: number;
  estimatedInputTokensAnnual: number;
  estimatedOutputTokensAnnual: number;
  aiCostingMode: AiCostingMode;
};

export type CommercialSummary = {
  annualLicenceRevenue: number;
  annualAiCostEstimate: number;
  annualAiCostInModel: number;
  annualContributionAfterAiCost: number;
  contributionMarginPct: number | null;
  recurringCostBasisInModel: number;
  year1CostBasisInModel: number;
  costBasisLabel: string;
  costBasisNote: string;
};

export type OutputMetadata = {
  modelVersion: string;
  generatedDate: string;
  assumptionSetVersion: string;
  defaultsSourceNote: string;
  propagationNote: string;
  lastUpdated: string;
  includedNotes: string[];
  excludedNotes: string[];
};

export type QaCheck = {
  id: string;
  label: string;
  status: QaCheckStatus;
  message: string;
};

export type QaSummary = {
  overallStatus: QaCheckStatus;
  counts: Record<QaCheckStatus, number>;
  checks: QaCheck[];
};

export type InternalAdminSummary = {
  assumptionsGovernance: AssumptionsGovernanceSummary;
  year1CostBreakdown: {
    rows: BreakdownRow[];
    total: number;
  };
  ongoingCostBreakdown: {
    rows: BreakdownRow[];
    total: number;
  };
  cashSavingsBreakdown: {
    rows: BreakdownRow[];
    total: number;
  };
  educationalValueBreakdown: {
    rows: BreakdownRow[];
    totalAnnualValueOfReallocatedTimeGBP: number;
  };
  usageContext: UsageContext;
  commercialSummary: CommercialSummary;
  qaChecks: QaSummary;
  projectionSummary: ProjectionSummary;
  sensitivitySummary: SensitivitySummary;
  outputMetadata: OutputMetadata;
};

export type RoiModel = {
  inputs: Inputs;
  adoption: AdoptionSummary;
  reductions: Reductions;
  usage: UsageSummary;
  educationalValue: EducationalValueSummary;
  cashSavings: CashSavingsSummary;
  costs: CostSummary;
  schoolYear1: Year1Metrics;
  internalYear1: Year1Metrics;
  schoolProjectionSummary: ProjectionSummary;
  schoolProjection5y: YearRow[];
  schoolRoiByYear: (number | null)[];
  internalProjectionSummary: ProjectionSummary;
  internalProjection5y: YearRow[];
  internalRoiByYear: (number | null)[];
  sensitivities: SensitivitySummary;
};

export type SchoolView = {
  adoptedStudents: number;
  adoptedTeachers: number;
  annualSavingsCash: number;
  totalCostYear1: number;
  netBenefitYear1: number;
  roiYear1: number | null;
  impact5Year: number;
  annualHoursSavedTotal: number;
  annualValueOfReallocatedTimeGBP: number;
};

export type InternalView = {
  assumptionsGovernance: AssumptionsGovernanceSummary;
  adoption: AdoptionSummary;
  reductions: Reductions;
  usage: UsageSummary;
  educationalValue: EducationalValueSummary;
  cashSavings: CashSavingsSummary;
  costs: CostSummary;
  year1: Year1Metrics;
  projectionSummary: ProjectionSummary;
  projection5y: YearRow[];
  sensitivities: SensitivitySummary;
};
