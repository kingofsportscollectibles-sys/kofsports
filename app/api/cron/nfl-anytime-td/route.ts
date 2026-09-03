import { NextRequest, NextResponse } from "next/server";

import { importNflAnytimeTdOdds } from "@/lib/nfl/import-anytime-td-odds";

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
      `[NFL Anytime TD Cron] Starting refresh at ${startedAt}`,
    );

    const result = await importNflAnytimeTdOdds();

    const completedAt = new Date().toISOString();

    console.log(
      `[NFL Anytime TD Cron] Completed refresh at ${completedAt}`,
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
      "[NFL Anytime TD Cron] Refresh failed:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown NFL anytime TD import error",
      },
      {
        status: 500,
      },
    );
  }
}
