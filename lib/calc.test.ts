import { describe, it, expect } from "vitest";
import { calculate, DEFAULTS } from "./calc";

function closeTo(a: number, b: number, tol = 1e-6) {
  expect(Math.abs(a - b)).toBeLessThanOrEqual(tol);
}


    // If your pricing defaults are as you described, this should be stable.
    // Replace these with exact expected values after first run.
    // Example placeholders (CHANGE THESE after first run):
    // closeTo(o.aiSubscriptionAnnual, 2600);
    // closeTo(o.annualSupplySavings, 2975);
    // closeTo(o.annualAttritionSavings, 1760);
    // closeTo(o.annualSavingsCash, 4735);
    // closeTo(o.totalCostYear1, 5350);
    // closeTo(o.netBenefitYear1, -615);


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
    expect(higher.roiYear1 as number).toBeLessThanOrEqual(base.roiYear1 as number);
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

    expect(o.aiSubscriptionAnnual).toBeGreaterThan(0);
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



