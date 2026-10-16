import "dotenv/config";
import { importNbaPropLines } from "../../lib/nba/import-prop-lines";

async function main() {
  console.log("Starting NBA prop line import...");

  const result = await importNbaPropLines();

  console.log("NBA prop line import complete:");
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error("NBA prop line import failed:");
  console.error(error);
  process.exit(1);
});
