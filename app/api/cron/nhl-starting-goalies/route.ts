import { NextRequest, NextResponse } from "next/server";

import { importNhlStartingGoalies } from "@/lib/nhl/import-starting-goalies";

export const dynamic = "force-dynamic";

function getEasternDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

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
    const gameDate = getEasternDate();

    console.log(
      `[NHL Starting Goalies Cron] Starting ${gameDate} refresh at ${startedAt}`,
    );

    await importNhlStartingGoalies(gameDate);

    const completedAt = new Date().toISOString();

    console.log(
      `[NHL Starting Goalies Cron] Completed ${gameDate} refresh at ${completedAt}`,
    );

    return NextResponse.json({
      ok: true,
      gameDate,
      startedAt,
      completedAt,
    });
  } catch (error) {
    console.error(
      "[NHL Starting Goalies Cron] Refresh failed:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown NHL starting goalie import error",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: NextRequest) {
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
    const gameDate = getEasternDate();
    const dailyFaceoffHtml = await request.text();

    if (!dailyFaceoffHtml.includes("__NEXT_DATA__")) {
      return NextResponse.json(
        {
          ok: false,
          error: "Daily Faceoff HTML payload is invalid",
        },
        {
          status: 400,
        },
      );
    }

    console.log(
      `[NHL Starting Goalies Cron] Starting ${gameDate} supplied-HTML refresh at ${startedAt}`,
    );

    await importNhlStartingGoalies(
      gameDate,
      dailyFaceoffHtml,
    );

    const completedAt = new Date().toISOString();

    console.log(
      `[NHL Starting Goalies Cron] Completed ${gameDate} supplied-HTML refresh at ${completedAt}`,
    );

    return NextResponse.json({
      ok: true,
      gameDate,
      source: "supplied-html",
      startedAt,
      completedAt,
    });
  } catch (error) {
    console.error(
      "[NHL Starting Goalies Cron] Supplied-HTML refresh failed:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown NHL starting goalie import error",
      },
      {
        status: 500,
      },
    );
  }
}
