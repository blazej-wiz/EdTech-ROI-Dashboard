import { clamp01, clampInt, nonneg } from "../normalize";
import { AdoptionSummary, Inputs, SubjectPreset, SubjectWeights, UsageSummary } from "../types";

function presetToWeights(
  preset: SubjectPreset,
  humanitiesHeavy: number,
  stemHeavy: number
): SubjectWeights {
  const hum = clamp01(humanitiesHeavy);
  const stem = clamp01(stemHeavy);

  let humanitiesTotal = 0.5;
  let stemTotal = 0.5;

  if (preset === "MostlyHumanities") {
    humanitiesTotal = hum || 0.65;
    stemTotal = 1 - humanitiesTotal;
  } else if (preset === "MostlySTEM") {
    stemTotal = stem || 0.65;
    humanitiesTotal = 1 - stemTotal;
  }

  const english = humanitiesTotal * 0.55;
  const humanities = humanitiesTotal * 0.35;
  const otherFromHum = humanitiesTotal * 0.1;

  const maths = stemTotal * 0.45;
  const science = stemTotal * 0.45;
  const otherFromStem = stemTotal * 0.1;

  const other = otherFromHum + otherFromStem;
  const sum = maths + english + science + humanities + other;

  if (sum <= 0) {
    return { maths: 0.2, english: 0.2, science: 0.2, humanities: 0.2, other: 0.2 };
  }

  return {
    maths: maths / sum,
    english: english / sum,
    science: science / sum,
    humanities: humanities / sum,
    other: other / sum,
  };
}

export function calculateUsage(inputs: Inputs, adoption: AdoptionSummary): UsageSummary {
  const participation = clamp01(inputs.examParticipationRate);
  const assessmentsPerStudent = clampInt(inputs.assessmentsPerStudentPerYear, 1, 20);
  const estimatedAssessmentsAnnual =
    adoption.adoptedStudents * participation * assessmentsPerStudent;

  const subjectWeights = presetToWeights(
    inputs.subjectPreset,
    nonneg(inputs.presetHumanitiesWeight),
    nonneg(inputs.presetStemWeight)
  );

  const weightedTokenMultiplier =
    subjectWeights.maths * (nonneg(inputs.tokenMultMaths) || 1) +
    subjectWeights.english * (nonneg(inputs.tokenMultEnglish) || 1) +
    subjectWeights.science * (nonneg(inputs.tokenMultScience) || 1) +
    subjectWeights.humanities * (nonneg(inputs.tokenMultHumanities) || 1) +
    subjectWeights.other * (nonneg(inputs.tokenMultOther) || 1);

  const safeMultiplier = weightedTokenMultiplier > 0 ? weightedTokenMultiplier : 1;

  return {
    estimatedAssessmentsAnnual,
    estimatedInputTokensAnnual:
      estimatedAssessmentsAnnual * nonneg(inputs.baseInputTokensPerAssessment) * safeMultiplier,
    estimatedOutputTokensAnnual:
      estimatedAssessmentsAnnual * nonneg(inputs.baseOutputTokensPerAssessment) * safeMultiplier,
    subjectWeights,
    weightedTokenMultiplier: safeMultiplier,
  };
}
