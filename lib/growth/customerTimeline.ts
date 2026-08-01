import { getLeadActivities } from "@/lib/growth/activity";
import { createClient } from "@/lib/supabase/server";

export type TimelineEventType =
  | "activity"
  | "membership"
  | "purchase"
  | "payment";

export type TimelineEvent = {
  id: string;
  type: TimelineEventType;
  title: string;
  description: string;
  occurredAt: string;
  icon: string;
  color: string;
  metadata?: Record<string, unknown>;
};

type GetCustomerTimelineParams = {
  leadId: string;
  profileId: string | null;
};

function sortNewest(
  a: TimelineEvent,
  b: TimelineEvent,
) {
  return (
    new Date(b.occurredAt).getTime() -
    new Date(a.occurredAt).getTime()
  );
}

function formatTitle(value: string | null) {
  if (!value) {
    return "Membership Event";
  }

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character: string) =>
      character.toUpperCase(),
    );
}

function formatCurrency(
  amountInCents: number | null,
  currency: string | null,
) {
  const amount =
    typeof amountInCents === "number"
      ? amountInCents / 100
      : 0;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency?.toUpperCase() ?? "USD",
  }).format(amount);
}

export async function getCustomerTimeline({
  leadId,
  profileId,
}: GetCustomerTimelineParams): Promise<TimelineEvent[]> {
  const supabase = await createClient();

  const membershipEventsQuery = profileId
    ? supabase
        .from("membership_events")
        .select("*")
        .eq("user_id", profileId)
        .order("created_at", {
          ascending: false,
        })
    : Promise.resolve({
        data: [],
        error: null,
      });

  const membershipTransactionsQuery = profileId
    ? supabase
        .from("membership_transactions")
        .select("*")
        .eq("profile_id", profileId)
        .order("purchased_at", {
          ascending: false,
        })
    : Promise.resolve({
        data: [],
        error: null,
      });

  const ordersQuery = supabase
    .from("orders")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", {
      ascending: false,
    });

  const [
    activities,
    membershipEventsResult,
    membershipTransactionsResult,
    ordersResult,
  ] = await Promise.all([
    getLeadActivities(leadId),
    membershipEventsQuery,
    membershipTransactionsQuery,
    ordersQuery,
  ]);

  if (membershipEventsResult.error) {
    console.error(
      "[CustomerTimeline] Membership events query failed:",
      membershipEventsResult.error,
    );
  }

  if (membershipTransactionsResult.error) {
    console.error(
      "[CustomerTimeline] Membership transactions query failed:",
      membershipTransactionsResult.error,
    );
  }

  if (ordersResult.error) {
    console.error(
      "[CustomerTimeline] Orders query failed:",
      ordersResult.error,
    );
  }

  const timeline: TimelineEvent[] = [];

  //
  // CRM Activities
  //

  for (const activity of activities) {
    timeline.push({
      id: `activity-${activity.id}`,
      type: "activity",
      title:
        activity.title ||
        formatTitle(activity.activityType),
      description: activity.description ?? "",
      occurredAt: activity.occurredAt,
      icon:
        activity.direction === "inbound"
          ? "📩"
          : activity.direction === "outbound"
            ? "✉️"
            : "📝",
      color:
        activity.direction === "inbound"
          ? "blue"
          : activity.direction === "outbound"
            ? "emerald"
            : "slate",
      metadata: {
        platform: activity.platform,
        direction: activity.direction,
      },
    });
  }

  //
  // Membership Events
  //

  for (const event of membershipEventsResult.data ?? []) {
    const membershipChange =
      event.new_membership &&
      event.previous_membership !== event.new_membership
        ? `${formatTitle(
            event.previous_membership,
          )} → ${formatTitle(event.new_membership)}`
        : event.new_membership
          ? formatTitle(event.new_membership)
          : "";

    const statusChange =
      event.new_status &&
      event.previous_status !== event.new_status
        ? `${formatTitle(
            event.previous_status,
          )} → ${formatTitle(event.new_status)}`
        : "";

    const description = [
      membershipChange,
      statusChange,
      event.duration_days
        ? `${event.duration_days} days`
        : "",
    ]
      .filter(Boolean)
      .join(" · ");

    timeline.push({
      id: `membership-${event.id}`,
      type: "membership",
      title: formatTitle(event.event_type),
      description,
      occurredAt: event.created_at,
      icon:
        event.event_type === "renewed"
          ? "🔄"
          : event.event_type === "cancelled"
            ? "❌"
            : "⭐",
      color: "violet",
      metadata: event,
    });
  }

  //
  // Membership Transactions
  //

  for (
    const transaction of
    membershipTransactionsResult.data ?? []
  ) {
    const amount = formatCurrency(
      transaction.amount,
      transaction.currency,
    );

    const details = [
      amount,
      formatTitle(transaction.membership_type),
      formatTitle(transaction.payment_status),
    ]
      .filter(Boolean)
      .join(" · ");

    timeline.push({
      id: `payment-${transaction.id}`,
      type: "payment",
      title: "Membership Payment",
      description: details,
      occurredAt:
        transaction.purchased_at ??
        transaction.created_at,
      icon: "💳",
      color: "emerald",
      metadata: transaction,
    });
  }

  //
  // Orders
  //

  for (const order of ordersResult.data ?? []) {
    const total =
      typeof order.total === "number"
        ? new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(order.total)
        : null;

    const details = [
      order.order_number
        ? `Order #${order.order_number}`
        : "Order",
      total,
      formatTitle(order.status),
    ]
      .filter(Boolean)
      .join(" · ");

    timeline.push({
      id: `purchase-${order.id}`,
      type: "purchase",
      title: "Order Placed",
      description: details,
      occurredAt:
        order.sold_at ??
        order.created_at,
      icon: "🛒",
      color: "amber",
      metadata: order,
    });
  }

  return timeline.sort(sortNewest);
}