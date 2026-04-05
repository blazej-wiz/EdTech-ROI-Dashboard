import { useState, type ReactNode } from "react";
import type {
  AssumptionsGovernanceSummary,
  BreakdownRow,
  GovernedAssumption,
  GovernedAssumptionGroup,
  Inputs,
  InternalAdminSummary,
  QaCheckStatus,
} from "@/lib/calc";
import type { PercentDraftField } from "./use-roi-dashboard";
import { BRAND, formatGBP, formatNum, formatPct, SelectInput, TextInput } from "./ui";

type InternalTabId =
  | "commercial-controls"
  | "assumptions-governance"
  | "qa-decomposition"
  | "sensitivity-analysis";

type InternalDashboardProps = {
  internalAdminSummary: InternalAdminSummary;
  draftAssumptionsGovernance: AssumptionsGovernanceSummary;
  hasUncalculatedChanges: boolean;
  onApplyGovernance: () => void;
  onResetGovernance: () => void;
  onUpdateNumberField: (field: keyof Inputs, rawValue: string) => void;
  onUpdatePercentField: (field: PercentDraftField, rawValue: string) => void;
  onUpdateSelectField: (field: keyof Inputs, value: Inputs[keyof Inputs]) => void;
  getNumberValue: (field: keyof Inputs) => string;
  getPercentValue: (field: PercentDraftField) => string;
};

const TABS: { id: InternalTabId; label: string }[] = [
  { id: "commercial-controls", label: "Commercial controls" },
  { id: "assumptions-governance", label: "Assumptions governance" },
  { id: "qa-decomposition", label: "QA decomposition" },
  { id: "sensitivity-analysis", label: "Sensitivity analysis" },
];

const PERCENT_FIELDS: PercentDraftField[] = [
  "adoptionRate",
  "examParticipationRate",
  "attritionRate",
  "markingReductionCustom",
  "otherReductionCustom",
  "sickdayReductionCustom",
  "attritionReductionCustom",
];

function formatBreakEvenMonth(month: number) {
  return Math.max(1, Math.ceil(month));
}

function formatBreakEvenLabel(month: number | null) {
  if (month === null) return "No break-even in 5 years";
  if (month === 0) return "Immediate";

  const displayedMonth = formatBreakEvenMonth(month);
  return `During Year ${Math.ceil(displayedMonth / 12)} (month ${displayedMonth})`;
}

function renderBreakdownValue(row: BreakdownRow) {
  switch (row.displayUnit) {
    case "hours":
      return `${formatNum(row.value, 1)} hrs`;
    case "percentage":
      return formatPct(row.value);
    case "count":
      return formatNum(row.value, 0);
    case "currency":
    default:
      return formatGBP(row.value);
  }
}

function qaTone(status: QaCheckStatus) {
  if (status === "fail") {
    return { bg: "#FEF2F2", border: "#FECACA", text: BRAND.bad };
  }

  if (status === "warn") {
    return { bg: "#FFF7ED", border: "#FED7AA", text: "#9A3412" };
  }

  return { bg: "#F6FBF8", border: "#BBF7D0", text: BRAND.good };
}

function isPercentField(field: keyof Inputs): field is PercentDraftField {
  return PERCENT_FIELDS.includes(field as PercentDraftField);
}

function getAssumptionInputValue(
  assumption: GovernedAssumption,
  getNumberValue: (field: keyof Inputs) => string,
  getPercentValue: (field: PercentDraftField) => string
) {
  if (!assumption.editable) {
    return assumption.controlType === "percent"
      ? String(Number(assumption.value) * 100)
      : String(assumption.value);
  }

  if (assumption.controlType === "percent" && isPercentField(assumption.id)) {
    return getPercentValue(assumption.id);
  }

  if (assumption.controlType === "number") {
    return getNumberValue(assumption.id);
  }

  return String(assumption.value);
}

function findGroup(
  groups: GovernedAssumptionGroup[],
  id: GovernedAssumptionGroup["id"]
) {
  return groups.find((group) => group.id === id);
}

function tabIcon(tabId: InternalTabId, active: boolean) {
  const stroke = active ? "#FFFFFF" : BRAND.muted;

  if (tabId === "commercial-controls") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 7h16M7 4v6M17 14H4M17 11v6M10 20h10"
          stroke={stroke}
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (tabId === "assumptions-governance") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 3 5 6v6c0 4.2 2.7 7.9 7 9 4.3-1.1 7-4.8 7-9V6l-7-3Z"
          stroke={stroke}
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (tabId === "qa-decomposition") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M8 3h6l5 5v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
          stroke={stroke}
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 3v5h5M9 13l2 2 4-4"
          stroke={stroke}
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 18V6M12 18V10M19 18V4M3 20h18"
        stroke={stroke}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WorkspaceSurface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border bg-white p-5 shadow-sm ${className ?? ""}`.trim()}
      style={{ borderColor: BRAND.border }}
    >
      {children}
    </section>
  );
}

function TabButton({
  tabId,
  label,
  active,
  onClick,
}: {
  tabId: InternalTabId;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-left text-sm font-semibold transition"
      style={{
        background: active
          ? `linear-gradient(135deg, ${BRAND.blue} 0%, ${BRAND.indigo} 100%)`
          : "#FFFFFF",
        borderColor: active ? "transparent" : BRAND.border,
        color: active ? "#FFFFFF" : BRAND.text,
        boxShadow: active ? "0 10px 20px rgba(59, 91, 219, 0.14)" : "none",
        cursor: "pointer",
      }}
      onClick={onClick}
    >
      {tabIcon(tabId, active)}
      <span>{label}</span>
    </button>
  );
}

function SectionTitle({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="max-w-3xl">
        <h2 className="text-[1.02rem] font-[680] tracking-tight" style={{ color: BRAND.text }}>
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm leading-6" style={{ color: BRAND.muted }}>
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  note,
}: {
  label: string;
  value: ReactNode;
  note?: string;
}) {
  return (
    <div
      className="rounded-2xl border bg-white px-5 py-5 shadow-sm"
      style={{ borderColor: BRAND.border }}
    >
      <div className="text-sm leading-6" style={{ color: BRAND.muted }}>
        {label}
      </div>
      <div className="mt-2 text-[1.8rem] font-[720] tracking-tight" style={{ color: BRAND.text }}>
        {value}
      </div>
      {note ? (
        <div className="mt-2 text-sm leading-6" style={{ color: BRAND.muted }}>
          {note}
        </div>
      ) : null}
    </div>
  );
}

function SoftMessage({
  title,
  children,
  tone = "neutral",
}: {
  title: string;
  children: ReactNode;
  tone?: "neutral" | "info" | "warn";
}) {
  const background =
    tone === "warn" ? "#EFF6FF" : tone === "info" ? "#F8FAFF" : "#F7F8FC";
  const border = tone === "warn" ? "#BFDBFE" : BRAND.border;
  const titleColor = tone === "warn" ? BRAND.blue : BRAND.text;

  return (
    <div
      className="rounded-2xl border px-5 py-4"
      style={{ background, borderColor: border }}
    >
      <div className="text-base font-[680]" style={{ color: titleColor }}>
        {title}
      </div>
      <div className="mt-1 text-sm leading-6" style={{ color: BRAND.muted }}>
        {children}
      </div>
    </div>
  );
}

function BreakdownList({
  rows,
  totalLabel,
  totalValue,
}: {
  rows: BreakdownRow[];
  totalLabel?: string;
  totalValue?: number;
}) {
  return (
    <div className="divide-y" style={{ borderColor: BRAND.border }}>
      {rows.map((row) => (
        <div key={row.key} className="flex items-start justify-between gap-5 py-3 first:pt-0 last:pb-0">
          <div className="min-w-0">
            <div className="text-[1rem]" style={{ color: BRAND.text }}>
              {row.label}
            </div>
            {row.note ? (
              <div className="mt-1 text-sm leading-6" style={{ color: BRAND.muted }}>
                {row.note}
              </div>
            ) : null}
          </div>
          <div className="shrink-0 text-right text-[1rem] font-semibold" style={{ color: BRAND.text }}>
            {renderBreakdownValue(row)}
          </div>
        </div>
      ))}
      {totalLabel && totalValue !== undefined ? (
        <div className="flex items-center justify-between gap-5 py-4 text-[1rem] font-semibold">
          <div style={{ color: BRAND.text }}>{totalLabel}</div>
          <div style={{ color: BRAND.text }}>{formatGBP(totalValue)}</div>
        </div>
      ) : null}
    </div>
  );
}

function AssumptionInput({
  assumption,
  onUpdateNumberField,
  onUpdatePercentField,
  onUpdateSelectField,
  getNumberValue,
  getPercentValue,
}: {
  assumption: GovernedAssumption;
  onUpdateNumberField: (field: keyof Inputs, rawValue: string) => void;
  onUpdatePercentField: (field: PercentDraftField, rawValue: string) => void;
  onUpdateSelectField: (field: keyof Inputs, value: Inputs[keyof Inputs]) => void;
  getNumberValue: (field: keyof Inputs) => string;
  getPercentValue: (field: PercentDraftField) => string;
}) {
  const displayValue = getAssumptionInputValue(assumption, getNumberValue, getPercentValue);

  if (assumption.controlType === "select") {
    return (
      <SelectInput
        value={String(assumption.value)}
        onChange={(event) =>
          onUpdateSelectField(assumption.id, event.target.value as Inputs[keyof Inputs])
        }
        disabled={!assumption.editable}
      >
        {assumption.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectInput>
    );
  }

  return (
    <TextInput
      type="number"
      min={assumption.guardrails?.min}
      max={
        assumption.controlType === "percent" && assumption.guardrails?.max !== undefined
          ? assumption.guardrails.max * 100
          : assumption.guardrails?.max
      }
      step={assumption.controlType === "percent" ? 0.1 : 0.1}
      value={displayValue}
      onChange={(event) => {
        if (assumption.controlType === "percent" && isPercentField(assumption.id)) {
          onUpdatePercentField(assumption.id, event.target.value);
          return;
        }

        onUpdateNumberField(assumption.id, event.target.value);
      }}
      disabled={!assumption.editable}
    />
  );
}

function FormField({
  assumption,
  onUpdateNumberField,
  onUpdatePercentField,
  onUpdateSelectField,
  getNumberValue,
  getPercentValue,
}: {
  assumption: GovernedAssumption;
  onUpdateNumberField: (field: keyof Inputs, rawValue: string) => void;
  onUpdatePercentField: (field: PercentDraftField, rawValue: string) => void;
  onUpdateSelectField: (field: keyof Inputs, value: Inputs[keyof Inputs]) => void;
  getNumberValue: (field: keyof Inputs) => string;
  getPercentValue: (field: PercentDraftField) => string;
}) {
  return (
    <div>
      <div className="text-[1rem] font-semibold" style={{ color: BRAND.text }}>
        {assumption.label}
      </div>
      <div className="mt-1 text-sm leading-6" style={{ color: BRAND.muted }}>
        {assumption.definition}
      </div>
      <div className="mt-3">
        <AssumptionInput
          assumption={assumption}
          onUpdateNumberField={onUpdateNumberField}
          onUpdatePercentField={onUpdatePercentField}
          onUpdateSelectField={onUpdateSelectField}
          getNumberValue={getNumberValue}
          getPercentValue={getPercentValue}
        />
      </div>
      {assumption.helperText ? (
        <div className="mt-2 text-sm leading-6" style={{ color: BRAND.muted }}>
          {assumption.helperText}
        </div>
      ) : null}
    </div>
  );
}

function GovernanceTable({
  rows,
  onUpdateNumberField,
  onUpdatePercentField,
  onUpdateSelectField,
  getNumberValue,
  getPercentValue,
}: {
  rows: GovernedAssumption[];
  onUpdateNumberField: (field: keyof Inputs, rawValue: string) => void;
  onUpdatePercentField: (field: PercentDraftField, rawValue: string) => void;
  onUpdateSelectField: (field: keyof Inputs, value: Inputs[keyof Inputs]) => void;
  getNumberValue: (field: keyof Inputs) => string;
  getPercentValue: (field: PercentDraftField) => string;
}) {
  return (
    <div className="mt-5 overflow-hidden rounded-2xl border" style={{ borderColor: BRAND.border }}>
      <div
        className="hidden xl:grid xl:grid-cols-[minmax(14rem,0.95fr)_minmax(11rem,0.7fr)_minmax(0,1.35fr)_minmax(0,1fr)] xl:items-center xl:gap-5 xl:px-5 xl:py-3.5"
        style={{ background: "#F7F8FC", color: BRAND.text }}
      >
        <div className="font-semibold">Assumption</div>
        <div className="font-semibold">Value</div>
        <div className="font-semibold">Definition</div>
        <div className="font-semibold">Source</div>
      </div>

      <div>
        {rows.map((assumption, index) => (
          <div
            key={assumption.id}
            className={`grid gap-3 px-5 py-4 xl:grid-cols-[minmax(14rem,0.95fr)_minmax(11rem,0.7fr)_minmax(0,1.35fr)_minmax(0,1fr)] xl:items-center xl:gap-5 ${
              index > 0 ? "border-t" : ""
            }`}
            style={index > 0 ? { borderColor: BRAND.border } : undefined}
          >
            <div className="min-w-0">
              <div className="text-[0.98rem] font-semibold" style={{ color: BRAND.text }}>
                {assumption.label}
              </div>
            </div>

            <div className="min-w-0 self-center">
              <AssumptionInput
                assumption={assumption}
                onUpdateNumberField={onUpdateNumberField}
                onUpdatePercentField={onUpdatePercentField}
                onUpdateSelectField={onUpdateSelectField}
                getNumberValue={getNumberValue}
                getPercentValue={getPercentValue}
              />
            </div>

            <div className="self-center text-sm leading-6" style={{ color: BRAND.muted }}>
              {assumption.definition}
              {assumption.helperText ? <div className="mt-1.5">{assumption.helperText}</div> : null}
            </div>

            <div className="self-center text-sm leading-6" style={{ color: BRAND.muted }}>
              {assumption.sourceNote}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QaCheckRow({
  status,
  title,
  message,
}: {
  status: QaCheckStatus;
  title: string;
  message: string;
}) {
  const tone = qaTone(status);
  const symbol = status === "pass" ? "✓" : status === "warn" ? "!" : "×";

  return (
    <div
      className="rounded-2xl px-5 py-4"
      style={{ background: "#F7F8FC", border: `1px solid ${BRAND.border}` }}
    >
      <div className="flex items-start gap-4">
        <div
          className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold"
          style={{ background: tone.bg, color: tone.text }}
        >
          {symbol}
        </div>
        <div>
          <div className="text-[1rem] font-semibold" style={{ color: BRAND.text }}>
            {title}
          </div>
          <div className="mt-1 text-sm leading-6" style={{ color: BRAND.muted }}>
            {message}
          </div>
        </div>
      </div>
    </div>
  );
}

function SensitivityBar({
  label,
  swing,
  lowValue,
  highValue,
  maxSwing,
}: {
  label: string;
  swing: number;
  lowValue: string;
  highValue: string;
  maxSwing: number;
}) {
  const widthPct = maxSwing > 0 ? Math.max(15, (swing / maxSwing) * 100) : 15;

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-4">
        <div className="text-[1rem] font-semibold" style={{ color: BRAND.text }}>
          {label}
        </div>
        <div className="text-right text-sm" style={{ color: BRAND.muted }}>
          Swing: {formatGBP(swing)}
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_11rem] xl:items-center">
        <div className="h-[2.2rem] overflow-hidden rounded-full" style={{ background: "#E8EBF3" }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(widthPct, 100)}%`,
              background: `linear-gradient(90deg, ${BRAND.blue} 0%, #5D70E8 100%)`,
            }}
          />
        </div>
        <div className="text-right text-[1rem] leading-7">
          <span style={{ color: "#EF4444" }}>{lowValue}</span>
          <span style={{ color: BRAND.muted }}> → </span>
          <span style={{ color: "#16A34A" }}>{highValue}</span>
        </div>
      </div>
    </div>
  );
}

export function InternalDashboard({
  internalAdminSummary,
  draftAssumptionsGovernance,
  hasUncalculatedChanges,
  onApplyGovernance,
  onResetGovernance,
  onUpdateNumberField,
  onUpdatePercentField,
  onUpdateSelectField,
  getNumberValue,
  getPercentValue,
}: InternalDashboardProps) {
  const [activeTab, setActiveTab] = useState<InternalTabId>("commercial-controls");

  const groups = draftAssumptionsGovernance.groups;
  const schoolProfileGroup = findGroup(groups, "school-profile");
  const commercialGroup = findGroup(groups, "commercial-onboarding");
  const aiUsageGroup = findGroup(groups, "ai-usage-costing");

  const schoolProfileFields =
    schoolProfileGroup?.assumptions.filter((assumption) =>
      ["teachersFTE", "students", "adoptionRate"].includes(assumption.id)
    ) ?? [];
  const topPresetField =
    schoolProfileGroup?.assumptions.find((assumption) => assumption.id === "preset") ?? null;
  const schoolTypeField =
    schoolProfileGroup?.assumptions.find(
      (assumption) => assumption.id === "schoolTypePreset"
    ) ?? null;
  const governanceTableRows = groups
    .flatMap((group) => group.assumptions)
    .filter(
      (assumption) =>
        assumption.id !== "preset" &&
        assumption.id !== "schoolTypePreset" &&
        assumption.id !== "teachersFTE" &&
        assumption.id !== "students" &&
        assumption.id !== "adoptionRate"
    );
  const commercialFields =
    commercialGroup?.assumptions.filter((assumption) => assumption.id !== "aiCostingMode") ?? [];
  const aiCostingModeField =
    commercialGroup?.assumptions.find((assumption) => assumption.id === "aiCostingMode") ?? null;

  const absenceRows = internalAdminSummary.sensitivitySummary.absenceSensitivity;
  const maxAbsenceSwing = Math.max(
    ...absenceRows.map((point) => point.annualSupplySavings),
    internalAdminSummary.sensitivitySummary.retentionImpact5Annual,
    1
  );

  const commercialWarning =
    internalAdminSummary.commercialSummary.annualAiCostEstimate < 5
      ? "Estimated annual AI cost is under £5. Validate token assumptions against real usage logs before relying on the contribution readout."
      : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {TABS.map((tab) => (
          <TabButton
            key={tab.id}
            tabId={tab.id}
            label={tab.label}
            active={tab.id === activeTab}
            onClick={() => setActiveTab(tab.id)}
          />
        ))}
      </div>

      {activeTab === "commercial-controls" ? (
        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-4">
            <SummaryCard
              label="Licence revenue (annual)"
              value={formatGBP(internalAdminSummary.commercialSummary.annualLicenceRevenue)}
            />
            <SummaryCard
              label="Est. inference cost (annual)"
              value={formatGBP(internalAdminSummary.commercialSummary.annualAiCostEstimate)}
            />
            <SummaryCard
              label="AI contribution margin"
              value={formatGBP(internalAdminSummary.commercialSummary.annualContributionAfterAiCost)}
              note="Excludes staffing, hosting, and wider operating costs."
            />
            <SummaryCard
              label="Contribution margin %"
              value={
                internalAdminSummary.commercialSummary.contributionMarginPct === null
                  ? "—"
                  : `${(internalAdminSummary.commercialSummary.contributionMarginPct * 100).toFixed(1)}%`
              }
            />
          </div>

          <div className="px-1 text-sm leading-6" style={{ color: BRAND.muted }}>
            &quot;AI contribution margin&quot; here means licence revenue minus the AI cost
            currently used in the model. It does not represent a fully loaded business margin.
          </div>

          {commercialWarning ? (
            <SoftMessage title="Inference cost appears low" tone="warn">
              {commercialWarning}
            </SoftMessage>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-2">
            <WorkspaceSurface>
              <SectionTitle
                title="Pricing controls"
                description="Commercial inputs that shape the internal cost basis used by ROI, payback, and the 5-year projection."
              />

              <div className="mt-8 space-y-7">
                {commercialFields.map((assumption) => (
                  <FormField
                    key={assumption.id}
                    assumption={assumption}
                    onUpdateNumberField={onUpdateNumberField}
                    onUpdatePercentField={onUpdatePercentField}
                    onUpdateSelectField={onUpdateSelectField}
                    getNumberValue={getNumberValue}
                    getPercentValue={getPercentValue}
                  />
                ))}
              </div>

              <div className="mt-6 rounded-2xl bg-[#F7F8FC] px-4 py-4">
                <div className="text-[0.82rem] font-bold uppercase tracking-[0.08em]" style={{ color: BRAND.text }}>
                  Active cost basis
                </div>
                <div className="mt-3 space-y-3 text-sm leading-6" style={{ color: BRAND.muted }}>
                  <div>{internalAdminSummary.commercialSummary.costBasisNote}</div>
                  <div>
                    Year 1 model cost basis:{" "}
                    <span className="font-semibold" style={{ color: BRAND.text }}>
                      {formatGBP(internalAdminSummary.commercialSummary.year1CostBasisInModel)}
                    </span>
                  </div>
                  <div>
                    Ongoing annual basis:{" "}
                    <span className="font-semibold" style={{ color: BRAND.text }}>
                      {formatGBP(internalAdminSummary.commercialSummary.recurringCostBasisInModel)}
                    </span>
                  </div>
                </div>
              </div>
            </WorkspaceSurface>

            <WorkspaceSurface>
              <SectionTitle
                title="AI cost model"
                description="Token and pricing assumptions driving the current estimated AI usage cost."
              />

              <div className="mt-8 space-y-7">
                {aiCostingModeField ? (
                  <FormField
                    assumption={aiCostingModeField}
                    onUpdateNumberField={onUpdateNumberField}
                    onUpdatePercentField={onUpdatePercentField}
                    onUpdateSelectField={onUpdateSelectField}
                    getNumberValue={getNumberValue}
                    getPercentValue={getPercentValue}
                  />
                ) : null}

                {aiUsageGroup?.assumptions.map((assumption) => (
                  <FormField
                    key={assumption.id}
                    assumption={assumption}
                    onUpdateNumberField={onUpdateNumberField}
                    onUpdatePercentField={onUpdatePercentField}
                    onUpdateSelectField={onUpdateSelectField}
                    getNumberValue={getNumberValue}
                    getPercentValue={getPercentValue}
                  />
                ))}
              </div>

              <div className="mt-6 rounded-2xl bg-[#F7F8FC] px-4 py-4">
                <div className="grid gap-3 text-sm md:grid-cols-2" style={{ color: BRAND.muted }}>
                  <div>
                    AI cost in model
                    <div className="mt-1 text-[1rem] font-semibold" style={{ color: BRAND.text }}>
                      {formatGBP(internalAdminSummary.commercialSummary.annualAiCostInModel)}
                    </div>
                  </div>
                  <div>
                    Estimated assessments / year
                    <div className="mt-1 text-[1rem] font-semibold" style={{ color: BRAND.text }}>
                      {formatNum(internalAdminSummary.usageContext.estimatedAssessmentsAnnual, 0)}
                    </div>
                  </div>
                </div>
              </div>
            </WorkspaceSurface>
          </div>
        </div>
      ) : null}

      {activeTab === "assumptions-governance" ? (
        <WorkspaceSurface>
          <SectionTitle
            title={
    <span
      className="text-[1.1rem] font-[640]"
      style={{ color: BRAND.text, fontWeight: 640 }}
    >
      Governed defaults
    </span>
  }
            description="Each assumption used in the School view is defined here with source and notes. Changes remain local until recalculation, then propagate to all panels."
            actions={
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-full px-4 py-2 text-sm font-semibold text-white"
                  style={{
                    background: `linear-gradient(135deg, ${BRAND.blue} 0%, ${BRAND.indigo} 100%)`,
                    cursor: "pointer",
                  }}
                  onClick={onApplyGovernance}
                >
                  Recalculate
                </button>
                <button
                  type="button"
                  className="rounded-full border px-4 py-2 text-sm font-semibold"
                  style={{
                    background: "#FFFFFF",
                    borderColor: BRAND.border,
                    color: BRAND.text,
                    cursor: "pointer",
                  }}
                  onClick={onResetGovernance}
                >
                  Reset defaults
                </button>
              </div>
            }
          />

          <div className="mt-6 rounded-2xl bg-[#F7F8FC] px-4 py-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="text-[1rem] font-semibold" style={{ color: BRAND.text }}>
                Active preset:
              </div>
              <div className="w-full md:max-w-[14rem]">
                {topPresetField ? (
                  <AssumptionInput
                    assumption={topPresetField}
                    onUpdateNumberField={onUpdateNumberField}
                    onUpdatePercentField={onUpdatePercentField}
                    onUpdateSelectField={onUpdateSelectField}
                    getNumberValue={getNumberValue}
                    getPercentValue={getPercentValue}
                  />
                ) : null}
              </div>
              <div className="text-sm leading-6" style={{ color: BRAND.muted }}>
                Presets control the modelled reduction assumptions for time savings, absence, and attrition impact.
              </div>
            </div>
          </div>

          {schoolTypeField ? (
            <div className="mt-4 rounded-2xl bg-[#F7F8FC] px-4 py-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="text-[1rem] font-semibold" style={{ color: BRAND.text }}>
                  School preset:
                </div>
                <div className="w-full md:max-w-[14rem]">
                  <AssumptionInput
                    assumption={schoolTypeField}
                    onUpdateNumberField={onUpdateNumberField}
                    onUpdatePercentField={onUpdatePercentField}
                    onUpdateSelectField={onUpdateSelectField}
                    getNumberValue={getNumberValue}
                    getPercentValue={getPercentValue}
                  />
                </div>
                <div className="text-sm leading-6" style={{ color: BRAND.muted }}>
                  Applies more realistic default assumptions for primary vs secondary schools. Values can still be adjusted and only affect results after recalculation.
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-8">
            <div
              className="text-[0.9rem] font-bold uppercase tracking-[0.08em]"
              style={{ color: BRAND.text }}
            >
              School profile
            </div>
            <div className="mt-5 grid gap-5 xl:grid-cols-3">
              {schoolProfileFields.map((assumption) => (
                <FormField
                  key={assumption.id}
                  assumption={assumption}
                  onUpdateNumberField={onUpdateNumberField}
                  onUpdatePercentField={onUpdatePercentField}
                  onUpdateSelectField={onUpdateSelectField}
                  getNumberValue={getNumberValue}
                  getPercentValue={getPercentValue}
                />
              ))}
            </div>
          </div>

          <div className="mt-8">
            <div
              className="text-[0.9rem] font-bold uppercase tracking-[0.08em]"
              style={{ color: BRAND.text }}
            >
              Assumption definitions & values
            </div>

            <GovernanceTable
              rows={governanceTableRows}
              onUpdateNumberField={onUpdateNumberField}
              onUpdatePercentField={onUpdatePercentField}
              onUpdateSelectField={onUpdateSelectField}
              getNumberValue={getNumberValue}
              getPercentValue={getPercentValue}
            />
          </div>

          <div
            className="mt-6 rounded-2xl border px-4 py-3 text-sm leading-6"
            style={{
              background: hasUncalculatedChanges ? "#FFF7ED" : "#F7FBF8",
              borderColor: hasUncalculatedChanges ? "#FED7AA" : "#BBF7D0",
              color: hasUncalculatedChanges ? "#9A3412" : "#166534",
            }}
          >
            {hasUncalculatedChanges
              ? "Pending governance edits are not yet reflected in School or Internal outputs."
              : "Governed defaults currently match the active School and Internal outputs."}
          </div>
        </WorkspaceSurface>
      ) : null}

      {activeTab === "qa-decomposition" ? (
        <div className="space-y-4">
          <WorkspaceSurface>
            <SectionTitle
              title="Model QA checks"
              description="This workspace confirms the single truth model is internally coherent and that visible outputs reconcile to the active assumptions and cost basis."
            />

            <div className="mt-8 space-y-3">
              {internalAdminSummary.qaChecks.checks.map((check) => (
                <QaCheckRow
                  key={check.id}
                  status={check.status}
                  title={check.label}
                  message={check.message}
                />
              ))}
            </div>
          </WorkspaceSurface>

          <div className="grid gap-4 xl:grid-cols-2">
            <WorkspaceSurface>
              <div
                className="text-[0.9rem] font-bold uppercase tracking-[0.08em]"
                style={{ color: BRAND.text }}
              >
                Year 1 costs
              </div>
              <div className="mt-7">
                <BreakdownList
                  rows={internalAdminSummary.year1CostBreakdown.rows}
                  totalLabel="Total Year 1"
                  totalValue={internalAdminSummary.year1CostBreakdown.total}
                />
              </div>
              <div className="mt-6 border-t pt-6" style={{ borderColor: BRAND.border }}>
                <BreakdownList
                  rows={internalAdminSummary.ongoingCostBreakdown.rows}
                  totalLabel="Ongoing annual (Year 2+)"
                  totalValue={internalAdminSummary.ongoingCostBreakdown.total}
                />
              </div>
            </WorkspaceSurface>

            <WorkspaceSurface>
              <div
                className="text-[0.9rem] font-bold uppercase tracking-[0.08em]"
                style={{ color: BRAND.text }}
              >
                Cash savings
              </div>
              <div className="mt-7">
                <BreakdownList
                  rows={internalAdminSummary.cashSavingsBreakdown.rows}
                  totalLabel="Total cash savings"
                  totalValue={internalAdminSummary.cashSavingsBreakdown.total}
                />
              </div>
              <div className="mt-8 border-t pt-6" style={{ borderColor: BRAND.border }}>
                <div
                  className="text-[0.9rem] font-bold uppercase tracking-[0.08em]"
                  style={{ color: BRAND.text }}
                >
                  Educational value (separate from cash ROI)
                </div>
                <div className="mt-5">
                  <BreakdownList rows={internalAdminSummary.educationalValueBreakdown.rows} />
                </div>
              </div>
            </WorkspaceSurface>
          </div>

          <WorkspaceSurface>
            <SectionTitle
              title="Projection, usage context, and notes"
              description="The 5-year projection uses the same internal basis validated above. Supporting context stays here rather than competing with the headline breakdowns."
            />

            <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr style={{ color: BRAND.muted }}>
                      <th className="pb-3 text-left font-semibold">Year</th>
                      <th className="pb-3 text-right font-semibold">Costs</th>
                      <th className="pb-3 text-right font-semibold">Savings</th>
                      <th className="pb-3 text-right font-semibold">Net</th>
                      <th className="pb-3 text-right font-semibold">Cumulative</th>
                      <th className="pb-3 text-right font-semibold">ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {internalAdminSummary.projectionSummary.projection5y.map((row) => (
                      <tr key={row.year} style={{ borderTop: `1px solid ${BRAND.border}` }}>
                        <td className="py-3 font-semibold" style={{ color: BRAND.text }}>
                          Year {row.year}
                        </td>
                        <td className="py-3 text-right" style={{ color: BRAND.text }}>
                          {formatGBP(row.costs)}
                        </td>
                        <td className="py-3 text-right" style={{ color: BRAND.text }}>
                          {formatGBP(row.savings)}
                        </td>
                        <td className="py-3 text-right" style={{ color: BRAND.text }}>
                          {formatGBP(row.netBenefit)}
                        </td>
                        <td className="py-3 text-right" style={{ color: BRAND.text }}>
                          {formatGBP(row.cumulativeNetBenefit)}
                        </td>
                        <td className="py-3 text-right" style={{ color: BRAND.text }}>
                          {formatPct(row.cumulativeRoi)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl bg-[#F7F8FC] px-4 py-4">
                  <div className="text-[0.9rem] font-bold uppercase tracking-[0.08em]" style={{ color: BRAND.text }}>
                    Usage context
                  </div>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span style={{ color: BRAND.muted }}>Adoption rate</span>
                      <span className="font-semibold" style={{ color: BRAND.text }}>
                        {formatPct(internalAdminSummary.usageContext.adoptionRate)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span style={{ color: BRAND.muted }}>Adopted teachers</span>
                      <span className="font-semibold" style={{ color: BRAND.text }}>
                        {formatNum(internalAdminSummary.usageContext.adoptedTeachers, 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span style={{ color: BRAND.muted }}>Adopted students</span>
                      <span className="font-semibold" style={{ color: BRAND.text }}>
                        {formatNum(internalAdminSummary.usageContext.adoptedStudents, 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span style={{ color: BRAND.muted }}>Annual assessments</span>
                      <span className="font-semibold" style={{ color: BRAND.text }}>
                        {formatNum(internalAdminSummary.usageContext.estimatedAssessmentsAnnual, 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span style={{ color: BRAND.muted }}>Break-even</span>
                      <span className="font-semibold" style={{ color: BRAND.text }}>
                        {formatBreakEvenLabel(internalAdminSummary.projectionSummary.breakEvenMonth)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-[#F7F8FC] px-4 py-4">
                  <div className="text-[0.9rem] font-bold uppercase tracking-[0.08em]" style={{ color: BRAND.text }}>
                    Included / excluded notes
                  </div>
                  <div className="mt-4 space-y-2 text-sm leading-6" style={{ color: BRAND.muted }}>
                    {internalAdminSummary.outputMetadata.includedNotes.map((note) => (
                      <div key={note}>{note}</div>
                    ))}
                    {internalAdminSummary.outputMetadata.excludedNotes.map((note) => (
                      <div key={note}>{note}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </WorkspaceSurface>
        </div>
      ) : null}

      {activeTab === "sensitivity-analysis" ? (
        <div className="space-y-4">
          <WorkspaceSurface>
            <SectionTitle
              title="Sensitivity: which variables most move ROI?"
              description="This first version remains lightweight. It shows how the active assumptions change annual cash savings under the currently governed defaults."
            />

            <div className="mt-8 space-y-8">
              {absenceRows.map((point) => (
                <SensitivityBar
                  key={point.label}
                  label={`Supply cover at ${point.label} absence reduction`}
                  swing={point.annualSupplySavings}
                  lowValue={formatGBP(0)}
                  highValue={formatGBP(point.annualSupplySavings)}
                  maxSwing={maxAbsenceSwing}
                />
              ))}

              <SensitivityBar
                label="Retention improvement impact"
                swing={internalAdminSummary.sensitivitySummary.retentionImpact5Annual}
                lowValue={formatGBP(0)}
                highValue={formatGBP(internalAdminSummary.sensitivitySummary.retentionImpact5Annual)}
                maxSwing={maxAbsenceSwing}
              />
            </div>
          </WorkspaceSurface>

          <div className="px-1 text-sm leading-6" style={{ color: BRAND.muted }}>
            Sensitivity is computed against current governed inputs. Re-run after changing
            assumptions to refresh the ranking.
          </div>
        </div>
      ) : null}

      <div className="px-1 text-sm leading-6" style={{ color: BRAND.muted }}>
        Model v{internalAdminSummary.outputMetadata.modelVersion} •{" "}
        {internalAdminSummary.outputMetadata.generatedDate} • Internal use only — not for external
        distribution.
      </div>
    </div>
  );
}


