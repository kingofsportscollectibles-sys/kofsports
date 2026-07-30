const goals = [
  {
    label: "Reply to betting posts",
    completed: 0,
    target: 25,
  },
  {
    label: "Start new conversations",
    completed: 0,
    target: 10,
  },
  {
    label: "Follow up with leads",
    completed: 0,
    target: 5,
  },
  {
    label: "Publish a free pick",
    completed: 0,
    target: 1,
  },
  {
    label: "Publish an educational post",
    completed: 0,
    target: 1,
  },
  {
    label: "Publish a short-form video",
    completed: 0,
    target: 1,
  },
];

export default function DailyMission() {
  const completed = goals.reduce((sum, goal) => sum + goal.completed, 0);
  const total = goals.reduce((sum, goal) => sum + goal.target, 0);
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-600">
            Daily Mission
          </p>

          <h3 className="mt-2 text-xl font-black text-slate-950">
            Today&apos;s Growth Plan
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Complete the daily actions that consistently grow KofSports.
          </p>
        </div>

        <div className="rounded-2xl bg-slate-950 px-5 py-3 text-white">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Progress
          </p>

          <p className="mt-1 text-2xl font-black">
            {percentage}%
          </p>
        </div>
      </div>

      <div className="p-6">
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {goals.map((goal) => {
            const goalPercentage =
              goal.target > 0
                ? Math.min(
                    Math.round((goal.completed / goal.target) * 100),
                    100,
                  )
                : 0;

            return (
              <div
                key={goal.label}
                className="rounded-xl border border-slate-200 p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-bold text-slate-800">
                    {goal.label}
                  </p>

                  <span className="shrink-0 text-sm font-black text-slate-950">
                    {goal.completed}/{goal.target}
                  </span>
                </div>

                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${goalPercentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
