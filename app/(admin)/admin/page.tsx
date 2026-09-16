import Link from "next/link";

import { ActiveMembersTable } from "@/components/admin/active-members-table";
import { ActivityFeed } from "@/components/admin/activity-feed";
import { BusinessKpis } from "@/components/admin/business-kpis";
import { DashboardHeader } from "@/components/admin/dashboard-header";
import { GoalsBanner } from "@/components/admin/goals-banner";
import { RecentlyExpiredMembers } from "@/components/admin/recently-expired-members";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { SystemHealth } from "@/components/admin/system-health";
import { TodaysPriorities } from "@/components/admin/todays-priorities";
import { TopSports } from "@/components/admin/top-sports";
import { getAdminDashboardData } from "@/lib/admin/dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
      displayCurrent: formatCurrency(
        data.currentMonthRevenueInCents,
      ),
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
    <main className="mx-auto max-w-[1500px] px-4 py-10 sm:px-6">
      <DashboardHeader adminName={data.adminName} />

      <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
            KofSports Business Dashboard
          </p>

          <h1 className="mt-1 text-2xl font-bold text-white">
            Revenue, memberships and growth
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Stripe and manual sales now roll into one business view.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/sales/new"
            className="rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            Record Sale
          </Link>

          <Link
            href="/admin/sales"
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-slate-600 hover:bg-slate-800"
          >
            View Sales Ledger
          </Link>
        </div>
      </div>

      <div className="mt-6">
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
        <BusinessKpis
          revenueTodayInCents={data.revenueTodayInCents}
          currentMonthRevenueInCents={
            data.currentMonthRevenueInCents
          }
          yearToDateRevenueInCents={data.yearToDateRevenueInCents}
          lifetimeRevenueInCents={data.lifetimeRevenueInCents}
          stripeRevenueInCents={data.stripeRevenueInCents}
          manualRevenueInCents={data.manualRevenueInCents}
          activePremiumMembers={data.activePremiumMembers}
          activeProMembers={data.activeProMembers}
        />
      </div>

      <div className="mt-6">
        <RevenueChart data={data.revenueByMonth} />
      </div>

      <div className="mt-6">
        <ActiveMembersTable members={data.activeMembers} />
      </div>

      <div className="mt-6">
        <RecentlyExpiredMembers
          members={data.recentlyExpiredMembers}
        />
      </div>

      <div className="mt-6">
        <TodaysPriorities items={data.priorities} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <TopSports sports={data.topSports} />
        <ActivityFeed items={data.recentActivity} />
      </div>

      <div className="mt-6">
        <SystemHealth items={data.systemHealth} />
      </div>
    </main>
  );
}
