import FollowUpScheduler from "@/components/admin/growth/lead-workspace/FollowUpScheduler";
import type { GrowthActivity } from "@/lib/growth/activity";
import type { GrowthLead } from "@/lib/growth/lead";

type LeadInsightsProps = {
  lead: GrowthLead;
  activities: GrowthActivity[];
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
        "The lead is engaged and moving in the right direction.",
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
      "This lead needs a meaningful new touchpoint.",
  };
}

export default function LeadInsights({
  lead,
  activities,
}: LeadInsightsProps) {
  const followUpStatus = getFollowUpStatus(
    lead.nextFollowUpAt,
  );

  const relationshipHealth =
    calculateRelationshipHealth(lead, activities);

  const healthDisplay = getHealthLabel(
    relationshipHealth,
  );

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
          currentFollowUpAt={lead.nextFollowUpAt}
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
          Growth OS will summarize this lead&apos;s interests,
          engagement history, objections, and recommended next
          action.
        </p>
      </section>
    </aside>
  );
}
