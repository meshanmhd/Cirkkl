import { build } from "esbuild";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(__dirname, "package.json"), "utf8"));
const dependencies = Object.keys(pkg.dependencies || {}).filter((dep) => dep !== "@cirkkl/contracts");

await build({
  entryPoints: [resolve(__dirname, "src/index.ts")],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  outfile: resolve(__dirname, "dist/index.js"),
  external: [...dependencies, "pg-native"],
  sourcemap: true,
});
