import { buildAssumptionsGovernanceSummary } from "../governance";
import { runQaChecks } from "../qa";
import { InternalAdminSummary, OutputMetadata, RoiModel } from "../types";

export function buildInternalAdminSummary(
  model: RoiModel,
  outputMetadata: OutputMetadata
): InternalAdminSummary {
  const aiCostInModel = model.costs.aiInferenceCostAnnualInModel;
  const aiCostEstimate = model.costs.aiInferenceCostAnnualEstimate;
  const assumptionsGovernance = buildAssumptionsGovernanceSummary(model.inputs, {
    assumptionSetVersion: outputMetadata.assumptionSetVersion,
    generatedDate: outputMetadata.generatedDate,
    lastUpdated: outputMetadata.lastUpdated,
    defaultsSourceNote: outputMetadata.defaultsSourceNote,
    propagationNote: outputMetadata.propagationNote,
  });

  const summaryWithoutQa: Omit<InternalAdminSummary, "qaChecks"> = {
    assumptionsGovernance,
    year1CostBreakdown: {
      rows: [
        {
          key: "annual-licence",
          label: "Annual licence",
          value: model.costs.licenceFeeAnnual,
          displayUnit: "currency",
        },
        {
          key: "ai-usage-cost",
          label: "AI usage cost in model",
          value: aiCostInModel,
          displayUnit: "currency",
          note:
            model.costs.aiCostingMode === "UsageBasedEstimate"
              ? "Usage-based AI cost is included in the internal ROI and payback logic."
              : "Simple pricing mode excludes AI usage cost from the internal ROI and payback logic.",
        },
        {
          key: "setup-one-time",
          label: "One-off setup",
          value: model.costs.setupOneTime,
          displayUnit: "currency",
        },
        {
          key: "training-one-time",
          label: "One-off training",
          value: model.costs.trainingOneTime,
          displayUnit: "currency",
        },
      ],
      total: model.costs.internal.totalCostYear1,
    },
    ongoingCostBreakdown: {
      rows: [
        {
          key: "annual-licence",
          label: "Annual licence",
          value: model.costs.licenceFeeAnnual,
          displayUnit: "currency",
        },
        {
          key: "ai-usage-cost",
          label: "AI usage cost in model",
          value: aiCostInModel,
          displayUnit: "currency",
        },
      ],
      total: model.costs.internal.recurringAnnualCost,
    },
    cashSavingsBreakdown: {
      rows: [
        {
          key: "supply-cover",
          label: "Supply cover savings",
          value: model.cashSavings.supplySavings,
          displayUnit: "currency",
        },
        {
          key: "recruitment-replacement",
          label: "Recruitment / replacement savings",
          value: model.cashSavings.annualAttritionSavings,
          displayUnit: "currency",
        },
      ],
      total: model.cashSavings.annualSavingsCash,
    },
    educationalValueBreakdown: {
      rows: [
        {
          key: "weekly-time-saved",
          label: "Weekly time saved per teacher",
          value: model.educationalValue.weeklyHoursSavedPerTeacher,
          displayUnit: "hours",
        },
        {
          key: "annual-hours-saved",
          label: "Total teacher hours saved per year",
          value: model.educationalValue.annualHoursSavedTotal,
          displayUnit: "hours",
        },
        {
          key: "value-equivalent",
          label: "Annual £-equivalent of reallocated time",
          value: model.educationalValue.annualValueOfReallocatedTimeGBP,
          displayUnit: "currency",
          note: "Shown separately from cash ROI and break-even.",
        },
      ],
      totalAnnualValueOfReallocatedTimeGBP:
        model.educationalValue.annualValueOfReallocatedTimeGBP,
    },
    usageContext: {
      teachers: model.adoption.teachers,
      students: model.adoption.students,
      adoptionRate: model.adoption.adoptionRate,
      adoptedTeachers: model.adoption.adoptedTeachers,
      adoptedStudents: model.adoption.adoptedStudents,
      estimatedAssessmentsAnnual: model.usage.estimatedAssessmentsAnnual,
      estimatedInputTokensAnnual: model.usage.estimatedInputTokensAnnual,
      estimatedOutputTokensAnnual: model.usage.estimatedOutputTokensAnnual,
      aiCostingMode: model.costs.aiCostingMode,
    },
    commercialSummary: {
      annualLicenceRevenue: model.costs.licenceFeeAnnual,
      annualAiCostEstimate: aiCostEstimate,
      annualAiCostInModel: aiCostInModel,
      annualContributionAfterAiCost: model.costs.licenceFeeAnnual - aiCostInModel,
      contributionMarginPct:
        model.costs.licenceFeeAnnual > 0
          ? (model.costs.licenceFeeAnnual - aiCostInModel) / model.costs.licenceFeeAnnual
          : null,
      recurringCostBasisInModel: model.costs.internal.recurringAnnualCost,
      year1CostBasisInModel: model.costs.internal.totalCostYear1,
      costBasisLabel:
        model.costs.aiCostingMode === "UsageBasedEstimate"
          ? "Licence plus estimated AI usage cost"
          : "Licence only (simple pricing mode)",
      costBasisNote:
        model.costs.aiCostingMode === "UsageBasedEstimate"
          ? "Internal ROI, payback, and 5-year projections include the active AI usage estimate."
          : "Internal ROI, payback, and 5-year projections currently use the simple pricing cost basis.",
    },
    projectionSummary: model.internalProjectionSummary,
    sensitivitySummary: model.sensitivities,
    outputMetadata,
  };

  return {
    ...summaryWithoutQa,
    qaChecks: runQaChecks(model, summaryWithoutQa),
  };
}
