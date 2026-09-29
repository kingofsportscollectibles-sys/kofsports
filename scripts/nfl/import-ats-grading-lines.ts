import { importNflAtsGradingLines } from "../../lib/nfl/import-ats-grading-lines";

async function main() {
  const result = await importNflAtsGradingLines();

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
