import {
  CashSavingsSummary,
  CostBasis,
  MonthlyCumulativeNetPoint,
  ProjectionSummary,
  YearRow,
} from "../types";

function buildMonthlyCumulativeNetData(
  annualSavingsCash: number,
  recurringAnnualCost: number,
  oneTimeCostsTotal: number
): MonthlyCumulativeNetPoint[] {
  const monthlySavings = annualSavingsCash / 12;
  const initialContractCost = recurringAnnualCost + oneTimeCostsTotal;
  let cumulativeNet = -initialContractCost;
  const data = [{ month: 0, cumulativeNet }];

  for (let month = 1; month <= 60; month += 1) {
    if (month > 1 && (month - 1) % 12 === 0) {
      cumulativeNet -= recurringAnnualCost;
    }

    cumulativeNet += monthlySavings;
    data.push({
      month,
      cumulativeNet,
    });
  }

  return data;
}

function calculateBreakEvenMonth(
  annualSavingsCash: number,
  monthlyCumulativeNetData: MonthlyCumulativeNetPoint[]
) {
  const monthlySavings = annualSavingsCash / 12;
  if (monthlySavings <= 0) return null;

  for (let index = 1; index < monthlyCumulativeNetData.length; index += 1) {
    const previousNet = monthlyCumulativeNetData[index - 1]?.cumulativeNet ?? 0;
    const currentNet = monthlyCumulativeNetData[index]?.cumulativeNet ?? 0;

    if (previousNet >= 0) {
      return 0;
    }

    if (previousNet < 0 && currentNet >= 0) {
      const exactMonths = (index - 1) + Math.abs(previousNet) / monthlySavings;
      return Math.max(1, exactMonths);
    }
  }

  return null;
}

export function calculateProjection5y(
  cashSavings: CashSavingsSummary,
  costBasis: CostBasis
): ProjectionSummary {
  const projection5y: YearRow[] = [];
  const roiByYear: (number | null)[] = [];

  let cumulativeCosts = 0;
  let cumulativeSavings = 0;
  let cumulativeNet = 0;

  for (let year = 1; year <= 5; year += 1) {
    const annualCosts = year === 1 ? costBasis.totalCostYear1 : costBasis.recurringAnnualCost;
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

  const monthlyCumulativeNetData = buildMonthlyCumulativeNetData(
    cashSavings.annualSavingsCash,
    costBasis.recurringAnnualCost,
    Math.max(0, costBasis.totalCostYear1 - costBasis.recurringAnnualCost)
  );

  return {
    projection5y,
    roiByYear,
    monthlyCumulativeNetData,
    breakEvenMonth: calculateBreakEvenMonth(
      cashSavings.annualSavingsCash,
      monthlyCumulativeNetData
    ),
  };
}
