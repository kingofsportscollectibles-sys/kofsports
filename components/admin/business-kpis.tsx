type BusinessKpisProps = {
  revenueTodayInCents: number;
  currentMonthRevenueInCents: number;
  yearToDateRevenueInCents: number;
  lifetimeRevenueInCents: number;
  stripeRevenueInCents: number;
  manualRevenueInCents: number;
  activePremiumMembers: number;
  activeProMembers: number;
};

function formatCurrency(amountInCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amountInCents / 100);
}

function KpiCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>

      <p className="mt-3 text-3xl font-bold tracking-tight text-white">
        {value}
      </p>

      {detail ? (
        <p className="mt-2 text-sm text-slate-400">{detail}</p>
      ) : null}
    </div>
  );
}

export function BusinessKpis({
  revenueTodayInCents,
  currentMonthRevenueInCents,
  yearToDateRevenueInCents,
  lifetimeRevenueInCents,
  stripeRevenueInCents,
  manualRevenueInCents,
  activePremiumMembers,
  activeProMembers,
}: BusinessKpisProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Revenue Today"
        value={formatCurrency(revenueTodayInCents)}
        detail={`${formatCurrency(currentMonthRevenueInCents)} this month`}
      />

      <KpiCard
        label="Year to Date"
        value={formatCurrency(yearToDateRevenueInCents)}
        detail={`${formatCurrency(lifetimeRevenueInCents)} lifetime`}
      />

      <KpiCard
        label="Active Members"
        value={String(activePremiumMembers + activeProMembers)}
        detail={`${activePremiumMembers} Premium · ${activeProMembers} standalone Pro`}
      />

      <KpiCard
        label="Revenue Mix"
        value={formatCurrency(stripeRevenueInCents)}
        detail={`${formatCurrency(manualRevenueInCents)} manual / non-Stripe`}
      />
    </div>
  );
}
