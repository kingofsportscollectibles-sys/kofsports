import "server-only";

import { BETTING_BOARD_EVENTS } from "./betting-board-policy";

import { createAdminClient } from "@/lib/supabase/admin";

import { processGrowthEvent } from "./processGrowthEvent";

import type { CreateGrowthEventInput } from "./types";
import { cleanAnalyticsUuid, FREE_ACCOUNT_CLIENT_EVENTS } from "./free-account-policy";

export async function createGrowthEvent(
  input: CreateGrowthEventInput,
) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("growth_events")
    .insert({
      ...(cleanAnalyticsUuid(input.eventId) ? { id: input.eventId } : {}),
      event_type: input.eventType,
      page: input.page ?? null,
      url: input.url ?? null,
      referrer: input.referrer ?? null,
      session_id: input.sessionId ?? null,
      anonymous_id: input.anonymousId ?? null,
      lead_id: input.leadId ?? null,
      user_id: input.userId ?? null,
      occurred_at:
        input.occurredAt ?? new Date().toISOString(),
      metadata: input.metadata ?? {},
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505" && input.eventId) return { id: input.eventId, duplicate: true };
    console.error(
      "Unable to create growth event:",
      error,
    );

    throw new Error("Unable to create growth event.");
  }

  // Lightweight experiment events do not need CRM lookup/scoring writes.
  if ((FREE_ACCOUNT_CLIENT_EVENTS as readonly string[]).includes(input.eventType) || (BETTING_BOARD_EVENTS as readonly string[]).includes(input.eventType)) return data;

  const processingResult = await processGrowthEvent({
    eventId: data.id,
    event: input,
  });

  return {
    ...data,
    processing: processingResult,
  };
}
