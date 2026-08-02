"use client";

import { useActionState, useMemo, useState } from "react";

import {
  addCampaignLeadsAction,
  type AddCampaignLeadsState,
} from "@/app/(admin)/admin/campaigns/[id]/add-leads/actions";

export type CampaignLeadOption = {
  id: string;
  displayName: string;
  username: string | null;
  platform: string;
  status: string;
  leadScore: number;
  source: string | null;
};

type AddCampaignLeadsFormProps = {
  campaignId: string;
  leads: CampaignLeadOption[];
};

const initialState: AddCampaignLeadsState = {};

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

export default function AddCampaignLeadsForm({
  campaignId,
  leads,
}: AddCampaignLeadsFormProps) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<
    Set<string>
  >(new Set());

  const boundAction = addCampaignLeadsAction.bind(
    null,
    campaignId,
  );

  const [state, formAction, pending] = useActionState(
    boundAction,
    initialState,
  );

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return leads;
    }

    return leads.filter((lead) => {
      const searchableValues = [
        lead.displayName,
        lead.username,
        lead.platform,
        lead.status,
        lead.source,
      ];

      return searchableValues.some((value) =>
        value?.toLowerCase().includes(query),
      );
    });
  }, [leads, search]);

  const allFilteredSelected =
    filteredLeads.length > 0 &&
    filteredLeads.every((lead) =>
      selectedIds.has(lead.id),
    );

  function toggleLead(leadId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(leadId)) {
        next.delete(leadId);
      } else {
        next.add(leadId);
      }

      return next;
    });
  }

  function toggleAllFiltered() {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (allFilteredSelected) {
        for (const lead of filteredLeads) {
          next.delete(lead.id);
        }
      } else {
        for (const lead of filteredLeads) {
          next.add(lead.id);
        }
      }

      return next;
    });
  }

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {state.error}
        </div>
      ) : null}

      {Array.from(selectedIds).map((leadId) => (
        <input
          key={leadId}
          type="hidden"
          name="leadIds"
          value={leadId}
        />
      ))}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950">
                Select Leads
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Choose CRM leads to add to this campaign.
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 px-4 py-2 text-center">
              <p className="text-xl font-black text-emerald-800">
                {selectedIds.size}
              </p>

              <p className="text-[10px] font-black uppercase tracking-wide text-emerald-600">
                Selected
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search name, username, platform, or status..."
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />

            <button
              type="button"
              onClick={toggleAllFiltered}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            >
              {allFilteredSelected
                ? "Clear Visible"
                : "Select Visible"}
            </button>
          </div>
        </div>

        {leads.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="text-3xl">✅</div>

            <h3 className="mt-4 font-black text-slate-950">
              No available leads
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Every CRM lead is already part of this campaign.
            </p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <h3 className="font-black text-slate-950">
              No matching leads
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Try another search term.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLeads.map((lead) => {
              const selected = selectedIds.has(lead.id);

              return (
                <label
                  key={lead.id}
                  className={`flex cursor-pointer items-start gap-4 px-5 py-4 transition ${
                    selected
                      ? "bg-emerald-50"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleLead(lead.id)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-black text-slate-950">
                        {lead.displayName}
                      </p>

                      {lead.username ? (
                        <span className="text-xs font-semibold text-slate-500">
                          @{lead.username.replace(/^@/, "")}
                        </span>
                      ) : null}

                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600">
                        {formatLabel(lead.status)}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
                      <span>
                        Platform:{" "}
                        {formatLabel(lead.platform)}
                      </span>

                      <span>
                        Source: {formatLabel(lead.source)}
                      </span>

                      <span>
                        Lead Score: {lead.leadScore}
                      </span>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <a
          href={`/admin/campaigns/${campaignId}`}
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </a>

        <button
          type="submit"
          disabled={pending || selectedIds.size === 0}
          className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-6 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending
            ? "Adding Leads..."
            : `Add ${selectedIds.size} ${
                selectedIds.size === 1
                  ? "Lead"
                  : "Leads"
              }`}
        </button>
      </div>
    </form>
  );
}