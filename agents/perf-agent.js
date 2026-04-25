#!/usr/bin/env node
/**
 * Performance Agent -- mern-ecommerce
 * Statically audits backend source for known performance anti-patterns.
 */
"use strict";
const fs   = require("fs");
const path = require("path");
const ROOT    = path.resolve(__dirname, "..");
const BACKEND = path.join(ROOT, "backend");

const issues = [];

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules",".git","__tests__"].includes(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { scanDir(full); continue; }
    if (!/\.js$/.test(e.name)) continue;
    const src  = fs.readFileSync(full, "utf8");
    const rel  = path.relative(ROOT, full);
    const lines = src.split("\n");
    lines.forEach((line, i) => {
      const L = i + 1;
      // Sequential awaits inside loops
      if (/for\s*\(/.test(line) && lines[i+1] && /await/.test(lines[i+1]))
        issues.push({ file: rel, line: L, msg: "Sequential await inside for-loop — use Promise.all()" });
      // Unbounded .find() with no .limit()
      if (/\.find\(\)/.test(line) && !line.includes(".limit("))
        issues.push({ file: rel, line: L, msg: "Unbounded .find() — add .limit() or pagination" });
      // Deprecated .remove()
      if (/\.remove\(\)/.test(line))
        issues.push({ file: rel, line: L, msg: "Deprecated .remove() — use .deleteOne()" });
      // useFindAndModify deprecated option
      if (/useFindAndModify/.test(line))
        issues.push({ file: rel, line: L, msg: "useFindAndModify removed in Mongoose 6+" });
    });
  }
}

console.log("\n⚡  [perf-agent] Scanning backend for performance issues ...\n");
scanDir(BACKEND);

console.log("─── Performance Agent Report ────────────────────────");
if (issues.length === 0) {
  console.log("  ✅  No performance issues found.");
} else {
  for (const i of issues)
    console.log(`  ⚠️   ${i.file}:${i.line}  ${i.msg}`);
}
console.log("─────────────────────────────────────────────────────\n");
