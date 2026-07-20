import { NextResponse } from "next/server";

import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

type PlanKey = "one_day" | "weekly" | "monthly" | "ninety_day";

type CheckoutRequestBody = {
  plan?: PlanKey;
};

type PlanConfiguration = {
  priceId: string;
  mode: "payment" | "subscription";
  membershipType: string;
};

function getPlanConfiguration(plan: PlanKey): PlanConfiguration {
  const configurations: Record<PlanKey, PlanConfiguration> = {
    one_day: {
      priceId: process.env.STRIPE_PRICE_1_DAY ?? "",
      mode: "payment",
      membershipType: "one_day",
    },
    weekly: {
      priceId: process.env.STRIPE_PRICE_WEEKLY ?? "",
      mode: "subscription",
      membershipType: "weekly",
    },
    monthly: {
      priceId: process.env.STRIPE_PRICE_MONTHLY ?? "",
      mode: "subscription",
      membershipType: "monthly",
    },
    ninety_day: {
      priceId: process.env.STRIPE_PRICE_90_DAY ?? "",
      mode: "subscription",
      membershipType: "ninety_day",
    },
  };

  return configurations[plan];
}

function getSiteUrl(request: Request): string {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL;

  if (configuredUrl) {
    return configuredUrl.startsWith("http")
      ? configuredUrl.replace(/\/$/, "")
      : `https://${configuredUrl.replace(/\/$/, "")}`;
  }

  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CheckoutRequestBody;
    const plan = body.plan;

    if (
      plan !== "one_day" &&
      plan !== "weekly" &&
      plan !== "monthly" &&
      plan !== "ninety_day"
    ) {
      return NextResponse.json(
        { error: "Invalid Premium Pass selection." },
        { status: 400 },
      );
    }

    const planConfiguration = getPlanConfiguration(plan);

    if (!planConfiguration.priceId) {
      console.error(`Missing Stripe Price ID for plan: ${plan}`);

      return NextResponse.json(
        { error: "This Premium Pass is not configured yet." },
        { status: 500 },
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "You must be logged in before purchasing a Premium Pass.",
        },
        { status: 401 },
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("Unable to load profile for Stripe Checkout:", profileError);

      return NextResponse.json(
        { error: "We could not load your KofSports profile." },
        { status: 500 },
      );
    }

    const siteUrl = getSiteUrl(request);

    const metadata = {
      profile_id: profile.id,
      user_id: user.id,
      membership_type: planConfiguration.membershipType,
      stripe_price_id: planConfiguration.priceId,
    };

    const session = await stripe.checkout.sessions.create({
      mode: planConfiguration.mode,
      line_items: [
        {
          price: planConfiguration.priceId,
          quantity: 1,
        },
      ],

      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/plans?checkout=canceled`,

      customer: profile.stripe_customer_id ?? undefined,
      customer_email: profile.stripe_customer_id
        ? undefined
        : user.email ?? undefined,

      client_reference_id: profile.id,
      metadata,

      allow_promotion_codes: true,

      ...(planConfiguration.mode === "subscription"
        ? {
            subscription_data: {
              metadata,
            },
          }
        : {
            payment_intent_data: {
              metadata,
            },
          }),
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error("Stripe Checkout error:", error);

    return NextResponse.json(
      { error: "Unable to start Stripe Checkout." },
      { status: 500 },
    );
  }
}