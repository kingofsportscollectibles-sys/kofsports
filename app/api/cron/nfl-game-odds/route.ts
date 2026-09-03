import { NextRequest, NextResponse } from "next/server";

import { importNflGameOdds } from "@/lib/nfl/import-game-odds";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("Missing CRON_SECRET");

    return NextResponse.json(
      {
        ok: false,
        error: "Server configuration error",
      },
      {
        status: 500,
      },
    );
  }

  const authorization = request.headers.get("authorization");

  if (authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  try {
    const startedAt = new Date().toISOString();

    console.log(
      `[NFL Game Odds Cron] Starting refresh at ${startedAt}`,
    );

    const result = await importNflGameOdds();

    const completedAt = new Date().toISOString();

    console.log(
      `[NFL Game Odds Cron] Completed refresh at ${completedAt}`,
      result,
    );

    return NextResponse.json({
      ok: true,
      startedAt,
      completedAt,
      ...result,
    });
  } catch (error) {
    console.error(
      "[NFL Game Odds Cron] Refresh failed:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown NFL game odds import error",
      },
      {
        status: 500,
      },
    );
  }
}
