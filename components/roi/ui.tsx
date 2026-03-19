import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export const BRAND = {
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
} as const;

export function formatGBP(n: number) {
  const value = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPct(n: number | null) {
  if (n === null || !Number.isFinite(n)) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

export function formatNum(n: number | null, dp = 1) {
  if (n === null || !Number.isFinite(n)) return "—";
  return n.toFixed(dp);
}

export function Card({
  title,
  children,
  onClick,
  clickable,
  bodyClassName,
}: {
  title: string;
  children: ReactNode;
  onClick?: () => void;
  clickable?: boolean;
  bodyClassName?: string;
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
      <div className={bodyClassName ? `mt-2 ${bodyClassName}` : "mt-2"}>{children}</div>
    </div>
  );
}

export function InputRow({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="space-y-1">
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

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition"
      style={{
        background: "#fff",
        border: `1px solid ${BRAND.border}`,
        color: BRAND.text,
      }}
    />
  );
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full appearance-none rounded-xl px-3 py-2.5 pr-10 text-sm outline-none transition"
      style={{
        background: "#fff",
        border: `1px solid ${BRAND.border}`,
        color: BRAND.text,
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M4 6L8 10L12 6' stroke='%2346556E' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 12px center",
        backgroundSize: "16px 16px",
      }}
    />
  );
}

export function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <div className="relative mb-4 mt-6">
      <div className="absolute inset-0 flex items-center">
        <div className="h-px w-full" style={{ background: BRAND.border }} />
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
