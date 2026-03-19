"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildInternalView,
  buildSchoolView,
  createModel,
  DEFAULTS,
  type Inputs,
} from "@/lib/calc";
import { BRAND } from "./ui";

export type RoiViewMode = "school" | "internal";
export type RawInputState = Partial<Record<keyof Inputs, string>>;

type MonthlyCumulativeNetPoint = {
  month: number;
  cumulativeNet: number;
};

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

function buildMonthlyCumulativeNetData(
  annualSavingsCash: number,
  recurringAnnualCost: number,
  trainingOneTime: number,
  setupOneTime: number
): MonthlyCumulativeNetPoint[] {
  const monthlySavings = annualSavingsCash / 12;
  const initialContractCost = recurringAnnualCost + trainingOneTime + setupOneTime;
  let cumulativeNet = -initialContractCost;
  const data = [{ month: 0, cumulativeNet: Math.round(cumulativeNet) }];

  for (let month = 1; month <= 60; month += 1) {
    if (month > 1 && (month - 1) % 12 === 0) {
      cumulativeNet -= recurringAnnualCost;
    }

    cumulativeNet += monthlySavings;
    data.push({
      month,
      cumulativeNet: Math.round(cumulativeNet),
    });
  }

  return data;
}

function calculateBreakEvenMonth(
  annualSavingsCash: number,
  monthlyCumulativeNetData: MonthlyCumulativeNetPoint[]
) {
  const monthlySavings = annualSavingsCash / 12;
  if (monthlySavings <= 0) return null;

  for (let index = 1; index < monthlyCumulativeNetData.length; index += 1) {
    const previousNet = monthlyCumulativeNetData[index - 1]?.cumulativeNet ?? 0;
    const currentNet = monthlyCumulativeNetData[index]?.cumulativeNet ?? 0;

    if (previousNet >= 0) {
      return 0;
    }

    if (previousNet < 0 && currentNet >= 0) {
      const exactMonths = (index - 1) + Math.abs(previousNet) / monthlySavings;
      return Math.max(1, Math.round(exactMonths));
    }
  }

  return null;
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

  const internalEcon = useMemo(() => {
    const licence = internalView.costs.licenceFeeAnnual ?? 0;
    const inference = internalView.costs.aiInferenceCostAnnual ?? 0;
    const grossMargin = licence - inference;
    const marginPct = licence > 0 ? grossMargin / licence : null;

    return {
      licence,
      inference,
      grossMargin,
      marginPct,
    };
  }, [
    internalView.costs.aiInferenceCostAnnual,
    internalView.costs.licenceFeeAnnual,
  ]);

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
        scenario: "Before AI",
        remaining: baselineAffected,
        freedRange: [baselineAffected, baselineAffected] as [number, number],
      },
      {
        scenario: "With AI",
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

  const schoolMonthlyCumulativeNetData = useMemo(() => buildMonthlyCumulativeNetData(
    internalView.cashSavings.annualSavingsCash,
    internalView.costs.school.recurringAnnualCost,
    internalView.costs.trainingOneTime,
    internalView.costs.setupOneTime
  ), [
    internalView.cashSavings.annualSavingsCash,
    internalView.costs.school.recurringAnnualCost,
    internalView.costs.setupOneTime,
    internalView.costs.trainingOneTime,
  ]);

  const internalMonthlyCumulativeNetData = useMemo(() => buildMonthlyCumulativeNetData(
    internalView.cashSavings.annualSavingsCash,
    internalView.costs.internal.recurringAnnualCost,
    internalView.costs.trainingOneTime,
    internalView.costs.setupOneTime
  ), [
    internalView.cashSavings.annualSavingsCash,
    internalView.costs.internal.recurringAnnualCost,
    internalView.costs.setupOneTime,
    internalView.costs.trainingOneTime,
  ]);

  const schoolCumulativeNetData = useMemo(
    () =>
      model.schoolProjection5y.map((row) => ({
        year: `Year ${row.year}`,
        cumulativeNet: Math.round(row.cumulativeNetBenefit),
      })),
    [model.schoolProjection5y]
  );

  const internalCumulativeNetData = useMemo(
    () =>
      internalView.projection5y.map((row) => ({
        year: `Year ${row.year}`,
        cumulativeNet: Math.round(row.cumulativeNetBenefit),
      })),
    [internalView.projection5y]
  );

  const cumulativeNetData = viewMode === "school" ? schoolCumulativeNetData : internalCumulativeNetData;

  const breakEvenMonth = useMemo(
    () =>
      calculateBreakEvenMonth(
        internalView.cashSavings.annualSavingsCash,
        viewMode === "school" ? schoolMonthlyCumulativeNetData : internalMonthlyCumulativeNetData
      ),
    [
      internalView.cashSavings.annualSavingsCash,
      internalMonthlyCumulativeNetData,
      schoolMonthlyCumulativeNetData,
      viewMode,
    ]
  );

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
    internalEcon,
    displayedRoi,
    roiAnimating,
    roiYearShown,
    roiColor,
    timeReallocationData,
    schoolMonthlyCumulativeNetData,
    cumulativeNetData,
    breakEvenMonth,
    startRoiAnimation,
    applyDraft,
    resetToDefaults,
  };
}
