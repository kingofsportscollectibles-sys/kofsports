import type { GrowthActivity } from "@/lib/growth/activity";

type ActivityItemProps = {
  activity: GrowthActivity;
};

const activityLabels: Record<string, string> = {
  note: "Note",
  dm_sent: "DM Sent",
  dm_received: "DM Received",
  tweet_reply: "Tweet Reply",
  website_visit: "Website Visit",
  trial_started: "Trial Started",
  premium_signup: "Premium Signup",
  renewal: "Renewal",
};

const activityIcons: Record<string, string> = {
  note: "📝",
  dm_sent: "📤",
  dm_received: "📥",
  tweet_reply: "💬",
  website_visit: "🌐",
  trial_started: "🚀",
  premium_signup: "⭐",
  renewal: "🔄",
};

function formatTime(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatValue(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function ActivityItem({
  activity,
}: ActivityItemProps) {
  const label =
    activityLabels[activity.activityType] ??
    formatValue(activity.activityType);

  const icon = activityIcons[activity.activityType] ?? "•";

  return (
    <div className="relative flex gap-4 pb-6 last:pb-0">
      <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-lg">
        <span aria-hidden="true">{icon}</span>
      </div>

      <div className="min-w-0 flex-1 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-semibold text-white">
              {activity.title?.trim() || label}
            </p>

            {activity.title && (
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
                {label}
              </p>
            )}
          </div>

          <time
            dateTime={activity.occurredAt}
            className="shrink-0 text-sm text-zinc-500"
          >
            {formatTime(activity.occurredAt)}
          </time>
        </div>

        {activity.description && (
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-300">
            {activity.description}
          </p>
        )}

        {(activity.platform || activity.direction) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {activity.platform && (
              <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-300">
                {formatValue(activity.platform)}
              </span>
            )}

            {activity.direction && (
              <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-300">
                {activity.direction === "outbound"
                  ? "Outgoing"
                  : activity.direction === "inbound"
                    ? "Incoming"
                    : formatValue(activity.direction)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}