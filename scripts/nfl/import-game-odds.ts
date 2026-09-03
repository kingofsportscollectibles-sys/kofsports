import { importNflGameOdds } from "../../lib/nfl/import-game-odds";

async function main() {
  try {
    const result = await importNflGameOdds();
    console.log(result);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
