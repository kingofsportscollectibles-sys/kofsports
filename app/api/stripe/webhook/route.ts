import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MembershipType = "one_day" | "weekly" | "monthly" | "ninety_day";

type ProfileUpdate = {
  membership: "free" | "premium";
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  stripe_price_id?: string | null;
  subscription_status?: string | null;
  membership_expires_at?: string | null;
};

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  }

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function objectId(
  value:
    | string
    | Stripe.Customer
    | Stripe.DeletedCustomer
    | Stripe.Subscription
    | null
    | undefined,
): string | null {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id;
}

function unixToIso(timestamp: number | null | undefined): string | null {
  if (!timestamp) {
    return null;
  }

  return new Date(timestamp * 1000).toISOString();
}

function isMembershipType(value: string | undefined): value is MembershipType {
  return (
    value === "one_day" ||
    value === "weekly" ||
    value === "monthly" ||
    value === "ninety_day"
  );
}

function membershipTypeFromPriceId(priceId: string | null): MembershipType | null {
  if (!priceId) {
    return null;
  }

  const prices: Array<[MembershipType, string | undefined]> = [
    ["one_day", process.env.STRIPE_PRICE_1_DAY],
    ["weekly", process.env.STRIPE_PRICE_WEEKLY],
    ["monthly", process.env.STRIPE_PRICE_MONTHLY],
    ["ninety_day", process.env.STRIPE_PRICE_90_DAY],
  ];

  const match = prices.find(([, configuredPriceId]) => {
    return configuredPriceId === priceId;
  });

  return match?.[0] ?? null;
}

function getSubscriptionPriceId(
  subscription: Stripe.Subscription,
): string | null {
  return subscription.items.data[0]?.price.id ?? null;
}

function getSubscriptionPeriodEnd(
  subscription: Stripe.Subscription,
): string | null {
  const periodEnds = subscription.items.data
    .map((item) => item.current_period_end)
    .filter((timestamp): timestamp is number => typeof timestamp === "number");

  if (periodEnds.length === 0) {
    return null;
  }

  return unixToIso(Math.max(...periodEnds));
}

function subscriptionHasPremiumAccess(status: Stripe.Subscription.Status) {
  return status === "active" || status === "trialing" || status === "past_due";
}

async function updateProfile(
  profileId: string,
  updates: ProfileUpdate,
): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", profileId);

  if (error) {
    throw new Error(`Unable to update profile ${profileId}: ${error.message}`);
  }
}

async function findProfileIdByStripeData({
  profileId,
  customerId,
  subscriptionId,
}: {
  profileId?: string | null;
  customerId?: string | null;
  subscriptionId?: string | null;
}): Promise<string | null> {
  if (profileId) {
    return profileId;
  }

  const supabase = getSupabaseAdmin();

  if (subscriptionId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("stripe_subscription_id", subscriptionId)
      .maybeSingle();

    if (error) {
      throw new Error(
        `Unable to find profile by subscription: ${error.message}`,
      );
    }

    if (data?.id) {
      return data.id;
    }
  }

  if (customerId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();

    if (error) {
      throw new Error(`Unable to find profile by customer: ${error.message}`);
    }

    if (data?.id) {
      return data.id;
    }
  }

  return null;
}

async function recordTransaction({
  eventId,
  profileId,
  customerId,
  subscriptionId,
  checkoutSessionId,
  priceId,
  amount,
  currency,
  membershipType,
  paymentStatus,
  purchasedAt,
  expiresAt,
}: {
  eventId: string;
  profileId: string;
  customerId: string | null;
  subscriptionId: string | null;
  checkoutSessionId: string | null;
  priceId: string;
  amount: number;
  currency: string;
  membershipType: MembershipType;
  paymentStatus: string;
  purchasedAt: string;
  expiresAt: string | null;
}): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("membership_transactions").insert({
    profile_id: profileId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    stripe_checkout_session_id: checkoutSessionId,
    stripe_price_id: priceId,
    stripe_event_id: eventId,
    amount,
    currency,
    membership_type: membershipType,
    payment_status: paymentStatus,
    purchased_at: purchasedAt,
    expires_at: expiresAt,
  });

  if (error && error.code !== "23505") {
    throw new Error(`Unable to record transaction: ${error.message}`);
  }
}

async function claimWebhookEvent(event: Stripe.Event): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("stripe_webhook_events").insert({
    stripe_event_id: event.id,
    event_type: event.type,
  });

  if (!error) {
    return true;
  }

  if (error.code === "23505") {
    return false;
  }

  throw new Error(`Unable to claim webhook event: ${error.message}`);
}

async function releaseWebhookEvent(eventId: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("stripe_webhook_events")
    .delete()
    .eq("stripe_event_id", eventId);

  if (error) {
    console.error("Unable to release failed webhook event:", error);
  }
}

async function syncSubscription(
  subscription: Stripe.Subscription,
): Promise<void> {
  const customerId = objectId(subscription.customer);
  const subscriptionId = subscription.id;
  const metadataProfileId = subscription.metadata.profile_id ?? null;

  const profileId = await findProfileIdByStripeData({
    profileId: metadataProfileId,
    customerId,
    subscriptionId,
  });

  if (!profileId) {
    throw new Error(
      `No KofSports profile found for subscription ${subscription.id}.`,
    );
  }

  const priceId = getSubscriptionPriceId(subscription);
  const periodEnd = getSubscriptionPeriodEnd(subscription);
  const hasAccess = subscriptionHasPremiumAccess(subscription.status);

  await updateProfile(profileId, {
    membership: hasAccess ? "premium" : "free",
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    subscription_status: subscription.status,
    membership_expires_at: periodEnd,
  });
}

async function handleCheckoutCompleted(
  event: Stripe.Event,
  session: Stripe.Checkout.Session,
): Promise<void> {
  const profileId =
    session.metadata?.profile_id ?? session.client_reference_id ?? null;

    console.log("=== CHECKOUT COMPLETED ===");
console.log({
  sessionId: session.id,
  mode: session.mode,
  paymentStatus: session.payment_status,
  profileId,
  metadata: session.metadata,
});

  if (!profileId) {
    throw new Error(`Checkout Session ${session.id} has no profile ID.`);
  }

  const customerId = objectId(session.customer);
  const metadataMembershipType = session.metadata?.membership_type;
  const metadataPriceId = session.metadata?.stripe_price_id ?? null;

  if (session.mode === "payment") {
    if (session.payment_status !== "paid") {
      console.log(
        `Ignoring unpaid Checkout Session ${session.id}: ${session.payment_status}`,
      );
      return;
    }

    const membershipType: MembershipType = isMembershipType(
      metadataMembershipType,
    )
      ? metadataMembershipType
      : "one_day";

    const priceId =
      metadataPriceId ??
      process.env.STRIPE_PRICE_1_DAY ??
      "unknown_one_day_price";

    const purchasedAt = new Date(event.created * 1000);
    const expiresAt = new Date(
      purchasedAt.getTime() + 24 * 60 * 60 * 1000,
    ).toISOString();

    console.log("Updating profile to PREMIUM:", profileId);

    await updateProfile(profileId, {
      membership: "premium",
      stripe_customer_id: customerId,
      stripe_subscription_id: null,
      stripe_price_id: priceId,
      subscription_status: "one_time_active",
      membership_expires_at: expiresAt,
    });

    console.log("Profile successfully updated.");

    await recordTransaction({
      eventId: event.id,
      profileId,
      customerId,
      subscriptionId: null,
      checkoutSessionId: session.id,
      priceId,
      amount: session.amount_total ?? 0,
      currency: session.currency ?? "usd",
      membershipType,
      paymentStatus: session.payment_status,
      purchasedAt: purchasedAt.toISOString(),
      expiresAt,
    });

    return;
  }

  if (session.mode === "subscription") {
    const subscriptionId = objectId(session.subscription);

    if (!subscriptionId) {
      throw new Error(
        `Subscription Checkout Session ${session.id} has no subscription.`,
      );
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    await syncSubscription(subscription);

    const priceId =
      getSubscriptionPriceId(subscription) ??
      metadataPriceId ??
      "unknown_subscription_price";

    const membershipType =
      (isMembershipType(metadataMembershipType)
        ? metadataMembershipType
        : null) ??
      membershipTypeFromPriceId(priceId) ??
      "monthly";

    await recordTransaction({
      eventId: event.id,
      profileId,
      customerId: objectId(subscription.customer),
      subscriptionId: subscription.id,
      checkoutSessionId: session.id,
      priceId,
      amount: session.amount_total ?? 0,
      currency: session.currency ?? "usd",
      membershipType,
      paymentStatus: session.payment_status,
      purchasedAt: new Date(event.created * 1000).toISOString(),
      expiresAt: getSubscriptionPeriodEnd(subscription),
    });
  }
}

async function getInvoiceSubscriptionId(
  invoice: Stripe.Invoice,
): Promise<string | null> {
  const parent = invoice.parent;

  if (
    parent?.type === "subscription_details" &&
    parent.subscription_details?.subscription
  ) {
    return objectId(parent.subscription_details.subscription);
  }

  return null;
}

async function handleInvoicePaid(
  event: Stripe.Event,
  invoice: Stripe.Invoice,
): Promise<void> {
  const subscriptionId = await getInvoiceSubscriptionId(invoice);

  if (!subscriptionId) {
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  await syncSubscription(subscription);

  /*
   * The initial subscription payment is already recorded by
   * checkout.session.completed. Only record later renewal invoices here.
   */
  if (invoice.billing_reason === "subscription_create") {
    return;
  }

  const profileId = await findProfileIdByStripeData({
    profileId: subscription.metadata.profile_id ?? null,
    customerId: objectId(subscription.customer),
    subscriptionId: subscription.id,
  });

  if (!profileId) {
    throw new Error(`No profile found for paid invoice ${invoice.id}.`);
  }

  const priceId = getSubscriptionPriceId(subscription);

  if (!priceId) {
    throw new Error(`No Stripe Price ID found for invoice ${invoice.id}.`);
  }

  const membershipType =
    membershipTypeFromPriceId(priceId) ??
    (isMembershipType(subscription.metadata.membership_type)
      ? subscription.metadata.membership_type
      : "monthly");

  await recordTransaction({
    eventId: event.id,
    profileId,
    customerId: objectId(subscription.customer),
    subscriptionId: subscription.id,
    checkoutSessionId: null,
    priceId,
    amount: invoice.amount_paid,
    currency: invoice.currency,
    membershipType,
    paymentStatus: invoice.status ?? "paid",
    purchasedAt: new Date(event.created * 1000).toISOString(),
    expiresAt: getSubscriptionPeriodEnd(subscription),
  });
}

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
): Promise<void> {
  const subscriptionId = await getInvoiceSubscriptionId(invoice);

  if (!subscriptionId) {
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const customerId = objectId(subscription.customer);

  const profileId = await findProfileIdByStripeData({
    profileId: subscription.metadata.profile_id ?? null,
    customerId,
    subscriptionId,
  });

  if (!profileId) {
    throw new Error(`No profile found for failed invoice ${invoice.id}.`);
  }

  await updateProfile(profileId, {
    membership: "premium",
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: getSubscriptionPriceId(subscription),
    subscription_status: subscription.status,
    membership_expires_at: getSubscriptionPeriodEnd(subscription),
  });
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
): Promise<void> {
  const profileId = await findProfileIdByStripeData({
    profileId: subscription.metadata.profile_id ?? null,
    customerId: objectId(subscription.customer),
    subscriptionId: subscription.id,
  });

  if (!profileId) {
    throw new Error(
      `No KofSports profile found for deleted subscription ${subscription.id}.`,
    );
  }

  await updateProfile(profileId, {
    membership: "free",
    stripe_customer_id: objectId(subscription.customer),
    stripe_subscription_id: subscription.id,
    stripe_price_id: getSubscriptionPriceId(subscription),
    subscription_status: subscription.status,
    membership_expires_at:
      getSubscriptionPeriodEnd(subscription) ?? new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("Missing STRIPE_WEBHOOK_SECRET.");

    return NextResponse.json(
      { error: "Webhook is not configured." },
      { status: 500 },
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature." },
      { status: 400 },
    );
  }

  const rawBody = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);

    return NextResponse.json(
      { error: "Invalid webhook signature." },
      { status: 400 },
    );
  }

  let claimed = false;

  try {
    claimed = await claimWebhookEvent(event);

    if (!claimed) {
      return NextResponse.json({
        received: true,
        duplicate: true,
      });
    }

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event,
          event.data.object as Stripe.Checkout.Session,
        );
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;

      case "invoice.paid":
        await handleInvoicePaid(
          event,
          event.data.object as Stripe.Invoice,
        );
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(
          event.data.object as Stripe.Invoice,
        );
        break;

      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error(`Stripe webhook failed for ${event.id}:`, error);

    if (claimed) {
      await releaseWebhookEvent(event.id);
    }

    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 },
    );
  }
}