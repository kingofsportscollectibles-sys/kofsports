"use client";

import { useActionState, useEffect, useState } from "react";

import {
  updateFollowUp,
  type UpdateFollowUpState,
} from "@/app/(admin)/admin/growth/leads/[id]/actions/updateFollowUp";

type FollowUpSchedulerProps = {
  leadId: string;
  currentFollowUpAt: string | null;
};

const initialState: UpdateFollowUpState = {
  success: false,
  message: "",
};

function toDateTimeLocal(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getSuggestedFollowUp(daysFromNow: number) {
  const date = new Date();

  date.setDate(date.getDate() + daysFromNow);
  date.setHours(10, 0, 0, 0);

  return toDateTimeLocal(date);
}

function getInitialValue(value: string | null) {
  if (!value) {
    return "";
  }

  return toDateTimeLocal(new Date(value));
}

export default function FollowUpScheduler({
  leadId,
  currentFollowUpAt,
}: FollowUpSchedulerProps) {
  const boundAction = updateFollowUp.bind(null, leadId);

  const [state, formAction, isPending] = useActionState(
    boundAction,
    initialState,
  );

  const [followUpAt, setFollowUpAt] = useState(
    getInitialValue(currentFollowUpAt),
  );

  useEffect(() => {
    setFollowUpAt(getInitialValue(currentFollowUpAt));
  }, [currentFollowUpAt]);

  function applyPreset(days: number) {
    setFollowUpAt(getSuggestedFollowUp(days));
  }

  return (
    <form action={formAction} className="mt-4 space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => applyPreset(1)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          Tomorrow
        </button>

        <button
          type="button"
          onClick={() => applyPreset(3)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          3 Days
        </button>

        <button
          type="button"
          onClick={() => applyPreset(7)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          7 Days
        </button>
      </div>

      <div>
        <label
          htmlFor="nextFollowUpAt"
          className="text-xs font-black uppercase tracking-[0.16em] text-slate-400"
        >
          Custom Date
        </label>

        <input
          id="nextFollowUpAt"
          name="nextFollowUpAt"
          type="datetime-local"
          value={followUpAt}
          onChange={(event) => setFollowUpAt(event.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-400"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending || !followUpAt}
          className="flex-1 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Schedule"}
        </button>

        <button
          type="submit"
          name="nextFollowUpAt"
          value=""
          disabled={isPending || !currentFollowUpAt}
          onClick={() => setFollowUpAt("")}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Clear
        </button>
      </div>

      {state.message && (
        <p
          className={`text-sm font-medium ${
            state.success ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}