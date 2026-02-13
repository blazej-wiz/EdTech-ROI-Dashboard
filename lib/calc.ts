// lib/calc.ts
export type ScenarioPreset = "Conservative" | "Expected" | "Ambitious" | "Custom";

export type Inputs = {
  // Required
  students: number;      // Inputs!B5
  teachersFTE: number;   // Inputs!B6
  adoptionRate: number;  // Inputs!B7 (0..1)

  // Advanced
  avgSalary: number;         // Inputs!B10
  weeksPerYear: number;      // Inputs!B13
  weeklyHoursTotal: number;  // Inputs!B17
  weeklyMarkingHours: number;// Inputs!B18

  preset: ScenarioPreset;     // Inputs!B21

  // Custom-only inputs (Inputs!B24,B25,B30,B36)
  markingReductionCustom: number;
  otherReductionCustom: number;
  sickdayReductionCustom: number;
  attritionReductionCustom: number;

  sickDaysPerTeacher: number; // Inputs!B28
  supplyDailyCost: number;    // Inputs!B31
  attritionRate: number;      // Inputs!B34
  replacementCost: number;    // Inputs!B37

  // AI pricing (Inputs!J2,J3,J4,J5,J7,J8,J9)
  aiBasePrice: number;
  aiPricePerTeacher: number;
  tier1StudentLimit: number;
  tier2StudentLimit: number;
  tier1PricePerStudent: number; // present but not used below tier1 in your sheet
  tier2PricePerStudent: number;
  tier3PricePerStudent: number;

  trainingOneTime: number; // Inputs!B41
  setupOneTime: number;    // Inputs!B42
};

export type YearRow = {
  year: number;
  costs: number;
  savings: number;
  netBenefit: number;
  cumulativeNetBenefit: number;
  cumulativeRoi: number | null; // Projection5Y row 13 logic
};

export type SensitivityPoint = {
  label: string;          // e.g. "10%"
  rate: number;           // 0.10
  annualSupplySavings: number;
};

export type Outputs = {
  adoptedStudents: number;  // Inputs!B8
  adoptedTeachers: number;  // Inputs!B9

  // Costs
  aiSubscriptionAnnual: number; // Inputs!B40
  totalCostYear1: number;       // Model!B38

  // Savings (cash)
  annualSupplySavings: number;     // Model!B26
  annualAttritionSavings: number;  // Model!B29
  annualSavingsCash: number;       // Model!B30

  // ROI (Year 1)
  netBenefitYear1: number;      // Model!B31
  roiYear1: number | null;      // Model!B32
  paybackMonths: number | null; // Model!B33
  breakEvenAiAnnual: number;    // Model!B39

  // Educational value
  weeklyHoursSavedPerTeacher: number;        // Model!B21
  annualHoursSavedTotal: number;             // Model!B22
  annualValueOfReallocatedTimeGBP: number;   // Model!B24

  // Per-student framing
  aiCostPerAdoptedStudent: number | null;
  netBenefitPerAdoptedStudentYear1: number | null;

  // 5-year projection (aligned to Projection5Y)
  projection5y: YearRow[];

  // ROI per year for animation (cumulative ROI so it changes Year 1..5)
  roiByYear: (number | null)[];

  // NEW: Key-question outputs
  absenceSensitivity: SensitivityPoint[]; // 10/20/30% absence drop savings (supply cover)
  retentionImpact5Annual: number;         // annual £ savings at 5% attrition reduction
};

const ASSUMPTIONS: Record<
  Exclude<ScenarioPreset, "Custom">,
  { marking: number; other: number; sick: number; attrition: number }
> = {
  Conservative: { marking: 0.25, other: 0.15, sick: 0.03, attrition: 0.01 },
  Expected:     { marking: 0.45, other: 0.25, sick: 0.05, attrition: 0.02 },
  Ambitious:    { marking: 0.8,  other: 0.4,  sick: 0.08, attrition: 0.04 },
};

export const DEFAULTS: Inputs = {
  students: 700,
  teachersFTE: 50,
  adoptionRate: 1,

  avgSalary: 48892,
  weeksPerYear: 39,
  weeklyHoursTotal: 54,
  weeklyMarkingHours: 10,

  preset: "Expected",
  markingReductionCustom: 0.45,
  otherReductionCustom: 0.25,
  sickdayReductionCustom: 0.05,
  attritionReductionCustom: 0.02,

  sickDaysPerTeacher: 7,
  supplyDailyCost: 170,
  attritionRate: 0.088,
  replacementCost: 20000,

  aiBasePrice: 300,
  aiPricePerTeacher: 30,
  tier1StudentLimit: 100,
  tier2StudentLimit: 500,
  tier1PricePerStudent: 0,
  tier2PricePerStudent: 1,
  tier3PricePerStudent: 2,

  trainingOneTime: 2000,
  setupOneTime: 750,
};

function safe(n: number) {
  return Number.isFinite(n) ? n : 0;
}
function nonneg(n: number) {
  return Math.max(0, safe(n));
}
function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function resolveReductions(i: Inputs) {
  if (i.preset === "Custom") {
    return {
      marking: clamp01(i.markingReductionCustom),
      other: clamp01(i.otherReductionCustom),
      sick: clamp01(i.sickdayReductionCustom),
      attrition: clamp01(i.attritionReductionCustom),
    };
  }
  return ASSUMPTIONS[i.preset];
}

function computeAiSubscriptionAnnual(i: Inputs, adoptedStudents: number, adoptedTeachers: number) {
  // Matches Inputs!B40 exactly:
  // = J2 + (B9 * J3) + IF(B8 > J5, ((J5-J4)*J8) + ((B8-J5)*J9), IF(B8 > J4, (B8-J4)*J8, 0))
  const base = nonneg(i.aiBasePrice);
  const perTeacher = nonneg(i.aiPricePerTeacher);

  const t1 = nonneg(i.tier1StudentLimit);
const t2Raw = nonneg(i.tier2StudentLimit);
// Guardrail: tier2 must be >= tier1 (avoid negative pricing segments)
const t2 = Math.max(t1, t2Raw);


  const p2 = nonneg(i.tier2PricePerStudent);
  const p3 = nonneg(i.tier3PricePerStudent);

  let studentPart = 0;
  if (adoptedStudents > t2) {
    studentPart = (t2 - t1) * p2 + (adoptedStudents - t2) * p3;
  } else if (adoptedStudents > t1) {
    studentPart = (adoptedStudents - t1) * p2;
  } else {
    studentPart = 0;
  }

  return base + adoptedTeachers * perTeacher + studentPart;
}

export function calculate(raw: Partial<Inputs>): Outputs {
  const i: Inputs = { ...DEFAULTS, ...raw };

  const students = nonneg(i.students);
  const teachers = nonneg(i.teachersFTE);
  const adoptionRate = clamp01(i.adoptionRate);

  // Inputs!B8 and Inputs!B9
  const adoptedStudents = students * adoptionRate;
  const adoptedTeachers = teachers * adoptionRate;

  const weeks = nonneg(i.weeksPerYear);
  const weeklyTotal = nonneg(i.weeklyHoursTotal);
  // Guardrail: marking hours cannot exceed total hours
const weeklyMarkingRaw = nonneg(i.weeklyMarkingHours);
const weeklyMarking = Math.min(weeklyMarkingRaw, weeklyTotal);
const weeklyOther = Math.max(weeklyTotal - weeklyMarking, 0);


  const r = resolveReductions(i);

  // Model sheet logic
  const weeklyHoursSavedPerTeacher =
    weeklyMarking * r.marking + weeklyOther * r.other; // Model!B21
  const annualHoursSavedTotal = weeklyHoursSavedPerTeacher * weeks * adoptedTeachers; // Model!B22

  const annualHoursPerTeacher = weeks * weeklyTotal;
  const hourlyRate =
    annualHoursPerTeacher > 0 ? nonneg(i.avgSalary) / annualHoursPerTeacher : 0; // Model!B23
  const annualValueOfReallocatedTimeGBP = annualHoursSavedTotal * hourlyRate; // Model!B24

  const sickDaysSavedPerTeacher = nonneg(i.sickDaysPerTeacher) * r.sick; // Model!B25
  const annualSupplySavings =
    sickDaysSavedPerTeacher * adoptedTeachers * nonneg(i.supplyDailyCost); // Model!B26

const baselineLeavers = teachers * clamp01(i.attritionRate); // baseline school-wide leavers
const leaversAvoided = baselineLeavers * r.attrition * adoptionRate; // effect applies to adopting share
  const annualAttritionSavings = leaversAvoided * nonneg(i.replacementCost); // Model!B29

  const annualSavingsCash = annualSupplySavings + annualAttritionSavings; // Model!B30

  const aiSubscriptionAnnual = computeAiSubscriptionAnnual(i, adoptedStudents, adoptedTeachers); // Inputs!B40
  const totalCostYear1 =
    aiSubscriptionAnnual + nonneg(i.trainingOneTime) + nonneg(i.setupOneTime); // Model!B38

  const netBenefitYear1 = annualSavingsCash - totalCostYear1; // Model!B31
  const roiYear1 = totalCostYear1 > 0 ? netBenefitYear1 / totalCostYear1 : null; // Model!B32
  const paybackMonths =
    annualSavingsCash > 0 ? totalCostYear1 / (annualSavingsCash / 12) : null; // Model!B33

  const breakEvenAiAnnual = Math.max(
    0,
    annualSavingsCash - nonneg(i.trainingOneTime) - nonneg(i.setupOneTime)
  ); // Model!B39

  const aiCostPerAdoptedStudent =
    adoptedStudents > 0 ? aiSubscriptionAnnual / adoptedStudents : null;
  const netBenefitPerAdoptedStudentYear1 =
    adoptedStudents > 0 ? netBenefitYear1 / adoptedStudents : null;

  // Projection5Y alignment
  const projection5y: YearRow[] = [];
  const roiByYear: (number | null)[] = [];

  let cumCosts = 0;
  let cumSavings = 0;
  let cumulativeNet = 0;

  for (let year = 1; year <= 5; year++) {
    const costs =
      year === 1
        ? aiSubscriptionAnnual + nonneg(i.trainingOneTime) + nonneg(i.setupOneTime)
        : aiSubscriptionAnnual;

    const savings = annualSavingsCash;
    const netBenefit = savings - costs;

    cumCosts += costs;
    cumSavings += savings;
    cumulativeNet += netBenefit;

    // Projection5Y row 13: cumulative ROI % = (cumSavings - cumCosts) / cumCosts
    const cumulativeRoi = cumCosts > 0 ? (cumSavings - cumCosts) / cumCosts : null;

    projection5y.push({
      year,
      costs,
      savings,
      netBenefit,
      cumulativeNetBenefit: cumulativeNet,
      cumulativeRoi,
    });

    // Use cumulative ROI for animation (changes each year; matches Excel projection)
    roiByYear.push(cumulativeRoi);
  }

  // NEW: Key questions (independent of preset reductions)
  // 1) "If absence drops by 10% / 20% / 30%, how much do we save?"
// This is purely supply cover savings among adopting teachers:
// sickDaysPerTeacher * adoptedTeachers * supplyDailyCost * dropRate
  const absenceRates = [0.1, 0.2, 0.3];
  const absenceSensitivity: SensitivityPoint[] = absenceRates.map((rate) => {
    const annualSupplySavingsAtRate =
nonneg(i.sickDaysPerTeacher) * rate * adoptedTeachers * nonneg(i.supplyDailyCost);
    return {
      label: `${Math.round(rate * 100)}%`,
      rate,
      annualSupplySavings: annualSupplySavingsAtRate,
    };
  });

  // 2) "Financial impact if attrition (leavers) drops by 5% (relative)"
// i.e., avoid 5% of baseline leavers × replacement cost

  const retentionImpact5Annual =
  baselineLeavers * 0.05 * adoptionRate * nonneg(i.replacementCost);


  return {
    adoptedStudents,
    adoptedTeachers,

    aiSubscriptionAnnual,
    totalCostYear1,

    annualSupplySavings,
    annualAttritionSavings,
    annualSavingsCash,

    netBenefitYear1,
    roiYear1,
    paybackMonths,
    breakEvenAiAnnual,

    weeklyHoursSavedPerTeacher,
    annualHoursSavedTotal,
    annualValueOfReallocatedTimeGBP,

    aiCostPerAdoptedStudent,
    netBenefitPerAdoptedStudentYear1,

    projection5y,
    roiByYear,

    absenceSensitivity,
    retentionImpact5Annual,
  };
}
