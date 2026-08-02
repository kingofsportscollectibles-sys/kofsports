"use client";

import { useActionState } from "react";

import {
  updateCampaignMemberAction,
  type UpdateCampaignMemberState,
} from "@/app/(admin)/admin/campaigns/[id]/actions";
import type { CampaignMember } from "@/lib/growth/campaigns";

import Link from "next/link";

type CampaignMemberRowProps = {
  campaignId: string;
  member: CampaignMember;
};

const initialState: UpdateCampaignMemberState = {
  status: "idle",
  message: "",
};

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

function getStatusClasses(status: string) {
  switch (status) {
    case "converted":
      return "bg-emerald-100 text-emerald-700";

    case "interested":
      return "bg-violet-100 text-violet-700";

    case "replied":
      return "bg-blue-100 text-blue-700";

    case "contacted":
      return "bg-amber-100 text-amber-700";

    case "unresponsive":
    case "opted_out":
    case "removed":
      return "bg-red-100 text-red-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function CampaignMemberRow({
  campaignId,
  member,
}: CampaignMemberRowProps) {
  const boundAction = updateCampaignMemberAction.bind(
    null,
    campaignId,
    member.leadId,
  );

  const [state, formAction, pending] = useActionState(
    boundAction,
    initialState,
  );

  return (
    <tr className="align-top">
      <td className="px-6 py-4">
    <Link
  href={`/admin/growth/leads/${member.leadId}`}
  className="font-black text-slate-950 transition hover:text-emerald-700"
>
  {member.displayName}
</Link>

        <p className="mt-1 text-xs text-slate-500">
          {member.username
            ? `@${member.username.replace(/^@/, "")}`
            : formatLabel(member.platform)}
        </p>

        <div className="mt-2 flex flex-wrap gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${getStatusClasses(
              member.campaignStatus,
            )}`}
          >
            {formatLabel(member.campaignStatus)}
          </span>

          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600">
            Lead Score {member.leadScore}
          </span>
        </div>
      </td>

      <td
        className="px-6 py-4"
        colSpan={3}
      >
        <form
          action={formAction}
          className="grid gap-3 xl:grid-cols-[180px_150px_minmax(220px,1fr)_auto]"
        >
          <label className="space-y-1.5">
            <span className="text-xs font-black uppercase tracking-wide text-slate-400">
              Status
            </span>

            <select
              name="status"
              defaultValue={member.campaignStatus}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800"
            >
              <option value="queued">Queued</option>
              <option value="contacted">
                Contacted
              </option>
              <option value="replied">Replied</option>
              <option value="interested">
                Interested
              </option>
              <option value="converted">
                Converted
              </option>
              <option value="unresponsive">
                Unresponsive
              </option>
              <option value="opted_out">
                Opted Out
              </option>
              <option value="removed">
                Removed
              </option>
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-black uppercase tracking-wide text-slate-400">
              Revenue
            </span>

            <input
              name="revenueAttributed"
              type="number"
              min="0"
              step="0.01"
              defaultValue={member.revenueAttributed.toFixed(
                2,
              )}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-800"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-black uppercase tracking-wide text-slate-400">
              Notes
            </span>

            <input
              name="notes"
              type="text"
              defaultValue={member.notes ?? ""}
              placeholder="Add campaign notes..."
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-800"
            />
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-50 xl:w-auto"
            >
              {pending ? "Saving..." : "Save"}
            </button>
          </div>

          {state.status !== "idle" ? (
            <div
              className={`xl:col-span-4 rounded-xl border px-3 py-2 text-xs font-semibold ${
                state.status === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {state.message}
            </div>
          ) : null}
        </form>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-400">
          <span>
            Current Revenue:{" "}
            {formatCurrency(member.revenueAttributed)}
          </span>

          {member.contactedAt ? (
            <span>Contacted recorded</span>
          ) : null}

          {member.repliedAt ? (
            <span>Reply recorded</span>
          ) : null}

          {member.convertedAt ? (
            <span>Conversion recorded</span>
          ) : null}
        </div>
      </td>
    </tr>
  );
}