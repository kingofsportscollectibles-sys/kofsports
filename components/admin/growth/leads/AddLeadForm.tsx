"use client";

import {
  useActionState,
  useEffect,
  useRef,
} from "react";
import { useFormStatus } from "react-dom";

import {
  addLeadAction,
  type AddLeadState,
} from "@/app/(admin)/admin/growth/leads/actions/addLead";

const initialAddLeadState: AddLeadState = {
  status: "idle",
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Adding Lead..." : "Add Lead"}
    </button>
  );
}

export default function AddLeadForm() {
  const [state, formAction] = useActionState(
    addLeadAction,
    initialAddLeadState,
  );

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="border-b border-slate-200 p-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-600">
          New Prospect
        </p>

        <h3 className="mt-2 text-xl font-black text-slate-950">
          Add a Lead
        </h3>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          Save someone you discover through social media, the website,
          referrals, or direct outreach.
        </p>
      </div>

      <div className="space-y-5 p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-bold text-slate-700">
              Display Name
            </span>

            <input
              name="displayName"
              type="text"
              placeholder="John Smith"
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />

            {state.fieldErrors?.displayName ? (
              <span className="mt-2 block text-xs font-semibold text-red-600">
                {state.fieldErrors.displayName}
              </span>
            ) : null}
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">
              Username or Handle
            </span>

            <input
              name="username"
              type="text"
              placeholder="@sportsbettor"
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />

            {state.fieldErrors?.username ? (
              <span className="mt-2 block text-xs font-semibold text-red-600">
                {state.fieldErrors.username}
              </span>
            ) : null}
          </label>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-bold text-slate-700">
              Platform
            </span>

            <select
              name="platform"
              defaultValue=""
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="" disabled>
                Select a platform
              </option>
              <option value="x">X</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="reddit">Reddit</option>
              <option value="email">Email</option>
              <option value="website">Website</option>
              <option value="referral">Referral</option>
              <option value="other">Other</option>
            </select>

            {state.fieldErrors?.platform ? (
              <span className="mt-2 block text-xs font-semibold text-red-600">
                {state.fieldErrors.platform}
              </span>
            ) : null}
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">
              Lead Source
            </span>

            <select
              name="source"
              defaultValue="manual"
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="manual">Manual Entry</option>
              <option value="tweet_reply">Tweet Reply</option>
              <option value="social_comment">Social Comment</option>
              <option value="direct_message">Direct Message</option>
              <option value="organic_search">Organic Search</option>
              <option value="website_signup">Website Signup</option>
              <option value="free_pick">Free Pick</option>
              <option value="referral">Referral</option>
              <option value="campaign">Campaign</option>
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-bold text-slate-700">
            Notes
          </span>

          <textarea
            name="notes"
            rows={4}
            placeholder="What did they post about? What sport do they follow? Why could they be a strong lead?"
            className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </label>

        {state.message ? (
          <div
            role="status"
            className={[
              "rounded-xl border px-4 py-3 text-sm font-semibold",
              state.status === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700",
            ].join(" ")}
          >
            {state.message}
          </div>
        ) : null}

        <div className="flex justify-end">
          <SubmitButton />
        </div>
      </div>
    </form>
  );
}
