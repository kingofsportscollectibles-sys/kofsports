import EmptyState from "@/components/admin/growth/shared/EmptyState";
import type { DashboardActivity } from "@/lib/growth/dashboard";

type RecentActivityProps = {
  activities: DashboardActivity[];
};

function formatActivityType(type: string) {
  return type
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatActivityDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function RecentActivity({
  activities,
}: RecentActivityProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-600">
          Timeline
        </p>

        <h3 className="mt-2 text-xl font-black text-slate-950">
          Recent Activity
        </h3>
      </div>

      <div className="mt-5">
        {activities.length === 0 ? (
          <EmptyState
            title="No activity recorded yet"
            description="New leads, conversations, website visits, trials, and premium conversions will populate this feed."
          />
        ) : (
          <div className="space-y-5">
            {activities.map((activity, index) => (
              <article
                key={activity.id}
                className="relative flex gap-4"
              >
                {index < activities.length - 1 ? (
                  <div className="absolute bottom-[-20px] left-[15px] top-8 w-px bg-slate-200" />
                ) : null}

                <div className="relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700">
                  {activity.type.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1 pb-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-black text-slate-900">
                      {activity.title}
                    </p>

                    <time className="shrink-0 text-xs text-slate-400">
                      {formatActivityDate(activity.occurredAt)}
                    </time>
                  </div>

                  <p className="mt-1 text-xs font-bold text-emerald-700">
                    {formatActivityType(activity.type)}
                    {activity.leadName
                      ? ` · ${activity.leadName}`
                      : ""}
                  </p>

                  {activity.description ? (
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {activity.description}
                    </p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
