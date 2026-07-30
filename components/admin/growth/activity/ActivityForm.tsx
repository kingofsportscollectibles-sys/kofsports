"use client";

import {
  useActionState,
  useEffect,
  useRef,
} from "react";

import {
  createActivity,
  type CreateActivityState,
} from "@/app/(admin)/admin/growth/leads/[id]/actions/createActivity";

const initialState: CreateActivityState = {
  status: "idle",
  message: "",
};

const ACTIVITY_TYPES = [
  { value: "note", label: "Note" },
  { value: "dm_sent", label: "DM Sent" },
  { value: "dm_received", label: "DM Received" },
  { value: "tweet_reply", label: "Tweet Reply" },
  { value: "website_visit", label: "Website Visit" },
  { value: "trial_started", label: "Trial Started" },
  { value: "premium_signup", label: "Premium Signup" },
  { value: "renewal", label: "Renewal" },
];

const PLATFORMS = [
  { value: "x", label: "X" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "email", label: "Email" },
  { value: "website", label: "Website" },
  { value: "other", label: "Other" },
];

type ActivityFormProps = {
  leadId: string;
  onCancel: () => void;
  onSuccess: () => void;
};

export default function ActivityForm({
  leadId,
  onCancel,
  onSuccess,
}: ActivityFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const action = createActivity.bind(null, leadId);

  const [state, formAction, pending] = useActionState(
    action,
    initialState,
  );

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    formRef.current?.reset();
    onSuccess();
  }, [state.status, onSuccess]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-5"
    >
      <div>
        <label
          htmlFor="activityType"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Activity Type
        </label>

        <select
          id="activityType"
          name="activityType"
          required
          defaultValue="note"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
        >
          {ACTIVITY_TYPES.map((type) => (
            <option
              key={type.value}
              value={type.value}
            >
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="activityTitle"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Title
        </label>

        <input
          id="activityTitle"
          name="title"
          placeholder="Short summary"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      <div>
        <label
          htmlFor="activityDescription"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Description
        </label>

        <textarea
          id="activityDescription"
          name="description"
          rows={5}
          placeholder="Describe the interaction..."
          className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="activityPlatform"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Platform
          </label>

          <select
            id="activityPlatform"
            name="platform"
            defaultValue=""
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="">None</option>

            {PLATFORMS.map((platform) => (
              <option
                key={platform.value}
                value={platform.value}
              >
                {platform.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="activityDirection"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Direction
          </label>

          <select
            id="activityDirection"
            name="direction"
            defaultValue=""
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="">None</option>
            <option value="outbound">Outgoing</option>
<option value="inbound">Incoming</option>
          </select>
        </div>
      </div>

      {state.status === "error" && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          {state.message}
        </div>
      )}

      <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save Activity"}
        </button>
      </div>
    </form>
  );
}
