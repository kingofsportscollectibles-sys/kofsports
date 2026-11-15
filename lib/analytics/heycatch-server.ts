import "server-only";
import { analytics } from "@heycatch/sdk";
import type Stripe from "stripe";

analytics.init({ projectKey: "hck_pk_Iop4R8zHj3XrDsKXvt3xOdpkxpeppyKE" });

// Called only after signature verification, duplicate claiming and business handling.
export async function reportHeyCatchStripeOutcome(event: Stripe.Event) {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.profile_id ?? session.client_reference_id;
    if (!userId || session.payment_status !== "paid") return;
    const plan =
      session.metadata?.product === "kofsports_pro" ? "pro" : "premium";
    await analytics.setIdentity(userId, { plan });
    await analytics.trackEvent(
      session.mode === "subscription"
        ? "subscription_started"
        : "purchase_completed",
      {
        plan,
        amount: session.amount_total,
        currency: session.currency,
        stripe_event_id: event.id,
      },
      { userId },
    );
  } else if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata.profile_id;
    if (!userId) return;
    await analytics.setIdentity(userId, {
      subscription_status: subscription.status,
    });
  }
}
