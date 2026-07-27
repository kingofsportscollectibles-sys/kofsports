"use client";

import { useEffect, useState } from "react";

type GoalValues = {
  premiumMembersGoal: number;
  monthlyRevenueGoal: number;
  paidSignupsGoal: number;
};

type Props = {
  open: boolean;
  pending: boolean;
  defaultValues: GoalValues;
  onClose: () => void;
  onSave: (values: GoalValues) => void;
};

export function GoalsModal({
  open,
  pending,
  defaultValues,
  onClose,
  onSave,
}: Props) {
  const [premiumMembersGoal, setPremiumMembersGoal] = useState(
    defaultValues.premiumMembersGoal,
  );
  const [monthlyRevenueGoal, setMonthlyRevenueGoal] = useState(
    defaultValues.monthlyRevenueGoal,
  );
  const [paidSignupsGoal, setPaidSignupsGoal] = useState(
    defaultValues.paidSignupsGoal,
  );

  useEffect(() => {
    if (!open) return;

    setPremiumMembersGoal(defaultValues.premiumMembersGoal);
    setMonthlyRevenueGoal(defaultValues.monthlyRevenueGoal);
    setPaidSignupsGoal(defaultValues.paidSignupsGoal);
  }, [open, defaultValues]);

  useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, pending, onClose]);

  if (!open) {
    return null;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    onSave({
      premiumMembersGoal,
      monthlyRevenueGoal,
      paidSignupsGoal,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="goals-modal-title"
        className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
            Monthly Goals
          </p>

          <h2
            id="goals-modal-title"
            className="mt-2 text-2xl font-bold text-black"
          >
            Edit dashboard goals
          </h2>

          <p className="mt-2 text-sm text-gray-600">
            Update the targets for the current month.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="premium-members-goal"
              className="block text-sm font-semibold text-gray-800"
            >
              Premium members
            </label>

            <input
              id="premium-members-goal"
              type="number"
              min="0"
              step="1"
              required
              value={premiumMembersGoal}
              onChange={(event) =>
                setPremiumMembersGoal(Number(event.target.value))
              }
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-black outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
            />
          </div>

          <div>
            <label
              htmlFor="monthly-revenue-goal"
              className="block text-sm font-semibold text-gray-800"
            >
              Monthly revenue
            </label>

            <div className="relative mt-2">
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-gray-500">
                $
              </span>

              <input
                id="monthly-revenue-goal"
                type="number"
                min="0"
                step="1"
                required
                value={monthlyRevenueGoal}
                onChange={(event) =>
                  setMonthlyRevenueGoal(Number(event.target.value))
                }
                className="w-full rounded-xl border border-gray-300 py-3 pl-8 pr-4 text-black outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="paid-signups-goal"
              className="block text-sm font-semibold text-gray-800"
            >
              Paid signups
            </label>

            <input
              id="paid-signups-goal"
              type="number"
              min="0"
              step="1"
              required
              value={paidSignupsGoal}
              onChange={(event) =>
                setPaidSignupsGoal(Number(event.target.value))
              }
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-black outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
            />
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Saving..." : "Save Goals"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}