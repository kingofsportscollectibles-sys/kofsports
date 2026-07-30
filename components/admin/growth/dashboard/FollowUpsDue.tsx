import Link from "next/link";

import EmptyState from "@/components/admin/growth/shared/EmptyState";
import type { DashboardFollowUp } from "@/lib/growth/dashboard";

type FollowUpsDueProps = {
  followups: DashboardFollowUp[];
};

function formatDueDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Due soon";
  }

  const today = new Date();

  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  if (isToday) {
    return `Today at ${new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date)}`;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function FollowUpsDue({
  followups,
}: FollowUpsDueProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-600">
            Follow-Ups
          </p>

          <h3 className="mt-2 text-xl font-black text-slate-950">
            Due Now
          </h3>
        </div>

        <Link
          href="/admin/growth/tasks"
          className="text-sm font-bold text-emerald-700 hover:text-emerald-800"
        >
          View all
        </Link>
      </div>

      <div className="mt-5">
        {followups.length === 0 ? (
          <EmptyState
            title="No follow-ups due"
            description="Scheduled follow-ups will appear here so every promising conversation gets another touch."
          />
        ) : (
          <div className="divide-y divide-slate-200">
            {followups.map((followup) => (
              <div
                key={followup.id}
                className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-900">
                    {followup.title}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {followup.leadName
                      ? `${followup.leadName} · `
                      : ""}
                    {formatDueDate(followup.dueAt)}
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
                  Due
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
