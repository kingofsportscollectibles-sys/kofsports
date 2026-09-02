import { NextResponse } from "next/server";

import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

type PlanKey = "one_day" | "weekly" | "monthly" | "ninety_day";

type CheckoutRequestBody = {
  plan?: PlanKey;
  trial?: boolean;
  source?: string;
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

function sanitizeSource(source: string | undefined): string | null {
  if (!source) {
    return null;
  }

  const sanitized = source
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 100);

  return sanitized || null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CheckoutRequestBody;
    const plan = body.plan;
    const isTrial = body.trial === true;
    const trialSource = sanitizeSource(body.source);

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

    /*
     * The free-week offer is intentionally restricted to the
     * recurring Weekly Premium Pass.
     */
    if (isTrial && plan !== "weekly") {
      return NextResponse.json(
        { error: "The free trial is only available for Weekly Premium." },
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
      .select(
        `
          id,
          membership,
          stripe_customer_id,
          stripe_subscription_id,
          subscription_status,
          premium_trial_used_at
        `,
      )
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("Unable to load profile for Stripe Checkout:", profileError);

      return NextResponse.json(
        { error: "We could not load your KofSports profile." },
        { status: 500 },
      );
    }

    if (isTrial) {
      if (profile.premium_trial_used_at) {
        return NextResponse.json(
          {
            error:
              "This KofSports account has already used its free Premium trial.",
          },
          { status: 409 },
        );
      }

      /*
       * Don't allow an existing Premium member to use the acquisition
       * trial on top of an active Premium membership.
       */
      if (profile.membership === "premium") {
        return NextResponse.json(
          {
            error:
              "Your account already has Premium access and is not eligible for this trial.",
          },
          { status: 409 },
        );
      }

      /*
       * This also guards against an account with an existing Stripe
       * subscription that may not currently be reflected as Premium.
       */
      if (
        profile.stripe_subscription_id &&
        profile.subscription_status &&
        ["active", "trialing", "past_due"].includes(
          profile.subscription_status,
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Your account already has an active Premium subscription.",
          },
          { status: 409 },
        );
      }
    }

    const siteUrl = getSiteUrl(request);

    const metadata: Record<string, string> = {
      profile_id: profile.id,
      user_id: user.id,
      membership_type: planConfiguration.membershipType,
      stripe_price_id: planConfiguration.priceId,
    };

    if (isTrial) {
      metadata.is_free_trial = "true";
      metadata.trial_days = "7";

      if (trialSource) {
        metadata.trial_source = trialSource;
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: planConfiguration.mode,
      line_items: [
        {
          price: planConfiguration.priceId,
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: isTrial
        ? `${siteUrl}/free-week?checkout=canceled${
            trialSource
              ? `&source=${encodeURIComponent(trialSource)}`
              : ""
          }`
        : `${siteUrl}/plans?checkout=canceled`,
      customer: profile.stripe_customer_id ?? undefined,
      customer_email: profile.stripe_customer_id
        ? undefined
        : user.email ?? undefined,
      client_reference_id: profile.id,
      metadata,
      allow_promotion_codes: !isTrial,
      ...(planConfiguration.mode === "subscription"
        ? {
            subscription_data: {
              metadata,
              ...(isTrial
                ? {
                    trial_period_days: 7,
                  }
                : {}),
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