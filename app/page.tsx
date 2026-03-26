"use client";

import { InputsPanel } from "@/components/roi/inputs-panel";
import { InternalDashboard } from "@/components/roi/internal-dashboard";
import { PageHeader } from "@/components/roi/page-header";
import { SchoolDashboard } from "@/components/roi/school-dashboard";
import { BRAND, DASHBOARD_FRAME_CLASS } from "@/components/roi/ui";
import { useRoiDashboard } from "@/components/roi/use-roi-dashboard";

export default function Page() {
  const dashboard = useRoiDashboard();
  const appFont =
    '"Libertinus Sans", ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"';

  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily: appFont,
        background: `linear-gradient(180deg, ${BRAND.bgTop} 0%, ${BRAND.bgBottom} 100%)`,
        color: BRAND.text,
      }}
    >
      <PageHeader
        viewMode={dashboard.viewMode}
        onViewChange={dashboard.setViewMode}
        hasUncalculatedChanges={dashboard.hasUncalculatedChanges}
      />

      <main
        className={`${DASHBOARD_FRAME_CLASS} grid grid-cols-1 gap-6 pb-10 lg:grid-cols-3 xl:grid-cols-[minmax(20rem,21rem)_minmax(0,1fr)]`}
      >
        <div className="space-y-4 lg:col-span-1">
          <InputsPanel
            viewMode={dashboard.viewMode}
            draft={dashboard.draft}
            setDraft={dashboard.setDraft}
            rawInputs={dashboard.rawInputs}
            setRawInputs={dashboard.setRawInputs}
            showAdvanced={dashboard.showAdvanced}
            onToggleAdvanced={() => dashboard.setShowAdvanced((value) => !value)}
            onApply={dashboard.applyDraft}
            onReset={dashboard.resetToDefaults}
          />
        </div>

        <div className="space-y-6 lg:col-span-2 xl:col-span-1">
          {dashboard.viewMode === "school" ? (
            <SchoolDashboard
              schoolView={dashboard.schoolView}
              internalView={dashboard.internalView}
              applied={dashboard.applied}
              timeReallocationData={dashboard.timeReallocationData}
              schoolMonthlyCumulativeNetData={dashboard.schoolMonthlyCumulativeNetData}
              cumulativeNetData={dashboard.cumulativeNetData}
              breakEvenMonth={dashboard.breakEvenMonth}
              displayedRoi={dashboard.displayedRoi}
              roiAnimating={dashboard.roiAnimating}
              roiYearShown={dashboard.roiYearShown}
              roiColor={dashboard.roiColor}
              onStartRoiAnimation={dashboard.startRoiAnimation}
            />
          ) : (
            <InternalDashboard
              schoolView={dashboard.schoolView}
              internalView={dashboard.internalView}
              internalEcon={dashboard.internalEcon}
              applied={dashboard.applied}
              timeReallocationData={dashboard.timeReallocationData}
              schoolMonthlyCumulativeNetData={dashboard.schoolMonthlyCumulativeNetData}
              cumulativeNetData={dashboard.cumulativeNetData}
              breakEvenMonth={dashboard.breakEvenMonth}
              displayedRoi={dashboard.displayedRoi}
              roiAnimating={dashboard.roiAnimating}
              roiYearShown={dashboard.roiYearShown}
              roiColor={dashboard.roiColor}
              onStartRoiAnimation={dashboard.startRoiAnimation}
            />
          )}
        </div>
      </main>
    </div>
  );
}
