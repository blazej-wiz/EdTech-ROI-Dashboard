import type { AssumptionsGovernanceSummary } from "@/lib/calc";
import { BRAND } from "./ui";

type InternalAdminSidebarProps = {
  draftAssumptionsGovernance: AssumptionsGovernanceSummary;
  hasUncalculatedChanges: boolean;
};

export function InternalAdminSidebar({
  draftAssumptionsGovernance,
  hasUncalculatedChanges,
}: InternalAdminSidebarProps) {
  return (
    <div
      className="rounded-2xl p-5 shadow-sm"
      style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}
    >
      <div
        className="text-[0.72rem] font-semibold uppercase tracking-[0.16em]"
        style={{ color: BRAND.muted }}
      >
        Internal Context
      </div>
      <div className="mt-2 text-base font-[630]" style={{ color: BRAND.text }}>
        Governance sidebar
      </div>
      <div className="mt-2 text-sm leading-6" style={{ color: BRAND.muted }}>
        A compact summary of the governed defaults currently being edited in the internal control
        room.
      </div>

      <div className="mt-6 space-y-4 border-t pt-5" style={{ borderColor: BRAND.border }}>
        <div className="space-y-3 text-sm" style={{ color: BRAND.muted }}>
          <div className="flex items-center justify-between gap-3">
            <span>Scenario preset</span>
            <span className="font-semibold text-right" style={{ color: BRAND.text }}>
              {draftAssumptionsGovernance.activeScenarioPreset}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span>School type</span>
            <span className="font-semibold text-right" style={{ color: BRAND.text }}>
              {draftAssumptionsGovernance.activeSchoolTypePreset}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span>Assumption set</span>
            <span className="font-semibold text-right" style={{ color: BRAND.text }}>
              {draftAssumptionsGovernance.metadata.assumptionSetVersion}
            </span>
          </div>
        </div>

        <div
          className="rounded-2xl px-4 py-4 text-sm leading-6"
          style={{ background: "#F8FAFF", color: BRAND.muted }}
        >
          <div>{draftAssumptionsGovernance.metadata.defaultsSourceNote}</div>
          <div className="mt-2">{draftAssumptionsGovernance.metadata.propagationNote}</div>
        </div>

        <div
          className="rounded-2xl border px-4 py-4 text-sm font-semibold"
          style={{
            background: hasUncalculatedChanges ? "#FFF7ED" : "#ECFDF5",
            color: hasUncalculatedChanges ? "#9A3412" : "#065F46",
            borderColor: hasUncalculatedChanges ? "#FED7AA" : "#A7F3D0",
          }}
        >
          {hasUncalculatedChanges
            ? "Governed defaults have pending edits. Recalculate in the Assumptions governance tab to propagate them."
            : "Governed defaults are aligned with the active model outputs."}
        </div>
      </div>
    </div>
  );
}
