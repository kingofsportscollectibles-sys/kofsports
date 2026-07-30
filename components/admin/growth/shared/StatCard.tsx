type StatCardProps = {
  label: string;
  value: string | number;
  supportingText?: string;
  trend?: string;
  tone?: "default" | "positive" | "warning";
};

const toneClasses = {
  default: "bg-slate-100 text-slate-700",
  positive: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
};

export default function StatCard({
  label,
  value,
  supportingText,
  trend,
  tone = "default",
}: StatCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-bold text-slate-600">{label}</p>

        {trend ? (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-bold ${toneClasses[tone]}`}
          >
            {trend}
          </span>
        ) : null}
      </div>

      <p className="mt-4 text-3xl font-black tracking-tight text-slate-950">
        {value}
      </p>

      {supportingText ? (
        <p className="mt-2 text-xs leading-5 text-slate-500">
          {supportingText}
        </p>
      ) : null}
    </article>
  );
}
