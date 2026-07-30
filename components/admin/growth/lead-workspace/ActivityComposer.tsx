"use client";

import ActivityModal from "../activity/ActivityModal";

type ActivityComposerProps = {
  leadId: string;
};

export default function ActivityComposer({
  leadId,
}: ActivityComposerProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-950">
            Activity
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Record every interaction with this lead.
          </p>
        </div>

        <ActivityModal leadId={leadId}>
          <button
            type="button"
            className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-400"
          >
            + Log Activity
          </button>
        </ActivityModal>
      </div>
    </div>
  );
}
