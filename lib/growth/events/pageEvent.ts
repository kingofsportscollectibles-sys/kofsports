import type { GrowthEventType } from "./types";

export type ClassifiedPageEvent = {
  eventType: GrowthEventType;
  metadata?: Record<string, unknown>;
};

export function getPageEvent(
  pathname: string,
): ClassifiedPageEvent | null {
  if (pathname === "/plans") {
    return {
      eventType: "pricing_view",
    };
  }

  if (pathname === "/premium-picks") {
    return {
      eventType: "premium_page_view",
    };
  }

  if (pathname === "/results") {
    return {
      eventType: "results_view",
    };
  }

  if (
    pathname.startsWith("/blog/") &&
    pathname !== "/blog/"
  ) {
    const slug = pathname.replace("/blog/", "");

    return {
      eventType: "blog_view",
      metadata: {
        slug,
      },
    };
  }

  return null;
}