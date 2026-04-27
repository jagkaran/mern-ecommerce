#!/usr/bin/env node
/**
 * Dev Agent -- mern-ecommerce
 * Applies idempotent source-code patches to fix known bugs.
 * Each patch checks for the replacement string BEFORE patching — safe to run multiple times.
 */
"use strict";
const fs   = require("fs");
const path = require("path");

const BACKEND = path.resolve(__dirname, "..", "backend");
const ROOT    = path.resolve(__dirname, "..");
const patches = [];
const applied = [];

function patch(filePath, description, from, to) {
  patches.push({ filePath, description, from, to });
}

// ── Patches ──────────────────────────────────────────────────────────────────
patch(
  path.join(BACKEND, "models", "orderModel.js"),
  "Date.now() → Date.now (schema default fn ref)",
  "default: Date.now()", "default: Date.now"
);
patch(
  path.join(BACKEND, "models", "userModel.js"),
  "Date.now() → Date.now (schema default fn ref)",
  "default: Date.now()", "default: Date.now"
);
patch(
  path.join(BACKEND, "controllers", "orderController.js"),
  "GET endpoints: status 201 → 200",
  ".status(201).json", ".status(200).json"
);
patch(
  path.join(BACKEND, "utils", "jwtToken.js"),
  "JWT cookie: secure flag uses lowercase 'production'",
  'secure: process.env.NODE_ENV === "PRODUCTION"',
  'secure: process.env.NODE_ENV === "production"'
);
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n\uD83D\uDD27  [dev-agent] Applying auto-patches ...");
for (const p of patches) {
  if (!fs.existsSync(p.filePath)) { console.log(`  skip  ${p.description}  (file not found)`); continue; }
  let src = fs.readFileSync(p.filePath, "utf8");
  if (src.includes(p.to))   { console.log(`  \u2705   ${p.description}  (already applied)`); continue; }
  if (!src.includes(p.from)){ console.log(`  skip  ${p.description}  (pattern not found)`); continue; }
  src = src.split(p.from).join(p.to);
  fs.writeFileSync(p.filePath, src, "utf8");
  console.log(`  \u270F\uFE0F   ${p.description}`);
  applied.push({ file: path.relative(ROOT, p.filePath), desc: p.description });
}

console.log("\n\u2500\u2500\u2500 Dev Agent Report \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
if (applied.length === 0) {
  console.log("  \u2705  No patches needed \u2014 codebase already up to date.");
} else {
  console.log(`  \u2705  Applied ${applied.length} patch(es):`);
  for (const r of applied) console.log(`       \u2022 [${r.file}] ${r.desc}`);
}
console.log("\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n");
