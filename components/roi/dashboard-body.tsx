import type { Inputs, InternalView, SchoolView } from "@/lib/calc";
import packageJson from "@/package.json";
import { type ReactNode, useState } from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BRAND, Card, formatGBP, formatNum, formatPct } from "./ui";

type DashboardBodyProps = {
  schoolView: SchoolView;
  internalView: InternalView;
  applied: Inputs;
  timeReallocationData: {
    scenario: string;
    remaining: number;
    freedRange: [number, number];
  }[];
  cumulativeNetData: {
    year: string;
    cumulativeNet: number;
  }[];
  schoolMonthlyCumulativeNetData?: {
    month: number;
    cumulativeNet: number;
  }[];
  breakEvenMonth: number | null;
  displayedRoi: number | null;
  roiAnimating: boolean;
  roiYearShown: number;
  roiColor: string;
  onStartRoiAnimation: () => void;
  staticSchoolRoiTile?: boolean;
};

const SCHOOL_VIEW_OUTPUT_DATE = "25 March 2026";

function HeadlineTitle({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center"
        style={{ color: BRAND.muted }}
      >
        {icon}
      </span>
      <span>{label}</span>
    </span>
  );
}

function TrendUpIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M2 11.5L6 7.5L9 10.5L14 5.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.5 5.5H14V9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden="true">
      <circle cx="8" cy="8" r="5.75" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8" cy="8" r="2.75" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8" cy="8" r="0.9" fill="currentColor" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M2.25 2V13.75H14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 11V6.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M8.125 11V4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M11.25 11V8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden="true">
      {expanded ? (
        <path
          d="M3.25 10.25L8 5.75L12.75 10.25"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M3.25 5.75L8 10.25L12.75 5.75"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden="true">
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 7.1V10.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="8" cy="5.1" r="0.85" fill="currentColor" />
    </svg>
  );
}

function formatBreakEvenMonth(month: number) {
  return Math.max(1, Math.ceil(month));
}

export function DashboardBody({
  schoolView,
  internalView,
  applied,
  timeReallocationData,
  cumulativeNetData,
  breakEvenMonth,
  displayedRoi,
  roiAnimating,
  roiYearShown,
  roiColor,
  onStartRoiAnimation,
  staticSchoolRoiTile = false,
}: DashboardBodyProps) {
  const displayedBreakEvenMonth =
    breakEvenMonth !== null && breakEvenMonth > 0 ? formatBreakEvenMonth(breakEvenMonth) : null;
  const breakEvenYear =
    displayedBreakEvenMonth !== null ? Math.ceil(displayedBreakEvenMonth / 12) : null;
  const annualSavingsDrivers = [
    {
      label: "Supply cover",
      value: internalView.cashSavings.supplySavings,
    },
    {
      label: "Replacement / recruitment costs",
      value: internalView.cashSavings.annualAttritionSavings,
    },
  ];
  const headlineTileSupportClass = "mt-1 space-y-1 text-xs leading-5";
  const weeklyTimeSavedDisplay = staticSchoolRoiTile
    ? internalView.educationalValue.weeklyHoursSavedPerTeacher
    : internalView.educationalValue.weeklyHoursSavedPerTeacher * applied.adoptionRate;
  const weeklyTimeSavedSupport = staticSchoolRoiTile
    ? "Per adopting teacher"
    : "Average across adopting teachers";
  const investmentSummaryRowsYear1 = [
    {
      label: "Annual licence",
      value: internalView.costs.school.recurringAnnualCost,
    },
    {
      label: "One-off implementation",
      value: internalView.costs.setupOneTime,
    },
    {
      label: "Training",
      value: internalView.costs.trainingOneTime,
    },
  ];
  const investmentSummaryRowsOngoing = [
    {
      label: "Annual licence",
      value: internalView.costs.school.recurringAnnualCost,
    },
  ];
  const chartSupportTextClass = "mt-1 min-h-[2.5rem] text-[0.78rem] leading-5";
  const [showEducationalValue, setShowEducationalValue] = useState(true);

  return (
    <>
      <div
        className={
          staticSchoolRoiTile
            ? "grid grid-cols-1 gap-4 auto-rows-fr md:grid-cols-2 lg:grid-cols-4"
            : "grid grid-cols-1 gap-4 md:grid-cols-3"
        }
      >
        <Card
          title={<HeadlineTitle icon={<TrendUpIcon />} label="Annual cash savings" />}
          bodyClassName={staticSchoolRoiTile ? "flex h-full flex-col" : undefined}
        >
          <div className="text-[1.8rem] font-extrabold" style={{ color: BRAND.text, fontWeight: 650 }}>
            {formatGBP(schoolView.annualSavingsCash)}
          </div>

          <div className={headlineTileSupportClass} style={{ color: BRAND.muted }}>
            {annualSavingsDrivers.map((driver) => (
              <div key={driver.label} className="flex items-center justify-between gap-3">
                <span>{driver.label}</span>
                <span className="font-semibold" style={{ color: BRAND.text }}>
                  {formatGBP(driver.value)}
                </span>
              </div>
            ))}
            
          </div>
        </Card>

        <Card
          title={<HeadlineTitle icon={<TargetIcon />} label="Break-even" />}
          bodyClassName={staticSchoolRoiTile ? "flex h-full flex-col" : undefined}
        >
          {breakEvenMonth === null ? (
            <>
              <div className="text-2xl font-extrabold" style={{ color: BRAND.text }}>
                No break-even in 5 years
              </div>
              <div className={headlineTileSupportClass} style={{ color: BRAND.muted }}>
                <span className="block">Current annual cash savings do not recover the investment within 5 years.</span>
              </div>
            </>
          ) : breakEvenMonth === 0 ? (
            <>
              <div className="text-2xl font-extrabold" style={{ color: BRAND.text }}>
                <span style={{ color: BRAND.purple, fontWeight: 630 }}>Immediate</span>
              </div>
              <div className={headlineTileSupportClass} style={{ color: BRAND.muted }}>
                <span className="block">Current annual cash savings cover the school investment from the start.</span>
                <span className="block">Cash ROI only.</span>
              </div>
            </>
          ) : (
            <>
              <div className="text-[1.8rem] font-extrabold" style={{ color: BRAND.text, fontWeight: 650 }}>
                During Year{" "}
                <span className="text-1.8rem] font-extrabold" style={{ color: BRAND.purple, fontWeight: 650 }}>{breakEvenYear}</span>
              </div>
              <div className={headlineTileSupportClass} style={{ color: BRAND.muted }}>
                <div>
                  Approx. month{" "}
                  <span className="font-[630]" style={{ color: BRAND.text, fontWeight: 630 }}>
                    {displayedBreakEvenMonth}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <span className="block"> When cumulative cash savings exceed total costs.</span>
                </div>
              </div>
            </>
          )}
        </Card>

        <Card
          title={
            <HeadlineTitle
              icon={<ChartIcon />}
              label={staticSchoolRoiTile ? "Year 1 ROI" : roiAnimating ? `Year ${roiYearShown} ROI` : "Year 1 ROI"}
            />
          }
          clickable={!staticSchoolRoiTile}
          onClick={staticSchoolRoiTile ? undefined : onStartRoiAnimation}
          bodyClassName={staticSchoolRoiTile ? "flex h-full flex-col" : undefined}
        >
          <div
            className="text-[1.8rem] font-extrabold"
            style={{ color: staticSchoolRoiTile ? BRAND.text : roiColor, fontWeight: 650 }}
          >
            {formatPct(staticSchoolRoiTile ? schoolView.roiYear1 : displayedRoi)}
          </div>
	          <div className={headlineTileSupportClass} style={{ color: BRAND.muted }}>
	            {staticSchoolRoiTile
	              ? (
	                <>
	                  <span className="block">Includes annual licence, implementation and training.</span>
	                  <span className="block">Cash savings are scaled to the selected adoption rate.</span>
	
	                </>
	              )
              : roiAnimating
                ? "Animating Year 1 → Year 5"
                : "Click to animate to Year 5"}
          </div>
        </Card>

        {staticSchoolRoiTile ? (
          <Card
            title={<HeadlineTitle icon={<TrendUpIcon />} label="5-year net impact" />}
            bodyClassName="flex h-full flex-col"
          >
            <div className="text-[1.8rem] font-extrabold" style={{ color: BRAND.text, fontWeight: 650 }}>
              {formatGBP(schoolView.impact5Year)}
            </div>
            <div className={headlineTileSupportClass} style={{ color: BRAND.muted }}>
              <span className="block">Assumes consistent use across adopted teachers.</span>
              
            </div>
          </Card>
        ) : null}
      </div>

      {staticSchoolRoiTile ? (
        <div
          className="rounded-2xl p-5 shadow-sm"
          style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}
        >
          <div className="space-y-2">
            <div className="text-[1.1rem] font-[640]" style={{ color: BRAND.text, fontWeight:640 }}>
              Investment summary
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="space-y-2.5">
                <div className="text-[1rem] font-[640]" style={{ color: BRAND.muted, fontWeight:640 }}>
                  Year 1 costs
                </div>
                <div className="space-y-0 text-sm" style={{ color: BRAND.muted }}>
                  {investmentSummaryRowsYear1.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between gap-3 py-1"
                    >
                      <span>{row.label}</span>
                      <span className="font-semibold" style={{ color: BRAND.text }}>
                        {formatGBP(row.value)}
                      </span>
                    </div>
                  ))}
                  <div
                    className="mt-1.5 flex items-center justify-between gap-3 border-t pt-2.5"
                    style={{ borderColor: BRAND.border }}
                  >
                    <span className="font-semibold" style={{ color: BRAND.text }}>
                      Total Year 1
                    </span>
                    <span className="font-bold" style={{ color: BRAND.text, fontWeight: 650 }}>
                      {formatGBP(schoolView.totalCostYear1)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="text-[1rem] font-[640]" style={{ color: BRAND.muted, fontWeight:640 }}>
                  Ongoing annual cost (from Year 2 onwards)
                </div>
                <div className="space-y-0 text-sm" style={{ color: BRAND.muted }}>
                  {investmentSummaryRowsOngoing.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between gap-3 py-1"
                    >
                      <span>{row.label}</span>
                      <span className="font-semibold" style={{ color: BRAND.text }}>
                        {formatGBP(row.value)}
                      </span>
                    </div>
                  ))}
                  <div
                    className="mt-1.5 flex items-center justify-between gap-3 border-t pt-2.5"
                    style={{ borderColor: BRAND.border }}
                  >
                    <span className="font-semibold" style={{ color: BRAND.text }}>
                      Ongoing annual
                    </span>
                    <span className="font-bold" style={{ color: BRAND.text, fontWeight: 650 }}>
                      {formatGBP(internalView.costs.school.recurringAnnualCost)}
                    </span>
                  </div>
                  <div
                    className="mt-3 rounded-xl px-3 py-2.5 text-xs leading-5"
                    style={{ background: "#F8FAFF", color: BRAND.muted }}
                  >
                    <span style={{ color: BRAND.muted, fontWeight: 650 }}>
                      Year 1 includes one-off costs
                    </span>{" "}
                    (implementation + training) that do not recur. Ongoing cost is the annual baseline from Year 2 onwards.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div
        className="rounded-2xl p-5 shadow-sm"
        style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}
      >
        <div className="text-[1.1rem] font-[640]" style={{ color: BRAND.text, fontWeight:640 }}>
          {staticSchoolRoiTile ? "Investment Scenarios" : "Investment Scenarios"}
        </div>
        {staticSchoolRoiTile ? (
          <div className="mt-1 text-[0.78rem] leading-5" style={{ color: BRAND.muted }}>
            Explore how changes in absence and retention affect your savings.
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div
            className="rounded-2xl p-4"
            style={{ background: "#F8FAFF", border: `1px solid ${BRAND.border}` }}
          >
            <div className="text-sm font-extrabold" style={{ color: BRAND.text, fontWeight: 650 }}>
              {staticSchoolRoiTile
                ? "What if absence cover costs fell?"
                : "Supply cover savings from lower absence"}
            </div>
            <div className="mt-2 space-y-2">
              {internalView.sensitivities.absenceSensitivity.map((point) => (
                <div
                  key={point.label}
                  className="flex items-center justify-between rounded-xl px-3 py-2"
                  style={{ background: "#FFFFFF", border: `1px solid ${BRAND.border}` }}
                >
                  <div className="text-sm font-semibold" style={{ color: BRAND.text }}>
                    {staticSchoolRoiTile ? `${point.label} fewer absence days` : `${point.label} absence drop`}
                  </div>
                  <div className="text-sm font-extrabold" style={{ color: BRAND.blue, fontWeight: 650 }}>
                    {formatGBP(point.annualSupplySavings)} / year
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="rounded-2xl p-4"
            style={{ background: "#FBF7FF", border: `1px solid ${BRAND.border}` }}
          >
            <div className="text-sm font-extrabold" style={{ color: BRAND.text, fontWeight: 650 }}>
              {staticSchoolRoiTile
                ? "What if fewer teachers needed replacing?"
                : "Savings from fewer teacher replacements"}
            </div>
            <div
              className="mt-3 rounded-xl px-3 py-3"
              style={{ background: "#FFFFFF", border: `1px solid ${BRAND.border}` }}
            >
              <div className="mt-1 text-2xl font-extrabold" style={{ color: BRAND.purple, fontWeight: 650 }}>
                {formatGBP(internalView.sensitivities.retentionImpact5Annual)} / year
              </div>
            </div>
            <div className="mt-3 text-xs" style={{ color: BRAND.muted }}>
              {staticSchoolRoiTile
                ? "Based on 5% fewer teachers leaving each year among adopting teachers."
                : "Based on 5% fewer teachers leaving each year among adopting teachers."}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div
          className="rounded-2xl p-5 shadow-sm"
          style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}
        >
          <div className="text-[1.1rem] font-[640]" style={{ color: BRAND.text, fontWeight:640 }}>
            Financial impact over 5 years
          </div>
          <div className={chartSupportTextClass} style={{ color: BRAND.muted }}>
            {staticSchoolRoiTile
              ? "Cumulative net cash impact by year. Assumes steady adoption and ongoing annual cost from Year 2."
              : "Cumulative net impact after total costs."}
          </div>

          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              {staticSchoolRoiTile ? (
                <LineChart
                  data={cumulativeNetData}
                  margin={{ top: 8, right: 24, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="year" interval={0} tickMargin={8} />
                  <YAxis
                    width={52}
                    tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`}
                  />
                  <Tooltip
                    formatter={(value: number | string | undefined) => [
                      formatGBP(Number(value ?? 0)),
                      "Cumulative net impact",
                    ]}
                  />
                  <ReferenceLine y={0} stroke={BRAND.blueDeep} strokeOpacity={0.18} strokeWidth={1.75} />
                  <Area
                    type="linear"
                    dataKey="cumulativeNet"
                    tooltipType="none"
                    stroke="none"
                    fill={BRAND.blue}
                    fillOpacity={0.08}
                    isAnimationActive={false}
                  />
                  <Line
                    type="linear"
                    dataKey="cumulativeNet"
                    stroke={BRAND.blue}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    dot={(props) => {
                      const { cx, cy, index } = props;
                      if (typeof cx !== "number" || typeof cy !== "number") return null;

                      const isLastPoint = index === cumulativeNetData.length - 1;
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isLastPoint ? 4.75 : 3.5}
                          fill={BRAND.blue}
                          stroke="#FFFFFF"
                          strokeWidth={isLastPoint ? 2.25 : 2}
                        />
                      );
                    }}
                    activeDot={{
                      r: 5,
                      fill: BRAND.blue,
                      stroke: "#FFFFFF",
                      strokeWidth: 2,
                    }}
                  />
                </LineChart>
              ) : (
                <LineChart
                  data={cumulativeNetData}
                  margin={{ top: 8, right: 24, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="year"
                    interval={0}
                    tickMargin={8}
                  />
                  <YAxis
                    width={52}
                    tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`}
                  />
                  <Tooltip
                    formatter={(value: number | string | undefined) =>
                      formatGBP(Number(value ?? 0))
                    }
                  />
                  <Line
                    type="linear"
                    dataKey="cumulativeNet"
                    stroke={BRAND.blue}
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>

          {staticSchoolRoiTile ? (
            <div className="mt-3 flex justify-center text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center"
                  style={{ color: BRAND.blue }}
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 28 12" className="h-3.5 w-8" fill="none">
                    <path
                      d="M2 6H26"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="14"
                      cy="6"
                      r="3.5"
                      fill="#FFFFFF"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                </span>
                <span style={{ color: BRAND.blue }}>Cumulative net impact</span>
              </div>
            </div>
          ) : null}
        </div>

        <div
          className="rounded-2xl p-5 shadow-sm"
          style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}
        >
          <div className="text-[1.1rem] font-[640]" style={{ color: BRAND.text, fontWeight:640 }}>
            {staticSchoolRoiTile ? "Teacher time reallocated" : "Teacher time reallocated"}
          </div>
          <div className={chartSupportTextClass} style={{ color: BRAND.muted }}>
            Hours per week (all adopting teachers). Not included in cash ROI.
          </div>

          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeReallocationData} barSize={47} maxBarSize={47}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="scenario" />
                <YAxis />
                <Tooltip
                  formatter={(
                    value: number | string | [number, number] | undefined,
                    name: string | undefined
                  ) => {
                    if (Array.isArray(value)) {
                      const hours = Math.max(0, Number(value[1]) - Number(value[0]));
                      return [`${formatNum(hours, 1)} hours`, name ?? ""];
                    }
                    return [`${formatNum(Number(value ?? 0), 1)} hours`, name ?? ""];
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

      <div
        className="rounded-2xl p-5 shadow-sm"
        style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-[1.1rem] font-[640]" style={{ color: BRAND.text, fontWeight:640 }}>
                Educational Value <span style={{ color: BRAND.text }}>-</span> teacher time saved
              </div>
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
                style={{
                  background: "#EEF2FF",
                  color: BRAND.blue,
                }}
              >
                <InfoIcon />
                <span>Not included in cash ROI</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            aria-label={showEducationalValue ? "Collapse educational value" : "Expand educational value"}
            className="shrink-0 rounded-full p-2 transition"
            style={{
              background: "transparent",
              border: "none",
              color: BRAND.muted,
              cursor: "pointer",
            }}
            onClick={() => setShowEducationalValue((value) => !value)}
          >
            <ChevronIcon expanded={showEducationalValue} />
          </button>
        </div>

        {showEducationalValue ? (
          <>
            <div className="mt-3 text-[0.78rem] leading-5" style={{ color: BRAND.muted }}>
              This represents capacity reallocated to higher-value teaching activities. It is shown
              separately and is not included in cash ROI or break-even calculations.
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card title="Weekly time saved per teacher">
                <div className="text-2xl font-extrabold" style={{ color: BRAND.text, fontWeight: 630 }}>
                  {formatNum(weeklyTimeSavedDisplay, 1)}
                </div>
                <div className="mt-1 text-xs" style={{ color: BRAND.muted }}>
                  {weeklyTimeSavedSupport}
                </div>
              </Card>

              <Card title="Total teacher hours saved per year">
                <div className="text-2xl font-extrabold" style={{ color: BRAND.text, fontWeight: 630 }}>
                  {formatNum(schoolView.annualHoursSavedTotal, 0)}
                </div>
                <div className="mt-1 text-xs" style={{ color: BRAND.muted }}>
                  Across adopting teachers
                </div>
              </Card>
            </div>

            <details
              className="mt-4 rounded-2xl border px-4 py-3"
              style={{ background: "#F8FAFF", color: BRAND.muted, borderColor: BRAND.border }}
            >
              <summary
                className="cursor-pointer text-sm font-semibold"
                style={{ color: BRAND.text }}
              >
                Show £-equivalent value
              </summary>
              <div className="mt-3 text-sm leading-6">
                <span style={{ color: BRAND.text, fontWeight: 600 }}>
                  Estimated at roughly {formatGBP(schoolView.annualValueOfReallocatedTimeGBP)} per
                  year.
                </span>
                <div className="mt-2 text-xs leading-5">
                  Calculated from total teacher hours saved per year using the average teacher salary
                  assumption entered in the model.
                </div>
                <div className="mt-2 text-xs leading-5">
                  This is not a budget saving. It represents teaching capacity reallocated to
                  higher-value activity rather than cashable time.
                </div>
              </div>
            </details>
          </>
        ) : null}
      </div>

      <div className="border-t pt-4 text-xs leading-5" style={{ color: BRAND.muted, borderColor: BRAND.border }}>
        <div>
          Model version {packageJson.version} | Updated {SCHOOL_VIEW_OUTPUT_DATE}
        </div>
        <div className="mt-2">
          Includes modelled cash savings from supply cover and recruitment or replacement, plus
          Year 1 and 5-year output estimates based on the selected adoption and scenario
          assumptions. Excludes teacher time from cash ROI and break-even, plus local
          restructuring and IT overheads unless added separately.
        </div>
      </div>
    </>
  );
}

export type { DashboardBodyProps };
