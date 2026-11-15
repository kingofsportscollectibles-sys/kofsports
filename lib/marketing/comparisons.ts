export const comparisonCheckedAt = "2026-11-14";
export const comparisons = [
  {
    slug: "kofsports-vs-props-cash",
    name: "Props.Cash",
    title: "KofSports Pro vs Props.Cash",
    intro:
      "Compare the price and the workflow before adding another prop subscription. KofSports Pro focuses on NFL research; Props.Cash advertises prop tools across several sports.",
    price:
      "$19.99/month or $199.99/year for All Sports (US iOS listing). Web checkout may differ.",
    features: [
      [
        "Research focus",
        "NFL board, L5/L10, matchup and usage research",
        "Player-prop charts and trends across multiple sports",
      ],
      [
        "Odds workflow",
        "Recorded DraftKings board quotes; compare your books yourself",
        "Multi-book odds comparisons advertised",
      ],
      [
        "Official selections",
        "Separate Premium Passes include Kof’s picks and Pro",
        "Prop research and pick-finding tools advertised",
      ],
      [
        "Public results",
        "Published Premium selection vault, including losses",
        "Review the vendor’s own research and trial before choosing",
      ],
    ],
    choose:
      "Choose KofSports Pro if your main job is researching NFL props in one place at $9.99/month. Consider Props.Cash if broader sport coverage and its multi-book workflow are what you need. These are different feature sets, not a claim of equal capability or better betting results.",
    sources: [
      {
        label: "Props.Cash’s US App Store listing",
        href: "https://apps.apple.com/us/app/props-cash-prop-pick-finder/id1606752641",
      },
    ],
    note: "Props.Cash pricing and feature descriptions come from its developer-published US listing. We did not test its paid workspace. Promotions, platform prices and taxes can differ.",
  },
  {
    slug: "kofsports-vs-outlier",
    name: "Outlier",
    title: "KofSports Pro vs Outlier",
    intro:
      "The useful question is whether you want a lower-cost NFL research workspace or the broader odds and market tools Outlier advertises. Compare those jobs rather than treating every confidence score as a betting edge.",
    price:
      "Current checkout price not verified. Outlier’s public homepage describes one Pro subscription; its older plan guide still lists $19.99, $29.99 and $79.99 monthly tiers.",
    features: [
      [
        "Research focus",
        "NFL prop trends, matchup context and recorded usage",
        "Multi-sport props and game markets advertised",
      ],
      [
        "Positive EV",
        "Raw projection edges; not a calibrated +EV feed",
        "Positive EV feed and sharp-book tools advertised",
      ],
      [
        "Line shopping",
        "Stored DraftKings reference; check other books yourself",
        "Book comparisons and line-movement tools advertised",
      ],
      [
        "Game-day role",
        "Recorded usage and matchup context; verify injuries separately",
        "Injury context and real-time tools advertised",
      ],
    ],
    choose:
      "Choose KofSports Pro for the NFL data you want to inspect yourself, with clear limits around stored quotes and role uncertainty. Consider Outlier if its multi-book and Positive EV workflows are essential to you. Confirm the current plan and checkout price before comparing total cost.",
    sources: [
      {
        label: "Outlier product and current plans",
        href: "https://www.outlier.bet/",
      },
      {
        label: "Outlier’s dated plan guide",
        href: "https://help.outlier.bet/en/articles/12556823-choosing-the-right-outlier-plan-for-your-betting-style",
      },
    ],
    note: "Outlier’s current homepage and its July plan guide do not present the same plan structure. We are not treating the older prices as verified current checkout prices or claiming price parity. No paid workspace was tested.",
  },
  {
    slug: "kofsports-vs-sportsline",
    name: "SportsLine",
    title: "KofSports vs SportsLine",
    intro:
      "Both publish picks, but the choice is different from buying a prop research tool. Compare who makes the selections, which research you want, and what the subscription actually includes.",
    price:
      "SportsLine Pro lists $13.99/month, $39.99/3 months or $139.99/year; taxes may apply.",
    features: [
      [
        "Selections",
        "Kof’s official picks through Premium; Pro alone excludes picks",
        "Expert selections and computer simulations advertised",
      ],
      [
        "Research product",
        "Pro is available separately for $9.99/month",
        "SportsLine Pro bundles its own picks and projections",
      ],
      [
        "Entry access",
        "$10 one-day Premium Pass; no recurring charge",
        "Monthly, three-month and annual plans listed",
      ],
      [
        "Inspecting results",
        "Public settled Premium vault, including losses",
        "Review each expert’s displayed record and methodology",
      ],
    ],
    choose:
      "Choose KofSports Premium if you specifically want Kof’s selections and the Pro workspace together. Pro alone costs less but does not include official picks. SportsLine’s published monthly picks subscription costs less than KofSports’ $75 monthly Premium Pass; compare the services rather than assuming they are interchangeable.",
    sources: [
      {
        label: "SportsLine’s membership page",
        href: "https://www.sportsline.com/join/?xurl=/",
      },
    ],
    note: "Prices are the published membership-page prices checked on the date below, not an offer or completed checkout. Promotions and bundles can change. We did not test a paid membership.",
  },
] as const;
