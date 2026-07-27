import type { MemberGrowthPoint } from "@/lib/admin/dashboard";

export function MemberGrowthChart({ data }: { data: MemberGrowthPoint[] }) {
  const max = Math.max(...data.map((point) => point.members), 1);

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Member Growth</p>
      <h2 className="mt-3 text-2xl font-bold text-black">Premium members by month</h2>
      <p className="mt-2 text-sm text-gray-500">Unique paying members recorded each month.</p>

      <div className="mt-8 grid h-64 grid-cols-6 items-end gap-3 sm:gap-5">
        {data.map((point) => {
          const height = Math.max((point.members / max) * 100, 4);
          return (
            <div key={point.label} className="flex h-full flex-col justify-end gap-3">
              <p className="text-center text-xs font-semibold text-gray-500">{point.members}</p>
              <div className="flex h-full items-end rounded-2xl bg-gray-50 p-1.5">
                <div className="w-full rounded-xl bg-gradient-to-t from-black to-gray-500" style={{ height: `${height}%` }} />
              </div>
              <p className="text-center text-sm font-bold text-gray-700">{point.label}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
