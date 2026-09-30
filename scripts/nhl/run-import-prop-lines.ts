import { importNhlPropLines } from "./import-prop-lines";

importNhlPropLines().catch((error) => {
  console.error(error);
  process.exit(1);
});
