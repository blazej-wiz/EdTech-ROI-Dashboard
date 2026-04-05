import { buildAssumptionsGovernanceSummary, GOVERNANCE_UPDATED_DATE, GOVERNANCE_VERSION } from "../governance";
import { InternalView, RoiModel } from "../types";

export function buildInternalView(model: RoiModel): InternalView {
  return {
    assumptionsGovernance: buildAssumptionsGovernanceSummary(model.inputs, {
      assumptionSetVersion: GOVERNANCE_VERSION,
      generatedDate: GOVERNANCE_UPDATED_DATE,
      lastUpdated: GOVERNANCE_UPDATED_DATE,
      defaultsSourceNote:
        "Governed defaults are managed in the Internal admin assumptions registry.",
      propagationNote:
        "Changes to governed defaults propagate to both School and Internal outputs after recalculation.",
    }),
    adoption: model.adoption,
    reductions: model.reductions,
    usage: model.usage,
    educationalValue: model.educationalValue,
    cashSavings: model.cashSavings,
    costs: model.costs,
    year1: model.internalYear1,
    projectionSummary: model.internalProjectionSummary,
    projection5y: model.internalProjection5y,
    sensitivities: model.sensitivities,
  };
}
