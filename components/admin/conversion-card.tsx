import { DashboardCard } from "@/components/admin/dashboard-card";

export function ConversionCard({
  conversionRate,
  activeMembers,
  totalAccounts,
}: {
  conversionRate: number | null;
  activeMembers: number;
  totalAccounts: number;
}) {
  return (
    <DashboardCard
      label="Account Conversion"
      value={conversionRate === null ? "—" : `${conversionRate.toFixed(1)}%`}
      description={`${activeMembers.toLocaleString("en-US")} active Premium members from ${totalAccounts.toLocaleString("en-US")} total accounts.`}
    />
  );
}
