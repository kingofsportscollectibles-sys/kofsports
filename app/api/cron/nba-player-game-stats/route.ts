import { NextRequest, NextResponse } from "next/server";

import {
  refreshRecentNbaPlayerGameStats,
} from "@/scripts/nba/import-player-game-stats";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("CRON_SECRET is not configured.");

    return NextResponse.json(
      {
        ok: false,
        error: "Cron secret is not configured.",
      },
      { status: 500 }
    );
  }

  const authorization =
    request.headers.get("authorization");

  if (authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized.",
      },
      { status: 401 }
    );
  }

  const startedAt = new Date().toISOString();

  console.log(
    `Starting NBA player game stat refresh at ${startedAt}`
  );

  try {
    const result =
      await refreshRecentNbaPlayerGameStats({
        season: "2026-27",
        lookbackDays: 3,
      });

    const completedAt = new Date().toISOString();

    console.log(
      `Completed NBA player game stat refresh at ${completedAt}`
    );

    return NextResponse.json({
      ok: true,
      startedAt,
      completedAt,
      ...result,
    });
  } catch (error) {
    console.error(
      "NBA player game stat refresh failed:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown NBA player game stat refresh error.",
      },
      { status: 500 }
    );
  }
}
