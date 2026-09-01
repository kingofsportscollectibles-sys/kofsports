import fs from "node:fs";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";
import { parse } from "csv-parse/sync";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

type CsvRow = {
  season?: string;
  team?: string;
  position?: string;
  status?: string;
  full_name?: string;
  gsis_id?: string;
  sleeper_id?: string;
  week?: string;
  game_type?: string;
};

type CurrentRosterRow = {
  season: number;
  player_name: string;
  team: string;
  position: string | null;
  status: string | null;
  gsis_id: string | null;
  sleeper_id: string | null;
  roster_week: number | null;
  game_type: string | null;
  updated_at: string;
};

function clean(value: string | undefined): string | null {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

function normalizeNameForKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+(jr|sr|ii|iii|iv)$/i, "")
    .trim();
}

function parseNumber(value: string | undefined): number | null {
  const cleaned = clean(value);

  if (!cleaned) {
    return null;
  }

  const parsed = Number(cleaned);

  return Number.isFinite(parsed) ? parsed : null;
}

function rosterPriority(row: CurrentRosterRow): number {
  /*
   * Prefer regular-season records over preseason records when
   * the same player has records for both.
   */
  if (row.game_type === "REG") {
    return 3;
  }

  if (row.game_type === "POST") {
    return 2;
  }

  if (row.game_type === "PRE") {
    return 1;
  }

  return 0;
}

function shouldReplace(
  existing: CurrentRosterRow,
  candidate: CurrentRosterRow
): boolean {
  const existingWeek = existing.roster_week ?? -1;
  const candidateWeek = candidate.roster_week ?? -1;

  if (candidateWeek > existingWeek) {
    return true;
  }

  if (candidateWeek < existingWeek) {
    return false;
  }

  return rosterPriority(candidate) > rosterPriority(existing);
}

async function main() {
  const seasonArg = process.argv[2] ?? "2026";
  const season = Number(seasonArg);

  if (!Number.isInteger(season)) {
    throw new Error(`Invalid season: ${seasonArg}`);
  }

  const fileArg =
    process.argv[3] ?? `data/nfl/${season}-rosters.csv`;

  const filePath = path.resolve(process.cwd(), fileArg);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Roster CSV not found: ${filePath}`);
  }

  console.log(`🏈 KofSports NFL ${season} Current Roster Import`);
  console.log("---------------------------------------------");
  console.log(`Reading: ${fileArg}`);

  const csv = fs.readFileSync(filePath, "utf8");

  const rows = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  }) as CsvRow[];

  console.log(`CSV rows: ${rows.length}`);

  const currentPlayers = new Map<string, CurrentRosterRow>();

  let skipped = 0;

  for (const row of rows) {
    const rowSeason = parseNumber(row.season);
    const playerName = clean(row.full_name);
    const team = clean(row.team);

    if (rowSeason !== season || !playerName || !team) {
      skipped += 1;
      continue;
    }

    const currentRow: CurrentRosterRow = {
      season,
      player_name: playerName,
      team,
      position: clean(row.position),
      status: clean(row.status),
      gsis_id: clean(row.gsis_id),
      sleeper_id: clean(row.sleeper_id),
      roster_week: parseNumber(row.week),
      game_type: clean(row.game_type),
      updated_at: new Date().toISOString(),
    };

    const key = `${season}|||${normalizeNameForKey(playerName)}`;

    const existing = currentPlayers.get(key);

    if (!existing || shouldReplace(existing, currentRow)) {
      currentPlayers.set(key, currentRow);
    }
  }

  const importRows = Array.from(currentPlayers.values());

  console.log(`Unique current players: ${importRows.length}`);
  console.log(`Skipped CSV rows: ${skipped}`);

  if (importRows.length === 0) {
    throw new Error("No roster rows were produced. Import aborted.");
  }

  /*
   * Replace the season snapshot.
   *
   * This prevents players who disappear from a future roster feed
   * from remaining incorrectly marked as current.
   */
  const { error: deleteError } = await supabase
    .from("nfl_player_current_teams")
    .delete()
    .eq("season", season);

  if (deleteError) {
    throw new Error(
      `Failed deleting existing ${season} roster: ${deleteError.message}`
    );
  }

  const batchSize = 500;

  let inserted = 0;

  for (let i = 0; i < importRows.length; i += batchSize) {
    const batch = importRows.slice(i, i + batchSize);

    const { error } = await supabase
      .from("nfl_player_current_teams")
      .insert(batch);

    if (error) {
      throw new Error(
        `Roster insert failed at batch ${i / batchSize + 1}: ${error.message}`
      );
    }

    inserted += batch.length;
  }

  console.log("");
  console.log("✅ Current roster import complete");
  console.log("---------------------------------");
  console.log(`Season:           ${season}`);
  console.log(`Players inserted: ${inserted}`);
}

main().catch((error) => {
  console.error("");
  console.error("❌ Current roster import failed");
  console.error(error);

  process.exit(1);
});