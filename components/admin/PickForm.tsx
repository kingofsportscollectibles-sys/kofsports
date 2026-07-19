"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  createPick,
  type PickFormState,
} from "@/app/(admin)/admin/picks/actions";

const initialState: PickFormState = {
  error: "",
};

export default function PickForm() {
  const [state, formAction, pending] = useActionState(
    createPick,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor="sport"
            className="mb-2 block text-sm font-semibold text-gray-900"
          >
            Sport
          </label>

          <select
            id="sport"
            name="sport"
            required
            defaultValue=""
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
          >
            <option value="" disabled>
              Select a sport
            </option>
            <option value="MLB">MLB</option>
            <option value="NFL">NFL</option>
            <option value="NBA">NBA</option>
            <option value="NHL">NHL</option>
            <option value="NCAAF">College Football</option>
            <option value="NCAAB">College Basketball</option>
            <option value="Golf">Golf</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="bet_type"
            className="mb-2 block text-sm font-semibold text-gray-900"
          >
            Bet type
          </label>

          <select
            id="bet_type"
            name="bet_type"
            required
            defaultValue=""
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
          >
            <option value="" disabled>
              Select a bet type
            </option>
            <option value="Moneyline">Moneyline</option>
            <option value="Spread">Spread</option>
            <option value="Total">Total</option>
            <option value="Player Prop">Player Prop</option>
            <option value="Team Prop">Team Prop</option>
            <option value="Futures">Futures</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="matchup"
          className="mb-2 block text-sm font-semibold text-gray-900"
        >
          Matchup
        </label>

        <input
          id="matchup"
          name="matchup"
          type="text"
          required
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-black outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
          placeholder="Example: Yankees at Red Sox"
        />
      </div>

      <div>
        <label
          htmlFor="selection"
          className="mb-2 block text-sm font-semibold text-gray-900"
        >
          Selection
        </label>

        <input
          id="selection"
          name="selection"
          type="text"
          required
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-black outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
          placeholder="Example: Yankees -1.5"
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-4">
        <div>
          <label
            htmlFor="odds"
            className="mb-2 block text-sm font-semibold text-gray-900"
          >
            American odds
          </label>

          <input
            id="odds"
            name="odds"
            type="number"
            required
            defaultValue="-110"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-black outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
          />
        </div>

        <div>
          <label
            htmlFor="units"
            className="mb-2 block text-sm font-semibold text-gray-900"
          >
            Units
          </label>

          <input
            id="units"
            name="units"
            type="number"
            min="0.1"
            step="0.1"
            required
            defaultValue="1"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-black outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
          />
        </div>

        <div>
          <label
            htmlFor="confidence"
            className="mb-2 block text-sm font-semibold text-gray-900"
          >
            Confidence
          </label>

          <select
            id="confidence"
            name="confidence"
            required
            defaultValue="3"
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
          >
            <option value="1">1 — Lean</option>
            <option value="2">2 — Moderate</option>
            <option value="3">3 — Strong</option>
            <option value="4">4 — High</option>
            <option value="5">5 — Best Bet</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="game_time"
            className="mb-2 block text-sm font-semibold text-gray-900"
          >
            Game time
          </label>

          <input
            id="game_time"
            name="game_time"
            type="datetime-local"
            required
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-black outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="analysis"
          className="mb-2 block text-sm font-semibold text-gray-900"
        >
          Member analysis
        </label>

        <textarea
          id="analysis"
          name="analysis"
          rows={7}
          className="w-full resize-y rounded-xl border border-gray-300 px-4 py-3 text-black outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
          placeholder="Explain the reasoning behind the selection..."
        />
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <input
          name="is_published"
          type="checkbox"
          className="mt-1 h-4 w-4 accent-amber-600"
        />

        <span>
          <span className="block font-bold text-gray-900">
            Publish immediately
          </span>

          <span className="mt-1 block text-sm leading-6 text-gray-600">
            Leave unchecked to save this selection as an unpublished draft.
          </span>
        </span>
      </label>

      {state.error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {state.error}
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end">
        <Link
          href="/admin/picks"
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-gray-300 px-6 py-3 font-bold text-gray-700 transition hover:border-black hover:text-black"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-black px-6 py-3 font-bold text-white transition hover:bg-amber-500 hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving pick..." : "Save Pick"}
        </button>
      </div>
    </form>
  );
}