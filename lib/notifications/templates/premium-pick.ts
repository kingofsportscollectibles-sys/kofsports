type PremiumPickEmailData = {
  sport: string;
  matchup: string;
  selection: string;
  odds: number;
  units: number;
  confidence: number;
  analysis: string | null;
  gameTime: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatOdds(odds: number) {
  return odds > 0 ? `+${odds}` : `${odds}`;
}

function formatGameTime(gameTime: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(gameTime));
}

export function premiumPickEmailSubject(pick: PremiumPickEmailData) {
  return `🚨 New KofSports Premium Pick: ${pick.selection}`;
}

export function premiumPickEmailHtml(pick: PremiumPickEmailData) {
  const analysis = pick.analysis
    ? escapeHtml(pick.analysis).replaceAll("\n", "<br />")
    : "Log in to view the complete pick details.";

  const confidenceStars = "★".repeat(pick.confidence);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kofsports.com";
  const premiumUrl = `${siteUrl}/vip-picks`;

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>New KofSports Premium Pick</title>
      </head>

      <body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827;">
        <div style="display:none;max-height:0;overflow:hidden;">
          ${escapeHtml(pick.selection)} at ${formatOdds(pick.odds)}
        </div>

        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          style="background:#f3f4f6;padding:32px 16px;"
        >
          <tr>
            <td align="center">
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                style="max-width:620px;background:#ffffff;border-radius:20px;overflow:hidden;"
              >
                <tr>
                  <td style="background:#050505;padding:32px;text-align:center;">
                    <div
                      style="
                        color:#f59e0b;
                        font-size:13px;
                        font-weight:700;
                        letter-spacing:3px;
                        text-transform:uppercase;
                      "
                    >
                      KofSports
                    </div>

                    <h1
                      style="
                        margin:14px 0 0;
                        color:#ffffff;
                        font-size:30px;
                        line-height:1.2;
                      "
                    >
                      New Premium Pick
                    </h1>
                  </td>
                </tr>

                <tr>
                  <td style="padding:32px;">
                    <div
                      style="
                        display:inline-block;
                        padding:7px 12px;
                        border-radius:999px;
                        background:#fef3c7;
                        color:#92400e;
                        font-size:12px;
                        font-weight:700;
                        text-transform:uppercase;
                      "
                    >
                      ${escapeHtml(pick.sport)}
                    </div>

                    <p style="margin:24px 0 6px;color:#6b7280;font-size:14px;">
                      ${escapeHtml(pick.matchup)}
                    </p>

                    <h2
                      style="
                        margin:0;
                        color:#111827;
                        font-size:30px;
                        line-height:1.25;
                      "
                    >
                      ${escapeHtml(pick.selection)}
                    </h2>

                    <table
                      role="presentation"
                      width="100%"
                      cellspacing="0"
                      cellpadding="0"
                      style="margin-top:24px;border-collapse:collapse;"
                    >
                      <tr>
                        <td
                          width="33%"
                          style="padding:14px;border:1px solid #e5e7eb;text-align:center;"
                        >
                          <div style="color:#6b7280;font-size:11px;text-transform:uppercase;">
                            Odds
                          </div>
                          <div style="margin-top:5px;font-size:19px;font-weight:700;">
                            ${formatOdds(pick.odds)}
                          </div>
                        </td>

                        <td
                          width="33%"
                          style="padding:14px;border:1px solid #e5e7eb;text-align:center;"
                        >
                          <div style="color:#6b7280;font-size:11px;text-transform:uppercase;">
                            Units
                          </div>
                          <div style="margin-top:5px;font-size:19px;font-weight:700;">
                            ${pick.units}
                          </div>
                        </td>

                        <td
                          width="34%"
                          style="padding:14px;border:1px solid #e5e7eb;text-align:center;"
                        >
                          <div style="color:#6b7280;font-size:11px;text-transform:uppercase;">
                            Confidence
                          </div>
                          <div style="margin-top:5px;color:#d97706;font-size:16px;font-weight:700;">
                            ${confidenceStars}
                          </div>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:22px 0 0;color:#6b7280;font-size:14px;">
                      Game time:
                      <strong style="color:#111827;">
                        ${formatGameTime(pick.gameTime)}
                      </strong>
                    </p>

                    <div
                      style="
                        margin-top:26px;
                        padding:22px;
                        border-radius:14px;
                        background:#f9fafb;
                        border:1px solid #e5e7eb;
                      "
                    >
                      <div
                        style="
                          color:#111827;
                          font-size:13px;
                          font-weight:700;
                          letter-spacing:1px;
                          text-transform:uppercase;
                        "
                      >
                        Kof's Analysis
                      </div>

                      <p
                        style="
                          margin:12px 0 0;
                          color:#374151;
                          font-size:15px;
                          line-height:1.7;
                        "
                      >
                        ${analysis}
                      </p>
                    </div>

                    <div style="margin-top:30px;text-align:center;">
                      <a
                        href="${premiumUrl}"
                        style="
                          display:inline-block;
                          padding:15px 26px;
                          border-radius:10px;
                          background:#050505;
                          color:#ffffff;
                          font-size:15px;
                          font-weight:700;
                          text-decoration:none;
                        "
                      >
                        View Premium Picks
                      </a>
                    </div>

                    <p
                      style="
                        margin:28px 0 0;
                        color:#9ca3af;
                        font-size:11px;
                        line-height:1.6;
                        text-align:center;
                      "
                    >
                      You received this email because Premium Pick alerts are
                      enabled in your KofSports account. You can update your
                      preferences from your Account page.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}