import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import type {
  CreateGrowthEventInput,
  GrowthEventType,
} from "../types";

type CreateWebsiteActivityInput = {
  eventId: string;
  leadId: string;
  event: CreateGrowthEventInput;
};

type WebsiteActivityContent = {
  activityType: string;
  title: string;
  description: string;
};

function getWebsiteActivityContent(
  eventType: GrowthEventType,
  page?: string,
  metadata?: Record<string, unknown>,
): WebsiteActivityContent | null {
  switch (eventType) {
    case "pricing_view":
      return {
        activityType: "website_visit",
        title: "Viewed Pricing",
        description:
          "Visited the KofSports plans and pricing page.",
      };

    case "premium_page_view":
      return {
        activityType: "website_visit",
        title: "Viewed Premium Picks",
        description:
          "Visited the KofSports Premium Picks page.",
      };

    case "premium_vault_view":
      return {
        activityType: "website_visit",
        title: "Viewed Premium Vault",
        description:
          "Browsed historical results in the Premium Vault.",
      };

    case "trial_started":
      return {
        activityType: "trial_started",
        title: "Started Premium Trial",
        description:
          "Started a KofSports Premium trial.",
      };

    case "premium_purchase":
      return {
        activityType: "premium_purchase",
        title: "Purchased Premium",
        description:
          "Completed a KofSports Premium purchase.",
      };

    default:
      return null;
  }
}

export async function createCrmActivityFromEvent({
  eventId,
  leadId,
  event,
}: CreateWebsiteActivityInput): Promise<boolean> {
  const content = getWebsiteActivityContent(
    event.eventType,
    event.page,
    event.metadata,
  );

  if (!content) {
    return false;
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("growth_activities")
    .insert({
      lead_id: leadId,
      growth_event_id: eventId,
      activity_type: content.activityType,
      platform: "website",
      direction: "inbound",
      title: content.title,
      description: content.description,
      occurred_at:
        event.occurredAt ?? new Date().toISOString(),
    });

  if (error) {
    /*
     * PostgreSQL error 23505 means the event already created
     * an activity. Treat that as a successful no-op.
     */
    if (error.code === "23505") {
      return false;
    }

    console.error(
      "Unable to create CRM activity from growth event:",
      error,
    );

    throw new Error(
      "Growth event was recorded, but CRM activity creation failed.",
    );
  }

  return true;
}