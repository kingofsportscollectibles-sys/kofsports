import type { GrowthEventType } from "../types";

const EVENT_SCORES: Partial<Record<GrowthEventType, number>> = {
  pricing_view: 20,
  premium_page_view: 15,
  premium_vault_view: 30,
  blog_view: 5,
  blog_read: 10,
  results_view: 8,
  signup: 40,
  trial_started: 60,
  premium_purchase: 100,
};

export function getLeadScoreIncrease(
  eventType: GrowthEventType,
) {
  return EVENT_SCORES[eventType] ?? 0;
}