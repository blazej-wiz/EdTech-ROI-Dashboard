import { RoiModel, SchoolView } from "../types";

export function buildSchoolView(model: RoiModel): SchoolView {
  return {
    adoptedStudents: model.adoption.adoptedStudents,
    adoptedTeachers: model.adoption.adoptedTeachers,
    annualSavingsCash: model.cashSavings.annualSavingsCash,
    totalCostYear1: model.costs.school.totalCostYear1,
    netBenefitYear1: model.schoolYear1.netBenefitYear1,
    roiYear1: model.schoolYear1.roiYear1,
    impact5Year: model.schoolProjection5y[4]?.cumulativeNetBenefit ?? 0,
    annualHoursSavedTotal: model.educationalValue.annualHoursSavedTotal,
    annualValueOfReallocatedTimeGBP:
      model.educationalValue.annualValueOfReallocatedTimeGBP,
  };
}
