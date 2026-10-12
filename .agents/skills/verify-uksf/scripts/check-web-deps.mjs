import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const webDir = process.argv[2];
if (!webDir) {
  console.error("usage: check-web-deps.mjs <web-checkout>");
  process.exit(2);
}

const manifestPath = join(webDir, "package.json");
if (!existsSync(manifestPath)) {
  console.error(`refusing: ${webDir} has no package.json; set UKSF_WEB_DIR to a web checkout`);
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const declared = Object.keys({ ...manifest.dependencies, ...manifest.devDependencies });
const missing = declared.filter((name) => !existsSync(join(webDir, "node_modules", name, "package.json")));

if (missing.length > 0) {
  console.error(`refusing: ${missing.length} declared packages are not installed in ${webDir}/node_modules (${missing.slice(0, 5).join(", ")}${missing.length > 5 ? ", ..." : ""}); run 'bun install --frozen-lockfile' there`);
  process.exit(1);
}
