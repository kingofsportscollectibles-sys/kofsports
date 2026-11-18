import type { CreateGrowthEventInput } from "./types";

// Best-effort analytics must tolerate auth + database latency without interrupting the page.
export const GROWTH_EVENT_TIMEOUT_MS = 10_000;

function isCanceled(error: unknown, signal: AbortSignal) {
  return signal.aborted || (typeof error === "object" && error !== null && "name" in error && error.name === "AbortError");
}

export async function trackGrowthEvent(event: CreateGrowthEventInput) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GROWTH_EVENT_TIMEOUT_MS);
  try {
    const response = await fetch("/api/growth/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
      keepalive: true,
      signal: controller.signal,
    });

    // Error responses may be HTML from a proxy, not JSON from the event API.
    if (!response.ok) {
      console.warn("Growth event request was not accepted:", {
        eventType: event.eventType,
        status: response.status,
      });
      return null;
    }

    try {
      return await response.json();
    } catch (error) {
      if (isCanceled(error, controller.signal)) return null;
      console.warn("Growth event response was not valid JSON:", {
        eventType: event.eventType,
        status: response.status,
      });
      return null;
    }
  } catch (error) {
    // Navigation/timeouts/offline are expected best-effort failures, not product errors.
    if (isCanceled(error, controller.signal) || (typeof navigator !== "undefined" && navigator.onLine === false)) return null;
    console.warn("Growth event transport unavailable:", {
      eventType: event.eventType,
      errorName: typeof error === "object" && error !== null && "name" in error ? String(error.name) : "UnknownError",
    });
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
