export type ScenarioPreset = "Conservative" | "Expected" | "Ambitious" | "Custom";
export type AiCostingMode = "SimplePricing" | "UsageBasedEstimate";
export type SubjectPreset = "MostlyHumanities" | "Mixed" | "MostlySTEM";

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
  aiInferenceCostAnnual: number;
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
  schoolProjection5y: YearRow[];
  schoolRoiByYear: (number | null)[];
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
  adoption: AdoptionSummary;
  reductions: Reductions;
  usage: UsageSummary;
  educationalValue: EducationalValueSummary;
  cashSavings: CashSavingsSummary;
  costs: CostSummary;
  year1: Year1Metrics;
  projection5y: YearRow[];
  sensitivities: SensitivitySummary;
};
