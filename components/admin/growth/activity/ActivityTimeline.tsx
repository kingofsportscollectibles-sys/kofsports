import ActivityItem from "@/components/admin/growth/activity/ActivityItem";
import type { GrowthActivity } from "@/lib/growth/activity";

type ActivityTimelineProps = {
  activities: GrowthActivity[];
};

type ActivityGroup = {
  key: string;
  label: string;
  activities: GrowthActivity[];
};

function getDateKey(date: string) {
  const value = new Date(date);

  return [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, "0"),
    String(value.getDate()).padStart(2, "0"),
  ].join("-");
}

function getDateLabel(date: string) {
  const activityDate = new Date(date);
  const today = new Date();

  const activityDay = new Date(
    activityDate.getFullYear(),
    activityDate.getMonth(),
    activityDate.getDate(),
  );

  const currentDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const differenceInDays = Math.round(
    (currentDay.getTime() - activityDay.getTime()) / 86_400_000,
  );

  if (differenceInDays === 0) {
    return "Today";
  }

  if (differenceInDays === 1) {
    return "Yesterday";
  }

  const sameYear = activityDate.getFullYear() === today.getFullYear();

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(activityDate);
}

function groupActivities(activities: GrowthActivity[]): ActivityGroup[] {
  const groups = new Map<string, ActivityGroup>();

  for (const activity of activities) {
    const key = getDateKey(activity.occurredAt);

    const existingGroup = groups.get(key);

    if (existingGroup) {
      existingGroup.activities.push(activity);
      continue;
    }

    groups.set(key, {
      key,
      label: getDateLabel(activity.occurredAt),
      activities: [activity],
    });
  }

  return Array.from(groups.values());
}

export default function ActivityTimeline({
  activities,
}: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Activity Timeline
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Interactions and lead activity will appear here.
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-dashed border-zinc-700 px-6 py-10 text-center">
          <div className="text-2xl" aria-hidden="true">
            🗂️
          </div>

          <p className="mt-3 font-medium text-zinc-300">
            No activity logged yet
          </p>

          <p className="mt-1 text-sm text-zinc-500">
            Log a note, message, website visit, trial, or conversion to begin
            building this lead&apos;s history.
          </p>
        </div>
      </section>
    );
  }

  const groups = groupActivities(activities);

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Activity Timeline
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            {activities.length}{" "}
            {activities.length === 1 ? "activity" : "activities"} recorded
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-8">
        {groups.map((group) => (
          <div key={group.key}>
            <div className="mb-4 flex items-center gap-3">
              <h3 className="text-sm font-semibold text-zinc-300">
                {group.label}
              </h3>

              <div className="h-px flex-1 bg-zinc-800" />
            </div>

            <div className="relative">
              {group.activities.length > 1 && (
                <div className="absolute bottom-5 left-5 top-5 w-px bg-zinc-800" />
              )}

              {group.activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}