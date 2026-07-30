"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { getPageEvent } from "@/lib/growth/events/pageEvent";
import {
  getAnonymousId,
  getGrowthSession,
} from "@/lib/growth/events/session";
import { trackGrowthEvent } from "@/lib/growth/events/trackEvent";

export default function GrowthTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const sessionId = getGrowthSession() ?? undefined;
    const anonymousId = getAnonymousId() ?? undefined;

    const commonEventData = {
      page: pathname,
      url: window.location.href,
      referrer: document.referrer || undefined,
      sessionId,
      anonymousId,
    };

    void trackGrowthEvent({
      eventType: "page_view",
      ...commonEventData,
    });

    const pageEvent = getPageEvent(pathname);

    if (pageEvent) {
      void trackGrowthEvent({
        eventType: pageEvent.eventType,
        ...commonEventData,
        metadata: pageEvent.metadata,
      });
    }
  }, [pathname]);

  return null;
}