import { ActivityFeed } from "@/components/admin/activity-feed";
import { ConversionCard } from "@/components/admin/conversion-card";
import { DashboardHeader } from "@/components/admin/dashboard-header";
import { GoalsBanner } from "@/components/admin/goals-banner";
import { MarketingFunnel } from "@/components/admin/marketing-funnel";
import { MemberGrowthChart } from "@/components/admin/member-growth-chart";
import { MembersCard } from "@/components/admin/members-card";
import { MRRCard } from "@/components/admin/mrr-card";
import { NotificationStatus } from "@/components/admin/notification-status";
import { QuickActions } from "@/components/admin/quick-actions";
import { RecentSignups } from "@/components/admin/recent-signups";
import { RetentionCard } from "@/components/admin/retention-card";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { SystemHealth } from "@/components/admin/system-health";
import { TodaysPriorities } from "@/components/admin/todays-priorities";
import { TopSports } from "@/components/admin/top-sports";
import { getAdminDashboardData } from "@/lib/admin/dashboard";

function formatCurrency(amountInCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amountInCents / 100);
}

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardData();

  const goals = [
    {
      label: "Premium Members",
      current: data.activePremiumMembers,
      target: data.goals.premiumMembersGoal,
    },
    {
      label: "Monthly Revenue",
      current: data.currentMonthRevenueInCents,
      target: data.goals.monthlyRevenueGoalInCents,
      displayCurrent: formatCurrency(data.currentMonthRevenueInCents),
      displayTarget: formatCurrency(
        data.goals.monthlyRevenueGoalInCents,
      ),
    },
    {
      label: "Paid Signups",
      current: data.newPremiumMembersThisMonth,
      target: data.goals.paidSignupsGoal,
    },
  ];

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <DashboardHeader adminName={data.adminName} />

      <div className="mt-10">
   <GoalsBanner
  goals={goals}
  premiumMembersGoal={data.goals.premiumMembersGoal}
  monthlyRevenueGoalInCents={
    data.goals.monthlyRevenueGoalInCents
  }
  paidSignupsGoal={data.goals.paidSignupsGoal}
/>
      </div>

      <div className="mt-6">
        <TodaysPriorities items={data.priorities} />
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <MRRCard
          amountInCents={data.mrrInCents}
          revenueChangePercent={data.revenueChangePercent}
        />

        <MembersCard
          activeMembers={data.activePremiumMembers}
          newThisMonth={data.newPremiumMembersThisMonth}
        />

        <ConversionCard
          conversionRate={data.accountToPremiumConversion}
          activeMembers={data.activePremiumMembers}
          totalAccounts={data.totalAccounts}
        />

        <RetentionCard
          renewalRate={data.renewalRate}
          churnRate={data.churnRate}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <RevenueChart data={data.revenueByMonth} />
        <MemberGrowthChart data={data.memberGrowthByMonth} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <RecentSignups signups={data.recentSignups} />
        <MarketingFunnel stages={data.funnel} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <TopSports sports={data.topSports} />
        <ActivityFeed items={data.recentActivity} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <NotificationStatus data={data.notifications} />
        <QuickActions />
      </div>

      <div className="mt-6">
        <SystemHealth items={data.systemHealth} />
      </div>
    </main>
  );
}