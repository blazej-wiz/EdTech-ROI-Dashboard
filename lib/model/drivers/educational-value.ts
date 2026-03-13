import { nonneg } from "../normalize";
import { AdoptionSummary, EducationalValueSummary, Inputs, Reductions } from "../types";

export function calculateEducationalValue(
  inputs: Inputs,
  adoption: AdoptionSummary,
  reductions: Reductions
): EducationalValueSummary {
  const weeks = nonneg(inputs.weeksPerYear);
  const weeklyTotal = nonneg(inputs.weeklyHoursTotal);
  const weeklyMarking = Math.min(nonneg(inputs.weeklyMarkingHours), weeklyTotal);
  const weeklyAiAdmin = Math.min(
    nonneg(inputs.weeklyAiAdminHours),
    Math.max(weeklyTotal - weeklyMarking, 0)
  );

  const weeklyMarkingHoursSavedPerTeacher = weeklyMarking * reductions.marking;
  const weeklyAiAdminHoursSavedPerTeacher = weeklyAiAdmin * reductions.other;
  const weeklyHoursSavedPerTeacher =
    weeklyMarkingHoursSavedPerTeacher + weeklyAiAdminHoursSavedPerTeacher;
  const annualHoursSavedTotal =
    weeklyHoursSavedPerTeacher * weeks * adoption.adoptedTeachers;
  const annualHoursPerTeacher = weeks * weeklyTotal;
  const hourlyRate =
    annualHoursPerTeacher > 0 ? nonneg(inputs.avgSalary) / annualHoursPerTeacher : 0;

  return {
    weeklyMarkingHours: weeklyMarking,
    weeklyAiAdminHours: weeklyAiAdmin,
    weeklyMarkingHoursSavedPerTeacher,
    weeklyAiAdminHoursSavedPerTeacher,
    weeklyHoursSavedPerTeacher,
    annualHoursSavedTotal,
    hourlyRate,
    annualValueOfReallocatedTimeGBP: annualHoursSavedTotal * hourlyRate,
  };
}
