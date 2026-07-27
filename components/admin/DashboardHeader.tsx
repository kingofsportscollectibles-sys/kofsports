export function DashboardHeader({ adminName }: { adminName: string }) {
  const date = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-amber-700">
          KofSports Command Center
        </span>
        <h1 className="mt-5 text-4xl font-black tracking-tight text-black sm:text-5xl">
          Welcome back, {adminName}
        </h1>
        <p className="mt-3 text-lg text-gray-600">{date}</p>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm shadow-sm">
        <p className="font-bold text-black">Founder Dashboard</p>
        <p className="mt-1 text-gray-500">Revenue, growth, retention, and operations.</p>
      </div>
    </header>
  );
}