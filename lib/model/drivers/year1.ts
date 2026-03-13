import { AdoptionSummary, CashSavingsSummary, CostSummary, Year1Metrics } from "../types";

export function calculateYear1Metrics(
  adoption: AdoptionSummary,
  cashSavings: CashSavingsSummary,
  costs: CostSummary
): Year1Metrics {
  const netBenefitYear1 = cashSavings.annualSavingsCash - costs.totalCostYear1;
  const roiYear1 =
    costs.totalCostYear1 > 0 ? netBenefitYear1 / costs.totalCostYear1 : null;

  return {
    netBenefitYear1,
    roiYear1,
    breakEvenAiAnnual: Math.max(
      0,
      cashSavings.annualSavingsCash - costs.trainingOneTime - costs.setupOneTime
    ),
    aiCostPerAdoptedStudent:
      adoption.adoptedStudents > 0 ? costs.recurringAnnualCost / adoption.adoptedStudents : null,
    netBenefitPerAdoptedStudentYear1:
      adoption.adoptedStudents > 0 ? netBenefitYear1 / adoption.adoptedStudents : null,
  };
}



