import { createClient } from "@/lib/supabase/server";

import {
  getLeadActivities,
  type GrowthActivity,
} from "@/lib/growth/activity";
import {
  getGrowthLead,
  type GrowthLead,
} from "@/lib/growth/lead";

export type RevenueSummary = {
  lifetimeValue: number;
  totalOrders: number;
  averageOrderValue: number;
  lastPurchaseAt: string | null;
};

export type MembershipSummary = {
  membership: string | null;
  subscriptionStatus: string | null;
  expiresAt: string | null;
};

export type CustomerOrder = {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  source: string | null;
  soldAt: string;
};

export type Customer360 = {
  lead: GrowthLead;
  membership: MembershipSummary;
  revenue: RevenueSummary;
  orders: CustomerOrder[];
  activities: GrowthActivity[];
};

type ProfileRow = {
  membership: string | null;
  subscription_status: string | null;
  membership_expires_at: string | null;
};

type OrderRow = {
  id: string;
  order_number: string | number | null;
  total: number | string | null;
  status: string | null;
  source: string | null;
  sold_at: string | null;
};

export async function getCustomer360(
  leadId: string,
): Promise<Customer360 | null> {
  const supabase = await createClient();

  const lead = await getGrowthLead(leadId);

  if (!lead) {
    return null;
  }

  const activitiesPromise = getLeadActivities(lead.id);

  const profilePromise = lead.profileId
    ? supabase
        .from("profiles")
        .select(`
          membership,
          subscription_status,
          membership_expires_at
        `)
        .eq("id", lead.profileId)
        .maybeSingle()
    : Promise.resolve({
        data: null,
        error: null,
      });

  const ordersPromise = supabase
    .from("orders")
    .select(`
      id,
      order_number,
      total,
      status,
      source,
      sold_at
    `)
    .eq("lead_id", lead.id)
    .order("sold_at", {
      ascending: false,
      nullsFirst: false,
    });

  const [
    activities,
    profileResult,
    ordersResult,
  ] = await Promise.all([
    activitiesPromise,
    profilePromise,
    ordersPromise,
  ]);

  if (profileResult.error) {
    console.error(
      "Unable to load Customer 360 membership:",
      profileResult.error,
    );
  }

  if (ordersResult.error) {
    console.error(
      "Unable to load Customer 360 orders:",
      ordersResult.error,
    );
  }

  const profile =
    (profileResult.data as ProfileRow | null) ?? null;

  const orderRows =
    (ordersResult.data as OrderRow[] | null) ?? [];

  const orders: CustomerOrder[] = orderRows
    .filter(
      (
        order,
      ): order is OrderRow & {
        sold_at: string;
      } => Boolean(order.sold_at),
    )
    .map((order) => ({
      id: order.id,
      orderNumber:
        order.order_number !== null
          ? String(order.order_number)
          : order.id.slice(0, 8).toUpperCase(),
      total: toNumber(order.total),
      status: order.status ?? "unknown",
      source: order.source,
      soldAt: order.sold_at,
    }));

  const lifetimeValue = roundCurrency(
    orders.reduce(
      (total, order) => total + order.total,
      0,
    ),
  );

  const totalOrders = orders.length;

  const averageOrderValue =
    totalOrders > 0
      ? roundCurrency(lifetimeValue / totalOrders)
      : 0;

  return {
    lead,
    activities,
    membership: {
      membership: profile?.membership ?? null,
      subscriptionStatus:
        profile?.subscription_status ?? null,
      expiresAt:
        profile?.membership_expires_at ?? null,
    },
    revenue: {
      lifetimeValue,
      totalOrders,
      averageOrderValue,
      lastPurchaseAt: orders[0]?.soldAt ?? null,
    },
    orders,
  };
}

function toNumber(
  value: number | string | null,
): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsedValue = Number(value);

    return Number.isFinite(parsedValue)
      ? parsedValue
      : 0;
  }

  return 0;
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}