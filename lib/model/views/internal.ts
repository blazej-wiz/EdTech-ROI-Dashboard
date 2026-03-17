import { InternalView, RoiModel } from "../types";

export function buildInternalView(model: RoiModel): InternalView {
  return {
    adoption: model.adoption,
    reductions: model.reductions,
    usage: model.usage,
    educationalValue: model.educationalValue,
    cashSavings: model.cashSavings,
    costs: model.costs,
    year1: model.internalYear1,
    projection5y: model.internalProjection5y,
    sensitivities: model.sensitivities,
  };
}
