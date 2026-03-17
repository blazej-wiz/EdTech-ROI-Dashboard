import { nonneg } from "../normalize";
import { CostSummary, Inputs, UsageSummary } from "../types";

export function calculateCosts(inputs: Inputs, usage: UsageSummary): CostSummary {
  const licenceFeeAnnual = nonneg(inputs.licenceFeeAnnual);
  const aiInferenceCostAnnual =
    (usage.estimatedInputTokensAnnual / 1_000_000) * nonneg(inputs.gbpPer1MInputTokens) +
    (usage.estimatedOutputTokensAnnual / 1_000_000) * nonneg(inputs.gbpPer1MOutputTokens);

  const internalRecurringAnnualCost =
    inputs.aiCostingMode === "UsageBasedEstimate"
      ? licenceFeeAnnual + aiInferenceCostAnnual
      : licenceFeeAnnual;
  const trainingOneTime = nonneg(inputs.trainingOneTime);
  const setupOneTime = nonneg(inputs.setupOneTime);
  const schoolRecurringAnnualCost = licenceFeeAnnual;

  return {
    aiCostingMode: inputs.aiCostingMode,
    licenceFeeAnnual,
    aiInferenceCostAnnual,
    trainingOneTime,
    setupOneTime,
    school: {
      recurringAnnualCost: schoolRecurringAnnualCost,
      totalCostYear1: schoolRecurringAnnualCost + trainingOneTime + setupOneTime,
    },
    internal: {
      recurringAnnualCost: internalRecurringAnnualCost,
      totalCostYear1: internalRecurringAnnualCost + trainingOneTime + setupOneTime,
    },
  };
}
