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
  const schoolYear1 = calculateYear1Metrics(adoption, cashSavings, costs, costs.school);
  const internalYear1 = calculateYear1Metrics(adoption, cashSavings, costs, costs.internal);
  const { projection5y: schoolProjection5y, roiByYear: schoolRoiByYear } =
    calculateProjection5y(cashSavings, costs.school);
  const { projection5y: internalProjection5y, roiByYear: internalRoiByYear } =
    calculateProjection5y(cashSavings, costs.internal);
  const sensitivities = calculateSensitivities(inputs, adoption, cashSavings);

  return {
    inputs,
    adoption,
    reductions,
    usage,
    educationalValue,
    cashSavings,
    costs,
    schoolYear1,
    internalYear1,
    schoolProjection5y,
    schoolRoiByYear,
    internalProjection5y,
    internalRoiByYear,
    sensitivities,
  };
}

export function calculate(raw: Partial<Inputs>): Outputs {
  const model = createModel(raw);

  return {
    adoptedStudents: model.adoption.adoptedStudents,
    adoptedTeachers: model.adoption.adoptedTeachers,
    aiSubscriptionAnnual: model.costs.internal.recurringAnnualCost,
    licenceFeeAnnual: model.costs.licenceFeeAnnual,
    aiInferenceCostAnnual: model.costs.aiInferenceCostAnnual,
    aiCostingMode: model.costs.aiCostingMode,
    schoolRecurringAnnualCost: model.costs.school.recurringAnnualCost,
    schoolTotalCostYear1: model.costs.school.totalCostYear1,
    internalRecurringAnnualCost: model.costs.internal.recurringAnnualCost,
    internalTotalCostYear1: model.costs.internal.totalCostYear1,
    estimatedAssessmentsAnnual: model.usage.estimatedAssessmentsAnnual,
    estimatedInputTokensAnnual: model.usage.estimatedInputTokensAnnual,
    estimatedOutputTokensAnnual: model.usage.estimatedOutputTokensAnnual,
    annualSupplySavings: model.cashSavings.supplySavings,
    annualAttritionSavings: model.cashSavings.annualAttritionSavings,
    annualSavingsCash: model.cashSavings.annualSavingsCash,
    schoolNetBenefitYear1: model.schoolYear1.netBenefitYear1,
    schoolRoiYear1: model.schoolYear1.roiYear1,
    internalNetBenefitYear1: model.internalYear1.netBenefitYear1,
    internalRoiYear1: model.internalYear1.roiYear1,
    breakEvenAiAnnual: model.schoolYear1.breakEvenAiAnnual,
    weeklyHoursSavedPerTeacher: model.educationalValue.weeklyHoursSavedPerTeacher,
    weeklyMarkingHoursSavedPerTeacher:
      model.educationalValue.weeklyMarkingHoursSavedPerTeacher,
    weeklyAiAdminHoursSavedPerTeacher:
      model.educationalValue.weeklyAiAdminHoursSavedPerTeacher,
    annualHoursSavedTotal: model.educationalValue.annualHoursSavedTotal,
    annualValueOfReallocatedTimeGBP:
      model.educationalValue.annualValueOfReallocatedTimeGBP,
    aiCostPerAdoptedStudent: model.internalYear1.aiCostPerAdoptedStudent,
    netBenefitPerAdoptedStudentYear1:
      model.internalYear1.netBenefitPerAdoptedStudentYear1,
    schoolProjection5y: model.schoolProjection5y,
    schoolRoiByYear: model.schoolRoiByYear,
    internalProjection5y: model.internalProjection5y,
    internalRoiByYear: model.internalRoiByYear,
    absenceSensitivity: model.sensitivities.absenceSensitivity,
    retentionImpact5Annual: model.sensitivities.retentionImpact5Annual,
  };
}
