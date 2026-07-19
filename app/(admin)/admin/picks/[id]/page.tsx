import { notFound } from "next/navigation";

import DeletePickButton from "@/components/admin/DeletePickButton";
import EditPickForm from "@/components/admin/EditPickForm";
import { createClient } from "@/lib/supabase/server";

type EditPickPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    updated?: string;
    delete_error?: string;
  }>;
};

function formatProfitLoss(value: number | null) {
  if (value === null) {
    return "Not graded";
  }

  if (value > 0) {
    return `+${value.toFixed(2)} units`;
  }

  return `${value.toFixed(2)} units`;
}

export default async function EditPickPage({
  params,
  searchParams,
}: EditPickPageProps) {
  const { id } = await params;
  const query = await searchParams;

  const supabase = await createClient();

  const { data: pick, error } = await supabase
    .from("vip_picks")
    .select(
      `
        id,
        sport,
        bet_type,
        matchup,
        selection,
        odds,
        units,
        confidence,
        analysis,
        game_time,
        status,
        profit_loss,
        is_published,
        published_at
      `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !pick) {
    notFound();
  }

  const isGraded = pick.status !== "pending";

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="inline-flex rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-amber-700">
            Manage Pick
          </span>

          <h1 className="mt-5 text-4xl font-black tracking-tight text-black sm:text-5xl">
            {pick.selection}
          </h1>

          <p className="mt-3 text-lg text-gray-600">
            {pick.matchup}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span
            className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide ${
              pick.is_published
                ? "bg-green-50 text-green-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            {pick.is_published ? "Published" : "Draft"}
          </span>

          <span className="rounded-full bg-gray-100 px-4 py-2 text-xs font-bold uppercase tracking-wide text-gray-700">
            {pick.status}
          </span>
        </div>
      </div>

      {query.updated === "true" && (
        <div className="mt-8 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          Pick updated successfully.
        </div>
      )}

      {query.delete_error === "graded" && (
        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          Graded picks cannot be deleted because they are part of your
          performance history.
        </div>
      )}

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_280px]">
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <EditPickForm pick={pick} />
        </section>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
              Performance
            </p>

            <p className="mt-4 text-2xl font-black text-black">
              {formatProfitLoss(pick.profit_loss)}
            </p>

            <p className="mt-2 text-sm capitalize text-gray-500">
              Current status: {pick.status}
            </p>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
              Confidence
            </p>

            <p className="mt-4 text-2xl font-black text-black">
              {pick.confidence ?? 3}/5
            </p>

            <p className="mt-2 text-sm text-gray-500">
              {pick.bet_type ?? "Bet type not set"}
            </p>
          </section>

          <section className="rounded-3xl border border-red-100 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-700">
              Danger Zone
            </p>

            <div className="mt-4">
              <DeletePickButton
                pickId={pick.id}
                disabled={isGraded}
              />
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}