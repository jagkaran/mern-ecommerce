#!/usr/bin/env node
/**
 * Quality Agent -- mern-ecommerce
 * Scaffolds ESLint v9 flat config + Prettier, then lints the backend.
 */
"use strict";
const { execSync } = require("child_process");
const fs   = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");

function write(file, content) {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, content, "utf8");
    console.log("  📝  Created " + path.relative(ROOT, file));
  }
}

// ESLint v9 flat config
write(path.join(ROOT, "eslint.config.js"),
`"use strict";
const js = require("@eslint/js");
module.exports = [
  js.configs.recommended,
  {
    files: ["backend/**/*.js"],
    languageOptions: {
      ecmaVersion: 2021,
      globals: {
        require:"readonly",module:"readonly",exports:"readonly",
        __dirname:"readonly",__filename:"readonly",process:"readonly",
        console:"readonly",setTimeout:"readonly",clearTimeout:"readonly",
        setInterval:"readonly",clearInterval:"readonly",Buffer:"readonly",
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console":     "off",
      "prefer-const":   "error",
      "no-var":         "error",
      "eqeqeq":         ["error", "always"],
    },
  },
  { ignores: ["**/node_modules/**","**/build/**","**/dist/**","frontend/**","backend/__tests__/**"] },
];
`);

write(path.join(ROOT, ".prettierrc"), JSON.stringify(
  { semi:true, singleQuote:false, tabWidth:2, trailingComma:"es5", printWidth:100, endOfLine:"lf" },
  null, 2
));
write(path.join(ROOT, ".prettierignore"),
  "node_modules\nbackend/node_modules\nfrontend/node_modules\nbuild\ndist\n*.lock\n");

// Ensure @eslint/js is installed
console.log("\n[quality-agent] Checking ESLint v9 ...");
try { require.resolve("@eslint/js"); console.log("   ✅  ESLint already installed."); }
catch (_) { execSync("npm install --save-dev eslint @eslint/js prettier", { cwd:ROOT, stdio:"inherit" }); }

// Lint
console.log("\n🔎  [quality-agent] Running ESLint on backend ...\n");
try {
  execSync("npx eslint backend --max-warnings=20", { cwd:ROOT, stdio:"inherit" });
  console.log("\n  ✅  ESLint passed.\n");
} catch (_) {
  console.error("\n  ❌  ESLint failed or exceeded warning threshold.\n");
  process.exit(1);
}
