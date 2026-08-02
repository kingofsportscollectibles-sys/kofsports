import { getLeadActivities } from "@/lib/growth/activity";
import { createClient } from "@/lib/supabase/server";

export type TimelineEventType =
  | "activity"
  | "membership"
  | "purchase"
  | "payment"
  | "campaign";

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

function toNumber(
  value: number | string | null | undefined,
) {
  const parsed = Number(value ?? 0);

  return Number.isFinite(parsed) ? parsed : 0;
}

function formatTitle(value: string | null) {
  if (!value) {
    return "Event";
  }

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character: string) =>
      character.toUpperCase(),
    );
}

function formatCurrency(
  value: number,
  currency = "USD",
) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(value);
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

  const campaignMembershipsQuery = supabase
    .from("growth_campaign_members")
    .select(`
      campaign_id,
      status,
      joined_at,
      contacted_at,
      replied_at,
      converted_at,
      revenue_attributed,
      notes,
      growth_campaigns (
        id,
        name,
        platform,
        campaign_type
      )
    `)
    .eq("lead_id", leadId)
    .order("joined_at", {
      ascending: false,
    });

  const [
    activities,
    membershipEventsResult,
    membershipTransactionsResult,
    ordersResult,
    campaignMembershipsResult,
  ] = await Promise.all([
    getLeadActivities(leadId),
    membershipEventsQuery,
    membershipTransactionsQuery,
    ordersQuery,
    campaignMembershipsQuery,
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

  if (campaignMembershipsResult.error) {
    console.error(
      "[CustomerTimeline] Campaign memberships query failed:",
      campaignMembershipsResult.error,
    );
  }

  const timeline: TimelineEvent[] = [];

  //
  // CRM Activities
  //

  for (const activity of activities) {
    /*
     * Campaign milestones are rendered from
     * growth_campaign_members below, so skip their generic
     * CRM activity copies to prevent duplicates.
     */
    if (activity.activityType.startsWith("campaign_")) {
      continue;
    }

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
  // Campaign Journey
  //

  for (
    const membership of
    campaignMembershipsResult.data ?? []
  ) {
    const campaignRelation =
      membership.growth_campaigns;

    const campaign = Array.isArray(campaignRelation)
      ? campaignRelation[0]
      : campaignRelation;

    const campaignName =
      campaign?.name ?? "Campaign";

    const campaignDescription = [
      campaign?.platform
        ? `Platform: ${formatTitle(
            campaign.platform,
          )}`
        : "",
      campaign?.campaign_type
        ? `Type: ${formatTitle(
            campaign.campaign_type,
          )}`
        : "",
    ]
      .filter(Boolean)
      .join(" · ");

    timeline.push({
      id: `campaign-joined-${membership.campaign_id}`,
      type: "campaign",
      title: `Joined ${campaignName}`,
      description:
        campaignDescription ||
        "Added to campaign audience.",
      occurredAt: membership.joined_at,
      icon: "📣",
      color: "indigo",
      metadata: {
        campaignId: membership.campaign_id,
        campaignStatus: membership.status,
      },
    });

    if (membership.contacted_at) {
      timeline.push({
        id: `campaign-contacted-${membership.campaign_id}`,
        type: "campaign",
        title: `Contacted through ${campaignName}`,
        description:
          membership.notes ||
          campaignDescription ||
          "Campaign outreach recorded.",
        occurredAt: membership.contacted_at,
        icon: "✉️",
        color: "indigo",
        metadata: {
          campaignId: membership.campaign_id,
          campaignStatus: "contacted",
        },
      });
    }

    if (membership.replied_at) {
      timeline.push({
        id: `campaign-replied-${membership.campaign_id}`,
        type: "campaign",
        title: `Replied to ${campaignName}`,
        description:
          membership.notes ||
          "Campaign reply recorded.",
        occurredAt: membership.replied_at,
        icon: "💬",
        color: "indigo",
        metadata: {
          campaignId: membership.campaign_id,
          campaignStatus: "replied",
        },
      });
    }

    if (membership.converted_at) {
      const revenue = toNumber(
        membership.revenue_attributed,
      );

      timeline.push({
        id: `campaign-converted-${membership.campaign_id}`,
        type: "campaign",
        title: `Converted through ${campaignName}`,
        description:
          revenue > 0
            ? `${formatCurrency(
                revenue,
              )} attributed revenue`
            : "Campaign conversion recorded.",
        occurredAt: membership.converted_at,
        icon: "🎯",
        color: "indigo",
        metadata: {
          campaignId: membership.campaign_id,
          campaignStatus: "converted",
          revenueAttributed: revenue,
        },
      });
    }
  }

  //
  // Membership Events
  //

  for (
    const event of membershipEventsResult.data ?? []
  ) {
    const membershipChange =
      event.new_membership &&
      event.previous_membership !==
        event.new_membership
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
          : event.event_type === "canceled"
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
    const amount =
      toNumber(transaction.amount) / 100;

    const description = [
      formatCurrency(
        amount,
        transaction.currency ?? "USD",
      ),
      formatTitle(transaction.membership_type),
      formatTitle(transaction.payment_status),
    ]
      .filter(Boolean)
      .join(" · ");

    timeline.push({
      id: `payment-${transaction.id}`,
      type: "payment",
      title: "Membership Payment",
      description,
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
    const total = toNumber(order.total);

    const description = [
      order.order_number
        ? `Order #${order.order_number}`
        : "Order",
      formatCurrency(total),
      formatTitle(order.status),
    ]
      .filter(Boolean)
      .join(" · ");

    timeline.push({
      id: `purchase-${order.id}`,
      type: "purchase",
      title: "Order Placed",
      description,
      occurredAt:
        order.sold_at ?? order.created_at,
      icon: "🛒",
      color: "amber",
      metadata: order,
    });
  }

  return timeline.sort(sortNewest);
}