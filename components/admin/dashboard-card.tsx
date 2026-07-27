type DashboardCardProps = {
  label: string;
  value: string;
  description: string;
  trend?: string;
};

export function DashboardCard({
  label,
  value,
  description,
  trend,
}: DashboardCardProps) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
          {label}
        </p>
        {trend ? (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
            {trend}
          </span>
        ) : null}
      </div>
      <p className="mt-4 text-4xl font-black tracking-tight text-black">{value}</p>
      <p className="mt-3 text-sm leading-6 text-gray-500">{description}</p>
    </section>
  );
}
