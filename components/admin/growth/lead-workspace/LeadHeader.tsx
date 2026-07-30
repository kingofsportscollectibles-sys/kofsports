import type { GrowthActivity } from "@/lib/growth/activity";
import type { GrowthLead } from "@/lib/growth/lead";

type LeadHeaderProps = {
  lead: GrowthLead;
  activities: GrowthActivity[];
};

type PriorityLevel =
  | "hot"
  | "warm"
  | "active"
  | "cold"
  | "customer";

function isCustomerStatus(status: string) {
  return ["premium", "member", "renewed"].includes(
    status.toLowerCase(),
  );
}

function getStartOfToday() {
  const now = new Date();

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  );
}

function getEndOfToday() {
  const now = new Date();

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  );
}

function getFollowUpPoints(nextFollowUpAt: string | null) {
  if (!nextFollowUpAt) {
    return 0;
  }

  const followUpDate = new Date(nextFollowUpAt);

  if (Number.isNaN(followUpDate.getTime())) {
    return 0;
  }

  if (followUpDate.getTime() < getStartOfToday().getTime()) {
    return 30;
  }

  if (followUpDate.getTime() <= getEndOfToday().getTime()) {
    return 15;
  }

  return 0;
}

function hasRecentInboundActivity(
  activities: GrowthActivity[],
) {
  const twentyFourHoursAgo =
    Date.now() - 24 * 60 * 60 * 1000;

  return activities.some((activity) => {
    const occurredAt = new Date(activity.occurredAt).getTime();

    return (
      activity.direction === "inbound" &&
      !Number.isNaN(occurredAt) &&
      occurredAt >= twentyFourHoursAgo
    );
  });
}

function getPriorityScore(
  lead: GrowthLead,
  activities: GrowthActivity[],
) {
  if (isCustomerStatus(lead.status)) {
    return 0;
  }

  let score = lead.leadScore;

  score += getFollowUpPoints(lead.nextFollowUpAt);

  if (hasRecentInboundActivity(activities)) {
    score += 25;
  }

  if (
    ["trial", "free_trial"].includes(
      lead.status.toLowerCase(),
    )
  ) {
    score += 20;
  }

  if (lead.lastContactAt) {
    const lastContactDate = new Date(
      lead.lastContactAt,
    ).getTime();

    const fourteenDaysAgo =
      Date.now() - 14 * 24 * 60 * 60 * 1000;

    if (
      !Number.isNaN(lastContactDate) &&
      lastContactDate < fourteenDaysAgo
    ) {
      score -= 20;
    }
  }

  return Math.max(score, 0);
}

function getPriorityLevel(
  score: number,
  status: string,
): PriorityLevel {
  if (isCustomerStatus(status)) {
    return "customer";
  }

  if (score >= 90) {
    return "hot";
  }

  if (score >= 50) {
    return "warm";
  }

  if (score >= 20) {
    return "active";
  }

  return "cold";
}

function getPriorityDisplay(level: PriorityLevel) {
  switch (level) {
    case "hot":
      return {
        label: "Hot Lead",
        icon: "🔥",
        className:
          "bg-red-100 text-red-700 ring-red-200",
      };

    case "warm":
      return {
        label: "Warm Lead",
        icon: "🟡",
        className:
          "bg-amber-100 text-amber-700 ring-amber-200",
      };

    case "active":
      return {
        label: "Active Lead",
        icon: "🟢",
        className:
          "bg-emerald-100 text-emerald-700 ring-emerald-200",
      };

    case "customer":
      return {
        label: "Customer",
        icon: "⭐",
        className:
          "bg-violet-100 text-violet-700 ring-violet-200",
      };

    default:
      return {
        label: "Cold Lead",
        icon: "⚪",
        className:
          "bg-slate-100 text-slate-600 ring-slate-200",
      };
  }
}

function formatText(value: string | null) {
  if (!value) {
    return "—";
  }

  if (value.toLowerCase() === "x") {
    return "X";
  }

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

function formatRelativeDate(value: string | null) {
  if (!value) {
    return "No contact yet";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  const difference = Date.now() - date.getTime();
  const minutes = Math.floor(difference / 60_000);
  const hours = Math.floor(difference / 3_600_000);
  const days = Math.floor(difference / 86_400_000);

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  if (hours < 24) {
    return `${hours}h ago`;
  }

  if (days === 1) {
    return "Yesterday";
  }

  if (days < 30) {
    return `${days}d ago`;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatFollowUp(value: string | null) {
  if (!value) {
    return "Not scheduled";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getDaysSinceAdded(createdAt: string) {
  const createdDate = new Date(createdAt);

  if (Number.isNaN(createdDate.getTime())) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(
      (Date.now() - createdDate.getTime()) / 86_400_000,
    ),
  );
}

export default function LeadHeader({
  lead,
  activities,
}: LeadHeaderProps) {
  const priorityScore = getPriorityScore(
    lead,
    activities,
  );

  const priorityLevel = getPriorityLevel(
    priorityScore,
    lead.status,
  );

  const priority = getPriorityDisplay(priorityLevel);

  const inboundReplies = activities.filter(
    (activity) => activity.direction === "inbound",
  ).length;

  const daysSinceAdded = getDaysSinceAdded(
    lead.createdAt,
  );

  return (
    <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-950 to-slate-800 px-6 py-6 text-white">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ring-1 ring-inset ${priority.className}`}
            >
              <span>{priority.icon}</span>
              {priority.label}
            </span>

            <p className="mt-4 text-xs font-black uppercase tracking-[0.22em] text-emerald-400">
              Lead 360
            </p>

            <h1 className="mt-2 text-3xl font-black">
              {lead.displayName}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-300">
              {lead.username ? (
                <span>
                  @{lead.username.replace(/^@/, "")}
                </span>
              ) : null}

              {lead.platform ? (
                <>
                  <span>•</span>
                  <span>
                    {formatText(lead.platform)}
                  </span>
                </>
              ) : null}

              {lead.status ? (
                <>
                  <span>•</span>
                  <span>
                    {formatText(lead.status)}
                  </span>
                </>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-28 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-center backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-300">
                Priority
              </p>

              <p className="mt-1 text-2xl font-black">
                {priorityScore}
              </p>
            </div>

            <div className="min-w-28 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-center backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-300">
                Lead Score
              </p>

              <p className="mt-1 text-2xl font-black">
                {lead.leadScore}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid divide-y divide-slate-200 md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
        <div className="px-5 py-4">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">
            Last Contact
          </p>

          <p className="mt-2 text-sm font-black text-slate-950">
            {formatRelativeDate(lead.lastContactAt)}
          </p>
        </div>

        <div className="px-5 py-4">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">
            Next Follow-up
          </p>

          <p className="mt-2 text-sm font-black text-slate-950">
            {formatFollowUp(lead.nextFollowUpAt)}
          </p>
        </div>

        <div className="px-5 py-4">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">
            Source
          </p>

          <p className="mt-2 text-sm font-black text-slate-950">
            {formatText(lead.source)}
          </p>
        </div>

        <div className="px-5 py-4">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">
            Recent Momentum
          </p>

          <p className="mt-2 text-sm font-black text-slate-950">
            {hasRecentInboundActivity(activities)
              ? "Inbound reply in last 24h"
              : "No recent inbound reply"}
          </p>
        </div>
      </div>

      <div className="grid border-t border-slate-200 bg-slate-50 sm:grid-cols-3">
        <div className="px-5 py-4">
          <p className="text-2xl font-black text-slate-950">
            {activities.length}
          </p>

          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
            Activities
          </p>
        </div>

        <div className="border-t border-slate-200 px-5 py-4 sm:border-l sm:border-t-0">
          <p className="text-2xl font-black text-slate-950">
            {inboundReplies}
          </p>

          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
            Inbound Replies
          </p>
        </div>

        <div className="border-t border-slate-200 px-5 py-4 sm:border-l sm:border-t-0">
          <p className="text-2xl font-black text-slate-950">
            {daysSinceAdded}
          </p>

          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
            Days Since Added
          </p>
        </div>
      </div>
    </header>
  );
}