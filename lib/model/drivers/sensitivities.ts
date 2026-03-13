import { nonneg } from "../normalize";
import { AdoptionSummary, CashSavingsSummary, Inputs, SensitivityPoint, SensitivitySummary } from "../types";

export function calculateSensitivities(
  inputs: Inputs,
  adoption: AdoptionSummary,
  cashSavings: CashSavingsSummary
): SensitivitySummary {
  const absenceSensitivity: SensitivityPoint[] = [0.1, 0.2, 0.3].map((rate) => ({
    label: `${Math.round(rate * 100)}%`,
    rate,
    annualSupplySavings:
      nonneg(inputs.sickDaysPerTeacher) *
      rate *
      adoption.adoptedTeachers *
      nonneg(inputs.supplyDailyCost),
  }));

  return {
    absenceSensitivity,
    retentionImpact5Annual:
      cashSavings.baselineLeavers * 0.05 * adoption.adoptionRate * nonneg(inputs.replacementCost),
  };
}
