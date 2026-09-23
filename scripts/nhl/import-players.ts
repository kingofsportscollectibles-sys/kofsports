import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

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

const NHL_TEAMS = [
  "ANA",
  "BOS",
  "BUF",
  "CAR",
  "CBJ",
  "CGY",
  "CHI",
  "COL",
  "DAL",
  "DET",
  "EDM",
  "FLA",
  "LAK",
  "MIN",
  "MTL",
  "NJD",
  "NSH",
  "NYI",
  "NYR",
  "OTT",
  "PHI",
  "PIT",
  "SEA",
  "SJS",
  "STL",
  "TBL",
  "TOR",
  "UTA",
  "VAN",
  "VGK",
  "WPG",
  "WSH",
] as const;

type LocalizedName = {
  default?: string;
};

type NhlRosterPlayer = {
  id: number;
  headshot?: string;
  firstName?: LocalizedName;
  lastName?: LocalizedName;
  sweaterNumber?: number;
  positionCode?: string;
  shootsCatches?: string;
  heightInInches?: number;
  weightInPounds?: number;
  birthDate?: string;
  birthCity?: LocalizedName;
  birthCountry?: string;
};

type NhlRosterResponse = {
  forwards?: NhlRosterPlayer[];
  defensemen?: NhlRosterPlayer[];
  goalies?: NhlRosterPlayer[];
};

type NhlPlayerRow = {
  id: number;
  first_name: string;
  last_name: string;
  player_name: string;
  team: string;
  position: string;
  sweater_number: number | null;
  shoots_catches: string | null;
  headshot_url: string | null;
  height_inches: number | null;
  weight_pounds: number | null;
  birth_date: string | null;
  birth_city: string | null;
  birth_country: string | null;
  active: boolean;
  updated_at: string;
};

async function fetchRoster(
  team: string
): Promise<NhlRosterResponse> {
  const url =
    `https://api-web.nhle.com/v1/roster/${team}/current`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `NHL roster request failed for ${team}: ` +
        `${response.status} ${response.statusText}`
    );
  }

  return (await response.json()) as NhlRosterResponse;
}

function buildPlayerRow(
  player: NhlRosterPlayer,
  team: string,
  updatedAt: string
): NhlPlayerRow | null {
  const firstName = player.firstName?.default?.trim() ?? "";
  const lastName = player.lastName?.default?.trim() ?? "";
  const position = player.positionCode?.trim() ?? "";

  if (
    !player.id ||
    !firstName ||
    !lastName ||
    !position
  ) {
    return null;
  }

  return {
    id: player.id,
    first_name: firstName,
    last_name: lastName,
    player_name: `${firstName} ${lastName}`,
    team,
    position,
    sweater_number: player.sweaterNumber ?? null,
    shoots_catches: player.shootsCatches ?? null,
    headshot_url: player.headshot ?? null,
    height_inches: player.heightInInches ?? null,
    weight_pounds: player.weightInPounds ?? null,
    birth_date: player.birthDate ?? null,
    birth_city: player.birthCity?.default ?? null,
    birth_country: player.birthCountry ?? null,
    active: true,
    updated_at: updatedAt,
  };
}

async function main() {
  const updatedAt = new Date().toISOString();
  const players = new Map<number, NhlPlayerRow>();

  for (const team of NHL_TEAMS) {
    console.log(`Fetching ${team} roster...`);

    const roster = await fetchRoster(team);

    const rosterPlayers = [
      ...(roster.forwards ?? []),
      ...(roster.defensemen ?? []),
      ...(roster.goalies ?? []),
    ];

    let accepted = 0;

    for (const player of rosterPlayers) {
      const row = buildPlayerRow(
        player,
        team,
        updatedAt
      );

      if (!row) {
        console.warn(
          `Skipping incomplete player on ${team}:`,
          player.id
        );
        continue;
      }

      players.set(row.id, row);
      accepted += 1;
    }

    console.log(
      `${team}: ${accepted}/${rosterPlayers.length} players accepted`
    );
  }

  const rows = Array.from(players.values());

  if (rows.length === 0) {
    throw new Error(
      "NHL roster import returned zero players. Aborting."
    );
  }

  console.log(
    `Upserting ${rows.length} unique NHL players...`
  );

  const batchSize = 250;

  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize);

    const { error } = await supabase
      .from("nhl_players")
      .upsert(batch, {
        onConflict: "id",
      });

    if (error) {
      throw new Error(
        `Failed to upsert NHL players: ${error.message}`
      );
    }
  }

  console.log(
    `NHL player import complete: ${rows.length} players`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
