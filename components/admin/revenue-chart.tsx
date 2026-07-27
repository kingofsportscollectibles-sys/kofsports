import type { RevenuePoint } from "@/lib/admin/dashboard";

function formatCurrency(amountInCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amountInCents / 100);
}

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const max = Math.max(...data.map((point) => point.amountInCents), 1);

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
        Revenue
      </p>
      <div className="mt-3 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-black">Last six months</h2>
          <p className="mt-2 text-sm text-gray-500">Successful live payments only.</p>
        </div>
      </div>

      <div className="mt-8 grid h-64 grid-cols-6 items-end gap-3 sm:gap-5">
        {data.map((point) => {
          const height = Math.max((point.amountInCents / max) * 100, 4);
          return (
            <div key={point.label} className="flex h-full flex-col justify-end gap-3">
              <div className="text-center text-xs font-semibold text-gray-500">
                {formatCurrency(point.amountInCents)}
              </div>
              <div className="flex h-full items-end rounded-2xl bg-gray-50 p-1.5">
                <div
                  className="w-full rounded-xl bg-gradient-to-t from-amber-600 to-amber-300"
                  style={{ height: `${height}%` }}
                />
              </div>
              <p className="text-center text-sm font-bold text-gray-700">{point.label}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
