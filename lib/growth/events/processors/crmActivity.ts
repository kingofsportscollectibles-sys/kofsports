import type { GrowthEventType } from "../types";

export function shouldCreateActivity(
  eventType: GrowthEventType,
) {
  switch (eventType) {
    case "pricing_view":
    case "premium_page_view":
    case "premium_vault_view":
    case "trial_started":
    case "premium_purchase":
      return true;

    default:
      return false;
  }
}