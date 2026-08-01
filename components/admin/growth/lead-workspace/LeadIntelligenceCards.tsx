import type { GrowthActivity } from "@/lib/growth/activity";
import type {
  MembershipSummary,
  RevenueSummary,
} from "@/lib/growth/customer360";
import type { GrowthLead } from "@/lib/growth/lead";
import {
  getLeadIntelligence,
  type BuyingIntentLevel,
} from "@/lib/growth/lead-intelligence";

type LeadIntelligenceCardsProps = {
  lead: GrowthLead;
  activities: GrowthActivity[];
  revenue: RevenueSummary;
  membership: MembershipSummary;
};

function getIntentDisplay(intent: BuyingIntentLevel) {
  switch (intent) {
    case "high":
      return {
        label: "High Intent",
        icon: "🔥",
        badgeClassName: "bg-red-100 text-red-700",
        barClassName: "bg-red-500",
      };

    case "medium":
      return {
        label: "Medium Intent",
        icon: "🟡",
        badgeClassName: "bg-amber-100 text-amber-700",
        barClassName: "bg-amber-500",
      };

    default:
      return {
        label: "Low Intent",
        icon: "⚪",
        badgeClassName: "bg-slate-100 text-slate-600",
        barClassName: "bg-slate-400",
      };
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return "No purchases";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatMembership(value: string | null) {
  if (!value) {
    return "Free";
  }

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

function formatSubscriptionStatus(
  value: string | null,
) {
  if (!value) {
    return "No active subscription";
  }

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

export default function LeadIntelligenceCards({
  lead,
  activities,
  revenue,
  membership,
}: LeadIntelligenceCardsProps) {
  const intelligence = getLeadIntelligence(
    lead,
    activities,
  );

  const intentDisplay = getIntentDisplay(
    intelligence.buyingIntent,
  );

  const customerMetrics = [
    {
      label: "Lifetime Value",
      value: formatCurrency(revenue.lifetimeValue),
      detail:
        revenue.totalOrders > 0
          ? `${revenue.totalOrders} paid ${
              revenue.totalOrders === 1
                ? "order"
                : "orders"
            }`
          : "No completed orders",
    },
    {
      label: "Total Orders",
      value: revenue.totalOrders.toString(),
      detail:
        revenue.totalOrders > 0
          ? `${formatCurrency(
              revenue.averageOrderValue,
            )} average order`
          : "No purchase history",
    },
    {
      label: "Average Order",
      value: formatCurrency(
        revenue.averageOrderValue,
      ),
      detail:
        revenue.totalOrders > 0
          ? "Average paid order value"
          : "Awaiting first purchase",
    },
    {
      label: "Membership",
      value: formatMembership(
        membership.membership,
      ),
      detail: formatSubscriptionStatus(
        membership.subscriptionStatus,
      ),
    },
    {
      label: "Last Purchase",
      value: formatDate(
        revenue.lastPurchaseAt,
      ),
      detail:
        membership.expiresAt
          ? `Access expires ${formatDate(
              membership.expiresAt,
            )}`
          : "No expiration date",
    },
    {
      label: "Lead Score",
      value: lead.leadScore.toString(),
      detail: `${intelligence.intentScore} intent score`,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {customerMetrics.map((metric) => (
          <section
            key={metric.label}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">
              {metric.label}
            </p>

            <p className="mt-3 text-2xl font-black text-slate-950">
              {metric.value}
            </p>

            <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
              {metric.detail}
            </p>
          </section>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
                Buying Intent
              </p>

              <h2 className="mt-2 text-xl font-black text-slate-950">
                Conversion Readiness
              </h2>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black ${intentDisplay.badgeClassName}`}
            >
              <span>{intentDisplay.icon}</span>
              {intentDisplay.label}
            </span>
          </div>

          <div className="mt-5 flex items-end justify-between">
            <div>
              <p className="text-4xl font-black text-slate-950">
                {intelligence.intentScore}
              </p>

              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                Intent Score
              </p>
            </div>

            <p className="text-sm font-bold text-slate-500">
              out of 100
            </p>
          </div>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all ${intentDisplay.barClassName}`}
              style={{
                width: `${intelligence.intentScore}%`,
              }}
            />
          </div>

          <div className="mt-5">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              Why
            </p>

            <ul className="mt-3 space-y-2">
              {intelligence.intentReasons.map(
                (reason) => (
                  <li
                    key={reason}
                    className="flex gap-2 text-sm leading-6 text-slate-600"
                  >
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />

                    <span>{reason}</span>
                  </li>
                ),
              )}
            </ul>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400">
                Next Best Action
              </p>

              <h2 className="mt-2 text-xl font-black">
                {intelligence.recommendedAction}
              </h2>
            </div>

            <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-black text-slate-200">
              {intelligence.confidence}% confidence
            </span>
          </div>

          <p className="mt-5 text-sm leading-6 text-slate-300">
            {intelligence.recommendationReason}
          </p>

          <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-emerald-400">
              Suggested Approach
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-200">
              {intelligence.suggestedMessage}
            </p>
          </div>

          <div className="mt-5 flex items-center gap-2 text-xs font-bold text-slate-400">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/20 text-violet-300">
              AI
            </span>

            <span>
              Rule-based recommendation — AI
              enhancement coming later
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}