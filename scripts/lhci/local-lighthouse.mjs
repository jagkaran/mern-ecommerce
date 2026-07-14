#!/usr/bin/env node
// scripts/lhci/local-lighthouse.mjs
// Local Lighthouse smoke runner. Not a CI gate. Captures baseline + post-change scores.
import { launch } from "chrome-launcher";
import lighthouse from "lighthouse";
import fs from "node:fs/promises";
import path from "node:path";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000/api/v1";
const OUTPUT_DIR = path.resolve("docs/perf");

async function getProductId() {
  const res = await fetch(`${BACKEND_URL}/products?limit=1`);
  if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`);
  const json = await res.json();
  const p = json?.products?.[0];
  if (!p?._id) throw new Error("No products found in DB; seed first.");
  return p._id;
}

const CATEGORIES = ["accessibility", "performance", "best-practices", "seo"];

async function runOne(url, formFactor) {
  const chrome = await launch({
    chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"],
  });
  try {
    const result = await lighthouse(url, {
      port: chrome.port,
      logLevel: "error",
      output: "json",
      onlyCategories: CATEGORIES,
      formFactor,
      screenEmulation:
        formFactor === "mobile"
          ? { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false }
          : { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false },
      throttling:
        formFactor === "mobile"
          ? { rttMs: 150, throughputKbps: 1638.4, cpuSlowdownMultiplier: 4, requestLatencyMs: 0, downloadThroughputKbps: 0, uploadThroughputKbps: 0 }
          : { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1, requestLatencyMs: 0, downloadThroughputKbps: 0, uploadThroughputKbps: 0 },
    });
    const cats = result.lhr.categories;
    return Object.fromEntries(CATEGORIES.map(c => [c, Math.round((cats[c]?.score ?? 0) * 100)]));
  } finally {
    await chrome.kill();
  }
}

function fmt(table) {
  console.table(table);
}

async function main() {
  const productId = await getProductId();
  const pages = {
    home: `${FRONTEND_URL}/`,
    pdp: `${FRONTEND_URL}/product/${productId}`,
  };
  const out = { date: new Date().toISOString(), scores: {} };
  const flat = [];
  for (const [name, url] of Object.entries(pages)) {
    out.scores[name] = {};
    for (const ff of ["mobile", "desktop"]) {
      process.stdout.write(`▶ ${name} ${ff} ... `);
      try {
        const scores = await runOne(url, ff);
        out.scores[name][ff] = scores;
        flat.push({ page: name, viewport: ff, ...scores });
        process.stdout.write("ok\n");
      } catch (e) {
        process.stdout.write(`FAIL: ${e.message}\n`);
        out.scores[name][ff] = { error: e.message };
        flat.push({ page: name, viewport: ff, error: e.message });
      }
    }
  }
  fmt(flat);
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const file = path.join(OUTPUT_DIR, `baseline-${stamp}.json`);
  await fs.writeFile(file, JSON.stringify(out, null, 2));
  console.log(`\n✓ scores written to ${file}`);
  process.exit(0); // smoke, never gate
}

main().catch(e => {
  console.error(e);
  process.exit(0); // smoke, never gate
});
