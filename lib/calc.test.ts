import { describe, it, expect } from "vitest";
import {
  buildAssumptionsGovernanceSummary,
  buildInternalAdminSummary,
  buildInternalView,
  buildSchoolView,
  calculate,
  createModel,
  DEFAULTS,
} from "./calc";

function closeTo(a: number, b: number, tol = 1e-6) {
  expect(Math.abs(a - b)).toBeLessThanOrEqual(tol);
}

describe("ROI model", () => {
  it("adoptionRate=0 => no adopted teachers/students, no savings, no time saved", () => {
    const o = calculate({ ...DEFAULTS, adoptionRate: 0 });

    closeTo(o.adoptedTeachers, 0);
    closeTo(o.adoptedStudents, 0);

    closeTo(o.annualSupplySavings, 0);
    // Attrition savings should also be 0 if adoption gates benefit
    closeTo(o.annualAttritionSavings, 0);
    closeTo(o.annualSavingsCash, 0);

    closeTo(o.annualHoursSavedTotal, 0);
    closeTo(o.annualValueOfReallocatedTimeGBP, 0);
  });

  it("attritionRate=0 => no attrition savings", () => {
    const o = calculate({ ...DEFAULTS, attritionRate: 0 });
    closeTo(o.annualAttritionSavings, 0);
  });

  it("supplyDailyCost=0 => no supply savings", () => {
    const o = calculate({ ...DEFAULTS, supplyDailyCost: 0 });
    closeTo(o.annualSupplySavings, 0);
  });

  it("weeklyMarkingHours > weeklyHoursTotal is capped (no impossible hours)", () => {
    const o = calculate({
      ...DEFAULTS,
      weeklyHoursTotal: 10,
      weeklyMarkingHours: 20,
      preset: "Custom",
      markingReductionCustom: 1,
      otherReductionCustom: 1,
    });

    // weeklyHoursSavedPerTeacher should never exceed weeklyHoursTotal (10)
    expect(o.weeklyHoursSavedPerTeacher).toBeLessThanOrEqual(10 + 1e-9);
  });

  it("increasing training cost cannot improve ROI (holding savings constant)", () => {
    const base = calculate({ ...DEFAULTS, trainingOneTime: 1000 });
    const higher = calculate({ ...DEFAULTS, trainingOneTime: 3000 });

    // ROI should be <= (worse or equal) when costs go up
    // Note: ROI can be null if totalCostYear1 is 0; defaults won't be.
    expect(higher.schoolRoiYear1 as number).toBeLessThanOrEqual(
      base.schoolRoiYear1 as number
    );
  });

  it("key question: absence sensitivity increases with rate", () => {
    const o = calculate(DEFAULTS);
    const vals = o.absenceSensitivity.map((p) => p.annualSupplySavings);
    expect(vals[1]).toBeGreaterThanOrEqual(vals[0]);
    expect(vals[2]).toBeGreaterThanOrEqual(vals[1]);
  });
  it("usage-based mode: if Gemini token prices are 0, annual AI cost should be 0", () => {
    const o = calculate({
      ...DEFAULTS,
      aiCostingMode: "UsageBasedEstimate",
      gbpPer1MInputTokens: 0,
      gbpPer1MOutputTokens: 0,
    });

    closeTo(o.aiInferenceCostAnnual, 0);
  });

  it("usage-based mode: positive token prices => annual AI cost is positive (when volume > 0)", () => {
    const o = calculate({
      ...DEFAULTS,
      aiCostingMode: "UsageBasedEstimate",
      gbpPer1MInputTokens: 1,  // £1 per 1M input tokens
      gbpPer1MOutputTokens: 2, // £2 per 1M output tokens
      adoptionRate: 1,
      students: 500,
      examParticipationRate: 0.8,
      assessmentsPerStudentPerYear: 6,
      baseInputTokensPerAssessment: 1000,
      baseOutputTokensPerAssessment: 500,
      // simple weights that sum to 1

      tokenMultMaths: 1.4,
      tokenMultEnglish: 1.0,
      tokenMultScience: 1.0,
      tokenMultHumanities: 1.0,
      tokenMultOther: 1.0,
    });

    expect(o.aiInferenceCostAnnual).toBeGreaterThan(0);
    expect(o.internalRecurringAnnualCost).toBeGreaterThan(o.licenceFeeAnnual);
    closeTo(o.schoolRecurringAnnualCost, o.licenceFeeAnnual);
  });

  it("usage-based mode: if adoptionRate=0, annual AI cost should be 0 (no adopted students)", () => {
    const o = calculate({
      ...DEFAULTS,
      aiCostingMode: "UsageBasedEstimate",
      gbpPer1MInputTokens: 1,
      gbpPer1MOutputTokens: 1,
      adoptionRate: 0,
    });

    closeTo(o.aiInferenceCostAnnual, 0);
  });
});

describe("refactored model rules", () => {
  it("educational value is excluded from cash ROI", () => {
    const lowSalary = calculate({ ...DEFAULTS, avgSalary: 20000 });
    const highSalary = calculate({ ...DEFAULTS, avgSalary: 80000 });

    closeTo(lowSalary.annualSavingsCash, highSalary.annualSavingsCash);
    closeTo(lowSalary.schoolNetBenefitYear1, highSalary.schoolNetBenefitYear1);
    expect(highSalary.annualValueOfReallocatedTimeGBP).toBeGreaterThan(
      lowSalary.annualValueOfReallocatedTimeGBP
    );
  });

  it("cash savings decompose to internal drivers", () => {
    const model = createModel(DEFAULTS);
    const internal = buildInternalView(model);

    closeTo(
      internal.cashSavings.annualSavingsCash,
      internal.cashSavings.supplySavings +
        internal.cashSavings.retentionSavings +
        internal.cashSavings.recruitmentSavings
    );
  });

  it("school and internal financials each use a consistent recurring cost base", () => {
    const o = calculate({
      ...DEFAULTS,
      aiCostingMode: "UsageBasedEstimate",
      gbpPer1MInputTokens: 2,
      gbpPer1MOutputTokens: 3,
    });

    closeTo(
      o.schoolTotalCostYear1 - DEFAULTS.trainingOneTime - DEFAULTS.setupOneTime,
      o.schoolRecurringAnnualCost
    );
    closeTo(
      o.internalTotalCostYear1 - DEFAULTS.trainingOneTime - DEFAULTS.setupOneTime,
      o.aiSubscriptionAnnual
    );
    closeTo(o.schoolProjection5y[1].costs, o.schoolRecurringAnnualCost);
    closeTo(o.internalProjection5y[1].costs, o.internalRecurringAnnualCost);
  });

  it("school-facing financials ignore inference cost while internal financials include it", () => {
    const o = calculate({
      ...DEFAULTS,
      aiCostingMode: "UsageBasedEstimate",
      gbpPer1MInputTokens: 4,
      gbpPer1MOutputTokens: 5,
    });

    closeTo(o.schoolRecurringAnnualCost, o.licenceFeeAnnual);
    expect(o.internalRecurringAnnualCost).toBeGreaterThan(o.schoolRecurringAnnualCost);
    expect(o.internalTotalCostYear1).toBeGreaterThan(o.schoolTotalCostYear1);
    expect(o.internalRoiYear1 as number).toBeLessThanOrEqual(o.schoolRoiYear1 as number);
  });

  it("school and internal views are derived from the same model", () => {
    const model = createModel(DEFAULTS);
    const school = buildSchoolView(model);
    const internal = buildInternalView(model);

    closeTo(school.annualSavingsCash, internal.cashSavings.annualSavingsCash);
    closeTo(school.totalCostYear1, internal.costs.school.totalCostYear1);
    closeTo(school.annualHoursSavedTotal, internal.educationalValue.annualHoursSavedTotal);
  });

  it("internal admin summary exposes grouped internal breakdowns and metadata", () => {
    const model = createModel(DEFAULTS);
    const summary = buildInternalAdminSummary(model, {
      modelVersion: "0.1.0",
      assumptionSetVersion: "2026.03-phase2",
      generatedDate: "27 March 2026",
      defaultsSourceNote: "Governed defaults note",
      propagationNote: "Propagation note",
      lastUpdated: "27 March 2026",
      includedNotes: ["Included note"],
      excludedNotes: ["Excluded note"],
    });

    closeTo(summary.year1CostBreakdown.total, model.costs.internal.totalCostYear1);
    closeTo(summary.ongoingCostBreakdown.total, model.costs.internal.recurringAnnualCost);
    closeTo(summary.cashSavingsBreakdown.total, model.cashSavings.annualSavingsCash);
    expect(summary.qaChecks.checks.length).toBeGreaterThanOrEqual(6);
    expect(summary.outputMetadata.modelVersion).toBe("0.1.0");
    expect(summary.assumptionsGovernance.activeScenarioPreset).toBe(DEFAULTS.preset);
  });

  it("simple pricing mode keeps internal commercial summary on the same active cost basis as ROI", () => {
    const model = createModel({
      ...DEFAULTS,
      aiCostingMode: "SimplePricing",
      gbpPer1MInputTokens: 4,
      gbpPer1MOutputTokens: 5,
    });
    const summary = buildInternalAdminSummary(model, {
      modelVersion: "0.1.0",
      assumptionSetVersion: "2026.03-phase2",
      generatedDate: "27 March 2026",
      defaultsSourceNote: "Governed defaults note",
      propagationNote: "Propagation note",
      lastUpdated: "27 March 2026",
      includedNotes: ["Included note"],
      excludedNotes: ["Excluded note"],
    });

    closeTo(summary.commercialSummary.annualAiCostInModel, 0);
    closeTo(
      summary.commercialSummary.recurringCostBasisInModel,
      model.costs.internal.recurringAnnualCost
    );
    expect(summary.qaChecks.overallStatus).toBe("pass");
  });

  it("usage-based mode aligns projection, commercial summary, and qa checks", () => {
    const model = createModel({
      ...DEFAULTS,
      aiCostingMode: "UsageBasedEstimate",
      gbpPer1MInputTokens: 4,
      gbpPer1MOutputTokens: 5,
    });
    const summary = buildInternalAdminSummary(model, {
      modelVersion: "0.1.0",
      assumptionSetVersion: "2026.03-phase2",
      generatedDate: "27 March 2026",
      defaultsSourceNote: "Governed defaults note",
      propagationNote: "Propagation note",
      lastUpdated: "27 March 2026",
      includedNotes: ["Included note"],
      excludedNotes: ["Excluded note"],
    });

    expect(summary.commercialSummary.annualAiCostInModel).toBeGreaterThan(0);
    closeTo(
      summary.commercialSummary.year1CostBasisInModel,
      summary.projectionSummary.projection5y[0]?.costs ?? 0
    );
    expect(summary.qaChecks.checks.every((check) => check.status !== "fail")).toBe(true);
  });

  it("builds a typed governance registry with scenario and school-type context", () => {
    const governance = buildAssumptionsGovernanceSummary(DEFAULTS, {
      assumptionSetVersion: "2026.03-phase2",
      generatedDate: "27 March 2026",
      lastUpdated: "27 March 2026",
      defaultsSourceNote: "Governed defaults note",
      propagationNote: "Propagation note",
    });

    expect(governance.activeScenarioPreset).toBe("Expected");
    expect(governance.activeSchoolTypePreset).toBe("Secondary");
    expect(governance.scenarioPresets).toHaveLength(4);
    expect(governance.schoolTypePresets.map((preset) => preset.id)).toEqual([
      "Primary",
      "Secondary",
    ]);

    const impactGroup = governance.groups.find((group) => group.id === "impact-assumptions");
    expect(impactGroup?.assumptions.length).toBeGreaterThan(0);
    expect(
      impactGroup?.assumptions.some((assumption) => assumption.presetControlled)
    ).toBe(true);
  });
});
