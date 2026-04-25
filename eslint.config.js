// ESLint v9 flat config
"use strict";

const js = require("@eslint/js");

module.exports = [
  js.configs.recommended,
  {
    files: ["backend/**/*.js"],
    languageOptions: {
      ecmaVersion: 2021,
      globals: {
        require:   "readonly",
        module:    "readonly",
        exports:   "readonly",
        __dirname: "readonly",
        __filename:"readonly",
        process:   "readonly",
        console:   "readonly",
        setTimeout:"readonly",
        clearTimeout:"readonly",
        setInterval: "readonly",
        clearInterval:"readonly",
        Buffer:    "readonly",
      },
    },
    rules: {
      "no-unused-vars":      ["warn", { argsIgnorePattern: "^_" }],
      "no-console":          "off",
      "prefer-const":        "error",
      "no-var":              "error",
      "eqeqeq":              ["error", "always"],
    },
  },
  {
    // Ignore generated / third-party directories
    ignores: [
      "**/node_modules/**",
      "**/build/**",
      "**/dist/**",
      "frontend/**",
      "backend/__tests__/**",
    ],
  },
];
