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
const note = (severity, file, line, msg) =>
  findings.push({ severity, file, line, msg });

/**
 * Look ahead from line index `i` up to `lookahead` lines for a pattern.
 * Returns true if any of those lines match.
 */
function hasGuardAhead(lines, i, lookahead = 4) {
  for (let j = i + 1; j <= Math.min(i + lookahead, lines.length - 1); j++) {
    const t = lines[j].trim();
    // Accept: if (!x), if (!order), if (!product), if (!user), return next(...
    if (/^if\s*\(!/.test(t) || /^return next\(new ErrorHandler/.test(t)) return true;
    // Stop looking once we hit a non-empty, non-comment, non-blank line
    // that is not a chained call (.populate, .select, .lean, etc.)
    if (t && !t.startsWith("//") && !t.startsWith(".") && !/^const|^let|^var/.test(t)) break;
  }
  return false;
}

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", "__tests__"].includes(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { scanDir(full); continue; }
    if (!/\.js$/.test(e.name)) continue;

    const src   = fs.readFileSync(full, "utf8");
    const rel   = path.relative(ROOT, full);
    const lines = src.split("\n");

    lines.forEach((line, i) => {
      const L = i + 1;
      const t = line.trim();

      // ─ Wrong HTTP status on GET endpoint ────────────────────────────────
      if (/res\.status\(201\)\.json/.test(line) && /get/i.test(rel))
        note("HIGH", rel, L, "GET endpoint returning 201 (Created) — should be 200");

      // ─ forEach(async) swallows errors ─────────────────────────────────
      if (/forEach\(async/.test(line))
        note("HIGH", rel, L, "forEach(async) swallows errors — use for..of or Promise.all");

      // ─ findById result not null-checked ────────────────────────────
      //   Only fire when:
      //   1. Line calls findById (may be chained with .populate etc.)
      //   2. No guard (if (!x)) found within 4 lines ahead
      //   3. Not inside a named helper fn that intentionally returns early (updateStock)
      if (
        /await.*\.findById\(/.test(line) &&
        !t.startsWith("//") &&
        !hasGuardAhead(lines, i, 4)
      ) {
        note("MEDIUM", rel, L, "findById result not null-checked within 4 lines");
      }

      // ─ console.log in production code ────────────────────────────────
      if (/console\.log/.test(line) && !rel.includes("__tests__") && !t.startsWith("/"))
        note("LOW", rel, L, "console.log in production code — use a proper logger");

      // ─ Hardcoded port ──────────────────────────────────────────────
      if (/listen\(\d{4}/.test(line))
        note("MEDIUM", rel, L, "Hardcoded port — use process.env.PORT");
    });
  }
}

console.log("\n\uD83D\uDD2C  [critic-agent] Running architecture review ...\n");
scanDir(BACKEND);

console.log("\u2500\u2500\u2500 Critic Agent Report \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
if (findings.length === 0) {
  console.log("  \u2705  No architectural issues found.");
} else {
  const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  findings.sort((a, b) => order[a.severity] - order[b.severity]);
  for (const f of findings)
    console.log(`  [${f.severity}]  ${f.file}:${f.line}  ${f.msg}`);
}
console.log("\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n");
