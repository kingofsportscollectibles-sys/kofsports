import { DashboardCard } from "@/components/admin/dashboard-card";

function formatCurrency(amountInCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amountInCents / 100);
}

export function MRRCard({
  amountInCents,
  revenueChangePercent,
}: {
  amountInCents: number;
  revenueChangePercent: number | null;
}) {
  const trend =
    revenueChangePercent !== null && revenueChangePercent > 0
      ? `+${revenueChangePercent.toFixed(1)}%`
      : undefined;

  return (
    <DashboardCard
      label="Revenue This Month"
      value={formatCurrency(amountInCents)}
      description="Monthly equivalent of active 7-day, 30-day, and 90-day subscriptions."
      trend={trend}
    />
  );
}
