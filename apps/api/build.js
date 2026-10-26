import { build } from "esbuild";
import { readFileSync } from "fs";

const pkg = JSON.parse(readFileSync("./package.json", "utf8"));
const dependencies = Object.keys(pkg.dependencies || {}).filter((dep) => dep !== "@cirkkl/contracts");

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  outfile: "dist/index.js",
  external: [...dependencies, "pg-native"],
  sourcemap: true,
});
