// There is no bundler: the app ships as static files. "Build" verifies that
// every module referenced from index.html and src/ resolves, by importing the
// module graph in Node (DOM-free modules) and syntax-checking the rest.
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

/** @param {string} dir @returns {Promise<string[]>} */
async function walk(dir) {
  const out = [];
  for (const d of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, d.name);
    if (d.isDirectory()) out.push(...(await walk(p)));
    else if (d.name.endsWith(".js")) out.push(p);
  }
  return out;
}

const files = await walk(join(root, "src"));
let failed = 0;
for (const f of files) {
  const r = spawnSync(process.execPath, ["--check", f], { encoding: "utf8" });
  if (r.status !== 0) { failed++; console.error(`Syntax error in ${f}\n${r.stderr}`); }
}
// Import DOM-free layers for real to catch broken import paths.
for (const rel of ["src/domain/duration.js", "src/domain/dates.js", "src/domain/models.js", "src/domain/totals.js", "src/domain/validation.js",
  "src/data/storage.js", "src/data/seed.js", "src/data/customerRepository.js", "src/data/portfolioRepository.js",
  "src/data/timeEntryRepository.js", "src/data/timeEntryDestination.js", "src/app/session.js", "src/app/timeEntryService.js"]) {
  try { await import(pathToFileURL(join(root, rel)).href); } catch (e) { failed++; console.error(`Import failed: ${rel}`, e); }
}
const html = await readFile(join(root, "index.html"), "utf8");
for (const ref of ["styles.css", "src/app.js", "assets/icon.svg"]) {
  if (!html.includes(ref)) { failed++; console.error(`index.html does not reference ${ref}`); }
}
if (failed) { console.error(`Build check failed (${failed}).`); process.exit(1); }
console.log(`Build check passed: ${files.length} modules OK.`);
