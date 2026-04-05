"use client";

import packageJson from "@/package.json";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildAssumptionsGovernanceSummary,
  buildInternalAdminSummary,
  buildInternalView,
  buildSchoolView,
  createModel,
  DEFAULTS,
  GOVERNANCE_UPDATED_DATE,
  GOVERNANCE_VERSION,
  type Inputs,
  type ScenarioPreset,
} from "@/lib/calc";
import { BRAND } from "./ui";

export type RoiViewMode = "school" | "internal";
export type RawInputState = Partial<Record<keyof Inputs, string>>;
export type PercentDraftField =
  | "adoptionRate"
  | "examParticipationRate"
  | "attritionRate"
  | "markingReductionCustom"
  | "otherReductionCustom"
  | "sickdayReductionCustom"
  | "attritionReductionCustom";

function shallowEqual(a: unknown, b: unknown) {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

function sanitizeInputs(draft: Inputs): Inputs {
  const safeWeeklyHoursTotal = Math.max(
    0,
    Number.isFinite(draft.weeklyHoursTotal) ? draft.weeklyHoursTotal : 0
  );

  return {
    ...draft,
    weeklyAiAdminHours: Math.max(
      0,
      Number.isFinite(draft.weeklyAiAdminHours) ? draft.weeklyAiAdminHours : 0
    ),
    adoptionRate: Math.max(
      0,
      Math.min(1, Number.isFinite(draft.adoptionRate) ? draft.adoptionRate : 0)
    ),
    weeklyHoursTotal: safeWeeklyHoursTotal,
    weeklyMarkingHours: Math.max(
      0,
      Math.min(
        Number.isFinite(draft.weeklyMarkingHours) ? draft.weeklyMarkingHours : 0,
        safeWeeklyHoursTotal
      )
    ),
  };
}

function formatGeneratedDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function useRoiDashboard() {
  const [viewMode, setViewMode] = useState<RoiViewMode>("school");
  const [draft, setDraft] = useState<Inputs>(DEFAULTS);
  const [rawInputs, setRawInputs] = useState<RawInputState>({});
  const [applied, setApplied] = useState<Inputs>(DEFAULTS);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [roiYearShown, setRoiYearShown] = useState(1);
  const [roiAnimating, setRoiAnimating] = useState(false);
  const roiTimerRef = useRef<number | null>(null);

  const hasUncalculatedChanges = useMemo(
    () => !shallowEqual(draft, applied),
    [draft, applied]
  );

  const model = useMemo(() => createModel(applied), [applied]);
  const schoolView = useMemo(() => buildSchoolView(model), [model]);
  const internalView = useMemo(() => buildInternalView(model), [model]);
  const outputMetadata = useMemo(
    () => ({
      modelVersion: packageJson.version,
      assumptionSetVersion: GOVERNANCE_VERSION,
      generatedDate: formatGeneratedDate(new Date()),
      lastUpdated: GOVERNANCE_UPDATED_DATE,
      defaultsSourceNote:
        "Governed defaults are maintained locally in the Internal admin assumptions registry for now.",
      propagationNote:
        "When recalculated, governed assumption changes propagate to both School and Internal outputs.",
      includedNotes: [
        "Cash savings from supply cover and recruitment or replacement costs.",
        "Year 1 and 5-year outputs based on the active internal or school cost basis.",
      ],
      excludedNotes: [
        "Educational value is shown separately and excluded from cash ROI and break-even.",
        "Fully loaded operating costs are not yet included in the internal contribution summary.",
      ],
    }),
    []
  );
  const internalAdminSummary = useMemo(
    () => buildInternalAdminSummary(model, outputMetadata),
    [model, outputMetadata]
  );
  const draftAssumptionsGovernance = useMemo(
    () =>
      buildAssumptionsGovernanceSummary(draft, {
        assumptionSetVersion: outputMetadata.assumptionSetVersion,
        generatedDate: outputMetadata.generatedDate,
        lastUpdated: outputMetadata.lastUpdated,
        defaultsSourceNote: outputMetadata.defaultsSourceNote,
        propagationNote: outputMetadata.propagationNote,
      }),
    [draft, outputMetadata]
  );

  const displayedRoi =
    (viewMode === "school" ? model.schoolRoiByYear : model.internalRoiByYear)[roiYearShown - 1] ??
    (viewMode === "school" ? schoolView.roiYear1 : internalView.year1.roiYear1);
  const roiColor =
    displayedRoi !== null && Number.isFinite(displayedRoi) && displayedRoi < 0
      ? BRAND.bad
      : BRAND.good;

  function stopRoiAnimation(resetToYear1 = true) {
    if (roiTimerRef.current) {
      window.clearTimeout(roiTimerRef.current);
      roiTimerRef.current = null;
    }
    setRoiAnimating(false);
    if (resetToYear1) setRoiYearShown(1);
  }

  function startRoiAnimation() {
    if (roiAnimating) return;

    stopRoiAnimation(true);
    setRoiAnimating(true);

    let year = 1;
    const stepMs = 1050;

    const tick = () => {
      year += 1;

      if (year > 5) {
        roiTimerRef.current = window.setTimeout(() => {
          setRoiAnimating(false);
          setRoiYearShown(1);
          roiTimerRef.current = null;
        }, 200);
        return;
      }

      setRoiYearShown(year);
      roiTimerRef.current = window.setTimeout(tick, stepMs);
    };

    roiTimerRef.current = window.setTimeout(tick, stepMs);
  }

  useEffect(() => () => stopRoiAnimation(false), []);

  const timeReallocationData = useMemo(() => {
    const baselineAffected = applied.weeklyMarkingHours + applied.weeklyAiAdminHours;
    const freedAverage =
      (internalView.educationalValue.weeklyMarkingHoursSavedPerTeacher +
        internalView.educationalValue.weeklyAiAdminHoursSavedPerTeacher) *
      applied.adoptionRate;
    const freed = Math.max(0, Math.min(baselineAffected, freedAverage));
    const remaining = Math.max(0, baselineAffected - freed);

    return [
      {
        scenario: "Before MySmartTeach",
        remaining: baselineAffected,
        freedRange: [baselineAffected, baselineAffected] as [number, number],
      },
      {
        scenario: "With MySmartTeach",
        remaining,
        freedRange: [remaining, baselineAffected] as [number, number],
      },
    ];
  }, [
    applied.adoptionRate,
    applied.weeklyAiAdminHours,
    applied.weeklyMarkingHours,
    internalView.educationalValue.weeklyAiAdminHoursSavedPerTeacher,
    internalView.educationalValue.weeklyMarkingHoursSavedPerTeacher,
  ]);

  const schoolMonthlyCumulativeNetData = model.schoolProjectionSummary.monthlyCumulativeNetData;
  const schoolCumulativeNetData = useMemo(
    () =>
      model.schoolProjectionSummary.projection5y.map((row) => ({
        year: `Year ${row.year}`,
        cumulativeNet: Math.round(row.cumulativeNetBenefit),
      })),
    [model.schoolProjectionSummary.projection5y]
  );
  const internalCumulativeNetData = useMemo(
    () =>
      internalAdminSummary.projectionSummary.projection5y.map((row) => ({
        year: `Year ${row.year}`,
        cumulativeNet: Math.round(row.cumulativeNetBenefit),
      })),
    [internalAdminSummary.projectionSummary.projection5y]
  );

  const cumulativeNetData = viewMode === "school" ? schoolCumulativeNetData : internalCumulativeNetData;
  const breakEvenMonth =
    viewMode === "school"
      ? model.schoolProjectionSummary.breakEvenMonth
      : internalAdminSummary.projectionSummary.breakEvenMonth;

  function updateDraftField<K extends keyof Inputs>(field: K, value: Inputs[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function updateDraftNumberField<K extends keyof Inputs>(field: K, rawValue: string) {
    setRawInputs((current) => ({ ...current, [field]: rawValue }));

    if (rawValue === "") {
      updateDraftField(field, 0 as Inputs[K]);
      return;
    }

    const parsed = Number(rawValue);
    updateDraftField(field, (Number.isFinite(parsed) ? parsed : 0) as Inputs[K]);
  }

  function updateDraftPercentField(field: PercentDraftField, rawValue: string) {
    setRawInputs((current) => ({ ...current, [field]: rawValue }));

    if (rawValue === "") {
      updateDraftField(field, 0 as Inputs[typeof field]);
      return;
    }

    const parsed = Number(rawValue);
    updateDraftField(field, (Number.isFinite(parsed) ? parsed / 100 : 0) as Inputs[typeof field]);
  }

  function updateDraftPreset(preset: ScenarioPreset) {
    setDraft((current) => ({ ...current, preset }));
  }

  function getNumberValue<K extends keyof Inputs>(field: K) {
    return rawInputs[field] ?? String(draft[field]);
  }

  function getPercentValue(field: PercentDraftField) {
    return rawInputs[field] ?? String(Number(draft[field]) * 100);
  }

  function applyDraft() {
    const sanitized = sanitizeInputs(draft);
    setApplied(sanitized);
    setDraft(sanitized);
    setRawInputs({});
    stopRoiAnimation(true);
  }

  function resetToDefaults() {
    setDraft(DEFAULTS);
    setApplied(DEFAULTS);
    setRawInputs({});
    stopRoiAnimation(true);
  }

  return {
    viewMode,
    setViewMode,
    draft,
    setDraft,
    rawInputs,
    setRawInputs,
    applied,
    showAdvanced,
    setShowAdvanced,
    hasUncalculatedChanges,
    schoolView,
    internalView,
    internalAdminSummary,
    draftAssumptionsGovernance,
    displayedRoi,
    roiAnimating,
    roiYearShown,
    roiColor,
    timeReallocationData,
    schoolMonthlyCumulativeNetData,
    cumulativeNetData,
    breakEvenMonth,
    updateDraftField,
    updateDraftNumberField,
    updateDraftPercentField,
    updateDraftPreset,
    getNumberValue,
    getPercentValue,
    startRoiAnimation,
    applyDraft,
    resetToDefaults,
  };
}
