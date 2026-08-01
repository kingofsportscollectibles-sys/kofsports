import type { Customer360 } from "@/lib/growth/customer360";
import {
  getCustomerTimeline,
  type TimelineEvent,
} from "@/lib/growth/customerTimeline";

type CustomerTimelineProps = {
  customer: Customer360;
};

const eventStyles: Record<
  TimelineEvent["type"],
  {
    badge: string;
    line: string;
  }
> = {
  activity: {
    badge:
      "bg-blue-100 text-blue-700 ring-blue-200",
    line: "bg-blue-200",
  },
  membership: {
    badge:
      "bg-violet-100 text-violet-700 ring-violet-200",
    line: "bg-violet-200",
  },
  purchase: {
    badge:
      "bg-amber-100 text-amber-700 ring-amber-200",
    line: "bg-amber-200",
  },
  payment: {
    badge:
      "bg-emerald-100 text-emerald-700 ring-emerald-200",
    line: "bg-emerald-200",
  },
};

function formatEventType(type: TimelineEvent["type"]) {
  return type
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character: string) =>
      character.toUpperCase(),
    );
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatRelativeTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  const difference = Date.now() - date.getTime();
  const absoluteDifference = Math.abs(difference);

  const minutes = Math.floor(
    absoluteDifference / 60_000,
  );

  const hours = Math.floor(
    absoluteDifference / 3_600_000,
  );

  const days = Math.floor(
    absoluteDifference / 86_400_000,
  );

  const isFuture = difference < 0;

  if (minutes < 1) {
    return isFuture ? "Soon" : "Just now";
  }

  if (minutes < 60) {
    return isFuture
      ? `In ${minutes}m`
      : `${minutes}m ago`;
  }

  if (hours < 24) {
    return isFuture
      ? `In ${hours}h`
      : `${hours}h ago`;
  }

  if (days < 30) {
    return isFuture
      ? `In ${days}d`
      : `${days}d ago`;
  }

  return formatDateTime(value);
}

function TimelineItem({
  event,
  isLast,
}: {
  event: TimelineEvent;
  isLast: boolean;
}) {
  const styles = eventStyles[event.type];

  return (
    <li className="relative flex gap-4">
      {!isLast ? (
        <div
          className={`absolute left-5 top-10 h-[calc(100%-1rem)] w-px ${styles.line}`}
          aria-hidden="true"
        />
      ) : null}

      <div
        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ring-1 ring-inset ${styles.badge}`}
      >
        <span aria-hidden="true">{event.icon}</span>
      </div>

      <div className="min-w-0 flex-1 pb-7">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-black text-slate-950">
                  {event.title}
                </h3>

                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ring-1 ring-inset ${styles.badge}`}
                >
                  {formatEventType(event.type)}
                </span>
              </div>

              {event.description ? (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {event.description}
                </p>
              ) : null}
            </div>

            <div className="shrink-0 text-left sm:text-right">
              <p className="text-xs font-bold text-slate-500">
                {formatRelativeTime(event.occurredAt)}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {formatDateTime(event.occurredAt)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

export default async function CustomerTimeline({
  customer,
}: CustomerTimelineProps) {
  const events = await getCustomerTimeline({
  leadId: customer.lead.id,
  profileId: customer.lead.profileId,
});

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
      <div className="border-b border-slate-200 bg-white px-6 py-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
              Customer History
            </p>

            <h2 className="mt-1 text-xl font-black text-slate-950">
              Unified Timeline
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              CRM activity, memberships, payments, and
              purchases in one chronological feed.
            </p>
          </div>

          <div className="rounded-xl bg-slate-100 px-4 py-2 text-center">
            <p className="text-xl font-black text-slate-950">
              {events.length}
            </p>

            <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
              Events
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 sm:px-6">
        {events.length > 0 ? (
          <ol>
            {events.map((event, index) => (
              <TimelineItem
                key={`${event.type}-${event.id}`}
                event={event}
                isLast={index === events.length - 1}
              />
            ))}
          </ol>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <div className="text-3xl" aria-hidden="true">
              🕒
            </div>

            <h3 className="mt-3 font-black text-slate-950">
              No customer history yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              CRM activity, purchases, payments, and
              membership changes will appear here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}