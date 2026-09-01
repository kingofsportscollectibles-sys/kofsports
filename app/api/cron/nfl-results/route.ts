import { NextRequest, NextResponse } from "next/server";

import { importNflPlayerStats } from "@/lib/nfl/import-player-stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("NFL results cron: CRON_SECRET is not configured.");

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
    const result = await importNflPlayerStats(2026);

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    console.error("NFL results cron failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown NFL results import error",
      },
      {
        status: 500,
      },
    );
  }
}