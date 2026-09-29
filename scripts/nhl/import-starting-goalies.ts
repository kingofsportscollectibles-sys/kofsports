import { importNhlStartingGoalies } from "../../lib/nhl/import-starting-goalies";

importNhlStartingGoalies(process.argv[2]).catch((error) => {
  console.error(error);
  process.exit(1);
});
