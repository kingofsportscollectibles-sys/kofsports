import { NextRequest, NextResponse } from "next/server";

import { importNflPlayerStats } from "@/lib/nfl/import-player-stats";

import { importNflPlayerGameUsage } from "@/lib/nfl/import-player-game-usage";
import { importNflSchedule } from "@/lib/nfl/import-schedule";

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

  const runImport = async <T>(
    name: string,
    importer: () => Promise<T>,
  ) => {
    try {
      const result = await importer();

      return {
        ok: true as const,
        result,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      console.error(
        `NFL results cron: ${name} failed:`,
        error,
      );

      return {
        ok: false as const,
        error: message,
      };
    }
  };

  const schedule = await runImport(
    "schedule",
    () => importNflSchedule(2026),
  );

  const playerStats = await runImport(
    "player stats",
    () => importNflPlayerStats(2026),
  );

  const playerGameUsage = await runImport(
    "player game usage",
    () => importNflPlayerGameUsage(2026),
  );

  const ok =
    schedule.ok &&
    playerStats.ok &&
    playerGameUsage.ok;

  return NextResponse.json(
    {
      ok,
      schedule,
      playerStats,
      playerGameUsage,
    },
    {
      status: ok ? 200 : 207,
    },
  );
}