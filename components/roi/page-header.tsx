import Image from "next/image";
import { BRAND, DASHBOARD_FRAME_CLASS } from "./ui";
import type { RoiViewMode } from "./use-roi-dashboard";

type PageHeaderProps = {
  viewMode: RoiViewMode;
  onViewChange: (mode: RoiViewMode) => void;
};

export function PageHeader({ viewMode, onViewChange }: PageHeaderProps) {
  const headerSummary =
    viewMode === "school"
      ? "Cash ROI is based on supply cover and recruitment or replacement savings. Teacher time is shown separately and excluded from cash ROI."
      : "ROI is based on savings from supply cover and attrition reduction. Teacher time is shown separately as educational value and £-equivalent value.";

  return (
    <header className={`${DASHBOARD_FRAME_CLASS} py-7`}>
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-[40px_1fr] gap-x-3 gap-y-2">
          <div className="relative h-10 w-10 shrink-0">
            <Image
              src="/mysmartteach-icon.png"
              alt="MySmartTeach"
              fill
              priority
              className="object-cover"
            />
          </div>

          <div>
            <h1 className="text-3xl font-[630] tracking-tight" style={{ color: BRAND.text }}>
              My Smart Teach ROI Dashboard
            </h1>
            <p className="text-sm" style={{ color: BRAND.muted }}>
              {headerSummary}
            </p>
          </div>

          <div className="col-span-2 mt-2">
            <div
              className="inline-flex w-fit items-center gap-2 rounded-full p-1"
              style={{ background: "#fff", border: `1px solid ${BRAND.border}` }}
            >
              <button
                className="rounded-full px-3 py-1 text-xs font-[630] transition"
                style={{
                  cursor: "pointer",
                  background: viewMode === "school" ? "#EEF2FF" : "transparent",
                  color: BRAND.text,
                }}
                onClick={() => onViewChange("school")}
              >
                School view
              </button>

              <button
                className="rounded-full px-3 py-1 text-xs font-[630] transition"
                style={{
                  cursor: "pointer",
                  background: viewMode === "internal" ? "#EEF2FF" : "transparent",
                  color: BRAND.text,
                }}
                onClick={() => onViewChange("internal")}
              >
                MySmartTeach internal
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
