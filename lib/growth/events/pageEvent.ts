import type { GrowthEventType } from "./types";

export type ClassifiedPageEvent = {
  eventType: GrowthEventType;
  metadata?: Record<string, unknown>;
};

export function getPageEvent(
  pathname: string,
): ClassifiedPageEvent | null {
  const dvpPositionMatch = pathname.match(
    /^\/nfl-defense-vs-(qb|rb|wr|te)$/,
  );

  if (dvpPositionMatch) {
    return {
      eventType: "dvp_view",
      metadata: {
        position: dvpPositionMatch[1].toUpperCase(),
      },
    };
  }

  if (pathname === "/nfl-player-prop-trends") {
    return {
      eventType: "prop_tool_view",
    };
  }

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