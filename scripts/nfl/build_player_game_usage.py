import sys

import pandas as pd

SEASON = int(sys.argv[1]) if len(sys.argv) > 1 else 2026

SNAPS_URL = (
    f"https://github.com/nflverse/nflverse-data/releases/download/"
    f"snap_counts/snap_counts_{SEASON}.parquet"
)

PBP_URL = (
    f"https://github.com/nflverse/nflverse-data/releases/download/"
    f"pbp/play_by_play_{SEASON}.parquet"
)

PLAYERS_URL = (
    "https://github.com/nflverse/nflverse-data/releases/download/"
    "players/players.csv"
)

print(f"Loading {SEASON} snap counts...")
snaps = pd.read_parquet(
    SNAPS_URL,
    columns=[
        "game_id",
        "season",
        "game_type",
        "week",
        "player",
        "pfr_player_id",
        "position",
        "team",
        "opponent",
        "offense_snaps",
        "offense_pct",
    ],
)

print(f"Loading {SEASON} play-by-play...")
pbp = pd.read_parquet(
    PBP_URL,
    columns=[
        "game_id",
        "week",
        "posteam",
        "defteam",
        "yardline_100",
        "rush_attempt",
        "pass_attempt",
        "rusher_player_id",
        "rusher_player_name",
        "receiver_player_id",
        "receiver_player_name",
        "complete_pass",
        "rush_touchdown",
        "pass_touchdown",
    ],
)

print("Loading player ID map...")
players = pd.read_csv(
    PLAYERS_URL,
    usecols=[
        "gsis_id",
        "pfr_id",
        "display_name",
        "position",
    ],
)

skill_positions = {"QB", "RB", "WR", "TE"}

# --------------------------------------------------
# PLAYER MAPS
# --------------------------------------------------

player_map = (
    players[
        players["gsis_id"].notna()
    ][
        [
            "gsis_id",
            "pfr_id",
            "display_name",
            "position",
        ]
    ]
    .drop_duplicates(subset=["gsis_id"])
)

pfr_map = (
    players[
        players["gsis_id"].notna()
        & players["pfr_id"].notna()
    ][
        [
            "gsis_id",
            "pfr_id",
            "display_name",
        ]
    ]
    .drop_duplicates(subset=["pfr_id"])
)

# --------------------------------------------------
# SNAP COUNTS
# --------------------------------------------------

snaps = snaps[
    snaps["position"].isin(skill_positions)
].copy()

snaps = snaps.merge(
    pfr_map,
    left_on="pfr_player_id",
    right_on="pfr_id",
    how="left",
)

unmatched_snaps = snaps[
    snaps["gsis_id"].isna()
].copy()

print(
    f"Snap rows: {len(snaps):,} | "
    f"Matched IDs: {snaps['gsis_id'].notna().sum():,} | "
    f"Unmatched IDs: {len(unmatched_snaps):,}"
)

snap_usage = snaps[
    snaps["gsis_id"].notna()
].copy()

snap_usage = snap_usage.rename(
    columns={
        "gsis_id": "external_player_id",
        "display_name": "player_name",
        "offense_snaps": "offensive_snaps",
        "offense_pct": "offensive_snap_pct",
    }
)

snap_usage = snap_usage[
    [
        "game_id",
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
    ]
]

# --------------------------------------------------
# RUSHING USAGE
# --------------------------------------------------

rushes = pbp[
    (pbp["rush_attempt"] == 1)
    & pbp["rusher_player_id"].notna()
].copy()

rushes["red_zone_carry"] = (
    rushes["yardline_100"].notna()
    & (rushes["yardline_100"] <= 20)
).astype(int)

rushes["inside_10_carry"] = (
    rushes["yardline_100"].notna()
    & (rushes["yardline_100"] <= 10)
).astype(int)

rushes["inside_5_carry"] = (
    rushes["yardline_100"].notna()
    & (rushes["yardline_100"] <= 5)
).astype(int)

rushes["rushing_td"] = (
    rushes["rush_touchdown"].fillna(0) == 1
).astype(int)

rush_usage = (
    rushes.groupby(
        ["game_id", "rusher_player_id"],
        dropna=False,
    )
    .agg(
        carries=("rush_attempt", "sum"),
        red_zone_carries=("red_zone_carry", "sum"),
        inside_10_carries=("inside_10_carry", "sum"),
        inside_5_carries=("inside_5_carry", "sum"),
        rushing_tds=("rushing_td", "sum"),
    )
    .reset_index()
    .rename(
        columns={
            "rusher_player_id": "external_player_id",
        }
    )
)

# --------------------------------------------------
# RECEIVING USAGE
# --------------------------------------------------

targets = pbp[
    (pbp["receiver_player_id"].notna())
    & (pbp["pass_attempt"] == 1)
].copy()

targets["red_zone_target"] = (
    targets["yardline_100"].notna()
    & (targets["yardline_100"] <= 20)
).astype(int)

targets["inside_10_target"] = (
    targets["yardline_100"].notna()
    & (targets["yardline_100"] <= 10)
).astype(int)

targets["inside_5_target"] = (
    targets["yardline_100"].notna()
    & (targets["yardline_100"] <= 5)
).astype(int)

targets["reception"] = (
    targets["complete_pass"].fillna(0) == 1
).astype(int)

targets["receiving_td"] = (
    targets["pass_touchdown"].fillna(0) == 1
).astype(int)

receiving_usage = (
    targets.groupby(
        ["game_id", "receiver_player_id"],
        dropna=False,
    )
    .agg(
        targets=("receiver_player_id", "size"),
        receptions=("reception", "sum"),
        red_zone_targets=("red_zone_target", "sum"),
        inside_10_targets=("inside_10_target", "sum"),
        inside_5_targets=("inside_5_target", "sum"),
        receiving_tds=("receiving_td", "sum"),
    )
    .reset_index()
    .rename(
        columns={
            "receiver_player_id": "external_player_id",
        }
    )
)

# --------------------------------------------------
# COMBINE PBP USAGE
# --------------------------------------------------

pbp_usage = pd.merge(
    rush_usage,
    receiving_usage,
    on=["game_id", "external_player_id"],
    how="outer",
)

count_columns = [
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
]

for column in count_columns:
    pbp_usage[column] = (
        pbp_usage[column]
        .fillna(0)
        .astype(int)
    )

pbp_usage["total_tds"] = (
    pbp_usage["rushing_tds"]
    + pbp_usage["receiving_tds"]
)

# --------------------------------------------------
# ADD PBP METADATA
# --------------------------------------------------

pbp_metadata = pd.concat(
    [
        pbp[
            pbp["rusher_player_id"].notna()
        ][
            [
                "game_id",
                "week",
                "posteam",
                "defteam",
                "rusher_player_id",
            ]
        ].rename(
            columns={
                "rusher_player_id": "external_player_id",
                "posteam": "pbp_team",
                "defteam": "pbp_opponent",
            }
        ),
        pbp[
            pbp["receiver_player_id"].notna()
        ][
            [
                "game_id",
                "week",
                "posteam",
                "defteam",
                "receiver_player_id",
            ]
        ].rename(
            columns={
                "receiver_player_id": "external_player_id",
                "posteam": "pbp_team",
                "defteam": "pbp_opponent",
            }
        ),
    ],
    ignore_index=True,
)

pbp_metadata = (
    pbp_metadata
    .drop_duplicates(
        subset=[
            "game_id",
            "external_player_id",
        ]
    )
)

pbp_usage = pbp_usage.merge(
    pbp_metadata,
    on=[
        "game_id",
        "external_player_id",
    ],
    how="left",
)

pbp_usage = pbp_usage.merge(
    player_map[
        [
            "gsis_id",
            "display_name",
            "position",
        ]
    ],
    left_on="external_player_id",
    right_on="gsis_id",
    how="left",
)

pbp_usage = pbp_usage.rename(
    columns={
        "display_name": "pbp_player_name",
        "position": "pbp_position",
    }
)

# --------------------------------------------------
# MERGE SNAP + PBP DATA
# --------------------------------------------------

usage = snap_usage.merge(
    pbp_usage,
    on=[
        "game_id",
        "external_player_id",
    ],
    how="outer",
)

# Fill metadata for PBP-only players.
usage["season"] = usage["season"].fillna(SEASON)

usage["week"] = (
    usage["week_x"]
    .combine_first(usage["week_y"])
    if "week_x" in usage.columns
    else usage["week"]
)

usage["player_name"] = (
    usage["player_name"]
    .combine_first(usage["pbp_player_name"])
)

usage["position"] = (
    usage["position"]
    .combine_first(usage["pbp_position"])
)

usage["team"] = (
    usage["team"]
    .combine_first(usage["pbp_team"])
)

usage["opponent"] = (
    usage["opponent"]
    .combine_first(usage["pbp_opponent"])
)

usage["game_type"] = usage["game_type"].fillna("REG")

for column in count_columns + ["total_tds"]:
    usage[column] = (
        usage[column]
        .fillna(0)
        .astype(int)
    )

# Keep missing snap data as null rather than pretending
# a missing snap-count record means zero snaps.
usage["offensive_snaps"] = (
    pd.to_numeric(
        usage["offensive_snaps"],
        errors="coerce",
    )
)

usage["offensive_snap_pct"] = (
    pd.to_numeric(
        usage["offensive_snap_pct"],
        errors="coerce",
    )
)

# Only keep the positions used by the KOF offensive tools.
usage = usage[
    usage["position"].isin(skill_positions)
].copy()

usage["season"] = usage["season"].astype(int)
usage["week"] = usage["week"].astype(int)

# --------------------------------------------------
# FINAL DATABASE SHAPE
# --------------------------------------------------

usage = usage.rename(
    columns={
        "game_id": "external_game_id",
    }
)

final_columns = [
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
]

usage = usage[final_columns]

# --------------------------------------------------
# EXPORT
# --------------------------------------------------

output_path = f"/tmp/nfl_player_game_usage_{SEASON}.csv"

usage.to_csv(
    output_path,
    index=False,
)

print(f"\nExported dataset to: {output_path}")

# --------------------------------------------------
# VALIDATION
# --------------------------------------------------

print("\nFINAL ROWS:", len(usage))

print(
    "ROWS WITH SNAP DATA:",
    usage["offensive_snaps"].notna().sum(),
)

print(
    "PBP-ONLY ROWS:",
    usage["offensive_snaps"].isna().sum(),
)

print("\nJAMES CONNER SAMPLE:")
print(
    usage[
        usage["player_name"]
        .astype(str)
        .str.contains(
            "James Conner",
            case=False,
            na=False,
        )
    ]
    .head(5)
    .to_string(index=False)
)

print("\nPBP-ONLY SAMPLE:")
print(
    usage[
        usage["offensive_snaps"].isna()
    ]
    .head(20)
    .to_string(index=False)
)

print("\nUNMATCHED SNAP PLAYER SAMPLE:")
print(
    unmatched_snaps[
        [
            "player",
            "pfr_player_id",
            "position",
            "team",
        ]
    ]
    .drop_duplicates()
    .head(20)
    .to_string(index=False)
)
