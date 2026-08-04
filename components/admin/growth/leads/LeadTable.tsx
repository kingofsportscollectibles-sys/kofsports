"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type {
  GrowthLeadListItem,
  LeadPriorityLevel,
} from "@/lib/growth/leads";

type LeadTableProps = {
  leads: GrowthLeadListItem[];
};

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

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatFollowUpDate(value: string | null) {
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

function getPriorityStyles(
  priorityLevel: LeadPriorityLevel,
) {
  switch (priorityLevel) {
    case "hot":
      return {
        label: "Hot",
        icon: "🔥",
        className:
          "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
      };

    case "warm":
      return {
        label: "Warm",
        icon: "🟡",
        className:
          "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
      };

    case "active":
      return {
        label: "Active",
        icon: "🟢",
        className:
          "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
      };

    case "customer":
      return {
        label: "Customer",
        icon: "⭐",
        className:
          "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200",
      };

    default:
      return {
        label: "Cold",
        icon: "⚪",
        className:
          "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
      };
  }
}

function getFollowUpStyles(
  urgency: GrowthLeadListItem["followUpUrgency"],
) {
  switch (urgency) {
    case "overdue":
      return {
        label: "Overdue",
        className:
          "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
      };

    case "today":
      return {
        label: "Due Today",
        className:
          "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
      };

    case "upcoming":
      return {
        label: "Scheduled",
        className:
          "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
      };

    default:
      return {
        label: "Not Scheduled",
        className:
          "bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200",
      };
  }
}

export default function LeadTable({
  leads,
}: LeadTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const statusOptions = useMemo(() => {
    return Array.from(
      new Set(
        leads
          .map((lead) => lead.status)
          .filter(
            (status): status is string =>
              Boolean(status),
          ),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    return leads.filter((lead) => {
      const matchesStatus =
        statusFilter === "all" ||
        lead.status === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableValues = [
        lead.displayName,
        lead.username,
        lead.platform,
        lead.status,
        lead.source,
        lead.priorityLevel,
        lead.followUpUrgency,
      ];

      return searchableValues.some((value) =>
        value
          ?.toLowerCase()
          .includes(normalizedSearch),
      );
    });
  }, [leads, search, statusFilter]);

  const hasActiveFilters =
    search.trim().length > 0 ||
    statusFilter !== "all";

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
  }

  if (leads.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
        <h3 className="text-base font-black text-slate-950">
          No leads yet
        </h3>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
          Add the first social prospect using the form. New
          leads will appear here immediately.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <label className="min-w-0 flex-1 space-y-1.5">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Search Leads
            </span>

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search name, username, platform, source, or priority..."
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
              <option value="all">All Statuses</option>

              {statusOptions.map((status) => (
                <option
                  key={status}
                  value={status}
                >
                  {formatText(status)}
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
              {filteredLeads.length}
            </strong>{" "}
            of{" "}
            <strong className="text-slate-950">
              {leads.length}
            </strong>{" "}
            leads
          </span>

          {statusFilter !== "all" ? (
            <span className="rounded-full bg-white px-2.5 py-1 font-black text-slate-600 ring-1 ring-slate-200">
              {formatText(statusFilter)}
            </span>
          ) : null}
        </div>
      </div>

      {filteredLeads.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <div className="text-3xl">🔍</div>

          <h3 className="mt-4 font-black text-slate-950">
            No matching leads
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Try another search term or status.
          </p>

          <button
            type="button"
            onClick={clearFilters}
            className="mt-5 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white transition hover:bg-slate-800"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-500">
                  Priority
                </th>

                <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-500">
                  Lead
                </th>

                <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-500">
                  Platform
                </th>

                <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-500">
                  Status
                </th>

                <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-500">
                  Follow Up
                </th>

                <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-wider text-slate-500">
                  Lead Score
                </th>

                <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-wider text-slate-500">
                  Priority Score
                </th>

                <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-wider text-slate-500">
                  Added
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredLeads.map((lead) => {
                const priority =
                  getPriorityStyles(
                    lead.priorityLevel,
                  );

                const followUp = getFollowUpStyles(
                  lead.followUpUrgency,
                );

                return (
                  <tr
                    key={lead.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black ${priority.className}`}
                      >
                        <span>{priority.icon}</span>
                        {priority.label}
                      </span>

                      {lead.hasRecentInboundActivity ? (
                        <p className="mt-2 text-xs font-bold text-emerald-700">
                          Recent inbound reply
                        </p>
                      ) : null}
                    </td>

                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/growth/leads/${lead.id}`}
                        className="font-black text-slate-950 transition hover:text-emerald-700"
                      >
                        {lead.displayName}
                      </Link>

                      <p className="mt-1 text-xs text-slate-500">
                        {lead.username
                          ? `@${lead.username.replace(
                              /^@/,
                              "",
                            )}`
                          : "No username"}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {formatText(lead.source)}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                      {formatText(lead.platform)}
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                        {formatText(lead.status)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${followUp.className}`}
                      >
                        {followUp.label}
                      </span>

                      <p className="mt-2 whitespace-nowrap text-xs text-slate-500">
                        {formatFollowUpDate(
                          lead.nextFollowUpAt,
                        )}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-right text-sm font-black text-slate-950">
                      {lead.score}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <span className="text-sm font-black text-slate-950">
                        {lead.priorityScore}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right text-sm text-slate-500">
                      {formatDate(lead.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
