import Image from "next/image";
import { BRAND } from "./ui";
import type { RoiViewMode } from "./use-roi-dashboard";

type PageHeaderProps = {
  viewMode: RoiViewMode;
  onViewChange: (mode: RoiViewMode) => void;
  hasUncalculatedChanges: boolean;
};

export function PageHeader({
  viewMode,
  onViewChange,
  hasUncalculatedChanges,
}: PageHeaderProps) {
  return (
    <header className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-3">
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
              ROI is based on savings from <span className="font-semibold">supply cover</span> and{" "}
              <span className="font-semibold">attrition reduction</span>. Teacher time is shown
              separately as educational value and £-equivalent value.
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

        {hasUncalculatedChanges ? (
          <div
            className="inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              background: "#FFF7ED",
              color: "#9A3412",
              border: "1px solid #FED7AA",
            }}
          >
            Unsaved changes — click <span className="font-[630]">Calculate</span> to update
            results
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
  );
}
