import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// F8 — Vite replaces react-scripts (EOL).
// build/ output dir preserves backend/app.js:202 contract.
// define keeps process.env.REACT_APP_* / NODE_ENV reads alive in src/.
// Vitest config rides along (no separate jest config needed).
export default defineConfig({
  plugins: [
    react({
      include: "**/*.{js,jsx,ts,tsx}",
    }),
  ],
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.jsx?$/,
    target: "es2020",
  },
  build: {
    outDir: "build",
    emptyOutDir: true,
    target: "es2020",
    sourcemap: false,
    rollupOptions: {
      input: "index.html",
    },
  },
  base: "./",
  resolve: {
    alias: { src: path.resolve(__dirname, "src") },
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development"),
    "process.env.REACT_APP_SITE_URL": JSON.stringify(
      process.env.REACT_APP_SITE_URL || ""
    ),
  },
  server: {
    port: 3000,
    proxy: { "/api": "http://localhost:10000" },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/setupTests.js"],
    css: false,
    server: {
      deps: {
        inline: [/@testing-library/],
      },
    },
  },
});
