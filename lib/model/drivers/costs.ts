import { nonneg } from "../normalize";
import { CostSummary, Inputs, UsageSummary } from "../types";

export function calculateCosts(inputs: Inputs, usage: UsageSummary): CostSummary {
  const licenceFeeAnnual = nonneg(inputs.licenceFeeAnnual);
  const aiInferenceCostAnnual =
    (usage.estimatedInputTokensAnnual / 1_000_000) * nonneg(inputs.gbpPer1MInputTokens) +
    (usage.estimatedOutputTokensAnnual / 1_000_000) * nonneg(inputs.gbpPer1MOutputTokens);

  const recurringAnnualCost =
    inputs.aiCostingMode === "UsageBasedEstimate"
      ? licenceFeeAnnual + aiInferenceCostAnnual
      : licenceFeeAnnual;

  const trainingOneTime = nonneg(inputs.trainingOneTime);
  const setupOneTime = nonneg(inputs.setupOneTime);

  return {
    aiCostingMode: inputs.aiCostingMode,
    licenceFeeAnnual,
    aiInferenceCostAnnual,
    recurringAnnualCost,
    trainingOneTime,
    setupOneTime,
    totalCostYear1: recurringAnnualCost + trainingOneTime + setupOneTime,
  };
}
