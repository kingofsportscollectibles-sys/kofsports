import { importNflPropLines } from "../../lib/nfl/import-prop-lines";

async function main() {
  console.log("");
  console.log(
    "🏈 KofSports NFL Prop Line Import",
  );
  console.log(
    "--------------------------------",
  );
  console.log("");

  const result =
    await importNflPropLines();

  console.log("");
  console.log(
    "✅ NFL prop import complete",
  );
  console.log(
    "---------------------------",
  );
  console.log(
    `Events processed:   ${result.eventsProcessed}`,
  );
  console.log(
    `Events with props:  ${result.eventsWithProps}`,
  );
  console.log(
    `Prop rows inserted: ${result.totalRows}`,
  );
}

main().catch((error) => {
  console.error("");
  console.error(
    "❌ NFL prop import failed",
  );
  console.error(error);
  process.exit(1);
});