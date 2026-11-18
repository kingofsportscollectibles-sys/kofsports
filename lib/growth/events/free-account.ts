"use client";

import { getAnonymousId, getGrowthSession } from "./session";
import { trackGrowthEvent } from "./trackEvent";
import { cleanAnalyticsPage, cleanAnalyticsUuid, cleanAcquisitionSource, type FREE_ACCOUNT_CLIENT_EVENTS } from "./free-account-policy";

type Context = { funnelId: string; sourcePage?: string; acquisitionSource?: string; createdAt: number };
const CONTEXT_KEY = "kof_free_account_context_v1";
const SOURCE_KEY = "kof_acquisition_source_v1";
const PAGE_KEY = "kof_acquisition_page_v1";
export function captureAcquisitionSource() {
  try {
    const source = cleanAcquisitionSource(new URL(window.location.href).searchParams.get("utm_source"));
    if (source) sessionStorage.setItem(SOURCE_KEY, source);
    const page = cleanAnalyticsPage(window.location.pathname);
    if (page && !["/signup", "/login", "/account"].includes(page)) sessionStorage.setItem(PAGE_KEY, page);
  } catch { /* Storage is optional; analytics never blocks the product. */ }
}
export function freeAccountContext(sourcePage?: string, newFlow = false, requestedFlow?: string): Context {
  let context: Context | undefined;
  try {
    const stored = JSON.parse(sessionStorage.getItem(CONTEXT_KEY) ?? "null");
    if (!newFlow && stored && cleanAnalyticsUuid(stored.funnelId) && Date.now() - stored.createdAt < 86_400_000) context = stored;
  } catch { /* Ignore inaccessible or corrupt storage. */ }
  const requested = cleanAnalyticsUuid(requestedFlow);
  if (!context || (requested && context.funnelId !== requested)) {
    context = { funnelId: requested ?? crypto.randomUUID(), sourcePage: cleanAnalyticsPage(sourcePage), createdAt: Date.now() };
  }
  context.sourcePage = cleanAnalyticsPage(context.sourcePage) ?? cleanAnalyticsPage(sourcePage);
  try {
    context.acquisitionSource = cleanAcquisitionSource(sessionStorage.getItem(SOURCE_KEY));
    sessionStorage.setItem(CONTEXT_KEY, JSON.stringify(context));
  } catch { /* Continue without persistent attribution. */ }
  return context;
}
export function signupAttribution(redirectTo: string) {
  let source = "/signup";
  let flow: string | undefined;
  try {
    const redirect = new URL(redirectTo, window.location.origin);
    flow = redirect.searchParams.get("saveFlow") ?? undefined;
    if (flow) source = cleanAnalyticsPage(redirect.pathname) ?? source;
    else source = cleanAnalyticsPage(sessionStorage.getItem(PAGE_KEY)) ?? source;
  } catch { /* Direct registration. */ }
  const context = freeAccountContext(source, false, flow);
  let anonymousId: string | undefined;
  let sessionId: string | undefined;
  try { anonymousId = getAnonymousId() ?? undefined; sessionId = getGrowthSession() ?? undefined; } catch { /* Optional. */ }
  return {
    analytics_version: "free_account_v1",
    conversion_funnel_id: context.funnelId,
    conversion_source_page: context.sourcePage,
    conversion_acquisition_source: context.acquisitionSource,
    conversion_anonymous_id: cleanAnalyticsUuid(anonymousId),
    conversion_session_id: cleanAnalyticsUuid(sessionId),
  };
}
export function trackFreeAccountEvent(
  eventType: typeof FREE_ACCOUNT_CLIENT_EVENTS[number],
  options: { page: string; sport?: string; loggedIn?: boolean; context?: Context; onceKey?: string },
) {
  try {
    const page = cleanAnalyticsPage(options.page);
    if (!page) return;
    const id = crypto.randomUUID();
    if (options.onceKey) {
      if (sessionStorage.getItem(options.onceKey)) return;
      sessionStorage.setItem(options.onceKey, id);
    }
    return trackGrowthEvent({
      eventId: id, eventType, page,
      sessionId: getGrowthSession() ?? undefined,
      anonymousId: getAnonymousId() ?? undefined,
      metadata: {
        sport: options.sport, logged_in: options.loggedIn ?? false,
        funnel_id: options.context?.funnelId,
        source_page: options.context?.sourcePage ?? page,
        acquisition_source: options.context?.acquisitionSource,
      },
    });
  } catch { /* Analytics must not prevent saving or registration. */ }
}
