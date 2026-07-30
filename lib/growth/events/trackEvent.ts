import type { CreateGrowthEventInput } from "./types";

export async function trackGrowthEvent(
  event: CreateGrowthEventInput,
) {
  try {
    const response = await fetch("/api/growth/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Growth event request failed:", {
        event,
        status: response.status,
        result,
      });

      return null;
    }

    return result;
  } catch (error) {
    console.error("Growth tracking failed:", {
      event,
      error,
    });

    return null;
  }
}