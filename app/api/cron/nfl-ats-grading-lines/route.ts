import { NextRequest, NextResponse } from "next/server";

import { importNflAtsGradingLines } from "@/lib/nfl/import-ats-grading-lines";

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
      `[NFL ATS Grading Lines Cron] Starting capture at ${startedAt}`,
    );

    const result = await importNflAtsGradingLines();

    const completedAt = new Date().toISOString();

    console.log(
      `[NFL ATS Grading Lines Cron] Completed capture at ${completedAt}`,
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
      "[NFL ATS Grading Lines Cron] Capture failed:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown NFL ATS grading line import error",
      },
      {
        status: 500,
      },
    );
  }
}
