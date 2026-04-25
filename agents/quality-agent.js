#!/usr/bin/env node
/**
 * Quality Agent -- mern-ecommerce
 * Scaffolds ESLint + Prettier configs, then runs linting on backend.
 */

const { execSync } = require("child_process");
const fs   = require("fs");
const path = require("path");

const ROOT    = path.resolve(__dirname, "..");
const BACKEND = path.join(ROOT, "backend");

function write(file, content) {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, content, "utf8");
    console.log("  📝  Created " + path.relative(ROOT, file));
  }
}

// -- ESLint config (backend) --------------------------------------------------
write(path.join(BACKEND, ".eslintrc.json"), JSON.stringify({
  env:     { node: true, es2021: true },
  extends: ["eslint:recommended"],
  parserOptions: { ecmaVersion: 2021 },
  rules: {
    "no-unused-vars":      ["warn", { argsIgnorePattern: "^_" }],
    "no-console":          "off",
    "prefer-const":        "error",
    "no-var":              "error",
    "eqeqeq":              ["error", "always"],
    "handle-callback-err": "warn",
  },
}, null, 2));

// -- Prettier config (root) ---------------------------------------------------
write(path.join(ROOT, ".prettierrc"), JSON.stringify({
  semi:          true,
  singleQuote:   false,
  tabWidth:      2,
  trailingComma: "es5",
  printWidth:    100,
  endOfLine:     "lf",
}, null, 2));

write(path.join(ROOT, ".prettierignore"), [
  "node_modules",
  "backend/node_modules",
  "frontend/node_modules",
  "build",
  "dist",
  "*.lock",
].join("\n"));

// -- Install ESLint if missing ------------------------------------------------
console.log("\n🔍  [quality-agent] Checking ESLint ...");
try {
  require.resolve("eslint");
  console.log("   ✅  ESLint already installed.");
} catch (_) {
  console.log("   📦  Installing eslint + prettier ...");
  execSync("npm install --save-dev eslint prettier", { cwd: ROOT, stdio: "inherit" });
}

// -- Run ESLint ---------------------------------------------------------------
console.log("\n🔎  [quality-agent] Running ESLint on backend ...\n");
try {
  execSync(
    "npx eslint " + BACKEND + " --ext .js --max-warnings=20 --ignore-pattern=node_modules",
    { cwd: ROOT, stdio: "inherit" }
  );
  console.log("\n✅  ESLint passed (within warning threshold).\n");
} catch (e) {
  console.error("\n❌  ESLint found errors or exceeded warning threshold.\n");
  process.exit(1);
}
