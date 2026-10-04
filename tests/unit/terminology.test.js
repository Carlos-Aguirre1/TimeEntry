// Guard: no sports / evaluation terminology may leak into the TimeEntry app.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const FORBIDDEN = [/\bsoccer\b/i, /\bcoach(es)?\b/i, /\bplayers?\b/i, /\bevaluations?\b/i, /\broster\b/i, /\bjersey\b/i, /\bOSC\b/, /\bPE1\b/, /\bMCPME\b/, /\bteams?\b/i, /\bratings?\b/i, /\bOakville\b/i];

/** @param {string} dir @returns {Promise<string[]>} */
async function walk(dir) {
  const out = [];
  for (const d of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, d.name);
    if (d.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

test("no reference-app terminology in shipped files", async () => {
  const files = [join(root, "index.html"), join(root, "styles.css"), join(root, "README.md"), ...(await walk(join(root, "src")))];
  /** @type {string[]} */
  const hits = [];
  for (const f of files) {
    const text = await readFile(f, "utf8");
    for (const re of FORBIDDEN) {
      const m = re.exec(text);
      if (m) hits.push(`${f.replace(root + "/", "")}: "${m[0]}"`);
    }
  }
  assert.deepEqual(hits, [], `Forbidden terminology found:\n${hits.join("\n")}`);
});
