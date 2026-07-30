import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import { processGrowthEvent } from "./processGrowthEvent";

import type { CreateGrowthEventInput } from "./types";

export async function createGrowthEvent(
  input: CreateGrowthEventInput,
) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("growth_events")
    .insert({
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
    console.error(
      "Unable to create growth event:",
      error,
    );

    throw new Error("Unable to create growth event.");
  }

  const processingResult = await processGrowthEvent({
    eventId: data.id,
    event: input,
  });

  return {
    ...data,
    processing: processingResult,
  };
}