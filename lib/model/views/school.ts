import { RoiModel, SchoolView } from "../types";

export function buildSchoolView(model: RoiModel): SchoolView {
  return {
    adoptedStudents: model.adoption.adoptedStudents,
    adoptedTeachers: model.adoption.adoptedTeachers,
    annualSavingsCash: model.cashSavings.annualSavingsCash,
    totalCostYear1: model.costs.totalCostYear1,
    netBenefitYear1: model.year1.netBenefitYear1,
    roiYear1: model.year1.roiYear1,
    impact5Year: model.projection5y[4]?.cumulativeNetBenefit ?? 0,
    annualHoursSavedTotal: model.educationalValue.annualHoursSavedTotal,
    annualValueOfReallocatedTimeGBP:
      model.educationalValue.annualValueOfReallocatedTimeGBP,
  };
}
