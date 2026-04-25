#!/usr/bin/env node
/**
 * Critic Agent -- mern-ecommerce
 * Architecture & code-quality review: HTTP status codes, async patterns,
 * missing indexes, error handling, scalability smells.
 */
"use strict";
const fs   = require("fs");
const path = require("path");
const ROOT    = path.resolve(__dirname, "..");
const BACKEND = path.join(ROOT, "backend");

const findings = [];
const note = (severity, file, line, msg) => findings.push({ severity, file, line, msg });

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules",".git","__tests__"].includes(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { scanDir(full); continue; }
    if (!/\.js$/.test(e.name)) continue;
    const src   = fs.readFileSync(full, "utf8");
    const rel   = path.relative(ROOT, full);
    const lines = src.split("\n");
    lines.forEach((line, i) => {
      const L = i + 1;
      // Wrong status on GET
      if (/res\.status\(201\)\.json/.test(line) && /get/i.test(rel))
        note("HIGH", rel, L, "GET endpoint returning 201 (Created) — should be 200");
      // forEach with async callback
      if (/forEach\(async/.test(line))
        note("HIGH", rel, L, "forEach(async) swallows errors — use for..of or Promise.all");
      // No null-check after findById
      if (/await.*findById/.test(line) && !lines[i+1]?.includes("if (!"))
        note("MEDIUM", rel, L, "findById result not null-checked on next line");
      // console.log in production code (not tests)
      if (/console\.log/.test(line) && !rel.includes("__tests__"))
        note("LOW", rel, L, "console.log in production code — use a proper logger");
      // Hardcoded port
      if (/listen\(\d{4}/.test(line))
        note("MEDIUM", rel, L, "Hardcoded port — use process.env.PORT");
    });
  }
}

console.log("\n🔬  [critic-agent] Running architecture review ...\n");
scanDir(BACKEND);

console.log("─── Critic Agent Report ─────────────────────────────");
if (findings.length === 0) {
  console.log("  ✅  No architectural issues found.");
} else {
  const order = { HIGH:0, MEDIUM:1, LOW:2 };
  findings.sort((a, b) => order[a.severity] - order[b.severity]);
  for (const f of findings)
    console.log(`  [${f.severity}]  ${f.file}:${f.line}  ${f.msg}`);
}
console.log("─────────────────────────────────────────────────────\n");
