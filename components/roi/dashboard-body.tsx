import type { Inputs, InternalView, SchoolView } from "@/lib/calc";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
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
  breakEvenMonth: number | null;
  displayedRoi: number | null;
  roiAnimating: boolean;
  roiYearShown: number;
  roiColor: string;
  onStartRoiAnimation: () => void;
};

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
}: DashboardBodyProps) {
  const annualSavingsDrivers = [
    {
      label: "Supply cover",
      value: internalView.cashSavings.supplySavings,
    },
    {
      label: "Lower replacement costs",
      value: internalView.cashSavings.annualAttritionSavings,
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card title="Annual cash savings">
          <div className="text-2xl font-extrabold" style={{ color: BRAND.text }}>
            {formatGBP(schoolView.annualSavingsCash)}
          </div>

          <div className="mt-3 space-y-1.5 text-xs" style={{ color: BRAND.muted }}>
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

        <Card title="Break-even">
          <div className="text-2xl font-extrabold" style={{ color: BRAND.text }}>
            {breakEvenMonth === null ? (
              <>No break-even in 5 years</>
            ) : breakEvenMonth === 0 ? (
              <>
                <span style={{ color: BRAND.purple, fontWeight: 700 }}>Immediate</span>
              </>
            ) : (
              <>
                Month{" "}
                <span style={{ color: BRAND.purple, fontWeight: 700 }}>
                  {breakEvenMonth}
                </span>
              </>
            )}
          </div>

          <div className="mt-1 text-xs" style={{ color: BRAND.muted }}>
            Cumulative cash savings cover costs
          </div>
        </Card>

        <Card
          title={roiAnimating ? `Year ${roiYearShown} ROI` : "Year 1 ROI"}
          clickable
          onClick={onStartRoiAnimation}
        >
          <div className="text-2xl font-extrabold" style={{ color: roiColor }}>
            {formatPct(displayedRoi)}
          </div>
          <div className="mt-1 text-xs" style={{ color: BRAND.muted }}>
            {roiAnimating ? "Animating Year 1 → Year 5" : "Click to animate to Year 5"}
          </div>
        </Card>
      </div>

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
              {internalView.sensitivities.absenceSensitivity.map((point) => (
                <div
                  key={point.label}
                  className="flex items-center justify-between rounded-xl px-3 py-2"
                  style={{ background: "#FFFFFF", border: `1px solid ${BRAND.border}` }}
                >
                  <div className="text-sm font-semibold" style={{ color: BRAND.text }}>
                    {point.label} absence drop
                  </div>
                  <div className="text-sm font-extrabold" style={{ color: BRAND.blue }}>
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
            <div className="text-sm font-extrabold" style={{ color: BRAND.text }}>
              Financial impact if leavers drop by 5%
            </div>
            <div
              className="mt-3 rounded-xl px-3 py-3"
              style={{ background: "#FFFFFF", border: `1px solid ${BRAND.border}` }}
            >
              <div className="mt-1 text-2xl font-extrabold" style={{ color: BRAND.purple }}>
                {formatGBP(internalView.sensitivities.retentionImpact5Annual)} / year
              </div>
            </div>
            <div className="mt-3 text-xs" style={{ color: BRAND.muted }}>
              Interpreted as 5% fewer leavers (relative) among adopting teachers.
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
            </ResponsiveContainer>
          </div>

          <div className="mt-3 text-xs" style={{ color: BRAND.muted }}>
            Cumulative net impact after licence and setup costs.
          </div>
        </div>

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
        <div className="flex flex-col gap-1">
          <div className="text-sm font-extrabold" style={{ color: BRAND.text }}>
            Teacher capacity unlocked
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card title="Hours reallocated per teacher (weekly)">
            <div className="text-2xl font-extrabold" style={{ color: BRAND.text }}>
              {formatNum(
                internalView.educationalValue.weeklyHoursSavedPerTeacher * applied.adoptionRate,
                1
              )}
            </div>
            <div className="mt-1 text-xs" style={{ color: BRAND.muted }}>
              Adoption-adjusted average
            </div>
          </Card>

          <Card title="Total hours reallocated (annual)">
            <div className="text-2xl font-extrabold" style={{ color: BRAND.text }}>
              {formatNum(schoolView.annualHoursSavedTotal, 0)}
            </div>
            <div className="mt-1 text-xs" style={{ color: BRAND.muted }}>
              Across adopting teachers
            </div>
          </Card>

          <Card title="Indicative value of time unlocked">
            <div className="text-2xl font-extrabold" style={{ color: BRAND.text }}>
              {formatGBP(schoolView.annualValueOfReallocatedTimeGBP)}
            </div>
            <div className="mt-1 text-xs" style={{ color: BRAND.muted }}>
              Annual £-equivalent value (not included in ROI)
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

export type { DashboardBodyProps };
