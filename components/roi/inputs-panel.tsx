import { useEffect, type Dispatch, type SetStateAction } from "react";
import type { AiCostingMode, Inputs, ScenarioPreset, SubjectPreset } from "@/lib/calc";
import { BRAND, InputRow, SectionHeader, SelectInput, TextInput } from "./ui";
import type { RawInputState, RoiViewMode } from "./use-roi-dashboard";

type InputsPanelProps = {
  viewMode: RoiViewMode;
  hasUncalculatedChanges: boolean;
  draft: Inputs;
  setDraft: Dispatch<SetStateAction<Inputs>>;
  rawInputs: RawInputState;
  setRawInputs: Dispatch<SetStateAction<RawInputState>>;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
  onApply: () => void;
  onReset: () => void;
};

export function InputsPanel({
  viewMode,
  hasUncalculatedChanges,
  draft,
  setDraft,
  rawInputs,
  setRawInputs,
  showAdvanced,
  onToggleAdvanced,
  onApply,
  onReset,
}: InputsPanelProps) {
  useEffect(() => {
    if (viewMode === "school" && draft.preset === "Custom") {
      setDraft((current) => ({ ...current, preset: "Expected" }));
    }
  }, [draft.preset, setDraft, viewMode]);

  function updateDraft<K extends keyof Inputs>(field: K, value: Inputs[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function updateNumberField<K extends keyof Inputs>(field: K, rawValue: string) {
    setRawInputs((current) => ({ ...current, [field]: rawValue }));

    if (rawValue === "") {
      updateDraft(field, 0 as Inputs[K]);
      return;
    }

    const parsed = Number(rawValue);
    updateDraft(field, (Number.isFinite(parsed) ? parsed : 0) as Inputs[K]);
  }

  function updatePercentField<
    K extends "adoptionRate" | "examParticipationRate" | "attritionRate",
  >(field: K, rawValue: string) {
    setRawInputs((current) => ({ ...current, [field]: rawValue }));

    if (rawValue === "") {
      updateDraft(field, 0 as Inputs[K]);
      return;
    }

    const parsed = Number(rawValue);
    updateDraft(field, (Number.isFinite(parsed) ? parsed / 100 : 0) as Inputs[K]);
  }

  function getNumberValue<K extends keyof Inputs>(field: K) {
    return rawInputs[field] ?? String(draft[field]);
  }

  function getPercentValue<
    K extends "adoptionRate" | "examParticipationRate" | "attritionRate",
  >(field: K) {
    return rawInputs[field] ?? String(draft[field] * 100);
  }

  return (
    <div
      className="rounded-2xl p-5 shadow-sm"
      style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}
    >
      <div className="flex items-center justify-between">
        <div className="text-base font-[630]" style={{ color: BRAND.text }}>
          Inputs
        </div>

        <button
          className="rounded-full px-3 py-1 text-sm font-semibold transition"
          style={{
            border: `1px solid ${BRAND.border}`,
            color: BRAND.text,
            background: "#fff",
            cursor: "pointer",
          }}
          onClick={onToggleAdvanced}
        >
          {showAdvanced ? "Hide advanced assumptions" : "Advanced assumptions"}
        </button>
      </div>

      {(draft.adoptionRate < 0 ||
        draft.adoptionRate > 1 ||
        draft.weeklyMarkingHours > draft.weeklyHoursTotal) && (
        <div
          className="mt-4 rounded-xl px-3 py-2 text-xs font-semibold"
          style={{ background: "#FFF7ED", color: "#9A3412", border: "1px solid #FED7AA" }}
        >
          {draft.adoptionRate < 0 || draft.adoptionRate > 1 ? (
            <div>
              Teachers using MySmartTeach should be between 0% and 100%. We’ll clamp it when
              you click Calculate.
            </div>
          ) : null}
          {draft.weeklyMarkingHours > draft.weeklyHoursTotal ? (
            <div>Marking hours can’t exceed total weekly hours. We’ll cap marking at total hours.</div>
          ) : null}
        </div>
      )}

      <div className="mt-5 space-y-5">
        <InputRow label="Number of teachers" hint="Required">
          <TextInput
            type="number"
            min={0}
            value={getNumberValue("teachersFTE")}
            onChange={(e) => updateNumberField("teachersFTE", e.target.value)}
          />
        </InputRow>

        <InputRow label="Number of students" hint="Required">
          <TextInput
            type="number"
            min={0}
            value={getNumberValue("students")}
            onChange={(e) => updateNumberField("students", e.target.value)}
          />
        </InputRow>

        <InputRow label="Teachers using MySmartTeach (%)" hint="Required">
          <TextInput
            type="number"
            min={0}
            max={100}
            step={1}
            value={getPercentValue("adoptionRate")}
            onChange={(e) => updatePercentField("adoptionRate", e.target.value)}
          />
        </InputRow>

        <InputRow
          label="Scenario preset"
          hint={viewMode === "school" ? "Predefined assumption set for the School view" : undefined}
        >
          <SelectInput
            value={draft.preset}
            onChange={(e) => updateDraft("preset", e.target.value as ScenarioPreset)}
          >
            <option value="Conservative">Conservative</option>
            <option value="Expected">Expected</option>
            <option value="Ambitious">Ambitious</option>
            {viewMode === "internal" ? <option value="Custom">Custom</option> : null}
          </SelectInput>
        </InputRow>

        <button
          className="w-full rounded-2xl px-4 py-3 text-sm font-[630] text-white transition"
          style={{
            background: `linear-gradient(135deg, ${BRAND.blue} 0%, ${BRAND.indigo} 55%, ${BRAND.purple} 100%)`,
            cursor: "pointer",
          }}
          onClick={onApply}
        >
          Calculate
        </button>

        {viewMode === "school" ? (
          <div
            className="flex items-center gap-2 px-1 text-xs"
            style={{ color: hasUncalculatedChanges ? "#9A3412" : "#065F46" }}
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{
                background: hasUncalculatedChanges ? "#F59E0B" : "#22C55E",
              }}
            />
            <span>
              {hasUncalculatedChanges
                ? "Inputs changed. Click Calculate to refresh results."
                : "Results are up to date with the current inputs."}
            </span>
          </div>
        ) : null}

        <button
          className="w-full rounded-2xl px-4 py-2 text-sm font-semibold transition"
          style={{
            background: "#fff",
            border: `1px solid ${BRAND.border}`,
            color: BRAND.text,
            cursor: "pointer",
          }}
          onClick={onReset}
        >
          Reset to defaults
        </button>
      </div>

      {showAdvanced ? (
        <div className="mt-6 space-y-6 border-t pt-5" style={{ borderColor: BRAND.border }}>
          <div className="text-sm font-[630]" style={{ color: BRAND.text }}>
            Advanced inputs
          </div>

          {viewMode === "school" ? (
            <div className="space-y-5">
              <SectionHeader>Assessment usage</SectionHeader>

              <InputRow label="Students using MySmartTeach for assessments (%)">
                <TextInput
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={getPercentValue("examParticipationRate")}
                  onChange={(e) =>
                    updatePercentField("examParticipationRate", e.target.value)
                  }
                />
              </InputRow>

              <InputRow label="Assessments per student (per year)">
                <TextInput
                  type="number"
                  min={1}
                  max={20}
                  step={1}
                  value={getNumberValue("assessmentsPerStudentPerYear")}
                  onChange={(e) =>
                    updateNumberField("assessmentsPerStudentPerYear", e.target.value)
                  }
                />
              </InputRow>

              <InputRow label="Subject focus">
                <SelectInput
                  value={draft.subjectPreset}
                  onChange={(e) =>
                    updateDraft("subjectPreset", e.target.value as SubjectPreset)
                  }
                >
                  <option value="MostlyHumanities">Mostly humanities</option>
                  <option value="Mixed">Mixed</option>
                  <option value="MostlySTEM">Mostly STEM</option>
                </SelectInput>
              </InputRow>
            </div>
          ) : null}

          {viewMode === "internal" ? (
            <InputRow
              label="AI costing mode"
              hint="Simple pricing or usage-based estimate"
            >
              <SelectInput
                value={draft.aiCostingMode}
                onChange={(e) =>
                  updateDraft("aiCostingMode", e.target.value as AiCostingMode)
                }
              >
                <option value="SimplePricing">Simple pricing (tiered)</option>
                <option value="UsageBasedEstimate">Usage-based (estimated, Gemini-aligned)</option>
              </SelectInput>
            </InputRow>
          ) : null}

          {viewMode === "internal" ? (
            <InputRow
              label="MySmartTeach licence fee (annual, £)"
              hint="Annual school price"
            >
              <TextInput
                type="number"
                min={0}
                step={100}
                value={getNumberValue("licenceFeeAnnual")}
                onChange={(e) => updateNumberField("licenceFeeAnnual", e.target.value)}
              />
            </InputRow>
          ) : null}

          {viewMode === "internal" && draft.aiCostingMode === "UsageBasedEstimate" ? (
            <div
              className="space-y-4 rounded-2xl p-4"
              style={{ background: "#F8FAFF", border: `1px solid ${BRAND.border}` }}
            >
              <div className="text-sm font-extrabold" style={{ color: BRAND.text }}>
                Usage-based AI cost (estimated)
              </div>

              <div className="text-xs" style={{ color: BRAND.muted }}>
                Estimate now, replace with real usage later.
              </div>

              <div className="text-sm font-[630]" style={{ color: BRAND.text }}>
                Token assumptions (per assessment)
              </div>

              <InputRow label="Base input tokens per assessment">
                <TextInput
                  type="number"
                  min={0}
                  step={50}
                  value={getNumberValue("baseInputTokensPerAssessment")}
                  onChange={(e) =>
                    updateNumberField("baseInputTokensPerAssessment", e.target.value)
                  }
                />
              </InputRow>

              <InputRow label="Base output tokens per assessment">
                <TextInput
                  type="number"
                  min={0}
                  step={50}
                  value={getNumberValue("baseOutputTokensPerAssessment")}
                  onChange={(e) =>
                    updateNumberField("baseOutputTokensPerAssessment", e.target.value)
                  }
                />
              </InputRow>

              <div className="text-sm font-[630]" style={{ color: BRAND.text }}>
                Subject token multipliers
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <InputRow label="Maths multiplier">
                  <TextInput
                    type="number"
                    min={0}
                    step={0.1}
                    value={getNumberValue("tokenMultMaths")}
                    onChange={(e) => updateNumberField("tokenMultMaths", e.target.value)}
                  />
                </InputRow>

                <InputRow label="English multiplier">
                  <TextInput
                    type="number"
                    min={0}
                    step={0.1}
                    value={getNumberValue("tokenMultEnglish")}
                    onChange={(e) => updateNumberField("tokenMultEnglish", e.target.value)}
                  />
                </InputRow>

                <InputRow label="Science multiplier">
                  <TextInput
                    type="number"
                    min={0}
                    step={0.1}
                    value={getNumberValue("tokenMultScience")}
                    onChange={(e) => updateNumberField("tokenMultScience", e.target.value)}
                  />
                </InputRow>

                <InputRow label="Humanities multiplier">
                  <TextInput
                    type="number"
                    min={0}
                    step={0.1}
                    value={getNumberValue("tokenMultHumanities")}
                    onChange={(e) =>
                      updateNumberField("tokenMultHumanities", e.target.value)
                    }
                  />
                </InputRow>

                <InputRow label="Other multiplier">
                  <TextInput
                    type="number"
                    min={0}
                    step={0.1}
                    value={getNumberValue("tokenMultOther")}
                    onChange={(e) => updateNumberField("tokenMultOther", e.target.value)}
                  />
                </InputRow>
              </div>

              <div className="text-sm font-[630]" style={{ color: BRAND.text }}>
                Gemini pricing (GBP per 1M tokens)
              </div>

              <InputRow label="£ per 1M input tokens">
                <TextInput
                  type="number"
                  min={0}
                  step={0.1}
                  value={getNumberValue("gbpPer1MInputTokens")}
                  onChange={(e) => updateNumberField("gbpPer1MInputTokens", e.target.value)}
                />
              </InputRow>

              <InputRow label="£ per 1M output tokens">
                <TextInput
                  type="number"
                  min={0}
                  step={0.1}
                  value={getNumberValue("gbpPer1MOutputTokens")}
                  onChange={(e) => updateNumberField("gbpPer1MOutputTokens", e.target.value)}
                />
              </InputRow>
            </div>
          ) : null}

          <div className="space-y-5">
            <SectionHeader>Workload & time</SectionHeader>

            <InputRow label="Average marking hours per week (per teacher)">
              <TextInput
                type="number"
                min={0}
                value={getNumberValue("weeklyMarkingHours")}
                onChange={(e) => updateNumberField("weeklyMarkingHours", e.target.value)}
              />
            </InputRow>

            <InputRow label="Admin & planning hours per week (per teacher)">
              <TextInput
                type="number"
                min={0}
                value={getNumberValue("weeklyAiAdminHours")}
                onChange={(e) => updateNumberField("weeklyAiAdminHours", e.target.value)}
              />
            </InputRow>

            <InputRow label="Average teacher salary (£/year)">
              <TextInput
                type="number"
                min={0}
                value={getNumberValue("avgSalary")}
                onChange={(e) => updateNumberField("avgSalary", e.target.value)}
              />
            </InputRow>
          </div>

          <div className="space-y-5">
            <SectionHeader>Absence & cover</SectionHeader>

            <InputRow
              label="Average teacher sick days per year"
              hint="Average teacher sickness absence days per teacher, per year"
            >
              <TextInput
                type="number"
                min={0}
                value={getNumberValue("sickDaysPerTeacher")}
                onChange={(e) => updateNumberField("sickDaysPerTeacher", e.target.value)}
              />
            </InputRow>

            <InputRow
              label="Supply cover cost per day (£)"
              hint="Average daily cost when teacher absence requires cover"
            >
              <TextInput
                type="number"
                min={0}
                value={getNumberValue("supplyDailyCost")}
                onChange={(e) => updateNumberField("supplyDailyCost", e.target.value)}
              />
            </InputRow>
          </div>

          <div className="space-y-5">
            <SectionHeader>Retention & recruitment</SectionHeader>

            <InputRow label="Teachers leaving each year (%)" hint="UK average ~8.8%">
              <TextInput
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={getPercentValue("attritionRate")}
                onChange={(e) => updatePercentField("attritionRate", e.target.value)}
              />
            </InputRow>

            <InputRow
              label="Replacement cost per teacher (£)"
              hint="Recruitment and onboarding cost when a teacher must be replaced"
            >
              <TextInput
                type="number"
                min={0}
                value={getNumberValue("replacementCost")}
                onChange={(e) => updateNumberField("replacementCost", e.target.value)}
              />
            </InputRow>
          </div>

          {viewMode === "internal" ? (
            <>
              <InputRow label="One time training cost (£)">
                <TextInput
                  type="number"
                  min={0}
                  value={getNumberValue("trainingOneTime")}
                  onChange={(e) => updateNumberField("trainingOneTime", e.target.value)}
                />
              </InputRow>

              <InputRow label="One time setup cost (£)">
                <TextInput
                  type="number"
                  min={0}
                  value={getNumberValue("setupOneTime")}
                  onChange={(e) => updateNumberField("setupOneTime", e.target.value)}
                />
              </InputRow>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
