export type GrowthEventType =
  | "page_view"
  | "pricing_view"
  | "premium_page_view"
  | "premium_vault_view"
  | "results_view"
  | "blog_view"
  | "blog_read"
  | "signup"
  | "trial_started"
  | "premium_purchase"
  | "cta_click"
  | "email_click"
  | "search"
  | "video_play"
  | "exit_intent";

export interface CreateGrowthEventInput {
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