import type { FunnelStage } from "@/lib/admin/dashboard";

export function MarketingFunnel({ stages }: { stages: FunnelStage[] }) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
        Conversion Funnel
      </p>
      <h2 className="mt-3 text-2xl font-bold text-black">Visitor to Premium</h2>

      <div className="mt-7 space-y-3">
        {stages.map((stage, index) => (
          <div key={stage.label}>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <p className="font-bold text-black">{stage.label}</p>
                <p className="text-xl font-black text-black">
                  {stage.value === null ? "—" : stage.value.toLocaleString("en-US")}
                </p>
              </div>
              {stage.note ? <p className="mt-2 text-xs leading-5 text-gray-500">{stage.note}</p> : null}
            </div>
            {index < stages.length - 1 ? (
              <div className="py-1 text-center text-gray-300">↓</div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
