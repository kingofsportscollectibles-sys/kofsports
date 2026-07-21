import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

function getSiteUrl(request: Request) {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL;

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.redirect(
        new URL("/login?redirect=/account", request.url),
        303,
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error(
        "Unable to retrieve Stripe customer ID:",
        profileError,
      );

      return NextResponse.redirect(
        new URL("/account?billing_error=profile", request.url),
        303,
      );
    }

    if (!profile?.stripe_customer_id) {
      return NextResponse.redirect(
        new URL("/account?billing_error=no_customer", request.url),
        303,
      );
    }

    const siteUrl = getSiteUrl(request);

    const portalSession =
      await stripe.billingPortal.sessions.create({
        customer: profile.stripe_customer_id,
        return_url: `${siteUrl}/account`,
      });

    return NextResponse.redirect(portalSession.url, 303);
  } catch (error) {
    console.error("Stripe customer portal error:", error);

    return NextResponse.redirect(
      new URL("/account?billing_error=portal", request.url),
      303,
    );
  }
}