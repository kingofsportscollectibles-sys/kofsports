"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  type NotificationPreferenceState,
  updateNotificationPreferences,
} from "@/app/(member)/account/actions";

type NotificationPreferencesFormProps = {
  initialEmailEnabled: boolean;
  isPremiumMember: boolean;
};

const initialState: NotificationPreferenceState = {
  success: false,
  message: "",
};

export default function NotificationPreferencesForm({
  initialEmailEnabled,
  isPremiumMember,
}: NotificationPreferencesFormProps) {
  const [state, formAction] = useActionState(
    updateNotificationPreferences,
    initialState,
  );

  if (!isPremiumMember) {
    return (
      <section className="rounded-3xl border border-gray-200 bg-white p-6 text-black shadow-sm">
        <h2 className="font-bold text-black">Notifications</h2>

        <p className="mt-3 text-sm text-gray-500">
          Premium Pick alerts are available to active Premium members.
        </p>

        <a
          href="/plans"
          className="mt-5 block w-full rounded-xl bg-amber-500 py-3 text-center font-semibold text-black transition hover:bg-amber-400"
        >
          View Premium Plans
        </a>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 text-black shadow-sm">
      <h2 className="font-bold text-black">Premium Pick Alerts</h2>

      <p className="mt-2 text-sm text-gray-500">
        Receive new Premium Picks automatically when they are published.
      </p>

      <form action={formAction} className="mt-5 space-y-5">
        <label className="flex cursor-pointer items-start gap-3 text-black">
          <input
            type="checkbox"
            name="email_enabled"
            defaultChecked={initialEmailEnabled}
            className="mt-1 h-4 w-4 rounded border-gray-300"
          />

          <span>
            <span className="block font-semibold">Email Premium Picks</span>

            <span className="mt-1 block text-xs leading-5 text-gray-500">
              Send newly published Premium Picks to your account email.
            </span>
          </span>
        </label>

        <div className="border-t border-gray-100 pt-4">
          <label className="flex items-start gap-3 text-gray-400">
            <input
              type="checkbox"
              disabled
              className="mt-1 h-4 w-4 rounded border-gray-300"
            />

            <span>
              <span className="block font-semibold">SMS Alerts</span>

              <span className="mt-1 block text-xs">Coming soon</span>
            </span>
          </label>
        </div>

        <SaveButton />

        {state.message ? (
          <p
            className={`text-sm ${
              state.success ? "text-green-700" : "text-red-700"
            }`}
          >
            {state.message}
          </p>
        ) : null}
      </form>
    </section>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-black py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving..." : "Save Alert Preferences"}
    </button>
  );
}