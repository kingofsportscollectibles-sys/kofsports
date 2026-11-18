import { BETTING_BOARD_EVENTS } from "./betting-board-policy";

export const GROWTH_EVENT_TYPES = [
  ...BETTING_BOARD_EVENTS,
  "page_view",
  "pricing_view",
  "premium_page_view",
  "premium_vault_view",
  "results_view",
  "blog_view",
  "blog_read",
  "signup",
  "signup_start",
  "save_player_click",
  "save_player_auth_prompt",
  "save_player_complete",
  "save_player_remove",
  "saved_players_dashboard_view",
  "authenticated_activity",
  "trial_started",
  "premium_purchase",
  "cta_click",
  "cta_impression",
  "email_click",
  "search",
  "video_play",
  "exit_intent",
  "dvp_view",
  "dvp_matchup_expand",
  "dvp_prop_cta_click",
  "prop_tool_view",
] as const;

export type GrowthEventType = typeof GROWTH_EVENT_TYPES[number];

export interface CreateGrowthEventInput {
  eventId?: string;
  eventType: GrowthEventType;

  page?: string;
  url?: string;
  referrer?: string;

  sessionId?: string;
  anonymousId?: string;

  leadId?: string;

  /*
   * This is assigned by the server from the authenticated
   * Supabase session. Do not rely on a client-supplied value.
   */
  userId?: string;

  occurredAt?: string;

  metadata?: Record<string, unknown>;
}
