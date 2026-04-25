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

/**
 * Returns true when the nearest enclosing function (looking backwards)
 * is a short named helper — these intentionally await sequentially.
 */
function inHelperFn(lines, i) {
  for (let j = i; j >= 0; j--) {
    const t = lines[j].trim();
    if (/^async function \w+/.test(t)) return (i - j) < 15;
    if (/^exports\.\w+/.test(t) || /^module\.exports/.test(t)) return false;
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

      // ─ Sequential awaits inside for-loops ──────────────────────────
      if (/for\s*\((?!\s*const\s+\w+\s+of)/.test(line)) {
        for (let j = i + 1; j <= Math.min(i + 3, lines.length - 1); j++) {
          const next = lines[j].trim();
          if (!next) continue;
          if (/\bawait\b/.test(next) && !inHelperFn(lines, i)) {
            issues.push({ file: rel, line: L, msg: "Sequential await inside for-loop — use Promise.all()" });
          }
          break;
        }
      }

      // ─ Unbounded .find() ───────────────────────────────────────
      //   Skip:
      //     - ApiFeatures file (pagination() applies .limit() later)
      //     - new ApiFeatures(X.find(), ...) call site (same reason)
      //     - Lines already chained with .skip()/.limit()
      if (
        /\.find\(\)/.test(line) &&
        !line.includes(".limit(") &&
        !line.includes(".skip(") &&
        !line.trim().startsWith("this.query") &&
        !rel.includes("apiFeatures") &&
        !line.includes("ApiFeatures(")          // ← new: skip ApiFeatures call sites
      ) {
        const chain = (lines[i + 1] || "") + (lines[i + 2] || "");
        if (!chain.includes(".limit(") && !chain.includes(".skip(")) {
          issues.push({ file: rel, line: L, msg: "Unbounded .find() — add .limit() or pagination" });
        }
      }

      // ─ Deprecated .remove() ────────────────────────────────────
      if (/\.remove\(\)/.test(line))
        issues.push({ file: rel, line: L, msg: "Deprecated .remove() — use .deleteOne()" });

      // ─ useFindAndModify ─────────────────────────────────────────
      if (/useFindAndModify/.test(line))
        issues.push({ file: rel, line: L, msg: "useFindAndModify removed in Mongoose 6+" });
    });
  }
}

console.log("\n\u26A1  [perf-agent] Scanning backend for performance issues ...\n");
scanDir(BACKEND);

console.log("\u2500\u2500\u2500 Performance Agent Report \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
if (issues.length === 0) {
  console.log("  \u2705  No performance issues found.");
} else {
  for (const iss of issues)
    console.log(`  \u26A0\uFE0F   ${iss.file}:${iss.line}  ${iss.msg}`);
}
console.log("\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n");
