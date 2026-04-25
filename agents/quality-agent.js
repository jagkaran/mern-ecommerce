#!/usr/bin/env node
/**
 * Quality Agent -- mern-ecommerce
 * Scaffolds ESLint v9 flat config + Prettier, then lints the backend.
 */

const { execSync } = require("child_process");
const fs   = require("fs");
const path = require("path");

const ROOT    = path.resolve(__dirname, "..");
const BACKEND = path.join(ROOT, "backend");

function write(file, content) {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, content, "utf8");
    console.log("  created: " + path.relative(ROOT, file));
  }
}

// ESLint v9 uses eslint.config.js (flat config) -- write only if missing
const flatConfig = path.join(ROOT, "eslint.config.js");
write(flatConfig,
  '"use strict";\n' +
  'const js = require("@eslint/js");\n' +
  'module.exports = [\n' +
  '  js.configs.recommended,\n' +
  '  {\n' +
  '    files: ["backend/**/*.js"],\n' +
  '    languageOptions: { ecmaVersion: 2021 },\n' +
  '    rules: {\n' +
  '      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],\n' +
  '      "no-console":     "off",\n' +
  '      "prefer-const":   "error",\n' +
  '      "no-var":         "error",\n' +
  '      "eqeqeq":         ["error", "always"],\n' +
  '    },\n' +
  '  },\n' +
  '  { ignores: ["**/node_modules/**", "**/build/**", "frontend/**", "backend/__tests__/**"] },\n' +
  '];\n'
);

// Prettier config
write(path.join(ROOT, ".prettierrc"), JSON.stringify({
  semi: true, singleQuote: false, tabWidth: 2,
  trailingComma: "es5", printWidth: 100, endOfLine: "lf",
}, null, 2));

write(path.join(ROOT, ".prettierignore"),
  "node_modules\nbackend/node_modules\nfrontend/node_modules\nbuild\ndist\n*.lock\n");

// Install ESLint + @eslint/js if missing
console.log("\n[quality-agent] Checking ESLint v9 ...");
try {
  require.resolve("eslint");
  require.resolve("@eslint/js");
  console.log("   ok  ESLint already installed.");
} catch (_) {
  console.log("   installing eslint @eslint/js prettier ...");
  execSync("npm install --save-dev eslint @eslint/js prettier", { cwd: ROOT, stdio: "inherit" });
}

// Run ESLint
console.log("\n[quality-agent] Running ESLint on backend ...\n");
try {
  execSync(
    "npx eslint backend --max-warnings=20",
    { cwd: ROOT, stdio: "inherit" }
  );
  console.log("\n  ESLint passed.\n");
} catch (_e) {
  console.error("\n  ESLint failed or exceeded warning threshold.\n");
  process.exit(1);
}
