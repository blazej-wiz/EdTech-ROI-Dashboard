"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { calculate, DEFAULTS, Inputs, ScenarioPreset } from "@/lib/calc";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";

/**
 * Lighter palette (your provided hexes) + softened fills.
 */
const BRAND = {
  blue: "#2367FA",
  blueDeep: "rgba(35,103,250,0.85)",

  indigo: "rgba(35,103,250,0.95)",

  purple: "#AE3CFA",
  purpleDeep: "rgba(174,60,250,0.85)",

  bgTop: "#F7F9FF",
  bgBottom: "#EEF2FF",

  text: "#0B1220",
  muted: "#46556E",
  card: "#FFFFFF",
  border: "#E2E8F0",

  good: "#15803D",
  bad: "#B91C1C",
};

function formatGBP(n: number) {
  const v = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(v);
}
function formatPct(n: number | null) {
  if (n === null || !Number.isFinite(n)) return "—";
  return `${(n * 100).toFixed(1)}%`;
}
function formatNum(n: number | null, dp = 1) {
  if (n === null || !Number.isFinite(n)) return "—";
  return n.toFixed(dp);
}

function Card({
  title,
  children,
  onClick,
  clickable,
}: {
  title: string;
  children: React.ReactNode;
  onClick?: () => void;
  clickable?: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-5 shadow-sm transition"
      style={{
        background: BRAND.card,
        border: `1px solid ${BRAND.border}`,
        cursor: clickable ? "pointer" : "default",
        userSelect: clickable ? "none" : "auto",
      }}
      onClick={onClick}
    >
      <div className="text-sm font-semibold" style={{ color: BRAND.muted }}>
        {title}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function InputRow({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:items-center">
      <div>
        <div className="text-sm font-semibold" style={{ color: BRAND.text }}>
          {label}
        </div>
        {hint ? (
          <div className="text-xs" style={{ color: BRAND.muted }}>
            {hint}
          </div>
        ) : null}
      </div>
      <div>{children}</div>
    </div>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-xl px-3 py-2 text-sm outline-none transition"
      style={{
        background: "#fff",
        border: `1px solid ${BRAND.border}`,
        color: BRAND.text,
      }}
    />
  );
}

function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full rounded-xl px-3 py-2 text-sm outline-none transition"
      style={{
        background: "#fff",
        border: `1px solid ${BRAND.border}`,
        color: BRAND.text,
      }}
    />
  );
}

function shallowEqual(a: any, b: any) {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

export default function Page() {
  // Draft inputs: user edits here
  const [draft, setDraft] = useState<Inputs>(DEFAULTS);
  // Applied inputs: used in calculation (only updates on Calculate)
  const [applied, setApplied] = useState<Inputs>(DEFAULTS);

  const [showAdvanced, setShowAdvanced] = useState(false);

  const hasUncalculatedChanges = useMemo(
    () => !shallowEqual(draft, applied),
    [draft, applied]
  );

  const outputs = useMemo(() => calculate(applied), [applied]);

  /**
   * ROI animation:
   * Steps Year 1 -> Year 5 using cumulative ROI (so it changes each year),
   * then resets to Year 1 at the end.
   */
  const [roiYearShown, setRoiYearShown] = useState<number>(1);
  const [roiAnimating, setRoiAnimating] = useState(false);
  const roiTimerRef = useRef<number | null>(null);

  const displayedRoi = outputs.roiByYear[roiYearShown - 1] ?? outputs.roiYear1;
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

    let y = 1;
    const stepMs = 900;

    const tick = () => {
      y += 1;

      if (y > 5) {
        setRoiYearShown(1);
        roiTimerRef.current = window.setTimeout(() => {
          stopRoiAnimation(false);
        }, 200);
        return;
      }

      setRoiYearShown(y);
      roiTimerRef.current = window.setTimeout(tick, stepMs);
    };

    roiTimerRef.current = window.setTimeout(tick, stepMs);
  }

  useEffect(() => {
    return () => stopRoiAnimation(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Educational chart data
  const timeReallocationData = useMemo(() => {
    const total = applied.weeklyHoursTotal;
    const adoptedAvgWeekly = outputs.weeklyHoursSavedPerTeacher * applied.adoptionRate;
    const reallocated = Math.max(0, Math.min(total, adoptedAvgWeekly));
    return [
      { scenario: "No AI", adminMarking: total, reallocatedTeaching: 0 },
      { scenario: "With AI", adminMarking: total - reallocated, reallocatedTeaching: reallocated },
    ];
  }, [applied.weeklyHoursTotal, applied.adoptionRate, outputs.weeklyHoursSavedPerTeacher]);

  // Projection charts
  const cumulativeNetData = outputs.projection5y.map((r) => ({
    year: `Year ${r.year}`,
    cumulativeNet: Math.round(r.cumulativeNetBenefit),
  }));

  const costsVsSavingsData = outputs.projection5y.map((r) => ({
    year: `Year ${r.year}`,
    Costs: Math.round(r.costs),
    Savings: Math.round(r.savings),
  }));

  // Font family
  const appFont = `"Libertinus Sans", ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"`;

  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily: appFont,
        background: `linear-gradient(180deg, ${BRAND.bgTop} 0%, ${BRAND.bgBottom} 100%)`,
        color: BRAND.text,
      }}
    >
      <header className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-2xl"
              style={{
                background: `linear-gradient(135deg, ${BRAND.blue} 0%, ${BRAND.indigo} 55%, ${BRAND.purple} 100%)`,
              }}
            />
            <div>
              <h1 className="text-3xl font-bold tracking-tight" style={{ color: BRAND.text }}>
                My Smart Teach ROI Dashboard
              </h1>
              <p className="text-sm" style={{ color: BRAND.muted }}>
                ROI is based on savings from <span className="font-semibold">supply cover</span> and{" "}
                <span className="font-semibold">attrition reduction</span>. Teacher time is shown separately as
                educational value and £-equivalent value.
              </p>
            </div>
          </div>

          {hasUncalculatedChanges ? (
            <div
              className="inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                background: "#FFF7ED",
                color: "#9A3412",
                border: "1px solid #FED7AA",
              }}
            >
              Unsaved changes — click <span className="font-bold">Calculate</span> to update results
            </div>
          ) : (
            <div
              className="inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                background: "#ECFDF5",
                color: "#065F46",
                border: "1px solid #A7F3D0",
              }}
            >
              Results up to date
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 pb-10 lg:grid-cols-3">
        {/* Inputs */}
        <div className="lg:col-span-1 space-y-4">
          <div
            className="rounded-2xl p-5 shadow-sm"
            style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}
          >
            <div className="flex items-center justify-between">
              <div className="text-base font-bold" style={{ color: BRAND.text }}>
                Inputs
              </div>

              <button
                className="rounded-full px-3 py-1 text-sm font-semibold transition"
                style={{
                  border: `1px solid ${BRAND.border}`,
                  color: BRAND.text,
                  background: "#fff",
                  cursor: 'pointer',
                }}
                onClick={() => setShowAdvanced((s) => !s)}
              >
                {showAdvanced ? "Hide advanced" : "More accurate"}
              </button>
            </div>

{/* Guardrail warnings (non-blocking) */}
{(draft.adoptionRate < 0 || draft.adoptionRate > 1 || draft.weeklyMarkingHours > draft.weeklyHoursTotal) && (
  <div
    className="rounded-xl px-3 py-2 text-xs font-semibold"
    style={{ background: "#FFF7ED", color: "#9A3412", border: "1px solid #FED7AA" }}
  >
    {draft.adoptionRate < 0 || draft.adoptionRate > 1 ? (
      <div>Teacher adoption rate should be between 0 and 1. We’ll clamp it when you click Calculate.</div>
    ) : null}
    {draft.weeklyMarkingHours > draft.weeklyHoursTotal ? (
      <div>Marking hours can’t exceed total weekly hours. We’ll cap marking at total hours.</div>
    ) : null}
  </div>
)}

            <div className="mt-4 space-y-4">
              <InputRow label="Number of teachers (FTE)" hint="Required">
                <TextInput
                  type="number"
                  min={0}
                  value={draft.teachersFTE}
                  onChange={(e) => setDraft({ ...draft, teachersFTE: Number(e.target.value) })}
                />
              </InputRow>

              <InputRow label="Number of students" hint="Required">
                <TextInput
                  type="number"
                  min={0}
                  value={draft.students}
                  onChange={(e) => setDraft({ ...draft, students: Number(e.target.value) })}
                />
              </InputRow>

<InputRow label="Teacher adoption rate" hint="Required (0.6 = 60% of teachers using the tool)">
                <TextInput
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={draft.adoptionRate}
                  onChange={(e) => setDraft({ ...draft, adoptionRate: Number(e.target.value) })}
                />
              </InputRow>

              <InputRow label="Scenario preset" hint="Conservative / Expected / Ambitious / Custom">
                <SelectInput
                  value={draft.preset}
                  onChange={(e) => setDraft({ ...draft, preset: e.target.value as ScenarioPreset })}
                >
                  <option value="Conservative">Conservative</option>
                  <option value="Expected">Expected</option>
                  <option value="Ambitious">Ambitious</option>
                  <option value="Custom">Custom</option>
                </SelectInput>
              </InputRow>

              <button
                className="w-full rounded-2xl px-4 py-3 text-sm font-bold text-white transition"
                style={{
                  background: `linear-gradient(135deg, ${BRAND.blue} 0%, ${BRAND.indigo} 55%, ${BRAND.purple} 100%)`,
                  cursor: 'pointer',
                }}
                onClick={() => {
  const sanitized: Inputs = {
    ...draft,
    adoptionRate: Math.max(0, Math.min(1, Number.isFinite(draft.adoptionRate) ? draft.adoptionRate : 0)),
    weeklyHoursTotal: Math.max(0, Number.isFinite(draft.weeklyHoursTotal) ? draft.weeklyHoursTotal : 0),
    weeklyMarkingHours: Math.max(
      0,
      Math.min(
        Number.isFinite(draft.weeklyMarkingHours) ? draft.weeklyMarkingHours : 0,
        Math.max(0, Number.isFinite(draft.weeklyHoursTotal) ? draft.weeklyHoursTotal : 0)
      )
    ),
  };

  setApplied(sanitized);
  // Optional: also update draft so the UI reflects what was applied
  setDraft(sanitized);
  stopRoiAnimation(true);
}}

              >
                Calculate
              </button>

              <button
                className="w-full rounded-2xl px-4 py-2 text-sm font-semibold transition"
                style={{
                  background: "#fff",
                  border: `1px solid ${BRAND.border}`,
                  color: BRAND.text,
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setDraft(DEFAULTS);
                  setApplied(DEFAULTS);
                  stopRoiAnimation(true);
                }}
              >
                Reset to defaults
              </button>
            </div>

            {showAdvanced && (
              <div className="mt-6 space-y-4 border-t pt-5" style={{ borderColor: BRAND.border }}>
                <div className="text-sm font-bold" style={{ color: BRAND.text }}>
                  Advanced inputs
                </div>

                <InputRow label="Average teacher salary (£/year)" hint="Used for £-equivalent value of reallocated time">
                  <TextInput
                    type="number"
                    min={0}
                    value={draft.avgSalary}
                    onChange={(e) => setDraft({ ...draft, avgSalary: Number(e.target.value) })}
                  />
                </InputRow>

                <InputRow label="School weeks per year">
                  <TextInput
                    type="number"
                    min={0}
                    value={draft.weeksPerYear}
                    onChange={(e) => setDraft({ ...draft, weeksPerYear: Number(e.target.value) })}
                  />
                </InputRow>

                <InputRow label="Weekly working hours per teacher">
                  <TextInput
                    type="number"
                    min={0}
                    value={draft.weeklyHoursTotal}
                    onChange={(e) => setDraft({ ...draft, weeklyHoursTotal: Number(e.target.value) })}
                  />
                </InputRow>

                <InputRow label="Marking hours per week (per teacher)">
                  <TextInput
                    type="number"
                    min={0}
                    value={draft.weeklyMarkingHours}
                    onChange={(e) => setDraft({ ...draft, weeklyMarkingHours: Number(e.target.value) })}
                  />
                </InputRow>

                {draft.preset === "Custom" && (
                  <>
                    <InputRow label="(Custom) Marking reduction (%)">
                      <TextInput
                        type="number"
                        min={0}
                        max={1}
                        step={0.05}
                        value={draft.markingReductionCustom}
                        onChange={(e) => setDraft({ ...draft, markingReductionCustom: Number(e.target.value) })}
                      />
                    </InputRow>

                    <InputRow label="(Custom) Other reduction (%)">
                      <TextInput
                        type="number"
                        min={0}
                        max={1}
                        step={0.05}
                        value={draft.otherReductionCustom}
                        onChange={(e) => setDraft({ ...draft, otherReductionCustom: Number(e.target.value) })}
                      />
                    </InputRow>

                    <InputRow label="(Custom) Sick-day reduction (%)">
                      <TextInput
                        type="number"
                        min={0}
                        max={1}
                        step={0.01}
                        value={draft.sickdayReductionCustom}
                        onChange={(e) => setDraft({ ...draft, sickdayReductionCustom: Number(e.target.value) })}
                      />
                    </InputRow>

                    <InputRow label="(Custom) Attrition reduction (%)">
                      <TextInput
                        type="number"
                        min={0}
                        max={1}
                        step={0.01}
                        value={draft.attritionReductionCustom}
                        onChange={(e) => setDraft({ ...draft, attritionReductionCustom: Number(e.target.value) })}
                      />
                    </InputRow>
                  </>
                )}

                <InputRow label="Sick days per teacher per year">
                  <TextInput
                    type="number"
                    min={0}
                    value={draft.sickDaysPerTeacher}
                    onChange={(e) => setDraft({ ...draft, sickDaysPerTeacher: Number(e.target.value) })}
                  />
                </InputRow>

                <InputRow label="Supply teacher daily cost (£/day)">
                  <TextInput
                    type="number"
                    min={0}
                    value={draft.supplyDailyCost}
                    onChange={(e) => setDraft({ ...draft, supplyDailyCost: Number(e.target.value) })}
                  />
                </InputRow>

                <InputRow label="Annual attrition rate (%)">
                  <TextInput
                    type="number"
                    min={0}
                    max={1}
                    step={0.005}
                    value={draft.attritionRate}
                    onChange={(e) => setDraft({ ...draft, attritionRate: Number(e.target.value) })}
                  />
                </InputRow>

                <InputRow label="Cost to replace one teacher (£)">
                  <TextInput
                    type="number"
                    min={0}
                    value={draft.replacementCost}
                    onChange={(e) => setDraft({ ...draft, replacementCost: Number(e.target.value) })}
                  />
                </InputRow>

                <InputRow label="Training cost (one-time, Year 1, £)">
                  <TextInput
                    type="number"
                    min={0}
                    value={draft.trainingOneTime}
                    onChange={(e) => setDraft({ ...draft, trainingOneTime: Number(e.target.value) })}
                  />
                </InputRow>

                <InputRow label="Setup cost (one-time, Year 1, £)">
                  <TextInput
                    type="number"
                    min={0}
                    value={draft.setupOneTime}
                    onChange={(e) => setDraft({ ...draft, setupOneTime: Number(e.target.value) })}
                  />
                </InputRow>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Assumptions & definitions">
  <details className="text-sm" style={{ color: BRAND.muted }}>
    <summary style={{ cursor: "pointer", color: BRAND.text, fontWeight: 700 }}>
      How these numbers are calculated (click to expand)
    </summary>

    <div className="mt-3 space-y-3" style={{ color: BRAND.muted }}>
      <div>
        <div className="font-semibold" style={{ color: BRAND.text }}>
          What ROI includes
        </div>
        <ul className="mt-1 list-disc pl-5">
          <li>
            <span className="font-semibold" style={{ color: BRAND.text }}>Supply cover savings</span> from reduced teacher absence
          </li>
          <li>
            <span className="font-semibold" style={{ color: BRAND.text }}>Attrition savings</span> from fewer teacher replacements
          </li>
        </ul>
      </div>

      <div>
        <div className="font-semibold" style={{ color: BRAND.text }}>
          What ROI does not include
        </div>
        <ul className="mt-1 list-disc pl-5">
          <li>
            Teacher time saved is shown as <span className="font-semibold" style={{ color: BRAND.text }}>capacity unlocked</span>, not payroll savings.
          </li>
          <li>
            Teachers are still paid the same — time is reallocated to higher-quality teaching and student support.
          </li>
        </ul>
      </div>

      <div>
        <div className="font-semibold" style={{ color: BRAND.text }}>
          Teacher adoption rate
        </div>
        <ul className="mt-1 list-disc pl-5">
          <li>
            Adoption rate represents the fraction of teachers actively using MySmartTeach.
          </li>
          <li>
            Savings and time benefits scale with adoption (e.g. 0.6 = 60% of teachers).
          </li>
        </ul>
      </div>

      <div>
        <div className="font-semibold" style={{ color: BRAND.text }}>
          Scenario presets
        </div>
        <ul className="mt-1 list-disc pl-5">
          <li>
            Conservative / Expected / Ambitious are illustrative assumptions. Use <span className="font-semibold" style={{ color: BRAND.text }}>Custom</span> for your own values.
          </li>
        </ul>
      </div>

      <div>
        <div className="font-semibold" style={{ color: BRAND.text }}>
          “5% retention improvement” (key question)
        </div>
        <ul className="mt-1 list-disc pl-5">
          <li>
            Interpreted as <span className="font-semibold" style={{ color: BRAND.text }}>5% fewer leavers (relative)</span> among adopting teachers, multiplied by replacement cost.
          </li>
        </ul>
      </div>

      <div className="text-xs">
        <span className="font-semibold" style={{ color: BRAND.text }}>Last updated:</span>{" "}
        {new Date().toLocaleDateString("en-GB")}
      </div>
    </div>
  </details>
</Card>

          {/* KPI tiles */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card title="Annual subscription cost">
              <div className="text-2xl font-extrabold" style={{ color: BRAND.text }}>
                {formatGBP(outputs.aiSubscriptionAnnual)}
              </div>
              <div className="mt-1 text-xs" style={{ color: BRAND.muted }}>
                Calculated internally (tiered)
              </div>
            </Card>

            <Card title="Annual savings">
              <div className="text-2xl font-extrabold" style={{ color: BRAND.text }}>
                {formatGBP(outputs.annualSavingsCash)}
              </div>
              <div className="mt-1 text-xs" style={{ color: BRAND.muted }}>
                Supply cover + attrition
              </div>
            </Card>

            <Card title="Year 1 total cost">
              <div className="text-2xl font-extrabold" style={{ color: BRAND.text }}>
                {formatGBP(outputs.totalCostYear1)}
              </div>
              <div className="mt-1 text-xs" style={{ color: BRAND.muted }}>
                Subscription + training + setup
              </div>
            </Card>

            <Card
              title={roiAnimating ? `ROI (Year ${roiYearShown})` : "ROI (Year 1)"}
              clickable
              onClick={startRoiAnimation}
            >
              <div className="text-2xl font-extrabold" style={{ color: roiColor }}>
                {formatPct(displayedRoi)}
              </div>
              <div className="mt-1 text-xs" style={{ color: BRAND.muted }}>
                {roiAnimating ? "Animating Year 1 → Year 5 (click disabled)" : "Click to animate to Year 5"}
              </div>
            </Card>
          </div>

          {/* NEW: Key Questions */}
          <div
            className="rounded-2xl p-5 shadow-sm"
            style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}
          >
            <div className="text-sm font-bold" style={{ color: BRAND.muted }}>
              Key questions (quick scenarios)
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div
                className="rounded-2xl p-4"
                style={{ background: "#F8FAFF", border: `1px solid ${BRAND.border}` }}
              >
                <div className="text-sm font-extrabold" style={{ color: BRAND.text }}>
                  Savings if absence drops (supply cover)
                </div>
                <div className="mt-2 space-y-2">
                  {outputs.absenceSensitivity.map((p) => (
                    <div
                      key={p.label}
                      className="flex items-center justify-between rounded-xl px-3 py-2"
                      style={{ background: "#FFFFFF", border: `1px solid ${BRAND.border}` }}
                    >
                      <div className="text-sm font-semibold" style={{ color: BRAND.text }}>
                        {p.label} absence drop
                      </div>
                      <div className="text-sm font-extrabold" style={{ color: BRAND.blue }}>
                        {formatGBP(p.annualSupplySavings)} / year
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs" style={{ color: BRAND.muted }}>
                  Uses: sick days × adopted teachers × supply daily cost × drop %.
                </div>
              </div>

              <div
                className="rounded-2xl p-4"
                style={{ background: "#FBF7FF", border: `1px solid ${BRAND.border}` }}
              >
                <div className="text-sm font-extrabold" style={{ color: BRAND.text }}>
Financial impact if leavers drop by 5%
                </div>
                <div className="mt-3 rounded-xl px-3 py-3"
                     style={{ background: "#FFFFFF", border: `1px solid ${BRAND.border}` }}>
                  <div className="text-xs" style={{ color: BRAND.muted }}>
                    Annual savings from reduced attrition
                  </div>
                  <div className="mt-1 text-2xl font-extrabold" style={{ color: BRAND.purple }}>
                    {formatGBP(outputs.retentionImpact5Annual)} / year
                  </div>
                </div>
                <div className="mt-3 text-xs" style={{ color: BRAND.muted }}>
Interpreted as 5% fewer leavers (relative) among adopting teachers × replacement cost.
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div
              className="rounded-2xl p-5 shadow-sm"
              style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}
            >
              <div className="text-sm font-bold" style={{ color: BRAND.muted }}>
                Cumulative net benefit (5-year)
              </div>
              <div className="mt-3 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cumulativeNetData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                    <Tooltip formatter={(v: any) => formatGBP(Number(v))} />
                    <Line type="monotone" dataKey="cumulativeNet" stroke={BRAND.blue} strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-xs" style={{ color: BRAND.muted }}>
                Break-even happens when the line crosses £0.
              </div>
            </div>

            <div
              className="rounded-2xl p-5 shadow-sm"
              style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}
            >
              <div className="text-sm font-bold" style={{ color: BRAND.muted }}>
                Costs vs savings (5-year)
              </div>
              <div className="mt-3 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={costsVsSavingsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                    <Tooltip formatter={(v: any) => formatGBP(Number(v))} />
                    <Legend />
                    <Bar dataKey="Costs" fill={BRAND.blueDeep} />
                    <Bar dataKey="Savings" fill={BRAND.purpleDeep} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-xs" style={{ color: BRAND.muted }}>
                Year 1 includes setup & training; Years 2–5 are subscription only.
              </div>
            </div>
          </div>

          {/* Educational Value */}
          <div
            className="rounded-2xl p-5 shadow-sm"
            style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}
          >
            <div className="flex flex-col gap-1">
              <div className="text-sm font-extrabold" style={{ color: BRAND.text }}>
                Educational value (time reallocated)
              </div>
              <div className="text-xs" style={{ color: BRAND.muted }}>
                AI reallocates time from admin/marking to higher-quality, student-facing teaching.
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card title="Hours reallocated per teacher (weekly)">
                <div className="text-2xl font-extrabold" style={{ color: BRAND.text }}>
                  {formatNum(outputs.weeklyHoursSavedPerTeacher * applied.adoptionRate, 1)}
                </div>
                <div className="mt-1 text-xs" style={{ color: BRAND.muted }}>
                  Adoption-adjusted average
                </div>
              </Card>

              <Card title="Total hours reallocated (annual)">
                <div className="text-2xl font-extrabold" style={{ color: BRAND.text }}>
                  {formatNum(outputs.annualHoursSavedTotal, 0)}
                </div>
                <div className="mt-1 text-xs" style={{ color: BRAND.muted }}>
                  Across adopting teachers
                </div>
              </Card>

              <Card title="£ value of time reallocated (annual)">
                <div className="text-2xl font-extrabold" style={{ color: BRAND.text }}>
                  {formatGBP(outputs.annualValueOfReallocatedTimeGBP)}
                </div>
                <div className="mt-1 text-xs" style={{ color: BRAND.muted }}>
                  £-equivalent value (not included in ROI)
                </div>
              </Card>
            </div>

            <div className="mt-5 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeReallocationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="scenario" />
                  <YAxis />
                  <Tooltip formatter={(v: any) => `${Number(v).toFixed(1)} hours`} />
                  <Legend />
                  <Bar dataKey="adminMarking" name="Admin & marking tasks" stackId="a" fill={BRAND.blueDeep} />
                  <Bar dataKey="reallocatedTeaching" name="Reallocated to high-quality teaching" stackId="a" fill={BRAND.purpleDeep} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div
                className="rounded-xl p-3 text-sm"
                style={{ background: "#F8FAFC", border: `1px solid ${BRAND.border}` }}
              >
                <div className="font-bold" style={{ color: BRAND.text }}>
                  Adoption scaling
                </div>
                <div style={{ color: BRAND.muted }}>
                  Adopted teachers: {outputs.adoptedTeachers.toFixed(1)} / {applied.teachersFTE} <br />
                  Adopted students: {outputs.adoptedStudents.toFixed(0)} / {applied.students}
                </div>
              </div>

              <div
                className="rounded-xl p-3 text-sm"
                style={{ background: "#F8FAFC", border: `1px solid ${BRAND.border}` }}
              >
                <div className="font-bold" style={{ color: BRAND.text }}>
                  Per adopted student framing
                </div>
                <div style={{ color: BRAND.muted }}>
                  Subscription per adopted student:{" "}
                  {outputs.aiCostPerAdoptedStudent ? formatGBP(outputs.aiCostPerAdoptedStudent) : "—"} / year
                  <br />
                  Year 1 net benefit per adopted student:{" "}
                  {outputs.netBenefitPerAdoptedStudentYear1
                    ? formatGBP(outputs.netBenefitPerAdoptedStudentYear1)
                    : "—"}
                </div>
              </div>
            </div>
          </div>

          {/* Break-even */}
          <div
            className="rounded-2xl p-5 shadow-sm"
            style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}
          >
            <div className="text-sm font-bold" style={{ color: BRAND.muted }}>
              Break-even subscription (Year 1)
            </div>
            <div className="mt-2" style={{ color: BRAND.text }}>
              Break-even annual subscription:{" "}
              <span className="font-extrabold">{formatGBP(outputs.breakEvenAiAnnual)}</span>
            </div>
            <div className="mt-2 text-xs" style={{ color: BRAND.muted }}>
              Maximum subscription that breaks even in Year 1 after setup & training.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
