import Link from "next/link";

import EmptyState from "@/components/admin/growth/shared/EmptyState";
import type { DashboardLead } from "@/lib/growth/dashboard";

type NewLeadsProps = {
  leads: DashboardLead[];
};

function formatPlatform(platform: string | null) {
  if (!platform) {
    return "Unknown source";
  }

  if (platform.toLowerCase() === "x") {
    return "X";
  }

  return platform
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function NewLeads({
  leads,
}: NewLeadsProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-600">
            Lead Queue
          </p>

          <h3 className="mt-2 text-xl font-black text-slate-950">
            New Leads
          </h3>
        </div>

        <Link
          href="/admin/growth/leads"
          className="text-sm font-bold text-emerald-700 hover:text-emerald-800"
        >
          View leads
        </Link>
      </div>

      <div className="mt-5">
        {leads.length === 0 ? (
          <EmptyState
            title="Your lead queue is empty"
            description="Once the first prospect is added, their score, status, source, and next action will appear here."
          />
        ) : (
          <div className="divide-y divide-slate-200">
            {leads.map((lead) => (
              <Link
                key={lead.id}
                href={`/admin/growth/leads?lead=${lead.id}`}
                className="flex items-center justify-between gap-4 py-4 transition first:pt-0 last:pb-0 hover:opacity-70"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-900">
                    {lead.name}
                  </p>

                  <p className="mt-1 truncate text-xs text-slate-500">
                    {lead.handle ? `@${lead.handle.replace(/^@/, "")} · ` : ""}
                    {formatPlatform(lead.platform)} ·{" "}
                    {formatStatus(lead.status)}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-lg font-black text-slate-950">
                    {lead.score}
                  </p>

                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Score
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
