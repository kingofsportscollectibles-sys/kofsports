import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

type UsageRow = {
  external_game_id: string;
  external_player_id: string;
  season: number;
  week: number;
  game_type: string | null;
  player_name: string | null;
  position: string | null;
  team: string | null;
  opponent: string | null;
  offensive_snaps: number | null;
  offensive_snap_pct: number | null;
  carries: number;
  targets: number;
  receptions: number;
  red_zone_carries: number;
  red_zone_targets: number;
  inside_10_carries: number;
  inside_10_targets: number;
  inside_5_carries: number;
  inside_5_targets: number;
  rushing_tds: number;
  receiving_tds: number;
  total_tds: number;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);

const season = Number(process.argv[2] ?? 2025);
const csvPath =
  process.argv[3] ??
  `/tmp/nfl_player_game_usage_${season}.csv`;

if (!fs.existsSync(csvPath)) {
  throw new Error(`CSV not found: ${csvPath}`);
}

const csv = fs.readFileSync(csvPath, "utf8");

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);

  return values;
}

const lines = csv
  .split(/\r?\n/)
  .filter((line) => line.length > 0);

const headers = parseCsvLine(lines[0]);

const expectedHeaders = [
  "external_game_id",
  "external_player_id",
  "season",
  "week",
  "game_type",
  "player_name",
  "position",
  "team",
  "opponent",
  "offensive_snaps",
  "offensive_snap_pct",
  "carries",
  "targets",
  "receptions",
  "red_zone_carries",
  "red_zone_targets",
  "inside_10_carries",
  "inside_10_targets",
  "inside_5_carries",
  "inside_5_targets",
  "rushing_tds",
  "receiving_tds",
  "total_tds",
];

if (headers.join("|") !== expectedHeaders.join("|")) {
  throw new Error(
    `Unexpected CSV headers:\n${headers.join(",")}`,
  );
}

function nullableString(value: string): string | null {
  return value === "" ? null : value;
}

function nullableNumber(value: string): number | null {
  if (value === "") {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  return number;
}

function requiredNumber(value: string): number {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    throw new Error(`Invalid numeric value: ${value}`);
  }

  return number;
}

const rows: UsageRow[] = lines
  .slice(1)
  .map((line) => {
    const values = parseCsvLine(line);

    const row = Object.fromEntries(
      headers.map((header, index) => [
        header,
        values[index] ?? "",
      ]),
    );

    return {
      external_game_id: row.external_game_id,
      external_player_id: row.external_player_id,
      season: requiredNumber(row.season),
      week: requiredNumber(row.week),
      game_type: nullableString(row.game_type),
      player_name: nullableString(row.player_name),
      position: nullableString(row.position),
      team: nullableString(row.team),
      opponent: nullableString(row.opponent),
      offensive_snaps: nullableNumber(
        row.offensive_snaps,
      ),
      offensive_snap_pct: nullableNumber(
        row.offensive_snap_pct,
      ),
      carries: requiredNumber(row.carries),
      targets: requiredNumber(row.targets),
      receptions: requiredNumber(row.receptions),
      red_zone_carries: requiredNumber(
        row.red_zone_carries,
      ),
      red_zone_targets: requiredNumber(
        row.red_zone_targets,
      ),
      inside_10_carries: requiredNumber(
        row.inside_10_carries,
      ),
      inside_10_targets: requiredNumber(
        row.inside_10_targets,
      ),
      inside_5_carries: requiredNumber(
        row.inside_5_carries,
      ),
      inside_5_targets: requiredNumber(
        row.inside_5_targets,
      ),
      rushing_tds: requiredNumber(
        row.rushing_tds,
      ),
      receiving_tds: requiredNumber(
        row.receiving_tds,
      ),
      total_tds: requiredNumber(row.total_tds),
    };
  });

console.log(
  `Prepared ${rows.length.toLocaleString()} rows for ${season}.`,
);

const batchSize = 500;

async function run() {
  for (
    let start = 0;
    start < rows.length;
    start += batchSize
  ) {
    const batch = rows.slice(
      start,
      start + batchSize,
    );

    const { error } = await supabase
      .from("nfl_player_game_usage")
      .upsert(batch, {
        onConflict:
          "external_game_id,external_player_id",
      });

    if (error) {
      throw new Error(
        `Batch starting at ${start} failed: ${error.message}`,
      );
    }

    console.log(
      `Imported ${Math.min(
        start + batch.length,
        rows.length,
      ).toLocaleString()} / ${rows.length.toLocaleString()}`,
    );
  }

  console.log(
    `Finished importing ${rows.length.toLocaleString()} player-game usage rows.`,
  );
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
