import { DashboardCard } from "@/components/admin/dashboard-card";

export function MembersCard({
  activeMembers,
  newThisMonth,
}: {
  activeMembers: number;
  newThisMonth: number;
}) {
  return (
    <DashboardCard
      label="Active Premium"
      value={activeMembers.toLocaleString("en-US")}
      description={`${newThisMonth} paid member${newThisMonth === 1 ? "" : "s"} added this month.`}
    />
  );
}
