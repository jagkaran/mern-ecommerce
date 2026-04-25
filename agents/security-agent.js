#!/usr/bin/env node
/**
 * Security Agent — mern-ecommerce
 * Auto-installs missing security packages, then checks:
 * npm audit, required middleware, cookie flags, hardcoded secrets.
 */

const { execSync } = require("child_process");
const fs   = require("fs");
const path = require("path");

const ROOT    = path.resolve(__dirname, "..");
const BACKEND = path.join(ROOT, "backend");

const issues = [];
const warn   = (msg) => issues.push({ level: "WARN",     msg });
const fail   = (msg) => issues.push({ level: "CRITICAL",  msg });

// ── 0. Auto-install missing security packages ─────────────────────────────────
const REQUIRED_PACKAGES = [
  "helmet",
  "cors",
  "express-rate-limit",
  "express-mongo-sanitize",
  "xss-clean",
  "compression",
];

console.log("\n🔍  [security] Checking & installing required security packages ...");
const pkgPath = path.join(ROOT, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const installed = { ...pkg.dependencies, ...pkg.devDependencies };
const missing = REQUIRED_PACKAGES.filter((p) => !installed[p]);

if (missing.length > 0) {
  console.log(`   📦  Installing missing packages: ${missing.join(", ")} ...`);
  try {
    execSync(`npm install ${missing.join(" ")}`, { cwd: ROOT, stdio: "inherit" });
    console.log("   ✅  All security packages installed.");
  } catch (e) {
    fail(`Failed to install packages: ${missing.join(", ")} — run: npm install ${missing.join(" ")}`);
  }
} else {
  console.log("   ✅  All required security packages already present.");
}

// ── 1. npm audit ──────────────────────────────────────────────────────────────
console.log("\n🔍  [security] Running npm audit ...");
try {
  execSync("npm audit --audit-level=high --json", { cwd: ROOT, stdio: "pipe" });
  console.log("   ✅  No high/critical npm vulnerabilities.");
} catch (e) {
  try {
    const audit = JSON.parse(e.stdout?.toString() || "{}");
    const hi = audit.metadata?.vulnerabilities?.high   ?? 0;
    const cr = audit.metadata?.vulnerabilities?.critical ?? 0;
    if (cr > 0) fail(`npm audit: ${cr} critical vulnerabilities`);
    if (hi > 0) warn(`npm audit: ${hi} high vulnerabilities`);
  } catch (_) {
    warn("npm audit returned non-zero (parse failed)");
  }
}

// ── 2. Required middleware presence check ─────────────────────────────────────
console.log("\n🔍  [security] Checking required security middleware ...");
const appFile = path.join(BACKEND, "app.js");
if (fs.existsSync(appFile)) {
  const src = fs.readFileSync(appFile, "utf8");
  if (!src.includes("helmet"))         fail("Missing helmet middleware (HTTP security headers)");
  if (!src.includes("rateLimit"))      fail("Missing express-rate-limit on auth routes");
  if (!src.includes("mongoSanitize"))  fail("Missing express-mongo-sanitize (NoSQL injection)");
  if (!src.includes("xss"))           fail("Missing xss-clean middleware (XSS prevention)");
  if (!src.includes("cors"))          fail("Missing cors middleware");
  if (!src.includes("compression"))   warn("Missing compression middleware (performance)");
} else {
  warn("backend/app.js not found — skipping middleware checks");
}

// ── 3. Cookie flag checks ─────────────────────────────────────────────────────
console.log("\n🔍  [security] Checking JWT cookie flags ...");
const jwtFile = path.join(BACKEND, "utils", "jwtToken.js");
if (fs.existsSync(jwtFile)) {
  const src = fs.readFileSync(jwtFile, "utf8");
  if (!src.includes("secure:"))       fail("JWT cookie missing 'secure' flag");
  if (!src.includes("sameSite"))      fail("JWT cookie missing 'sameSite' flag");
  if (!src.includes("httpOnly: true")) fail("JWT cookie missing 'httpOnly: true'");
  // Warn if token is leaked in JSON response body
  if (/\.json\([^)]*\btoken\b/.test(src)) {
    warn("JWT token appears to be sent in JSON response body — remove 'token' from .json() to rely on httpOnly cookie only");
  }
} else {
  warn("backend/utils/jwtToken.js not found");
}

// ── 4. Hardcoded secret pattern scan ─────────────────────────────────────────
console.log("\n🔍  [security] Scanning for hardcoded secrets ...");
const SECRET_PATTERNS = [
  /(['"`])sk_(live|test)_[A-Za-z0-9]{20,}\1/,
  /(['"`])AKIA[0-9A-Z]{16}\1/,
  /password\s*[:=]\s*(['"`])[^'"` ]{6,}\1/i,
  /secret\s*[:=]\s*(['"`])[^'"` ]{6,}\1/i,
];
function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", "dist", "build"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { scanDir(full); continue; }
    if (!/\.(js|ts|jsx|tsx|env)$/.test(entry.name)) continue;
    const src = fs.readFileSync(full, "utf8");
    for (const p of SECRET_PATTERNS) {
      if (p.test(src)) warn(`Possible hardcoded secret in ${path.relative(ROOT, full)}`);
    }
  }
}
scanDir(BACKEND);

// ── Report ────────────────────────────────────────────────────────────────────
console.log("\n─── Security Agent Report ───────────────────────────");
if (issues.length === 0) {
  console.log("  ✅  No security issues found.");
} else {
  for (const i of issues) {
    const icon = i.level === "CRITICAL" ? "❌" : "⚠️ ";
    console.log(`  ${icon}  [${i.level}] ${i.msg}`);
  }
}
console.log("─────────────────────────────────────────────────────\n");

const criticalCount = issues.filter((i) => i.level === "CRITICAL").length;
if (criticalCount > 0) process.exit(1);
