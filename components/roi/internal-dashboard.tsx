import { BRAND, Card, formatGBP } from "./ui";
import { DashboardBody, type DashboardBodyProps } from "./dashboard-body";

type InternalDashboardProps = DashboardBodyProps & {
  internalEcon: {
    licence: number;
    inference: number;
    grossMargin: number;
    marginPct: number | null;
  };
};

export function InternalDashboard({
  internalEcon,
  ...dashboardProps
}: InternalDashboardProps) {
  return (
    <>
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

      <div className="mt-2 text-xs" style={{ color: BRAND.muted }}>
        Internal modelling view: margin reflects licence revenue minus estimated AI inference
        cost. Does not include staffing, hosting, or other operating expenses.
      </div>

      <DashboardBody {...dashboardProps} />
    </>
  );
}
