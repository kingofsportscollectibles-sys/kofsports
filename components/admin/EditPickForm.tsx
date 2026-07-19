"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  updatePick,
  type PickFormState,
} from "@/app/(admin)/admin/picks/actions";

type Pick = {
  id: string;
  sport: string | null;
  bet_type: string | null;
  matchup: string | null;
  selection: string;
  odds: number | null;
  units: number | null;
  confidence: number | null;
  analysis: string | null;
  game_time: string | null;
  status: string | null;
  is_published: boolean | null;
};

type EditPickFormProps = {
  pick: Pick;
};

const initialState: PickFormState = {
  error: "",
};

function toDateTimeLocalValue(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(0, 16);
}

export default function EditPickForm({ pick }: EditPickFormProps) {
  const [state, formAction, pending] = useActionState(
    updatePick,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="pick_id" value={pick.id} />

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
            defaultValue={pick.sport ?? ""}
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
            defaultValue={pick.bet_type ?? ""}
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
          defaultValue={pick.matchup ?? ""}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-black outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
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
          defaultValue={pick.selection}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-black outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
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
            defaultValue={pick.odds ?? -110}
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
            defaultValue={pick.units ?? 1}
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
            defaultValue={String(pick.confidence ?? 3)}
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
            defaultValue={toDateTimeLocalValue(pick.game_time)}
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
          defaultValue={pick.analysis ?? ""}
          className="w-full resize-y rounded-xl border border-gray-300 px-4 py-3 text-black outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
        />
      </div>

      {state.error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {state.error}
        </div>
      )}

      <div className="border-t border-gray-200 pt-6">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
          Save and visibility
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            name="action_type"
            value="save"
            disabled={pending}
            className="rounded-xl bg-black px-5 py-3 font-bold text-white transition hover:bg-amber-500 hover:text-black disabled:opacity-60"
          >
            {pending ? "Saving..." : "Save Changes"}
          </button>

          {pick.is_published ? (
            <button
              type="submit"
              name="action_type"
              value="unpublish"
              disabled={pending}
              className="rounded-xl border border-amber-300 px-5 py-3 font-bold text-amber-800 transition hover:bg-amber-100 disabled:opacity-60"
            >
              Unpublish
            </button>
          ) : (
            <button
              type="submit"
              name="action_type"
              value="publish"
              disabled={pending}
              className="rounded-xl bg-amber-500 px-5 py-3 font-bold text-black transition hover:bg-amber-400 disabled:opacity-60"
            >
              Publish
            </button>
          )}

          <Link
            href="/admin/picks"
            className="rounded-xl border border-gray-300 px-5 py-3 font-bold text-gray-700 transition hover:border-black hover:text-black"
          >
            Back to Picks
          </Link>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
          Grade Pick
        </p>

        <p className="mt-2 text-sm leading-6 text-gray-600">
          Grading automatically calculates the profit or loss based on the
          entered odds and units.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="submit"
            name="action_type"
            value="won"
            disabled={pending}
            className="rounded-xl bg-green-600 px-5 py-3 font-bold text-white transition hover:bg-green-700 disabled:opacity-60"
          >
            Grade Win
          </button>

          <button
            type="submit"
            name="action_type"
            value="lost"
            disabled={pending}
            className="rounded-xl bg-red-600 px-5 py-3 font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            Grade Loss
          </button>

          <button
            type="submit"
            name="action_type"
            value="push"
            disabled={pending}
            className="rounded-xl bg-gray-700 px-5 py-3 font-bold text-white transition hover:bg-gray-800 disabled:opacity-60"
          >
            Grade Push
          </button>

          <button
            type="submit"
            name="action_type"
            value="cancelled"
            disabled={pending}
            className="rounded-xl border border-gray-300 px-5 py-3 font-bold text-gray-700 transition hover:border-black hover:text-black disabled:opacity-60"
          >
            Cancelled
          </button>

          {pick.status !== "pending" && (
            <button
              type="submit"
              name="action_type"
              value="reset"
              disabled={pending}
              className="rounded-xl border border-amber-300 px-5 py-3 font-bold text-amber-800 transition hover:bg-amber-50 disabled:opacity-60"
            >
              Reset to Pending
            </button>
          )}
        </div>
      </div>
    </form>
  );
}