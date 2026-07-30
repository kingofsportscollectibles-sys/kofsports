import type { GrowthFunnel } from "@/lib/growth/dashboard";

type FunnelMetricsProps = {
  stages: GrowthFunnel;
};

export default function FunnelMetrics({
  stages,
}: FunnelMetricsProps) {
  const funnelStages = [
    {
      label: "Discovered",
      value: stages.discovered,
    },
    {
      label: "Conversation",
      value: stages.conversation,
    },
    {
      label: "Interested",
      value: stages.interested,
    },
    {
      label: "Trial",
      value: stages.trial,
    },
    {
      label: "Premium",
      value: stages.premium,
    },
  ];

  const total = funnelStages.reduce(
    (sum, stage) => sum + stage.value,
    0,
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-600">
            Pipeline
          </p>

          <h3 className="mt-2 text-xl font-black text-slate-950">
            Growth Funnel
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Track movement from first discovery through premium membership.
          </p>
        </div>

        <p className="text-sm font-bold text-slate-500">
          {total} total {total === 1 ? "lead" : "leads"}
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-5">
        {funnelStages.map((stage, index) => {
          const percentage =
            total > 0 ? Math.round((stage.value / total) * 100) : 0;

          return (
            <div
              key={stage.label}
              className="relative rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Stage {index + 1}
              </p>

              <p className="mt-3 text-2xl font-black text-slate-950">
                {stage.value}
              </p>

              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-slate-700">
                  {stage.label}
                </p>

                <span className="text-xs font-bold text-slate-400">
                  {percentage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
