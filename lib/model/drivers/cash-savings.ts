import { clamp01, nonneg } from "../normalize";
import { AdoptionSummary, CashSavingsSummary, Inputs, Reductions } from "../types";

export function calculateCashSavings(
  inputs: Inputs,
  adoption: AdoptionSummary,
  reductions: Reductions
): CashSavingsSummary {
  const sickDaysSavedPerTeacher = nonneg(inputs.sickDaysPerTeacher) * reductions.sick;
  const supplySavings =
    sickDaysSavedPerTeacher * adoption.adoptedTeachers * nonneg(inputs.supplyDailyCost);

  const baselineLeavers = adoption.teachers * clamp01(inputs.attritionRate);
  const leaversAvoided = baselineLeavers * reductions.attrition * adoption.adoptionRate;

  // Current cash model only has one monetized people-cost assumption:
  // replacement / recruitment cost avoided when a leaver is prevented.
  const recruitmentSavings = leaversAvoided * nonneg(inputs.replacementCost);
  const retentionSavings = 0;
  const annualAttritionSavings = retentionSavings + recruitmentSavings;

  return {
    supplySavings,
    retentionSavings,
    recruitmentSavings,
    annualAttritionSavings,
    annualSavingsCash: supplySavings + annualAttritionSavings,
    baselineLeavers,
    leaversAvoided,
  };
}
