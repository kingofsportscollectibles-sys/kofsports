"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

type AccountFormProps = {
  userId: string;
  email: string;
  initialDisplayName: string;
};

export default function AccountForm({
  userId,
  email,
  initialDisplayName,
}: AccountFormProps) {
  const supabase = createClient();

  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setIsError(false);

    const cleanedDisplayName = displayName.trim();

    if (!cleanedDisplayName) {
      setIsError(true);
      setMessage("Please enter a display name.");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: cleanedDisplayName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      setIsError(true);
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setDisplayName(cleanedDisplayName);
    setMessage("Your account information has been updated.");
    setLoading(false);
  }

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
          Profile
        </p>

        <h2 className="mt-3 text-2xl font-bold text-black">
          Personal information
        </h2>

        <p className="mt-2 text-sm leading-6 text-gray-600">
          This information is used to personalize your KofSports member
          experience.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <label
            htmlFor="display-name"
            className="mb-2 block text-sm font-semibold text-gray-900"
          >
            Display name
          </label>

          <input
            id="display-name"
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            maxLength={80}
            required
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
            placeholder="Enter your name"
          />
        </div>

        <div>
          <label
            htmlFor="account-email"
            className="mb-2 block text-sm font-semibold text-gray-900"
          >
            Email address
          </label>

          <input
            id="account-email"
            type="email"
            value={email}
            disabled
            className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-gray-500"
          />

          <p className="mt-2 text-xs leading-5 text-gray-500">
            Email changes are not currently available from the member
            dashboard.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-black px-6 py-3 font-bold text-white transition hover:bg-amber-500 hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Saving changes..." : "Save Changes"}
        </button>
      </form>

      {message && (
        <div
          role="status"
          className={`mt-6 rounded-xl border px-4 py-3 text-sm ${
            isError
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-green-200 bg-green-50 text-green-700"
          }`}
        >
          {message}
        </div>
      )}
    </section>
  );
}