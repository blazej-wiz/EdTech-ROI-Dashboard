import { Inputs, Reductions, ScenarioPreset } from "./types";
import { clamp01 } from "./normalize";

export const ASSUMPTIONS: Record<
  Exclude<ScenarioPreset, "Custom">,
  Reductions
> = {
  Conservative: { marking: 0.25, other: 0.15, sick: 0.03, attrition: 0.01 },
  Expected: { marking: 0.45, other: 0.25, sick: 0.05, attrition: 0.02 },
  Ambitious: { marking: 0.8, other: 0.4, sick: 0.08, attrition: 0.04 },
};

export function resolveReductions(inputs: Inputs): Reductions {
  if (inputs.preset === "Custom") {
    return {
      marking: clamp01(inputs.markingReductionCustom),
      other: clamp01(inputs.otherReductionCustom),
      sick: clamp01(inputs.sickdayReductionCustom),
      attrition: clamp01(inputs.attritionReductionCustom),
    };
  }

  return ASSUMPTIONS[inputs.preset];
}
