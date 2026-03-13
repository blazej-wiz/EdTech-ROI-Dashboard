import { CashSavingsSummary, CostSummary, YearRow } from "../types";

export function calculateProjection5y(
  cashSavings: CashSavingsSummary,
  costs: CostSummary
): { projection5y: YearRow[]; roiByYear: (number | null)[] } {
  const projection5y: YearRow[] = [];
  const roiByYear: (number | null)[] = [];

  let cumulativeCosts = 0;
  let cumulativeSavings = 0;
  let cumulativeNet = 0;

  for (let year = 1; year <= 5; year += 1) {
    const annualCosts = year === 1 ? costs.totalCostYear1 : costs.recurringAnnualCost;
    const annualSavings = cashSavings.annualSavingsCash;
    const netBenefit = annualSavings - annualCosts;

    cumulativeCosts += annualCosts;
    cumulativeSavings += annualSavings;
    cumulativeNet += netBenefit;

    const cumulativeRoi =
      cumulativeCosts > 0 ? (cumulativeSavings - cumulativeCosts) / cumulativeCosts : null;

    projection5y.push({
      year,
      costs: annualCosts,
      savings: annualSavings,
      netBenefit,
      cumulativeNetBenefit: cumulativeNet,
      cumulativeRoi,
    });

    roiByYear.push(cumulativeRoi);
  }

  return { projection5y, roiByYear };
}
