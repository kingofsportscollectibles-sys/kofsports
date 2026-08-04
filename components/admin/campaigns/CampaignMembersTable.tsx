"use client";

import { useMemo, useState } from "react";

import CampaignMemberRow from "@/components/admin/campaigns/CampaignMemberRow";
import type { CampaignMember } from "@/lib/growth/campaigns";

type CampaignMembersTableProps = {
  campaignId: string;
  members: CampaignMember[];
};

const statusOptions = [
  "all",
  "queued",
  "contacted",
  "replied",
  "interested",
  "converted",
  "unresponsive",
  "opted_out",
  "removed",
] as const;

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

export default function CampaignMembersTable({
  campaignId,
  members,
}: CampaignMembersTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const filteredMembers = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    return members.filter((member) => {
      const matchesStatus =
        statusFilter === "all" ||
        member.campaignStatus === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableValues = [
        member.displayName,
        member.username,
        member.platform,
        member.campaignStatus,
        member.leadStatus,
        member.notes,
      ];

      return searchableValues.some((value) =>
        value
          ?.toLowerCase()
          .includes(normalizedSearch),
      );
    });
  }, [members, search, statusFilter]);

  const hasActiveFilters =
    search.trim().length > 0 ||
    statusFilter !== "all";

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
  }

  return (
    <>
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <label className="min-w-0 flex-1 space-y-1.5">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Search Campaign Members
            </span>

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search name, username, platform, or notes..."
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </label>

          <label className="space-y-1.5 lg:w-52">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Status
            </span>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            >
              {statusOptions.map((status) => (
                <option
                  key={status}
                  value={status}
                >
                  {formatLabel(status)}
                </option>
              ))}
            </select>
          </label>

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-100"
            >
              Clear
            </button>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
          <span>
            Showing{" "}
            <strong className="text-slate-950">
              {filteredMembers.length}
            </strong>{" "}
            of{" "}
            <strong className="text-slate-950">
              {members.length}
            </strong>{" "}
            members
          </span>

          {statusFilter !== "all" ? (
            <span className="rounded-full bg-white px-2.5 py-1 font-black text-slate-600 ring-1 ring-slate-200">
              {formatLabel(statusFilter)}
            </span>
          ) : null}
        </div>
      </div>

      {filteredMembers.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <div className="text-3xl">🔍</div>

          <h3 className="mt-4 font-black text-slate-950">
            No matching campaign members
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Try another search term or status.
          </p>

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white transition hover:bg-slate-800"
            >
              Clear Filters
            </button>
          ) : null}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                  Lead
                </th>

                <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                  Status
                </th>

                <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                  Score
                </th>

                <th className="px-6 py-3 text-right text-xs font-black uppercase tracking-wide text-slate-500">
                  Revenue
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map((member) => (
                <CampaignMemberRow
                  key={member.leadId}
                  campaignId={campaignId}
                  member={member}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}