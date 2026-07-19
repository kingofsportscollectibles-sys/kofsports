"use client";

import { useState } from "react";

import { deletePick } from "@/app/(admin)/admin/picks/actions";

type DeletePickButtonProps = {
  pickId: string;
  disabled?: boolean;
};

export default function DeletePickButton({
  pickId,
  disabled = false,
}: DeletePickButtonProps) {
  const [confirming, setConfirming] = useState(false);

  if (disabled) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
        <p className="font-bold text-gray-700">Deletion disabled</p>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          Graded picks are preserved so your historical record remains
          accurate.
        </p>
      </div>
    );
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-red-200 px-5 py-2.5 text-sm font-bold text-red-700 transition hover:border-red-600 hover:bg-red-600 hover:text-white"
      >
        Delete Pick
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
      <p className="font-bold text-red-800">Delete this pick permanently?</p>

      <p className="mt-2 text-sm leading-6 text-red-700">
        This action cannot be undone.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <form action={deletePick}>
          <input type="hidden" name="pick_id" value={pickId} />

          <button
            type="submit"
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
          >
            Yes, Delete
          </button>
        </form>

        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:border-black hover:text-black"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}