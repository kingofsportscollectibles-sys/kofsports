"use client";

import { useEffect } from "react";

import {
  getAnonymousId,
  getGrowthSession,
} from "@/lib/growth/events/session";
import { trackGrowthEvent } from "@/lib/growth/events/trackEvent";

const NOVIG_AFFILIATE_URL =
  "https://novig.onelink.me/JHQQ/sz3auvq5";

type Props = {
  sport: "nfl" | "nba" | "nhl";
  placement?: string;
};

export default function NovigResearchCta({
  sport,
  placement = "prop_trends",
}: Props) {
  useEffect(() => {
    void trackGrowthEvent({
      eventType: "cta_impression",
      page: window.location.pathname,
      url: window.location.href,
      referrer: document.referrer || undefined,
      sessionId: getGrowthSession() ?? undefined,
      anonymousId: getAnonymousId() ?? undefined,
      metadata: {
        partner: "novig",
        placement,
        sport,
      },
    });
  }, [placement, sport]);

  function handleClick() {
    void trackGrowthEvent({
      eventType: "cta_click",
      page: window.location.pathname,
      url: window.location.href,
      referrer: document.referrer || undefined,
      sessionId: getGrowthSession() ?? undefined,
      anonymousId: getAnonymousId() ?? undefined,
      metadata: {
        partner: "novig",
        placement,
        sport,
      },
    });
  }

  return (
    <aside
      className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:flex sm:items-center sm:justify-between sm:gap-6"
      aria-label="Novig promotional offer"
    >
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Sponsored
        </div>

        <h2 className="mt-1 text-lg font-bold text-white">
          Ready to make your pick?
        </h2>

        <p className="mt-1 text-sm leading-6 text-slate-400">
          New to Novig? Deposit $10 and get $50 in Trade Credits.
          Use promo code{" "}
          <strong className="font-bold text-white">
            KOFSPORTS
          </strong>
          .
        </p>

        <p className="mt-2 text-[11px] leading-4 text-slate-500">
          KofSports may earn a commission. Restrictions and
          requirements apply. Not available in all states. 21+.
        </p>
      </div>

      <a
        href={NOVIG_AFFILIATE_URL}
        target="_blank"
        rel="sponsored noopener noreferrer"
        onClick={handleClick}
        className="mt-4 flex shrink-0 items-center justify-center rounded-lg bg-[#179BE7] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 sm:mt-0"
      >
        Get the Novig Offer
      </a>
    </aside>
  );
}
