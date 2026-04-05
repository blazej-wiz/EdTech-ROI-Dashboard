import { InternalAdminSummary, QaCheck, QaCheckStatus, QaSummary, RoiModel } from "./types";

const TOLERANCE = 1e-6;

function isClose(a: number, b: number, tolerance = TOLERANCE) {
  return Math.abs(a - b) <= tolerance;
}

function maxStatus(a: QaCheckStatus, b: QaCheckStatus): QaCheckStatus {
  const order: QaCheckStatus[] = ["pass", "warn", "fail"];
  return order.indexOf(a) >= order.indexOf(b) ? a : b;
}

export function runQaChecks(model: RoiModel, summary: Omit<InternalAdminSummary, "qaChecks">): QaSummary {
  const checks: QaCheck[] = [];
  const breakEvenMonth = summary.projectionSummary.breakEvenMonth;
  const year1Roi = model.internalYear1.roiYear1;

  const directionallyAligned =
    year1Roi === null
      ? breakEvenMonth === null
      : year1Roi >= 0
        ? breakEvenMonth !== null && breakEvenMonth <= 12
        : breakEvenMonth === null || breakEvenMonth > 12;

  checks.push({
    id: "roi-break-even-alignment",
    label: "ROI and break-even use the same internal cost basis",
    status: directionallyAligned ? "pass" : "fail",
    message: directionallyAligned
      ? "Year 1 ROI direction matches the break-even timing for the internal model cost basis."
      : "Year 1 ROI and break-even timing point in different directions under the current assumptions.",
  });

  const year1ProjectionCost = summary.projectionSummary.projection5y[0]?.costs ?? 0;
  checks.push({
    id: "year1-costs-match-projection",
    label: "Year 1 costs reconcile to the projection",
    status: isClose(summary.year1CostBreakdown.total, year1ProjectionCost) ? "pass" : "fail",
    message: isClose(summary.year1CostBreakdown.total, year1ProjectionCost)
      ? "Year 1 internal cost breakdown matches the Year 1 projection row."
      : "Year 1 internal cost breakdown does not match the Year 1 projection row.",
  });

  const visibleSavingsTotal = summary.cashSavingsBreakdown.rows.reduce(
    (total, row) => total + row.value,
    0
  );
  checks.push({
    id: "cash-savings-reconcile",
    label: "Cash savings reconcile to visible drivers",
    status: isClose(summary.cashSavingsBreakdown.total, visibleSavingsTotal) ? "pass" : "fail",
    message: isClose(summary.cashSavingsBreakdown.total, visibleSavingsTotal)
      ? "Cash savings total matches the visible supply and recruitment drivers."
      : "Cash savings total does not match the visible savings drivers.",
  });

  const cashOnlyNetBenefit =
    model.cashSavings.annualSavingsCash - model.costs.internal.totalCostYear1;
  checks.push({
    id: "educational-value-excluded",
    label: "Educational value is excluded from cash ROI",
    status: isClose(model.internalYear1.netBenefitYear1, cashOnlyNetBenefit) ? "pass" : "fail",
    message: isClose(model.internalYear1.netBenefitYear1, cashOnlyNetBenefit)
      ? "Educational value remains separate from internal cash ROI and payback logic."
      : "Educational value appears to be affecting internal cash ROI calculations.",
  });

  const contributionReconciles =
    isClose(
      summary.commercialSummary.annualContributionAfterAiCost,
      summary.commercialSummary.annualLicenceRevenue - summary.commercialSummary.annualAiCostInModel
    ) &&
    isClose(
      summary.commercialSummary.recurringCostBasisInModel,
      summary.commercialSummary.annualLicenceRevenue + summary.commercialSummary.annualAiCostInModel
    ) &&
    isClose(summary.year1CostBreakdown.total, summary.commercialSummary.year1CostBasisInModel);
  checks.push({
    id: "internal-top-lines-reconcile",
    label: "Internal top-line summaries reconcile to their breakdowns",
    status: contributionReconciles ? "pass" : "fail",
    message: contributionReconciles
      ? "Commercial summary values reconcile to the internal cost breakdown and active AI cost logic."
      : "Commercial summary values do not reconcile to the internal cost breakdown.",
  });

  const hasMetadata =
    summary.outputMetadata.modelVersion.trim().length > 0 &&
    summary.outputMetadata.generatedDate.trim().length > 0 &&
    summary.outputMetadata.includedNotes.length > 0 &&
    summary.outputMetadata.excludedNotes.length > 0;
  checks.push({
    id: "output-metadata-present",
    label: "Output metadata exists",
    status: hasMetadata ? "pass" : "warn",
    message: hasMetadata
      ? "Model version, generated date, and included or excluded notes are present."
      : "Basic output metadata is incomplete.",
  });

  const counts: Record<QaCheckStatus, number> = {
    pass: checks.filter((check) => check.status === "pass").length,
    warn: checks.filter((check) => check.status === "warn").length,
    fail: checks.filter((check) => check.status === "fail").length,
  };

  return {
    overallStatus: checks.reduce<QaCheckStatus>(
      (status, check) => maxStatus(status, check.status),
      "pass"
    ),
    counts,
    checks,
  };
}
