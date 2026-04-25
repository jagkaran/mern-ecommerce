#!/usr/bin/env node
/**
 * Dev Agent -- mern-ecommerce
 * Applies idempotent source-code patches to fix known bugs.
 * Each patch checks for the exact target string BEFORE patching,
 * so running the agent multiple times never produces duplicates.
 */

const fs   = require("fs");
const path = require("path");

const BACKEND = path.resolve(__dirname, "..", "backend");

const patches = [];
const report  = [];

/** Safe replace: only applies if `from` is present AND `to` is NOT already present. */
function patch(filePath, description, from, to) {
  patches.push({ filePath, description, from, to });
}

// ── Patch definitions ───────────────────────────────────────────────────────

// 1. Date.now() → Date.now in orderModel
patch(
  path.join(BACKEND, "models", "orderModel.js"),
  "Date.now() → Date.now (schema default fn ref)",
  "default: Date.now()",
  "default: Date.now"
);

// 2. Date.now() → Date.now in userModel
patch(
  path.join(BACKEND, "models", "userModel.js"),
  "Date.now() → Date.now (schema default fn ref)",
  "default: Date.now()",
  "default: Date.now"
);

// 3. Fix GET endpoints returning 201 → 200 in orderController
patch(
  path.join(BACKEND, "controllers", "orderController.js"),
  "getOrderDetails/getMyOrders/getAllOrders: status 201 → 200",
  ".status(201).json",
  ".status(200).json"
);

// 4. JWT cookie: add secure + sameSite only if NOT already present
patch(
  path.join(BACKEND, "utils", "jwtToken.js"),
  "Add secure:true, sameSite:'strict' to cookie options",
  // Only match the bare httpOnly line WITHOUT secure already there
  "httpOnly: true,\n  };",
  "httpOnly: true,\n    secure: process.env.NODE_ENV === \"PRODUCTION\",\n    sameSite: \"strict\",\n  };"
);

// ── Apply ────────────────────────────────────────────────────────────────────

console.log("\n[dev-agent] Applying auto-patches ...");

for (const p of patches) {
  if (!fs.existsSync(p.filePath)) {
    console.log(`  skip  ${p.description}  (file not found)`);
    continue;
  }

  let src = fs.readFileSync(p.filePath, "utf8");

  // Idempotency guard: skip if the target replacement is already present
  if (src.includes(p.to)) {
    console.log(`  ok    ${p.description}  (already applied)`);
    continue;
  }

  // Skip if the source pattern is not present (nothing to replace)
  if (!src.includes(p.from)) {
    console.log(`  skip  ${p.description}  (pattern not found)`);
    continue;
  }

  src = src.split(p.from).join(p.to);          // replace ALL occurrences
  fs.writeFileSync(p.filePath, src, "utf8");
  console.log(`  patched  ${p.description}`);
  report.push({ file: path.relative(path.resolve(__dirname, ".."), p.filePath), description: p.description });
}

console.log("\n─── Dev Agent Report ──────────────────────────────");
if (report.length === 0) {
  console.log("  ok  No patches needed — codebase already up to date.");
} else {
  console.log(`  Applied ${report.length} patch(es):`);
  for (const r of report) console.log(`       • [${r.file}] ${r.description}`);
}
console.log("─────────────────────────────────────────\n");
