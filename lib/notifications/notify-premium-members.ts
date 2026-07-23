import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import { resend } from "./resend";
import {
  premiumPickEmailHtml,
  premiumPickEmailSubject,
} from "./templates/premium-pick";

type NotificationResult = {
  eligible: number;
  sent: number;
  failed: number;
  skipped: number;
};

type PremiumPick = {
  id: string;
  sport: string;
  matchup: string;
  selection: string;
  odds: number;
  units: number;
  confidence: number;
  analysis: string | null;
  game_time: string;
  is_published: boolean;
  is_premium: boolean;
};

export async function notifyPremiumMembers(
  pickId: string,
): Promise<NotificationResult> {
  const admin = createAdminClient();

  const result: NotificationResult = {
    eligible: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
  };

  try {
    const { data: pick, error: pickError } = await admin
      .from("vip_picks")
      .select(
        `
          id,
          sport,
          matchup,
          selection,
          odds,
          units,
          confidence,
          analysis,
          game_time,
          is_published,
          is_premium
        `,
      )
      .eq("id", pickId)
      .single<PremiumPick>();

    if (pickError || !pick) {
      console.error("Notification pick lookup failed:", pickError);
      return result;
    }

    if (!pick.is_published || !pick.is_premium) {
      return result;
    }

    const now = new Date().toISOString();

    const { data: preferences, error: preferencesError } = await admin
      .from("notification_preferences")
      .select("user_id")
      .eq("email_enabled", true);

    if (preferencesError) {
      console.error(
        "Notification preference lookup failed:",
        preferencesError,
      );
      return result;
    }

    const optedInUserIds = preferences?.map((item) => item.user_id) ?? [];

    if (optedInUserIds.length === 0) {
      return result;
    }

    const { data: profiles, error: profilesError } = await admin
      .from("profiles")
      .select(
        `
          id,
          membership,
          subscription_status,
          membership_expires_at,
          role
        `,
      )
      .in("id", optedInUserIds);

    if (profilesError) {
      console.error("Premium profile lookup failed:", profilesError);
      return result;
    }

    const eligibleUserIds = (profiles ?? [])
      .filter((profile) => {
        const isAdmin = profile.role === "admin";

        const hasPremiumMembership =
          profile.membership === "premium" || isAdmin;

        const hasActiveStatus =
          isAdmin ||
          profile.subscription_status === "active" ||
          profile.subscription_status === "trialing";

        const hasNotExpired =
          isAdmin ||
          !profile.membership_expires_at ||
          profile.membership_expires_at > now;

        return hasPremiumMembership && hasActiveStatus && hasNotExpired;
      })
      .map((profile) => profile.id);

    result.eligible = eligibleUserIds.length;

    if (eligibleUserIds.length === 0) {
      return result;
    }

    const { data: existingDeliveries, error: existingError } = await admin
      .from("notification_deliveries")
      .select("user_id")
      .eq("pick_id", pick.id)
      .eq("channel", "email")
      .in("user_id", eligibleUserIds);

    if (existingError) {
      console.error("Existing delivery lookup failed:", existingError);
      return result;
    }

    const alreadyProcessed = new Set(
      existingDeliveries?.map((delivery) => delivery.user_id) ?? [],
    );

    const usersToNotify = eligibleUserIds.filter(
      (userId) => !alreadyProcessed.has(userId),
    );

    result.skipped = eligibleUserIds.length - usersToNotify.length;

    for (const userId of usersToNotify) {
      const { data: authUserData, error: authUserError } =
        await admin.auth.admin.getUserById(userId);

      const email = authUserData.user?.email;

      if (authUserError || !email) {
        result.failed += 1;

        const { error: logError } = await admin
          .from("notification_deliveries")
          .upsert(
            {
              pick_id: pick.id,
              user_id: userId,
              channel: "email",
              destination: email ?? "missing-email",
              status: "failed",
              error_message:
                authUserError?.message ?? "Member email is missing.",
            },
            {
              onConflict: "pick_id,user_id,channel",
            },
          );

        if (logError) {
          console.error("Failed delivery log error:", logError);
        }

        continue;
      }

      const { data: pendingDelivery, error: pendingError } = await admin
        .from("notification_deliveries")
        .insert({
          pick_id: pick.id,
          user_id: userId,
          channel: "email",
          destination: email,
          status: "pending",
        })
        .select("id")
        .single();

      if (pendingError || !pendingDelivery) {
        // A unique-constraint conflict means another request already
        // claimed this member/pick/channel combination.
        result.skipped += 1;
        continue;
      }

      try {
        const { data: emailData, error: emailError } =
          await resend.emails.send({
            from:
              process.env.RESEND_FROM_EMAIL ??
              "KofSports Picks <picks@send.kofsports.com>",
            to: email,
            replyTo:
              process.env.RESEND_REPLY_TO ?? "kofsports1@gmail.com",
            subject: premiumPickEmailSubject({
              sport: pick.sport,
              matchup: pick.matchup,
              selection: pick.selection,
              odds: pick.odds,
              units: pick.units,
              confidence: pick.confidence,
              analysis: pick.analysis,
              gameTime: pick.game_time,
            }),
            html: premiumPickEmailHtml({
              sport: pick.sport,
              matchup: pick.matchup,
              selection: pick.selection,
              odds: pick.odds,
              units: pick.units,
              confidence: pick.confidence,
              analysis: pick.analysis,
              gameTime: pick.game_time,
            }),
          });

        if (emailError) {
          throw new Error(emailError.message);
        }

        await admin
          .from("notification_deliveries")
          .update({
            status: "sent",
            provider_message_id: emailData?.id ?? null,
            error_message: null,
            sent_at: new Date().toISOString(),
          })
          .eq("id", pendingDelivery.id);

        result.sent += 1;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown email error.";

        await admin
          .from("notification_deliveries")
          .update({
            status: "failed",
            error_message: message,
          })
          .eq("id", pendingDelivery.id);

        console.error(
          `Premium pick email failed for user ${userId}:`,
          error,
        );

        result.failed += 1;
      }
    }

    console.info("Premium notification result:", {
      pickId,
      ...result,
    });

    return result;
  } catch (error) {
    console.error("Premium notification process failed:", error);
    return result;
  }
}