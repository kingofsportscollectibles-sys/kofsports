import { DashboardCard } from "@/components/admin/dashboard-card";

export function RetentionCard({
  renewalRate,
  churnRate,
}: {
  renewalRate: number | null;
  churnRate: number | null;
}) {
  const churnText = churnRate === null ? "Churn unavailable." : `${churnRate.toFixed(1)}% observed churn.`;

  return (
    <DashboardCard
      label="Observed Renewal Rate"
      value={renewalRate === null ? "—" : `${renewalRate.toFixed(1)}%`}
      description={`Share of recurring subscriptions with a recorded renewal. ${churnText}`}
    />
  );
}
