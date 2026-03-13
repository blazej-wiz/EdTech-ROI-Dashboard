import { nonneg, clamp01 } from "../normalize";
import { AdoptionSummary, Inputs } from "../types";

export function calculateAdoption(inputs: Inputs): AdoptionSummary {
  const students = nonneg(inputs.students);
  const teachers = nonneg(inputs.teachersFTE);
  const adoptionRate = clamp01(inputs.adoptionRate);

  return {
    students,
    teachers,
    adoptionRate,
    adoptedStudents: students * adoptionRate,
    adoptedTeachers: teachers * adoptionRate,
  };
}
