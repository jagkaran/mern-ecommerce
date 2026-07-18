// scripts/e2eServer.js
// Tiny static-with-SPA-fallback server for E2E tests. Serves files from
// build/ and falls back to build/index.html for any non-asset GET, so the
// React Router handles arbitrary paths like /products, /wishlist, etc.
// Also proxies /api/* to the backend (defaults to http://localhost:10000).
//
// Usage:
//   node scripts/e2eServer.js [port] [apiTarget]
// Env: PORT, API_TARGET (overrides arg).

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = parseInt(process.env.PORT || process.argv[2] || "3000", 10);
const API_TARGET = process.env.API_TARGET || process.argv[3] || "http://localhost:10000";
const BUILD_DIR = path.join(__dirname, "..", "build");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".json": "application/json",
  ".ico": "image/x-icon",
};

const apiUrl = new URL(API_TARGET);

function serveStatic(req, res) {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (urlPath === "/") urlPath = "/index.html";
  const filePath = path.join(BUILD_DIR, urlPath);

  // Prevent directory traversal — only files inside BUILD_DIR
  if (!filePath.startsWith(BUILD_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // SPA fallback — let the client router handle the path
      fs.readFile(path.join(BUILD_DIR, "index.html"), (e2, html) => {
        if (e2) {
          res.writeHead(500);
          res.end("Build missing — run `npm run build` first.");
          return;
        }
        res.writeHead(200, { "Content-Type": MIME[".html"] });
        res.end(html);
      });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
}

function proxyApi(req, res) {
  const opts = {
    hostname: apiUrl.hostname,
    port: apiUrl.port,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: apiUrl.host },
  };
  const upstream = http.request(opts, (uRes) => {
    res.writeHead(uRes.statusCode, uRes.headers);
    uRes.pipe(res);
  });
  upstream.on("error", (e) => {
    res.writeHead(502, { "Content-Type": "text/plain" });
    res.end(`API proxy error: ${e.message}`);
  });
  req.pipe(upstream);
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api")) {
    proxyApi(req, res);
    return;
  }
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`e2eServer up: http://localhost:${PORT} (api → ${API_TARGET})`);
});
