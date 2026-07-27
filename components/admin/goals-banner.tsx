import { GoalsEditor } from "@/components/admin/goals-editor";

type Goal = {
  label: string;
  current: number;
  target: number;
  displayCurrent?: string;
  displayTarget?: string;
};

type GoalsBannerProps = {
  goals: Goal[];
  premiumMembersGoal: number;
  monthlyRevenueGoalInCents: number;
  paidSignupsGoal: number;
};

function clamp(value: number) {
  return Math.min(Math.max(value, 0), 100);
}

export function GoalsBanner({
  goals,
  premiumMembersGoal,
  monthlyRevenueGoalInCents,
  paidSignupsGoal,
}: GoalsBannerProps) {
  return (
    <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
            Monthly Goals
          </p>

          <h2 className="mt-3 text-2xl font-bold text-black">
            Keep the business moving
          </h2>
        </div>

        <GoalsEditor
          premiumMembersGoal={premiumMembersGoal}
          monthlyRevenueGoalInCents={monthlyRevenueGoalInCents}
          paidSignupsGoal={paidSignupsGoal}
        />
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {goals.map((goal) => {
          const percent =
            goal.target > 0
              ? clamp((goal.current / goal.target) * 100)
              : 0;

          return (
            <div
              key={goal.label}
              className="rounded-2xl border border-amber-200 bg-white p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <p className="font-bold text-black">{goal.label}</p>

                <p className="text-sm font-semibold text-gray-600">
                  {goal.displayCurrent ??
                    goal.current.toLocaleString("en-US")}{" "}
                  /{" "}
                  {goal.displayTarget ??
                    goal.target.toLocaleString("en-US")}
                </p>
              </div>

              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-amber-500"
                  style={{ width: `${percent}%` }}
                />
              </div>

              <p className="mt-2 text-xs font-semibold text-gray-500">
                {percent.toFixed(0)}% complete
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
