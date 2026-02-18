"use client";
import Image from "next/image";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { calculate, DEFAULTS, Inputs, ScenarioPreset, AiCostingMode } from "@/lib/calc";
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
  ReferenceLine,
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
        <div className="text-sm font-medium" style={{ color: BRAND.text }}>
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
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full h-px" style={{ background: BRAND.border }} />
      </div>

      <div className="relative flex justify-center">
        <span
          className="px-4 text-sm font-semibold"
          style={{ background: BRAND.card, color: BRAND.text }}
        >
          {children}
        </span>
      </div>
    </div>
  );
}

export default function Page() {
  const [viewMode, setViewMode] = useState<"school" | "internal">("school");

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
  const internalEcon = useMemo(() => {
  const licence = outputs.licenceFeeAnnual ?? outputs.aiSubscriptionAnnual ?? 0;
  const inference = outputs.aiInferenceCostAnnual ?? 0;

  const grossMargin = licence - inference;
  const marginPct = licence > 0 ? grossMargin / licence : null;

  return {
    licence,
    inference,
    grossMargin,
    marginPct,
  };
}, [
  outputs.licenceFeeAnnual,
  outputs.aiSubscriptionAnnual,
  outputs.aiInferenceCostAnnual,
]);

  const netBenefitPerAdoptedStudent5y = useMemo(() => {
  const year5 = outputs.projection5y[4]?.cumulativeNetBenefit ?? null;
  if (year5 === null) return null;
  return outputs.adoptedStudents > 0 ? year5 / outputs.adoptedStudents : null;
}, [outputs.projection5y, outputs.adoptedStudents]);

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
    const stepMs = 1050;


    const tick = () => {
      y += 1;

      if (y > 5) {
  // keep showing Year 5 while we finish animation state
  roiTimerRef.current = window.setTimeout(() => {
    setRoiAnimating(false); // stop animation first (syncs the subtitle)
    setRoiYearShown(1);     // then reset back to Year 1
    roiTimerRef.current = null;
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
  // Educational chart data (marking time only, reallocated — NOT added)
const timeReallocationData = useMemo(() => {
  const baselineAffected = applied.weeklyMarkingHours + applied.weeklyAiAdminHours;

  const freedAvg =
    (outputs.weeklyMarkingHoursSavedPerTeacher + outputs.weeklyAiAdminHoursSavedPerTeacher) *
    applied.adoptionRate;

  const freed = Math.max(0, Math.min(baselineAffected, freedAvg));
  const remaining = Math.max(0, baselineAffected - freed);

  return [
    {
      scenario: "Before AI",
      remaining: baselineAffected,
      freedRange: [baselineAffected, baselineAffected], // zero-height
    },
    {
      scenario: "With AI",
      remaining,
      freedRange: [remaining, baselineAffected], // top slice
    },
  ];
}, [
  applied.weeklyMarkingHours,
  applied.weeklyAiAdminHours,
  applied.adoptionRate,
  outputs.weeklyMarkingHoursSavedPerTeacher,
  outputs.weeklyAiAdminHoursSavedPerTeacher,
]);


  // Projection chart: cumulative net benefit (money) — keep original meaning
  const cumulativeNetData = useMemo(
    () =>
      outputs.projection5y.map((r) => ({
        year: `Year ${r.year}`,
        cumulativeNet: Math.round(r.cumulativeNetBenefit),
      })),
    [outputs.projection5y]
  );

// Break-even year: first year where cumulative net benefit >= 0
// Break-even year = first year where cumulative net crosses from <0 to >=0 during that year
// Break-even year (visual): the year *interval* where the line crosses 0.
// Example: if it crosses between Year 4 and Year 5, we display "Year 4".
// Break-even year (visual): find where cumulative net crosses 0 between year points,
// then label the crossing by the earlier year (matches the chart perception).
const breakEvenYear = useMemo(() => {
  const rows = outputs.projection5y;
  if (!rows || rows.length === 0) return null;

  // If already >= 0 by end of Year 1, treat as Year 1
  if ((rows[0].cumulativeNetBenefit ?? 0) >= 0) return 1;

  for (let i = 1; i < rows.length; i++) {
    const prevNet = rows[i - 1].cumulativeNetBenefit ?? 0;
    const currNet = rows[i].cumulativeNetBenefit ?? 0;

    if (prevNet < 0 && currNet >= 0) {
      // crossing occurs between rows[i-1].year and rows[i].year
      // visually label it as the earlier year (e.g. between Year 4 and 5 => "Year 4")
      return rows[i - 1].year;
    }
  }

  return null; // no break-even within 5 years
}, [outputs.projection5y]);




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
          <div className="grid grid-cols-[40px_1fr] gap-x-3 gap-y-2">
            {/* Icon */}
            <div className="relative h-10 w-10 shrink-0">
              <Image
                src="/mysmartteach-icon.png"
                alt="MySmartTeach"
                fill
                priority
                className="object-cover"
              />
            </div>

            {/* Title + description */}
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

            {/* Toggle row aligned with cards (spans full width) */}
            <div className="col-span-2 mt-2">
              <div
                className="inline-flex w-fit items-center gap-2 rounded-full p-1"
                style={{ background: "#fff", border: `1px solid ${BRAND.border}` }}
              >
                <button
                  className="rounded-full px-3 py-1 text-xs font-bold transition"
                  style={{
                    cursor: "pointer",
                    background: viewMode === "school" ? "#EEF2FF" : "transparent",
                    color: BRAND.text,
                  }}
                  onClick={() => setViewMode("school")}
                >
                  School view
                </button>

                <button
                  className="rounded-full px-3 py-1 text-xs font-bold transition"
                  style={{
                    cursor: "pointer",
                    background: viewMode === "internal" ? "#EEF2FF" : "transparent",
                    color: BRAND.text,
                  }}
                  onClick={() => setViewMode("internal")}
                >
                  MySmartTeach internal
                </button>

             
              </div>
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
        <div className="space-y-4 lg:col-span-1">

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
                  cursor: "pointer",
                }}
                onClick={() => setShowAdvanced((s) => !s)}
              >
                {showAdvanced ? "Hide advanced" : "More accurate"}
              </button>
            </div>

            {/* Guardrail warnings (non-blocking) */}
            {(draft.adoptionRate < 0 ||
              draft.adoptionRate > 1 ||
              draft.weeklyMarkingHours > draft.weeklyHoursTotal) && (
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
              <InputRow label="Number of teachers" hint="Required">
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

              <InputRow label="Teacher adoption rate" hint="Required (0.6 = 60%)">
                <TextInput
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={draft.adoptionRate}
                  onChange={(e) => setDraft({ ...draft, adoptionRate: Number(e.target.value) })}
                />
              </InputRow>

              <InputRow label="Scenario preset">
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
                  cursor: "pointer",
                }}
                onClick={() => {
                  const sanitized: Inputs = {
                    ...draft,
                    weeklyAiAdminHours: Math.max(0, Number.isFinite(draft.weeklyAiAdminHours) ? draft.weeklyAiAdminHours : 0),
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
                  setDraft(sanitized);
                  stopRoiAnimation(true);

                  // Phase 1: fade inputs + fade results (mask layout snap)
                  
                  // Phase 2: after fade duration, change layout, then fade results back in
                  
              
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
                  cursor: "pointer",
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
                

                {viewMode === "school" && (
                  <>
                    {/* ---------------- ASSESSMENT USAGE ---------------- */}
<div className="space-y-5">
  <SectionHeader>Assessment usage</SectionHeader>


  <InputRow label="% of students using MySmartTeach for assessments">
    <TextInput
      type="number"
      min={0}
      max={1}
      step={0.05}
      value={draft.examParticipationRate}
      onChange={(e) =>
        setDraft({ ...draft, examParticipationRate: Number(e.target.value) })
      }
    />
  </InputRow>

  <InputRow label="Assessments per student (per year)">
    <TextInput
      type="number"
      min={1}
      max={20}
      step={1}
      value={draft.assessmentsPerStudentPerYear}
      onChange={(e) =>
        setDraft({
          ...draft,
          assessmentsPerStudentPerYear: Number(e.target.value),
        })
      }
    />
  </InputRow>

  <InputRow label="Subject focus">
    <SelectInput
      value={draft.subjectPreset}
      onChange={(e) =>
        setDraft({ ...draft, subjectPreset: e.target.value as any })
      }
    >
      <option value="MostlyHumanities">Mostly humanities</option>
      <option value="Mixed">Mixed</option>
      <option value="MostlySTEM">Mostly STEM</option>
    </SelectInput>
  </InputRow>
</div>


                  </>
                )}

                {viewMode === "internal" && (
                  <InputRow
                    label="AI costing mode"
                    hint="Simple pricing = your current tiered subscription. Usage-based = estimated Gemini token cost (calibrated later with real usage)."
                  >
                    <SelectInput
                      value={draft.aiCostingMode}
                      onChange={(e) => setDraft({ ...draft, aiCostingMode: e.target.value as AiCostingMode })}
                    >
                      <option value="SimplePricing">Simple pricing (tiered)</option>
                      <option value="UsageBasedEstimate">Usage-based (estimated, Gemini-aligned)</option>
                    </SelectInput>
                  </InputRow>
                )}

                {viewMode === "internal" && (
                  <InputRow
                    label="MySmartTeach licence fee (annual, £)"
                    hint="Commercial price schools pay. Hidden in School view."
                  >
                    <TextInput
                      type="number"
                      min={0}
                      step={100}
                      value={draft.licenceFeeAnnual}
                      onChange={(e) => setDraft({ ...draft, licenceFeeAnnual: Number(e.target.value) })}
                    />
                  </InputRow>
                )}

                {viewMode === "internal" && draft.aiCostingMode === "UsageBasedEstimate" && (
                  <div
                    className="space-y-4 rounded-2xl p-4"
                    style={{ background: "#F8FAFF", border: `1px solid ${BRAND.border}` }}
                  >
                    <div className="text-sm font-extrabold" style={{ color: BRAND.text }}>
                      Usage-based AI cost (estimated)
                    </div>

                    <div className="text-xs" style={{ color: BRAND.muted }}>
                      This estimates annual Gemini token cost. Replace estimates with real usage logs after launch.
                    </div>

                    <div className="text-sm font-bold" style={{ color: BRAND.text }}>
                      Token assumptions (per assessment)
                    </div>

                    <InputRow label="Base input tokens per assessment">
                      <TextInput
                        type="number"
                        min={0}
                        step={50}
                        value={draft.baseInputTokensPerAssessment}
                        onChange={(e) =>
                          setDraft({ ...draft, baseInputTokensPerAssessment: Number(e.target.value) })
                        }
                      />
                    </InputRow>

                    <InputRow label="Base output tokens per assessment">
                      <TextInput
                        type="number"
                        min={0}
                        step={50}
                        value={draft.baseOutputTokensPerAssessment}
                        onChange={(e) =>
                          setDraft({ ...draft, baseOutputTokensPerAssessment: Number(e.target.value) })
                        }
                      />
                    </InputRow>

                    <div className="text-sm font-bold" style={{ color: BRAND.text }}>
                      Subject token multipliers
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <InputRow label="Maths multiplier">
                        <TextInput
                          type="number"
                          min={0}
                          step={0.1}
                          value={draft.tokenMultMaths}
                          onChange={(e) => setDraft({ ...draft, tokenMultMaths: Number(e.target.value) })}
                        />
                      </InputRow>

                      <InputRow label="English multiplier">
                        <TextInput
                          type="number"
                          min={0}
                          step={0.1}
                          value={draft.tokenMultEnglish}
                          onChange={(e) => setDraft({ ...draft, tokenMultEnglish: Number(e.target.value) })}
                        />
                      </InputRow>

                      <InputRow label="Science multiplier">
                        <TextInput
                          type="number"
                          min={0}
                          step={0.1}
                          value={draft.tokenMultScience}
                          onChange={(e) => setDraft({ ...draft, tokenMultScience: Number(e.target.value) })}
                        />
                      </InputRow>

                      <InputRow label="Humanities multiplier">
                        <TextInput
                          type="number"
                          min={0}
                          step={0.1}
                          value={draft.tokenMultHumanities}
                          onChange={(e) =>
                            setDraft({ ...draft, tokenMultHumanities: Number(e.target.value) })
                          }
                        />
                      </InputRow>

                      <InputRow label="Other multiplier">
                        <TextInput
                          type="number"
                          min={0}
                          step={0.1}
                          value={draft.tokenMultOther}
                          onChange={(e) => setDraft({ ...draft, tokenMultOther: Number(e.target.value) })}
                        />
                      </InputRow>
                    </div>

                    <div className="text-sm font-bold" style={{ color: BRAND.text }}>
                      Gemini pricing (GBP per 1M tokens)
                    </div>

                    <InputRow label="£ per 1M input tokens">
                      <TextInput
                        type="number"
                        min={0}
                        step={0.1}
                        value={draft.gbpPer1MInputTokens}
                        onChange={(e) => setDraft({ ...draft, gbpPer1MInputTokens: Number(e.target.value) })}
                      />
                    </InputRow>

                    <InputRow label="£ per 1M output tokens">
                      <TextInput
                        type="number"
                        min={0}
                        step={0.1}
                        value={draft.gbpPer1MOutputTokens}
                        onChange={(e) => setDraft({ ...draft, gbpPer1MOutputTokens: Number(e.target.value) })}
                      />
                    </InputRow>
                  </div>
                )}

                {/* ---------------- WORKLOAD & TIME ---------------- */}
<div className="space-y-4">
  <SectionHeader>Workload & time</SectionHeader>


  <InputRow label="Marking hours per week (per teacher)">
    <TextInput
      type="number"
      min={0}
      value={draft.weeklyMarkingHours}
      onChange={(e) =>
        setDraft({ ...draft, weeklyMarkingHours: Number(e.target.value) })
      }
    />
  </InputRow>

  <InputRow label="Admin & planning time (hours/week per teacher)">
    <TextInput
      type="number"
      min={0}
      value={draft.weeklyAiAdminHours}
      onChange={(e) =>
        setDraft({ ...draft, weeklyAiAdminHours: Number(e.target.value) })
      }
    />
  </InputRow>

  <InputRow label="Average teacher salary (£/year)">
    <TextInput
      type="number"
      min={0}
      value={draft.avgSalary}
      onChange={(e) =>
        setDraft({ ...draft, avgSalary: Number(e.target.value) })
      }
    />
  </InputRow>
</div>




{/* ---------------- ABSENCE & COVER ---------------- */}
<div className="space-y-5">
  <SectionHeader>Absence & cover</SectionHeader>


  <InputRow label="Sick days per teacher (per year)">
    <TextInput
      type="number"
      min={0}
      value={draft.sickDaysPerTeacher}
      onChange={(e) =>
        setDraft({ ...draft, sickDaysPerTeacher: Number(e.target.value) })
      }
    />
  </InputRow>

  <InputRow label="Supply teacher daily cost (£/day)">
    <TextInput
      type="number"
      min={0}
      value={draft.supplyDailyCost}
      onChange={(e) =>
        setDraft({ ...draft, supplyDailyCost: Number(e.target.value) })
      }
    />
  </InputRow>
</div>



{/* ---------------- RETENTION & RECRUITMENT ---------------- */}
<div className="space-y-5">
  <SectionHeader>Retention & recruitment</SectionHeader>


  <InputRow label="% of teachers leaving each year" hint="UK average ~8.8%">
    <TextInput
      type="number"
      min={0}
      max={1}
      step={0.005}
      value={draft.attritionRate}
      onChange={(e) =>
        setDraft({ ...draft, attritionRate: Number(e.target.value) })
      }
    />
  </InputRow>

  <InputRow label="Cost to replace one teacher (£)">
    <TextInput
      type="number"
      min={0}
      value={draft.replacementCost}
      onChange={(e) =>
        setDraft({ ...draft, replacementCost: Number(e.target.value) })
      }
    />
  </InputRow>
</div>


                
                {viewMode === "internal" && (
  <>
    <InputRow label="One time training cost (£)">
      <TextInput
        type="number"
        min={0}
        value={draft.trainingOneTime}
        onChange={(e) => setDraft({ ...draft, trainingOneTime: Number(e.target.value) })}
      />
    </InputRow>

    <InputRow label="One time setup cost (£)">
      <TextInput
        type="number"
        min={0}
        value={draft.setupOneTime}
        onChange={(e) => setDraft({ ...draft, setupOneTime: Number(e.target.value) })}
      />
    </InputRow>
  </>
)}

              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="space-y-6 lg:col-span-2">

          {/* KPI tiles (3 in one row) */}
          {viewMode === "internal" && (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
    <Card title="Licence revenue (annual)">
      <div className="text-xl font-extrabold" style={{ color: BRAND.text }}>
        {formatGBP(internalEcon.licence)}
      </div>
    </Card>

    <Card title="Estimated inference cost (annual)">
      <div className="text-xl font-extrabold" style={{ color: BRAND.text }}>
        {formatGBP(internalEcon.inference)}
      </div>
    </Card>

    <Card title="Gross margin (annual)">
      <div className="text-xl font-extrabold" style={{ color: BRAND.text }}>
        {formatGBP(internalEcon.grossMargin)}
      </div>
    </Card>

    <Card title="Margin">
      <div className="text-xl font-extrabold" style={{ color: BRAND.text }}>
        {internalEcon.marginPct === null
          ? "—"
          : `${(internalEcon.marginPct * 100).toFixed(1)}%`}
      </div>
    </Card>
  </div>
)}
{viewMode === "internal" && (
  <div
    className="mt-2 text-xs"
    style={{ color: BRAND.muted }}
  >
    Internal modelling view: margin reflects licence revenue minus estimated AI inference cost.
    Does not include staffing, hosting, or other operating expenses.
  </div>
)}


          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card title="Annual cash savings">
              <div className="text-2xl font-extrabold" style={{ color: BRAND.text }}>
                {formatGBP(outputs.annualSavingsCash)}
              </div>
              <div className="mt-1 text-xs" style={{ color: BRAND.muted }}>
                Supply cover + attrition
              </div>
            </Card>

            <Card title="Break-even">
  <div className="text-2xl font-extrabold" style={{ color: BRAND.text }}>
    {breakEvenYear === null ? (
      <>No break-even in 5 years</>
    ) : breakEvenYear === 1 ? (
      <>
        In{" "}
        <span style={{ color: BRAND.purple, fontWeight: 700 }}>Year 1</span>
      </>
    ) : (
      <>
        In{" "}
        <span style={{ color: BRAND.purple, fontWeight: 700 }}>
          Year {breakEvenYear}
        </span>
      </>
    )}
  </div>

  <div className="mt-1 text-xs" style={{ color: BRAND.muted }}>
    Savings exceed total costs
  </div>
</Card>


            <Card
              title={roiAnimating ? `Year ${roiYearShown} ROI` : "Year 1 ROI"}
              clickable
              onClick={startRoiAnimation}
            >
              <div className="text-2xl font-extrabold" style={{ color: roiColor }}>
                {formatPct(displayedRoi)}
              </div>
              <div className="mt-1 text-xs" style={{ color: BRAND.muted }}>
                {roiAnimating ? "Animating Year 1 → Year 5" : "Click to animate to Year 5"}
              </div>
            </Card>
          </div>
          {/* Key Questions (bottom) */}
          <div
            className="rounded-2xl p-5 shadow-sm"
            style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}
          >
            <div className="text-sm font-bold" style={{ color: BRAND.muted }}>
              Investment Scenarios
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
               
              </div>

              <div
                className="rounded-2xl p-4"
                style={{ background: "#FBF7FF", border: `1px solid ${BRAND.border}` }}
              >
                <div className="text-sm font-extrabold" style={{ color: BRAND.text }}>
                  Financial impact if leavers drop by 5%
                </div>
                <div
                  className="mt-3 rounded-xl px-3 py-3"
                  style={{ background: "#FFFFFF", border: `1px solid ${BRAND.border}` }}
                >
                  
                  <div className="mt-1 text-2xl font-extrabold" style={{ color: BRAND.purple }}>
                    {formatGBP(outputs.retentionImpact5Annual)} / year
                  </div>
                </div>
                <div className="mt-3 text-xs" style={{ color: BRAND.muted }}>
                  Interpreted as 5% fewer leavers (relative) among adopting teachers.
                </div>
              </div>
            </div>
          </div>
          {/* Two graphs side by side */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Cumulative net benefit (5-year) — monetary, with break-even line */}
            {/* Cumulative net benefit (5-year) — monetary, with break-even line */}
{/* Cumulative net benefit (5-year) — monetary, with break-even line */}
<div
  className="rounded-2xl p-5 shadow-sm"
  style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}
>
  <div className="text-sm font-extrabold" style={{ color: BRAND.text }}>
  Financial impact over 5 years
</div>




  <div className="mt-3 h-64">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={cumulativeNetData}
        margin={{ top: 8, right: 24, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" />

        {/* Force all years to show */}
        <XAxis dataKey="year" interval={0} tickMargin={8} />

        <YAxis
          width={52}
          tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
        />

        <Tooltip formatter={(v: any) => formatGBP(Number(v))} />

        {/* Break-even line */}
        <ReferenceLine
          y={0}
          stroke={BRAND.purpleDeep}
          strokeDasharray="6 6"
          strokeWidth={2}
          strokeOpacity={0.7}
        />
        
        <Line
          type="monotone"
          dataKey="cumulativeNet"
          stroke={BRAND.blue}
          strokeWidth={3}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>

  {/* Clean legend-style caption */}
  <div
    className="mt-3 flex items-center gap-2 text-xs"
    style={{ color: BRAND.muted }}
  >
    <span
      className="inline-block w-8"
      style={{ borderTop: `2px dashed ${BRAND.purpleDeep}` }}
    />
    Break-even line (£0)
  </div>
  <div className="mt-1 text-sm font-semibold" style={{ color: BRAND.text }}>
  {breakEvenYear === null ? (
    <>Break-even not reached within 5 years</>
  ) : breakEvenYear === 1 ? (
    <>
      Break-even reached within{" "}
      <span style={{ color: BRAND.purple, fontWeight: 700 }}>
        Year 1
      </span>
    </>
  ) : (
    <>
      Break-even reached in{" "}
      <span style={{ color: BRAND.purple, fontWeight: 700 }}>
        Year {breakEvenYear}
      </span>
    </>
  )}
</div>





</div>



            {/* Education Value graph */}
            <div
              className="rounded-2xl p-5 shadow-sm"
              style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}
            >
              <div className="text-sm font-extrabold" style={{ color: BRAND.text }}>
  Teacher time reallocated
</div>




              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeReallocationData} barSize={26} maxBarSize={32}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="scenario" />
                    <YAxis />
<Tooltip
  formatter={(v: any, name: any) => {
    if (Array.isArray(v)) {
      const a = Number(v[0]);
      const b = Number(v[1]);
      const hours = Number.isFinite(a) && Number.isFinite(b) ? Math.max(0, b - a) : 0;
      return [`${formatNum(hours, 1)} hours`, name];

    }
    const n = Number(v);
    return [`${formatNum(Number.isFinite(n) ? n : 0, 1)} hours`, name];

  }}
/>

                    
                    <Bar
  dataKey="remaining"
  name="Marking + admin tasks"
  stackId="a"
  fill={BRAND.blueDeep}
/>
<Bar
  dataKey="freedRange"
  name="Time reallocated to teaching"
  stackId="a"
  fill={BRAND.purpleDeep}
/>




                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Custom legend */}
<div className="mt-3 flex flex-col gap-1 text-xs">
  <div className="flex items-center gap-2">
    <span
      className="inline-block h-3 w-3 rounded-sm"
      style={{ background: BRAND.blueDeep }}
    />
    <span style={{ color: BRAND.blue }}>Marking & admin time</span>
  </div>

  <div className="flex items-center gap-2">
    <span
      className="inline-block h-3 w-3 rounded-sm"
      style={{ background: BRAND.purpleDeep }}
    />
    <span style={{ color: BRAND.purple }}>Time reallocated to teaching</span>
  </div>
</div>

            </div>
          </div>

          {/* Educational value data (text/data section under graphs) */}
          <div
            className="rounded-2xl p-5 shadow-sm"
            style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}
          >
            <div className="flex flex-col gap-1">
              <div className="text-sm font-extrabold" style={{ color: BRAND.text }}>
                Teacher capacity unlocked
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

              <Card title="Indicative value of time unlocked">
                <div className="text-2xl font-extrabold" style={{ color: BRAND.text }}>
                  {formatGBP(outputs.annualValueOfReallocatedTimeGBP)}
                </div>
                <div className="mt-1 text-xs" style={{ color: BRAND.muted }}>
                  Annual £-equivalent value (not included in ROI)
                </div>
              </Card>
            </div>
              
         


          </div>

          
        </div>
      </main>
    </div>
  );
}
