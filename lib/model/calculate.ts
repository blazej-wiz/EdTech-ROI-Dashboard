import { resolveReductions } from "./assumptions";
import { DEFAULTS } from "./defaults";
import { calculateAdoption } from "./drivers/adoption";
import { calculateCashSavings } from "./drivers/cash-savings";
import { calculateCosts } from "./drivers/costs";
import { calculateEducationalValue } from "./drivers/educational-value";
import { calculateProjection5y } from "./drivers/projection";
import { calculateSensitivities } from "./drivers/sensitivities";
import { calculateUsage } from "./drivers/usage";
import { calculateYear1Metrics } from "./drivers/year1";
import { Inputs, Outputs, RoiModel } from "./types";

export function createModel(raw: Partial<Inputs>): RoiModel {
  const inputs: Inputs = { ...DEFAULTS, ...raw };
  const adoption = calculateAdoption(inputs);
  const reductions = resolveReductions(inputs);
  const usage = calculateUsage(inputs, adoption);
  const educationalValue = calculateEducationalValue(inputs, adoption, reductions);
  const cashSavings = calculateCashSavings(inputs, adoption, reductions);
  const costs = calculateCosts(inputs, usage);
  const year1 = calculateYear1Metrics(adoption, cashSavings, costs);
  const { projection5y, roiByYear } = calculateProjection5y(cashSavings, costs);
  const sensitivities = calculateSensitivities(inputs, adoption, cashSavings);

  return {
    inputs,
    adoption,
    reductions,
    usage,
    educationalValue,
    cashSavings,
    costs,
    year1,
    projection5y,
    roiByYear,
    sensitivities,
  };
}

export function calculate(raw: Partial<Inputs>): Outputs {
  const model = createModel(raw);

  return {
    adoptedStudents: model.adoption.adoptedStudents,
    adoptedTeachers: model.adoption.adoptedTeachers,
    aiSubscriptionAnnual: model.costs.recurringAnnualCost,
    totalCostYear1: model.costs.totalCostYear1,
    licenceFeeAnnual: model.costs.licenceFeeAnnual,
    aiInferenceCostAnnual: model.costs.aiInferenceCostAnnual,
    aiCostingMode: model.costs.aiCostingMode,
    estimatedAssessmentsAnnual: model.usage.estimatedAssessmentsAnnual,
    estimatedInputTokensAnnual: model.usage.estimatedInputTokensAnnual,
    estimatedOutputTokensAnnual: model.usage.estimatedOutputTokensAnnual,
    annualSupplySavings: model.cashSavings.supplySavings,
    annualAttritionSavings: model.cashSavings.annualAttritionSavings,
    annualSavingsCash: model.cashSavings.annualSavingsCash,
    netBenefitYear1: model.year1.netBenefitYear1,
    roiYear1: model.year1.roiYear1,
    breakEvenAiAnnual: model.year1.breakEvenAiAnnual,
    weeklyHoursSavedPerTeacher: model.educationalValue.weeklyHoursSavedPerTeacher,
    weeklyMarkingHoursSavedPerTeacher:
      model.educationalValue.weeklyMarkingHoursSavedPerTeacher,
    weeklyAiAdminHoursSavedPerTeacher:
      model.educationalValue.weeklyAiAdminHoursSavedPerTeacher,
    annualHoursSavedTotal: model.educationalValue.annualHoursSavedTotal,
    annualValueOfReallocatedTimeGBP:
      model.educationalValue.annualValueOfReallocatedTimeGBP,
    aiCostPerAdoptedStudent: model.year1.aiCostPerAdoptedStudent,
    netBenefitPerAdoptedStudentYear1:
      model.year1.netBenefitPerAdoptedStudentYear1,
    projection5y: model.projection5y,
    roiByYear: model.roiByYear,
    absenceSensitivity: model.sensitivities.absenceSensitivity,
    retentionImpact5Annual: model.sensitivities.retentionImpact5Annual,
  };
}
