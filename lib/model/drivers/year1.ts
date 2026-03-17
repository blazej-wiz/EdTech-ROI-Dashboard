import { AdoptionSummary, CashSavingsSummary, CostBasis, CostSummary, Year1Metrics } from "../types";

export function calculateYear1Metrics(
  adoption: AdoptionSummary,
  cashSavings: CashSavingsSummary,
  costs: CostSummary,
  costBasis: CostBasis
): Year1Metrics {
  const netBenefitYear1 = cashSavings.annualSavingsCash - costBasis.totalCostYear1;
  const roiYear1 = costBasis.totalCostYear1 > 0 ? netBenefitYear1 / costBasis.totalCostYear1 : null;

  return {
    netBenefitYear1,
    roiYear1,
    breakEvenAiAnnual: Math.max(
      0,
      cashSavings.annualSavingsCash - costs.trainingOneTime - costs.setupOneTime
    ),
    aiCostPerAdoptedStudent:
      adoption.adoptedStudents > 0 ? costBasis.recurringAnnualCost / adoption.adoptedStudents : null,
    netBenefitPerAdoptedStudentYear1:
      adoption.adoptedStudents > 0 ? netBenefitYear1 / adoption.adoptedStudents : null,
  };
}
