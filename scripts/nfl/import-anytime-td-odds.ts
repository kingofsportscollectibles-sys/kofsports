import { importNflAnytimeTdOdds } from "../../lib/nfl/import-anytime-td-odds";

async function main() {
  const result = await importNflAnytimeTdOdds();

  console.log("Anytime TD import complete:");
  console.log(result);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
