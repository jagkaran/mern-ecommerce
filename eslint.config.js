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
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        process: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        Buffer: "readonly",
        // Node 18+ globals used by external-service clients
        fetch: "readonly",
        AbortController: "readonly",
        // WHATWG URL globals (Node 10+). Used by the Gmail OAuth flow.
        URL: "readonly",
        URLSearchParams: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }],
      "no-console": "off",
      "prefer-const": "error",
      "no-var": "error",
      eqeqeq: ["error", "always"],
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
