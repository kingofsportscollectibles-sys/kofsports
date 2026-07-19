import PickForm from "@/components/admin/PickForm";

export default function NewPickPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="max-w-2xl">
        <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-amber-700">
          Premium Picks
        </span>

        <h1 className="mt-5 text-4xl font-black tracking-tight text-black sm:text-5xl">
          Publish a Selection
        </h1>

        <p className="mt-4 text-lg leading-8 text-gray-600">
          Create a premium pick for members. Add the matchup, selection, odds,
          units, game time, and your analysis before publishing.
        </p>
      </div>

      <section className="mt-10 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <PickForm />
      </section>
    </main>
  );
}