// Shared client/server allowlists: never persist auth URLs, query strings or form values.
export const FREE_ACCOUNT_CLIENT_EVENTS = [
  "save_player_click", "save_player_auth_prompt", "signup_start", "saved_players_dashboard_view",
] as const;
export const FREE_ACCOUNT_SERVER_EVENTS = ["signup", "save_player_complete", "save_player_remove", "authenticated_activity"] as const;
export function cleanAnalyticsPage(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const path = value.split(/[?#]/)[0];
  return /^\/(?:account|signup|login|plans|pro|premium-picks|betting-board|nfl-player-prop-trends|nfl-defense-vs-(?:position|qb|rb|wr|te)|(?:nfl|nba|nhl)\/players\/[a-z0-9-]+|(?:nba|nhl)\/player-prop-trends|nba\/defense-vs-position|nhl\/starting-goalies)?$/.test(path) ? path : undefined;
}
export function cleanAnalyticsUuid(value: unknown): string | undefined {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) ? value.toLowerCase() : undefined;
}
export function cleanAcquisitionSource(value: unknown): string | undefined {
  return typeof value === "string" && /^[a-z0-9_-]{1,40}$/i.test(value) ? value.toLowerCase() : undefined;
}
export function sanitizeFreeAccountMetadata(metadata: Record<string, unknown> | undefined, authenticated: boolean) {
  return {
    version: "free_account_v1",
    logged_in: authenticated,
    ...(metadata?.sport === "nfl" || metadata?.sport === "nba" || metadata?.sport === "nhl" ? { sport: metadata.sport } : {}),
    ...(cleanAnalyticsUuid(metadata?.funnel_id) ? { funnel_id: cleanAnalyticsUuid(metadata?.funnel_id) } : {}),
    ...(cleanAnalyticsPage(metadata?.source_page) ? { source_page: cleanAnalyticsPage(metadata?.source_page) } : {}),
    ...(cleanAcquisitionSource(metadata?.acquisition_source) ? { acquisition_source: cleanAcquisitionSource(metadata?.acquisition_source) } : {}),
  };
}
