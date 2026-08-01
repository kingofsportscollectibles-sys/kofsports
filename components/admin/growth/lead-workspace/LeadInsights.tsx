import FollowUpScheduler from "@/components/admin/growth/lead-workspace/FollowUpScheduler";
import type { GrowthActivity } from "@/lib/growth/activity";
import type { Customer360 } from "@/lib/growth/customer360";
import type { GrowthLead } from "@/lib/growth/lead";

type LeadInsightsProps = {
  customer: Customer360;
};

function formatDate(value: string | null) {
  if (!value) {
    return "None scheduled";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "None scheduled";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatShortDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatLabel(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

function getFollowUpStatus(value: string | null) {
  if (!value) {
    return null;
  }

  const followUpDate = new Date(value);

  if (Number.isNaN(followUpDate.getTime())) {
    return null;
  }

  const now = new Date();

  if (followUpDate.getTime() < now.getTime()) {
    return {
      label: "Overdue",
      className: "bg-red-100 text-red-700",
    };
  }

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const followUpDay = new Date(
    followUpDate.getFullYear(),
    followUpDate.getMonth(),
    followUpDate.getDate(),
  );

  const differenceInDays = Math.round(
    (followUpDay.getTime() - today.getTime()) /
      86_400_000,
  );

  if (differenceInDays === 0) {
    return {
      label: "Today",
      className: "bg-amber-100 text-amber-700",
    };
  }

  if (differenceInDays === 1) {
    return {
      label: "Tomorrow",
      className: "bg-blue-100 text-blue-700",
    };
  }

  return {
    label: "Scheduled",
    className: "bg-emerald-100 text-emerald-700",
  };
}

function calculateRelationshipHealth(
  lead: GrowthLead,
  activities: GrowthActivity[],
) {
  let health = Math.min(lead.leadScore, 50);

  const inboundActivities = activities.filter(
    (activity) => activity.direction === "inbound",
  );

  health += Math.min(inboundActivities.length * 8, 24);

  const sevenDaysAgo =
    Date.now() - 7 * 24 * 60 * 60 * 1000;

  const recentActivities = activities.filter(
    (activity) => {
      const occurredAt = new Date(
        activity.occurredAt,
      ).getTime();

      return (
        !Number.isNaN(occurredAt) &&
        occurredAt >= sevenDaysAgo
      );
    },
  );

  health += Math.min(recentActivities.length * 4, 16);

  if (lead.nextFollowUpAt) {
    health += 5;
  }

  if (
    ["interested", "qualified"].includes(
      lead.status.toLowerCase(),
    )
  ) {
    health += 10;
  }

  if (
    ["trial", "free_trial"].includes(
      lead.status.toLowerCase(),
    )
  ) {
    health += 15;
  }

  if (
    ["premium", "renewed"].includes(
      lead.status.toLowerCase(),
    )
  ) {
    health += 20;
  }

  return Math.min(Math.max(health, 0), 100);
}

function getHealthLabel(health: number) {
  if (health >= 80) {
    return {
      label: "Excellent",
      description:
        "This relationship has strong engagement and momentum.",
    };
  }

  if (health >= 60) {
    return {
      label: "Strong",
      description:
        "The customer is engaged and moving in the right direction.",
    };
  }

  if (health >= 40) {
    return {
      label: "Developing",
      description:
        "Continue building trust through consistent outreach.",
    };
  }

  if (health >= 20) {
    return {
      label: "Early",
      description:
        "The relationship is still in its early stages.",
    };
  }

  return {
    label: "Low Engagement",
    description:
      "This contact needs a meaningful new touchpoint.",
  };
}

function getCustomerOpportunity(customer: Customer360) {
  const {
    lead,
    membership,
    revenue,
  } = customer;

  const membershipStatus =
    membership.subscriptionStatus?.toLowerCase() ?? "";

  const membershipTier =
    membership.membership?.toLowerCase() ?? "";

  const expiresAt = membership.expiresAt
    ? new Date(membership.expiresAt)
    : null;

  const daysUntilExpiration =
    expiresAt &&
    !Number.isNaN(expiresAt.getTime())
      ? Math.ceil(
          (expiresAt.getTime() - Date.now()) /
            86_400_000,
        )
      : null;

  if (
    daysUntilExpiration !== null &&
    daysUntilExpiration >= 0 &&
    daysUntilExpiration <= 7
  ) {
    return {
      title: "Renewal opportunity",
      description: `Membership expires in ${daysUntilExpiration} ${
        daysUntilExpiration === 1 ? "day" : "days"
      }. Reach out before access ends.`,
      action: "Recommend a longer-duration membership.",
      badge: "Priority",
      badgeClassName:
        "bg-amber-100 text-amber-700",
    };
  }

  if (
    membershipStatus === "canceled" ||
    membershipStatus === "cancelled" ||
    membershipStatus === "expired"
  ) {
    return {
      title: "Reactivation opportunity",
      description:
        "This customer previously purchased but no longer has active access.",
      action:
        "Offer a relevant comeback option based on prior purchase history.",
      badge: "Win Back",
      badgeClassName:
        "bg-violet-100 text-violet-700",
    };
  }

  if (
    revenue.totalOrders >= 2 &&
    !membershipTier.includes("90")
  ) {
    return {
      title: "Upgrade opportunity",
      description:
        "This customer has purchased multiple times and may benefit from a longer plan.",
      action:
        "Recommend the 90-day Premium membership.",
      badge: "Upsell",
      badgeClassName:
        "bg-emerald-100 text-emerald-700",
    };
  }

  if (revenue.totalOrders === 1) {
    return {
      title: "First-purchase follow-up",
      description:
        "This is a new paying customer. A timely follow-up can improve retention.",
      action:
        "Check satisfaction and explain the value of renewing.",
      badge: "Retention",
      badgeClassName:
        "bg-blue-100 text-blue-700",
    };
  }

  if (revenue.totalOrders === 0) {
    return {
      title: "Conversion opportunity",
      description:
        "This lead has not completed a purchase yet.",
      action:
        "Use the activity timeline and buying intent to personalize outreach.",
      badge: "Convert",
      badgeClassName:
        "bg-slate-100 text-slate-700",
    };
  }

  if (
    lead.status.toLowerCase() === "renewed" ||
    revenue.totalOrders >= 3
  ) {
    return {
      title: "Loyal customer",
      description:
        "This customer has demonstrated repeat purchase behavior.",
      action:
        "Protect the relationship and consider VIP treatment or referral outreach.",
      badge: "High Value",
      badgeClassName:
        "bg-emerald-100 text-emerald-700",
    };
  }

  return {
    title: "Maintain engagement",
    description:
      "The customer relationship is active with no immediate risk signal.",
    action:
      "Continue relevant communication and monitor purchase behavior.",
    badge: "Stable",
    badgeClassName:
      "bg-slate-100 text-slate-700",
  };
}

export default function LeadInsights({
  customer,
}: LeadInsightsProps) {
  const {
    lead,
    activities,
    membership,
    revenue,
  } = customer;

  const followUpStatus = getFollowUpStatus(
    lead.nextFollowUpAt,
  );

  const relationshipHealth =
    calculateRelationshipHealth(lead, activities);

  const healthDisplay = getHealthLabel(
    relationshipHealth,
  );

  const opportunity =
    getCustomerOpportunity(customer);

  return (
    <aside className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
              Relationship
            </p>

            <h2 className="mt-2 text-lg font-black text-slate-950">
              {healthDisplay.label}
            </h2>
          </div>

          <span className="text-2xl font-black text-slate-950">
            {relationshipHealth}%
          </span>
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{
              width: `${relationshipHealth}%`,
            }}
          />
        </div>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          {healthDisplay.description}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 px-3 py-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Activities
            </p>

            <p className="mt-1 text-xl font-black text-slate-950">
              {activities.length}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 px-3 py-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Inbound
            </p>

            <p className="mt-1 text-xl font-black text-slate-950">
              {
                activities.filter(
                  (activity) =>
                    activity.direction === "inbound",
                ).length
              }
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
              Customer Opportunity
            </p>

            <h2 className="mt-2 text-lg font-black text-slate-950">
              {opportunity.title}
            </h2>
          </div>

          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${opportunity.badgeClassName}`}
          >
            {opportunity.badge}
          </span>
        </div>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          {opportunity.description}
        </p>

        <div className="mt-4 rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">
            Recommended Action
          </p>

          <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
            {opportunity.action}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
          Customer Snapshot
        </p>

        <dl className="mt-4 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <dt className="text-sm font-semibold text-slate-500">
              Lifetime Value
            </dt>

            <dd className="text-right text-sm font-black text-slate-950">
              {formatCurrency(revenue.lifetimeValue)}
            </dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="text-sm font-semibold text-slate-500">
              Orders
            </dt>

            <dd className="text-right text-sm font-black text-slate-950">
              {revenue.totalOrders}
            </dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="text-sm font-semibold text-slate-500">
              Membership
            </dt>

            <dd className="text-right text-sm font-black text-slate-950">
              {formatLabel(membership.membership)}
            </dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="text-sm font-semibold text-slate-500">
              Subscription
            </dt>

            <dd className="text-right text-sm font-black text-slate-950">
              {formatLabel(
                membership.subscriptionStatus,
              )}
            </dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="text-sm font-semibold text-slate-500">
              Expires
            </dt>

            <dd className="text-right text-sm font-black text-slate-950">
              {formatShortDate(
                membership.expiresAt,
              )}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-950">
              Next Follow-up
            </h2>

            <p className="mt-2 text-sm font-bold text-slate-700">
              {formatDate(lead.nextFollowUpAt)}
            </p>
          </div>

          {followUpStatus ? (
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${followUpStatus.className}`}
            >
              {followUpStatus.label}
            </span>
          ) : null}
        </div>

        <FollowUpScheduler
          leadId={lead.id}
          currentFollowUpAt={
            lead.nextFollowUpAt
          }
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-950">
            AI Summary
          </h2>

          <span className="rounded-full bg-violet-100 px-2 py-1 text-xs font-bold text-violet-700">
            Soon
          </span>
        </div>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Growth OS will summarize this customer&apos;s interests,
          engagement history, purchase behavior, objections, and
          recommended next action.
        </p>
      </section>
    </aside>
  );
}
