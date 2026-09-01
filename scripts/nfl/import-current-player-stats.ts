import { importNflPlayerStats } from "@/lib/nfl/import-player-stats";

async function main() {
  const seasonArg = process.argv[2];
  const season = seasonArg ? Number(seasonArg) : 2026;

  if (!Number.isInteger(season)) {
    throw new Error(`Invalid season: ${seasonArg}`);
  }

  console.log(`🏈 KofSports NFL ${season} Player Stats Import`);
  console.log("----------------------------------------");

  const result = await importNflPlayerStats(season);

  if (!result.sourceAvailable) {
    console.log(
      `No nflverse weekly player stats file is available yet for ${season}.`,
    );
    console.log("No database changes were made.");
    return;
  }

  console.log(`Source rows:     ${result.sourceRows}`);
  console.log(`Eligible rows:   ${result.eligibleRows}`);
  console.log(`Games matched:   ${result.gamesMatched}`);
  console.log(`Rows upserted:   ${result.rowsUpserted}`);
  console.log(
    `Latest week:     ${result.latestWeek ?? "none"}`,
  );

  console.log("");
  console.log("✅ Player stats import complete");
}

main().catch((error) => {
  console.error("");
  console.error("❌ Player stats import failed");
  console.error(error);
  process.exit(1);
});