import DailyMission from "@/components/admin/growth/dashboard/DailyMission";
import FollowUpsDue from "@/components/admin/growth/dashboard/FollowUpsDue";
import FunnelMetrics from "@/components/admin/growth/dashboard/FunnelMetrics";
import NewLeads from "@/components/admin/growth/dashboard/NewLeads";
import QuickActions from "@/components/admin/growth/dashboard/QuickActions";
import RecentActivity from "@/components/admin/growth/dashboard/RecentActivity";
import GrowthHeader from "@/components/admin/growth/GrowthHeader";
import StatCard from "@/components/admin/growth/shared/StatCard";
import { getGrowthDashboard } from "@/lib/growth/dashboard";

export default async function GrowthDashboardPage() {
  const dashboard = await getGrowthDashboard();

  return (
    <>
      <GrowthHeader
        eyebrow="Daily Command Center"
        title="Growth Dashboard"
        description="Manage today's outreach, conversations, follow-ups, and movement through the KofSports customer funnel."
        action={
          <div className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white">
            Today&apos;s Mission
          </div>
        }
      />

      <div className="space-y-6 p-5 sm:p-8">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="New Leads"
            value={dashboard.stats.newLeads}
            supportingText="Prospects added today"
          />

          <StatCard
            label="Conversations"
            value={dashboard.stats.conversations}
            supportingText="Message activity logged today"
          />

          <StatCard
            label="Follow-Ups Due"
            value={dashboard.stats.followups}
            supportingText="Due today or overdue"
            tone="warning"
          />

          <StatCard
            label="Overdue"
            value={dashboard.stats.overdue}
            supportingText="Follow-ups requiring attention"
            tone="warning"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <DailyMission />
          <QuickActions />
        </section>

        <FunnelMetrics stages={dashboard.funnel} />

        <section className="grid gap-6 xl:grid-cols-2">
          <FollowUpsDue followups={dashboard.followups ?? []} />

          <NewLeads leads={dashboard.newLeads ?? []} />
        </section>

        <RecentActivity
          activities={dashboard.recentActivity}
        />
      </div>
    </>
  );
}
