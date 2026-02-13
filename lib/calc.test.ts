import { describe, it, expect } from "vitest";
import { calculate, DEFAULTS } from "./calc";

function closeTo(a: number, b: number, tol = 1e-6) {
  expect(Math.abs(a - b)).toBeLessThanOrEqual(tol);
}

describe("calculate() baseline + invariants", () => {
  it("golden test: DEFAULTS outputs are stable", () => {
    const o = calculate(DEFAULTS);

    // Basic sanity (non-null)
    expect(o.aiSubscriptionAnnual).toBeGreaterThanOrEqual(0);
    expect(o.totalCostYear1).toBeGreaterThanOrEqual(0);

    // Golden assertions: set these to the numbers you expect today.
    // Run once, log outputs, then lock them in.
    // NOTE: use closeTo for floats if needed.
    closeTo(o.adoptedTeachers, DEFAULTS.teachersFTE * DEFAULTS.adoptionRate);
    closeTo(o.adoptedStudents, DEFAULTS.students * DEFAULTS.adoptionRate);

    // If your pricing defaults are as you described, this should be stable.
    // Replace these with exact expected values after first run.
    // Example placeholders (CHANGE THESE after first run):
    // closeTo(o.aiSubscriptionAnnual, 2600);
    // closeTo(o.annualSupplySavings, 2975);
    // closeTo(o.annualAttritionSavings, 1760);
    // closeTo(o.annualSavingsCash, 4735);
    // closeTo(o.totalCostYear1, 5350);
    // closeTo(o.netBenefitYear1, -615);
  });

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
});
