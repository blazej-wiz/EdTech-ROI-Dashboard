import { ASSUMPTIONS } from "./assumptions";
import { DEFAULTS } from "./defaults";
import { resolveReductions } from "./assumptions";
import {
  AssumptionsGovernanceMetadata,
  AssumptionsGovernanceSummary,
  AssumptionControlType,
  AssumptionGroupId,
  GovernedAssumption,
  GovernedAssumptionGroup,
  Inputs,
  ScenarioPreset,
  ScenarioPresetDefinition,
  SchoolTypePreset,
  SchoolTypePresetDefinition,
} from "./types";

type AssumptionDefinition = {
  id: keyof Inputs;
  label: string;
  group: AssumptionGroupId;
  unit: string;
  controlType: AssumptionControlType;
  definition: string;
  sourceNote: string;
  schoolTypes: SchoolTypePreset[];
  scenarioPresets?: ScenarioPreset[];
  visibleInSchoolView: boolean;
  visibleInInternalView: boolean;
  includedInCashRoi?: boolean;
  guardrails?: {
    min?: number;
    max?: number;
    note?: string;
  };
  assumptionVersion: string;
  lastUpdated?: string;
  options?: { value: string; label: string }[];
};

const ALL_SCHOOL_TYPES: SchoolTypePreset[] = ["Primary", "Secondary"];
const GOVERNANCE_VERSION = "2026.03-phase2";
const GOVERNANCE_UPDATED_DATE = "27 March 2026";

const GROUPS: Record<
  AssumptionGroupId,
  { label: string; description: string }
> = {
  "school-profile": {
    label: "School profile",
    description: "Core context assumptions that shape the adoption and baseline school profile.",
  },
  "assessment-usage": {
    label: "Assessment usage",
    description: "Inputs that drive estimated assessment activity and AI usage volume.",
  },
  "impact-assumptions": {
    label: "Impact assumptions",
    description: "Governed reduction assumptions used by scenario presets or custom impact settings.",
  },
  "workload-time": {
    label: "Workload and time",
    description: "Teacher workload and salary assumptions used for educational value calculations.",
  },
  "absence-cover": {
    label: "Absence and cover",
    description: "Absence and supply-cover assumptions used for cash savings estimates.",
  },
  "retention-recruitment": {
    label: "Retention and recruitment",
    description: "Teacher attrition and replacement assumptions used for cash savings estimates.",
  },
  "commercial-onboarding": {
    label: "Commercial and onboarding",
    description: "Commercial assumptions that define licence and implementation cost treatment.",
  },
  "ai-usage-costing": {
    label: "AI usage costing",
    description: "Token and pricing assumptions used for internal AI cost estimation.",
  },
};

const SCENARIO_PRESET_DEFINITIONS: ScenarioPresetDefinition[] = [
  {
    id: "Conservative",
    label: "Conservative",
    description: "Lower expected impact on marking, admin time, absence, and attrition.",
    affectedAssumptionIds: [
      "markingReductionCustom",
      "otherReductionCustom",
      "sickdayReductionCustom",
      "attritionReductionCustom",
    ],
    reductions: ASSUMPTIONS.Conservative,
  },
  {
    id: "Expected",
    label: "Expected",
    description: "Balanced default scenario used as the current governed baseline.",
    affectedAssumptionIds: [
      "markingReductionCustom",
      "otherReductionCustom",
      "sickdayReductionCustom",
      "attritionReductionCustom",
    ],
    reductions: ASSUMPTIONS.Expected,
  },
  {
    id: "Ambitious",
    label: "Ambitious",
    description: "Higher expected impact assumptions for strong adoption and delivery.",
    affectedAssumptionIds: [
      "markingReductionCustom",
      "otherReductionCustom",
      "sickdayReductionCustom",
      "attritionReductionCustom",
    ],
    reductions: ASSUMPTIONS.Ambitious,
  },
  {
    id: "Custom",
    label: "Custom",
    description: "Directly editable impact assumptions for internal modelling overrides.",
    affectedAssumptionIds: [
      "markingReductionCustom",
      "otherReductionCustom",
      "sickdayReductionCustom",
      "attritionReductionCustom",
    ],
  },
];

const SCHOOL_TYPE_PRESET_DEFINITIONS: SchoolTypePresetDefinition[] = [
  {
    id: "Primary",
    label: "Primary",
    description: "Scaffolding for future default sets tuned to Primary school profiles.",
    defaultsNote: "Placeholder defaults only in Phase 2. No unique calculation logic is applied yet.",
    defaults: {
      schoolTypePreset: "Primary",
      subjectPreset: "MostlyHumanities",
      assessmentsPerStudentPerYear: DEFAULTS.assessmentsPerStudentPerYear,
    },
  },
  {
    id: "Secondary",
    label: "Secondary",
    description: "Scaffolding for future default sets tuned to Secondary school profiles.",
    defaultsNote: "Placeholder defaults only in Phase 2. Current dashboard behavior remains shared.",
    defaults: {
      schoolTypePreset: "Secondary",
      subjectPreset: "Mixed",
      assessmentsPerStudentPerYear: DEFAULTS.assessmentsPerStudentPerYear,
    },
  },
];

const ASSUMPTION_DEFINITIONS: AssumptionDefinition[] = [
  {
    id: "schoolTypePreset",
    label: "School type preset",
    group: "school-profile",
    unit: "type",
    controlType: "select",
    definition: "Future-facing school-type scaffold for governed defaults.",
    sourceNote: "Phase 2 placeholder for future school-type default sets.",
    schoolTypes: ALL_SCHOOL_TYPES,
    visibleInSchoolView: false,
    visibleInInternalView: true,
    assumptionVersion: GOVERNANCE_VERSION,
    lastUpdated: GOVERNANCE_UPDATED_DATE,
    options: [
      { value: "Primary", label: "Primary" },
      { value: "Secondary", label: "Secondary" },
    ],
  },
  {
    id: "teachersFTE",
    label: "Number of teachers",
    group: "school-profile",
    unit: "teachers",
    controlType: "number",
    definition: "Full-time equivalent teachers in scope for the model.",
    sourceNote: "User-entered school profile assumption.",
    schoolTypes: ALL_SCHOOL_TYPES,
    visibleInSchoolView: true,
    visibleInInternalView: true,
    includedInCashRoi: true,
    guardrails: { min: 0 },
    assumptionVersion: GOVERNANCE_VERSION,
    lastUpdated: GOVERNANCE_UPDATED_DATE,
  },
  {
    id: "students",
    label: "Number of students",
    group: "school-profile",
    unit: "students",
    controlType: "number",
    definition: "Students in scope for school-level adoption and usage estimates.",
    sourceNote: "User-entered school profile assumption.",
    schoolTypes: ALL_SCHOOL_TYPES,
    visibleInSchoolView: true,
    visibleInInternalView: true,
    guardrails: { min: 0 },
    assumptionVersion: GOVERNANCE_VERSION,
    lastUpdated: GOVERNANCE_UPDATED_DATE,
  },
  {
    id: "adoptionRate",
    label: "Teachers using MySmartTeach",
    group: "school-profile",
    unit: "%",
    controlType: "percent",
    definition: "Share of teachers assumed to adopt MySmartTeach.",
    sourceNote: "User-entered scenario assumption for adoption coverage.",
    schoolTypes: ALL_SCHOOL_TYPES,
    visibleInSchoolView: true,
    visibleInInternalView: true,
    includedInCashRoi: true,
    guardrails: { min: 0, max: 1 },
    assumptionVersion: GOVERNANCE_VERSION,
    lastUpdated: GOVERNANCE_UPDATED_DATE,
  },
  {
    id: "preset",
    label: "Scenario preset",
    group: "school-profile",
    unit: "preset",
    controlType: "select",
    definition: "Preset controlling the reduction assumptions for impact modelling.",
    sourceNote: "Internal governance preset controlling the four impact reduction assumptions.",
    schoolTypes: ALL_SCHOOL_TYPES,
    scenarioPresets: ["Conservative", "Expected", "Ambitious", "Custom"],
    visibleInSchoolView: true,
    visibleInInternalView: true,
    assumptionVersion: GOVERNANCE_VERSION,
    lastUpdated: GOVERNANCE_UPDATED_DATE,
    options: SCENARIO_PRESET_DEFINITIONS.map((preset) => ({
      value: preset.id,
      label: preset.label,
    })),
  },
  {
    id: "examParticipationRate",
    label: "Students using MySmartTeach for assessments",
    group: "assessment-usage",
    unit: "%",
    controlType: "percent",
    definition: "Share of adopted students assumed to participate in AI-assisted assessments.",
    sourceNote: "Usage assumption for assessment volume estimation.",
    schoolTypes: ALL_SCHOOL_TYPES,
    visibleInSchoolView: true,
    visibleInInternalView: true,
    guardrails: { min: 0, max: 1 },
    assumptionVersion: GOVERNANCE_VERSION,
    lastUpdated: GOVERNANCE_UPDATED_DATE,
  },
  {
    id: "assessmentsPerStudentPerYear",
    label: "Assessments per student per year",
    group: "assessment-usage",
    unit: "assessments/year",
    controlType: "number",
    definition: "Average annual assessment events per participating student.",
    sourceNote: "Usage assumption for AI cost and assessment volume estimates.",
    schoolTypes: ALL_SCHOOL_TYPES,
    visibleInSchoolView: true,
    visibleInInternalView: true,
    guardrails: { min: 1, max: 20 },
    assumptionVersion: GOVERNANCE_VERSION,
    lastUpdated: GOVERNANCE_UPDATED_DATE,
  },
  {
    id: "subjectPreset",
    label: "Subject focus",
    group: "assessment-usage",
    unit: "preset",
    controlType: "select",
    definition: "Subject mix preset used to estimate token usage by curriculum emphasis.",
    sourceNote: "Subject weighting preset used in token multiplier estimation.",
    schoolTypes: ALL_SCHOOL_TYPES,
    visibleInSchoolView: true,
    visibleInInternalView: true,
    assumptionVersion: GOVERNANCE_VERSION,
    lastUpdated: GOVERNANCE_UPDATED_DATE,
    options: [
      { value: "MostlyHumanities", label: "Mostly humanities" },
      { value: "Mixed", label: "Mixed" },
      { value: "MostlySTEM", label: "Mostly STEM" },
    ],
  },
  {
    id: "markingReductionCustom",
    label: "Marking time reduction",
    group: "impact-assumptions",
    unit: "%",
    controlType: "percent",
    definition: "Estimated share of marking time reduced by MySmartTeach.",
    sourceNote: "Governed by the active scenario preset unless Custom is selected.",
    schoolTypes: ALL_SCHOOL_TYPES,
    scenarioPresets: ["Conservative", "Expected", "Ambitious", "Custom"],
    visibleInSchoolView: false,
    visibleInInternalView: true,
    includedInCashRoi: false,
    guardrails: { min: 0, max: 1 },
    assumptionVersion: GOVERNANCE_VERSION,
    lastUpdated: GOVERNANCE_UPDATED_DATE,
  },
  {
    id: "otherReductionCustom",
    label: "Admin and planning time reduction",
    group: "impact-assumptions",
    unit: "%",
    controlType: "percent",
    definition: "Estimated share of admin and planning time reduced by MySmartTeach.",
    sourceNote: "Governed by the active scenario preset unless Custom is selected.",
    schoolTypes: ALL_SCHOOL_TYPES,
    scenarioPresets: ["Conservative", "Expected", "Ambitious", "Custom"],
    visibleInSchoolView: false,
    visibleInInternalView: true,
    includedInCashRoi: false,
    guardrails: { min: 0, max: 1 },
    assumptionVersion: GOVERNANCE_VERSION,
    lastUpdated: GOVERNANCE_UPDATED_DATE,
  },
  {
    id: "sickdayReductionCustom",
    label: "Sick day reduction",
    group: "impact-assumptions",
    unit: "%",
    controlType: "percent",
    definition: "Estimated reduction in teacher sick days attributable to MySmartTeach.",
    sourceNote: "Governed by the active scenario preset unless Custom is selected.",
    schoolTypes: ALL_SCHOOL_TYPES,
    scenarioPresets: ["Conservative", "Expected", "Ambitious", "Custom"],
    visibleInSchoolView: false,
    visibleInInternalView: true,
    includedInCashRoi: true,
    guardrails: { min: 0, max: 1 },
    assumptionVersion: GOVERNANCE_VERSION,
    lastUpdated: GOVERNANCE_UPDATED_DATE,
  },
  {
    id: "attritionReductionCustom",
    label: "Attrition reduction",
    group: "impact-assumptions",
    unit: "%",
    controlType: "percent",
    definition: "Estimated reduction in annual teacher attrition attributable to MySmartTeach.",
    sourceNote: "Governed by the active scenario preset unless Custom is selected.",
    schoolTypes: ALL_SCHOOL_TYPES,
    scenarioPresets: ["Conservative", "Expected", "Ambitious", "Custom"],
    visibleInSchoolView: false,
    visibleInInternalView: true,
    includedInCashRoi: true,
    guardrails: { min: 0, max: 1 },
    assumptionVersion: GOVERNANCE_VERSION,
    lastUpdated: GOVERNANCE_UPDATED_DATE,
  },
  {
    id: "weeksPerYear",
    label: "Weeks per year",
    group: "workload-time",
    unit: "weeks",
    controlType: "number",
    definition: "Number of working school weeks used for annualising teacher time calculations.",
    sourceNote: "Annualisation assumption for educational value.",
    schoolTypes: ALL_SCHOOL_TYPES,
    visibleInSchoolView: false,
    visibleInInternalView: true,
    includedInCashRoi: false,
    guardrails: { min: 1 },
    assumptionVersion: GOVERNANCE_VERSION,
    lastUpdated: GOVERNANCE_UPDATED_DATE,
  },
  {
    id: "weeklyMarkingHours",
    label: "Average marking hours per week",
    group: "workload-time",
    unit: "hours/week",
    controlType: "number",
    definition: "Average weekly marking workload per teacher.",
    sourceNote: "Workload baseline used for educational value calculations.",
    schoolTypes: ALL_SCHOOL_TYPES,
    visibleInSchoolView: true,
    visibleInInternalView: true,
    includedInCashRoi: false,
    guardrails: { min: 0 },
    assumptionVersion: GOVERNANCE_VERSION,
    lastUpdated: GOVERNANCE_UPDATED_DATE,
  },
  {
    id: "weeklyAiAdminHours",
    label: "Admin and planning hours per week",
    group: "workload-time",
    unit: "hours/week",
    controlType: "number",
    definition: "Average weekly admin and planning workload per teacher.",
    sourceNote: "Workload baseline used for educational value calculations.",
    schoolTypes: ALL_SCHOOL_TYPES,
    visibleInSchoolView: true,
    visibleInInternalView: true,
    includedInCashRoi: false,
    guardrails: { min: 0 },
    assumptionVersion: GOVERNANCE_VERSION,
    lastUpdated: GOVERNANCE_UPDATED_DATE,
  },
  {
    id: "avgSalary",
    label: "Average teacher salary",
    group: "workload-time",
    unit: "GBP/year",
    controlType: "number",
    definition: "Average teacher salary used to estimate the £-equivalent of reallocated time.",
    sourceNote: "Educational value conversion assumption only. Excluded from cash ROI.",
    schoolTypes: ALL_SCHOOL_TYPES,
    visibleInSchoolView: true,
    visibleInInternalView: true,
    includedInCashRoi: false,
    guardrails: { min: 0 },
    assumptionVersion: GOVERNANCE_VERSION,
    lastUpdated: GOVERNANCE_UPDATED_DATE,
  },
  {
    id: "sickDaysPerTeacher",
    label: "Average teacher sick days per year",
    group: "absence-cover",
    unit: "days/year",
    controlType: "number",
    definition: "Average teacher sickness absence days per teacher per year.",
    sourceNote: "Used to estimate supply cover savings when absence falls.",
    schoolTypes: ALL_SCHOOL_TYPES,
    visibleInSchoolView: true,
    visibleInInternalView: true,
    includedInCashRoi: true,
    guardrails: { min: 0 },
    assumptionVersion: GOVERNANCE_VERSION,
    lastUpdated: GOVERNANCE_UPDATED_DATE,
  },
  {
    id: "supplyDailyCost",
    label: "Supply cover cost per day",
    group: "absence-cover",
    unit: "GBP/day",
    controlType: "number",
    definition: "Average daily cost incurred when teacher absence requires supply cover.",
    sourceNote: "Cash ROI driver used in supply cover savings calculations.",
    schoolTypes: ALL_SCHOOL_TYPES,
    visibleInSchoolView: true,
    visibleInInternalView: true,
    includedInCashRoi: true,
    guardrails: { min: 0 },
    assumptionVersion: GOVERNANCE_VERSION,
    lastUpdated: GOVERNANCE_UPDATED_DATE,
  },
  {
    id: "attritionRate",
    label: "Teachers leaving each year",
    group: "retention-recruitment",
    unit: "%",
    controlType: "percent",
    definition: "Annual teacher attrition rate used to estimate leavers avoided.",
    sourceNote: "Retention cash savings driver. Current hint baseline is UK average ~8.8%.",
    schoolTypes: ALL_SCHOOL_TYPES,
    visibleInSchoolView: true,
    visibleInInternalView: true,
    includedInCashRoi: true,
    guardrails: { min: 0, max: 1 },
    assumptionVersion: GOVERNANCE_VERSION,
    lastUpdated: GOVERNANCE_UPDATED_DATE,
  },
  {
    id: "replacementCost",
    label: "Replacement cost per teacher",
    group: "retention-recruitment",
    unit: "GBP/teacher",
    controlType: "number",
    definition: "Recruitment and onboarding cost when a teacher must be replaced.",
    sourceNote: "Cash ROI driver used in recruitment or replacement savings calculations.",
    schoolTypes: ALL_SCHOOL_TYPES,
    visibleInSchoolView: true,
    visibleInInternalView: true,
    includedInCashRoi: true,
    guardrails: { min: 0 },
    assumptionVersion: GOVERNANCE_VERSION,
    lastUpdated: GOVERNANCE_UPDATED_DATE,
  },
  {
    id: "aiCostingMode",
    label: "AI costing mode",
    group: "commercial-onboarding",
    unit: "mode",
    controlType: "select",
    definition: "Determines whether internal AI cost is modelled as licence-only or usage-based.",
    sourceNote: "Commercial interpretation control for the internal model cost basis.",
    schoolTypes: ALL_SCHOOL_TYPES,
    visibleInSchoolView: false,
    visibleInInternalView: true,
    assumptionVersion: GOVERNANCE_VERSION,
    lastUpdated: GOVERNANCE_UPDATED_DATE,
    options: [
      { value: "SimplePricing", label: "Simple pricing (tiered)" },
      { value: "UsageBasedEstimate", label: "Usage-based (estimated)" },
    ],
  },
  {
    id: "licenceFeeAnnual",
    label: "MySmartTeach licence fee",
    group: "commercial-onboarding",
    unit: "GBP/year",
    controlType: "number",
    definition: "Annual licence price charged to the school.",
    sourceNote: "School-facing recurring cost and internal commercial baseline.",
    schoolTypes: ALL_SCHOOL_TYPES,
    visibleInSchoolView: false,
    visibleInInternalView: true,
    includedInCashRoi: true,
    guardrails: { min: 0 },
    assumptionVersion: GOVERNANCE_VERSION,
    lastUpdated: GOVERNANCE_UPDATED_DATE,
  },
  {
    id: "trainingOneTime",
    label: "One-off training cost",
    group: "commercial-onboarding",
    unit: "GBP",
    controlType: "number",
    definition: "One-off training cost included in Year 1 only.",
    sourceNote: "Year 1 cost basis component used in school and internal ROI calculations.",
    schoolTypes: ALL_SCHOOL_TYPES,
    visibleInSchoolView: false,
    visibleInInternalView: true,
    includedInCashRoi: true,
    guardrails: { min: 0 },
    assumptionVersion: GOVERNANCE_VERSION,
    lastUpdated: GOVERNANCE_UPDATED_DATE,
  },
  {
    id: "setupOneTime",
    label: "One-off setup cost",
    group: "commercial-onboarding",
    unit: "GBP",
    controlType: "number",
    definition: "One-off setup cost included in Year 1 only.",
    sourceNote: "Year 1 cost basis component used in school and internal ROI calculations.",
    schoolTypes: ALL_SCHOOL_TYPES,
    visibleInSchoolView: false,
    visibleInInternalView: true,
    includedInCashRoi: true,
    guardrails: { min: 0 },
    assumptionVersion: GOVERNANCE_VERSION,
    lastUpdated: GOVERNANCE_UPDATED_DATE,
  },
  {
    id: "baseInputTokensPerAssessment",
    label: "Base input tokens per assessment",
    group: "ai-usage-costing",
    unit: "tokens",
    controlType: "number",
    definition: "Estimated input token volume per assessment before subject weighting.",
    sourceNote: "Internal usage-cost estimate placeholder until telemetry is available.",
    schoolTypes: ALL_SCHOOL_TYPES,
    visibleInSchoolView: false,
    visibleInInternalView: true,
    assumptionVersion: GOVERNANCE_VERSION,
    lastUpdated: GOVERNANCE_UPDATED_DATE,
  },
  {
    id: "baseOutputTokensPerAssessment",
    label: "Base output tokens per assessment",
    group: "ai-usage-costing",
    unit: "tokens",
    controlType: "number",
    definition: "Estimated output token volume per assessment before subject weighting.",
    sourceNote: "Internal usage-cost estimate placeholder until telemetry is available.",
    schoolTypes: ALL_SCHOOL_TYPES,
    visibleInSchoolView: false,
    visibleInInternalView: true,
    assumptionVersion: GOVERNANCE_VERSION,
    lastUpdated: GOVERNANCE_UPDATED_DATE,
  },
  {
    id: "tokenMultMaths",
    label: "Maths token multiplier",
    group: "ai-usage-costing",
    unit: "multiplier",
    controlType: "number",
    definition: "Subject multiplier applied to base token assumptions for Maths assessments.",
    sourceNote: "Internal token-model assumption.",
    schoolTypes: ALL_SCHOOL_TYPES,
    visibleInSchoolView: false,
    visibleInInternalView: true,
    assumptionVersion: GOVERNANCE_VERSION,
    lastUpdated: GOVERNANCE_UPDATED_DATE,
  },
  {
    id: "tokenMultEnglish",
    label: "English token multiplier",
    group: "ai-usage-costing",
    unit: "multiplier",
    controlType: "number",
    definition: "Subject multiplier applied to base token assumptions for English assessments.",
    sourceNote: "Internal token-model assumption.",
    schoolTypes: ALL_SCHOOL_TYPES,
    visibleInSchoolView: false,
    visibleInInternalView: true,
    assumptionVersion: GOVERNANCE_VERSION,
    lastUpdated: GOVERNANCE_UPDATED_DATE,
  },
  {
    id: "tokenMultScience",
    label: "Science token multiplier",
    group: "ai-usage-costing",
    unit: "multiplier",
    controlType: "number",
    definition: "Subject multiplier applied to base token assumptions for Science assessments.",
    sourceNote: "Internal token-model assumption.",
    schoolTypes: ALL_SCHOOL_TYPES,
    visibleInSchoolView: false,
    visibleInInternalView: true,
    assumptionVersion: GOVERNANCE_VERSION,
    lastUpdated: GOVERNANCE_UPDATED_DATE,
  },
  {
    id: "tokenMultHumanities",
    label: "Humanities token multiplier",
    group: "ai-usage-costing",
    unit: "multiplier",
    controlType: "number",
    definition: "Subject multiplier applied to base token assumptions for Humanities assessments.",
    sourceNote: "Internal token-model assumption.",
    schoolTypes: ALL_SCHOOL_TYPES,
    visibleInSchoolView: false,
    visibleInInternalView: true,
    assumptionVersion: GOVERNANCE_VERSION,
    lastUpdated: GOVERNANCE_UPDATED_DATE,
  },
  {
    id: "tokenMultOther",
    label: "Other token multiplier",
    group: "ai-usage-costing",
    unit: "multiplier",
    controlType: "number",
    definition: "Subject multiplier applied to base token assumptions for Other assessments.",
    sourceNote: "Internal token-model assumption.",
    schoolTypes: ALL_SCHOOL_TYPES,
    visibleInSchoolView: false,
    visibleInInternalView: true,
    assumptionVersion: GOVERNANCE_VERSION,
    lastUpdated: GOVERNANCE_UPDATED_DATE,
  },
  {
    id: "gbpPer1MInputTokens",
    label: "GBP per 1M input tokens",
    group: "ai-usage-costing",
    unit: "GBP/1M",
    controlType: "number",
    definition: "Internal unit cost assumption for 1 million input tokens.",
    sourceNote: "Internal price placeholder for usage-based AI cost estimation.",
    schoolTypes: ALL_SCHOOL_TYPES,
    visibleInSchoolView: false,
    visibleInInternalView: true,
    assumptionVersion: GOVERNANCE_VERSION,
    lastUpdated: GOVERNANCE_UPDATED_DATE,
  },
  {
    id: "gbpPer1MOutputTokens",
    label: "GBP per 1M output tokens",
    group: "ai-usage-costing",
    unit: "GBP/1M",
    controlType: "number",
    definition: "Internal unit cost assumption for 1 million output tokens.",
    sourceNote: "Internal price placeholder for usage-based AI cost estimation.",
    schoolTypes: ALL_SCHOOL_TYPES,
    visibleInSchoolView: false,
    visibleInInternalView: true,
    assumptionVersion: GOVERNANCE_VERSION,
    lastUpdated: GOVERNANCE_UPDATED_DATE,
  },
];

const REDUCTION_FIELD_MAP: Record<
  "markingReductionCustom" | "otherReductionCustom" | "sickdayReductionCustom" | "attritionReductionCustom",
  keyof ReturnType<typeof resolveReductions>
> = {
  markingReductionCustom: "marking",
  otherReductionCustom: "other",
  sickdayReductionCustom: "sick",
  attritionReductionCustom: "attrition",
};

function getAssumptionValue(
  definition: AssumptionDefinition,
  inputs: Inputs
): { value: number | string; presetValue?: number | null; editable: boolean; helperText?: string; presetControlled?: boolean } {
  if (definition.id in REDUCTION_FIELD_MAP) {
    const reductionKey =
      REDUCTION_FIELD_MAP[
        definition.id as
          | "markingReductionCustom"
          | "otherReductionCustom"
          | "sickdayReductionCustom"
          | "attritionReductionCustom"
      ];
    const resolvedValue = resolveReductions(inputs)[reductionKey];
    const editable = inputs.preset === "Custom";

    return {
      value: editable ? inputs[definition.id] : resolvedValue,
      presetValue: resolvedValue,
      editable,
      helperText: editable
        ? "Custom scenario is active. Changes apply when you recalculate."
        : `Controlled by the ${inputs.preset} scenario preset.`,
      presetControlled: !editable,
    };
  }

  return {
    value: inputs[definition.id] as number | string,
    editable: true,
  };
}

function includeDefinition(
  definition: AssumptionDefinition,
  inputs: Inputs
) {
  if (
    definition.group === "ai-usage-costing" &&
    inputs.aiCostingMode !== "UsageBasedEstimate"
  ) {
    return false;
  }

  return true;
}

function buildGovernedAssumption(
  definition: AssumptionDefinition,
  inputs: Inputs
): GovernedAssumption {
  const valueMeta = getAssumptionValue(definition, inputs);

  return {
    id: definition.id,
    label: definition.label,
    group: definition.group,
    value: valueMeta.value,
    unit: definition.unit,
    controlType: definition.controlType,
    definition: definition.definition,
    sourceNote: definition.sourceNote,
    schoolTypes: definition.schoolTypes,
    scenarioPresets: definition.scenarioPresets,
    visibleInSchoolView: definition.visibleInSchoolView,
    visibleInInternalView: definition.visibleInInternalView,
    includedInCashRoi: definition.includedInCashRoi,
    guardrails: definition.guardrails,
    assumptionVersion: definition.assumptionVersion,
    lastUpdated: definition.lastUpdated,
    options: definition.options,
    editable: valueMeta.editable,
    helperText: valueMeta.helperText,
    presetValue: valueMeta.presetValue,
    presetControlled: valueMeta.presetControlled,
  };
}

export function buildAssumptionsGovernanceSummary(
  inputs: Inputs,
  metadata: AssumptionsGovernanceMetadata
): AssumptionsGovernanceSummary {
  const visibleAssumptions = ASSUMPTION_DEFINITIONS.filter((definition) =>
    includeDefinition(definition, inputs)
  ).map((definition) => buildGovernedAssumption(definition, inputs));

  const groups: GovernedAssumptionGroup[] = Object.entries(GROUPS).map(
    ([id, groupMeta]) => ({
      id: id as AssumptionGroupId,
      label: groupMeta.label,
      description: groupMeta.description,
      assumptions: visibleAssumptions.filter((assumption) => assumption.group === id),
    })
  );

  return {
    activeScenarioPreset: inputs.preset,
    activeSchoolTypePreset: inputs.schoolTypePreset,
    groups: groups.filter((group) => group.assumptions.length > 0),
    scenarioPresets: SCENARIO_PRESET_DEFINITIONS,
    schoolTypePresets: SCHOOL_TYPE_PRESET_DEFINITIONS,
    metadata,
  };
}

export {
  ASSUMPTION_DEFINITIONS,
  GOVERNANCE_UPDATED_DATE,
  GOVERNANCE_VERSION,
  GROUPS as ASSUMPTION_GROUPS,
  SCENARIO_PRESET_DEFINITIONS,
  SCHOOL_TYPE_PRESET_DEFINITIONS,
};
