# Website audit implementation baseline

Public source: https://app.heycatch.ai/audit/hck_pk_Iop4R8zHj3XrDsKXvt3xOdpkxpeppyKE?surface=website

The entire scorecard, dimension insights and action plan were read before implementation. The report contains Quick wins and Do this quarter, and no Bigger bets section. Work follows those priorities. Full-mark findings D4.1, D5.2 and D5.4 were not targeted. The Brief fit row is explicitly Pass and was not treated as a separate fix.

## Scores for the rerun

- D1.1: 3/6
- D1.2: 4/5
- D1.3: 3/4
- D1.4: 2/3
- D1.5: 1/3
- D1.6: 3/4
- D2.1: 5/7
- D2.2: 4/5
- D2.3: 4/5
- D2.4: 3/4
- D2.5: 2/4
- D2.B: +1/2
- D3.1: 3/4
- D3.2: 0/5
- D3.3: 2/4
- D3.4: 2/4
- D3.5: 0/3
- D4.2: 2/4
- D4.3: 4/5
- D4.4: 2/4
- D4.B: +0/1
- D5.1: 2/3
- D5.3: 2/4
- D5.5: 1/3

D1.2's insight literally contains “4/4... 4/5”; the final 4/5 is used as the current score. Dimension totals do not always equal the visible component totals. No component score was inferred from a dimension total. Bonus codes and signs above are preserved as shown.

## Implementation decisions

- Preserve primary/secondary CTAs, one h1 per page, existing access rules and payment endpoints. Add a subordinate pricing path and two intent anchors before the six plan cards.
- Show actual public settled data rather than synthetic player lines, scores or results. The sample is the most recent complete published settled pick regardless of win/loss, with no pending selection or paid analysis returned. A source failure renders a public-vault link, never fake data.
- Headline counts now use the same published Premium archive scope as the vault. The old independent baseline-plus-relaunch calculation is no longer mixed in. Win rate excludes pushes/voids, and the vault explains why its row count can differ. This changes headline totals to the actual archive, not to a curated marketing count. At the read-only check, the archive had 7,121 wins and 5,249 losses (12,370 decisions) plus one push; counts are dynamic, not hard-coded.
- Public record aggregation is server-only, cached five minutes and paginated with four page reads at a time. Read only published Premium wins/losses; do not expose pending picks. Existing database records and baselines are not altered.
- Explain recorded unit grading and source limitations, including missing historical sportsbook fields. Do not claim every official selection used DraftKings, a flat stake, or a closing line. Do not turn win rate into an ROI claim.
- Pricing comparisons use vendor sources with a checked date. Props.Cash's $19.99 is explicitly its US iOS listing; SportsLine's join page lists $13.99 monthly/$39.99 quarterly/$139.99 yearly. Outlier's current site and older guide conflict, so current checkout pricing is marked unverified. No paid memberships were tested.
- Correct Pro annual savings to $40.88 versus 12 monthly $9.99 payments (34.1%), preserving the actual $79 annual offer.
- Use the audience's +EV, closing-line and line-shopping vocabulary only with explicit capability limits. A KOFScore is not a calibrated +EV signal, and stored single-book reference lines are not live multi-book shopping.
- Keep owner-dependent proof slots empty and invisible. No fictional testimonials, subscriber counts, founder surname/photo/social profile, review rating or refund guarantee were published.
- Replace the malformed vault Clear Filters link markup. Its CSS string was being rendered as link text; the accessible tap target is now a real className attribute.

## Owner inputs still needed

1. Founder surname, real photo, and verified off-site profiles. Populate `lib/marketing/owner-content.ts`; until then the site shows only the existing Kof name and contact address.
2. Five to eight real member quotes with names, photos, context and permission to publish. The consent-gated testimonial grid is wired into home/plans/picks but renders nothing while empty.
3. A real review-platform profile and independently verifiable rating/count/date before showing the review slot. Account creation and review invitations were not performed.
4. An approved refund policy and completed billing/renewal/cancellation terms. Existing Terms still say they are preliminary. No seven-day guarantee or refund entitlement was invented.
5. A true 375×812 browser check of home and plans, menu interaction and keyboards; browser use is disabled in Work settings. Source/rendered-markup checks cannot substitute for this. The hero/tap targets and horizontal table containers were adjusted, but runtime phone verification is not claimed.
6. A real tool screenshot if desired in addition to the implemented server-rendered actual settled-pick preview. No product screenshot was fabricated. Thin CMS image-alt descriptions need review against the actual images; no visual description was invented from an article title.
7. Verify Outlier's current checkout pricing before replacing its explicit uncertainty note. Comparison sources are linked beside the claims.

No deployment, commits, database writes, migrations, Odds API calls, guarantees or external messages. The work is prepared in an isolated copy and applied only after checking original file hashes to preserve unrelated uncommitted changes.
