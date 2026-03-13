import { InternalView, RoiModel } from "../types";

export function buildInternalView(model: RoiModel): InternalView {
  return {
    adoption: model.adoption,
    reductions: model.reductions,
    usage: model.usage,
    educationalValue: model.educationalValue,
    cashSavings: model.cashSavings,
    costs: model.costs,
    year1: model.year1,
    projection5y: model.projection5y,
    sensitivities: model.sensitivities,
  };
}
