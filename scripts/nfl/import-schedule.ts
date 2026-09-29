import { importNflSchedule } from "../../lib/nfl/import-schedule";

async function main() {
  const seasonArgument = process.argv[2];

  if (!seasonArgument) {
    console.error("");
    console.error("Usage:");
    console.error(
      "npx tsx --env-file=.env.local scripts/nfl/import-schedule.ts 2026",
    );
    console.error("");

    process.exit(1);
  }

  const targetSeason = Number(seasonArgument);

  await importNflSchedule(targetSeason);
}

main().catch((error) => {
  console.error("");
  console.error(
    "💥 NFL schedule import failed",
  );

  console.error(
    error instanceof Error
      ? error.message
      : error,
  );

  console.error("");

  process.exit(1);
});
