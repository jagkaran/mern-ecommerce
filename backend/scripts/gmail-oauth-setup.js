#!/usr/bin/env node
"use strict";
/**
 * gmail-oauth-setup.js
 *
 * One-time OAuth2 consent flow for Gmail send. Run when (re)authorizing:
 *
 *   node backend/scripts/gmail-oauth-setup.js
 *
 * 1. Reads `backend/config/gmail-oauth-credentials.json` (downloaded from
 *    Google Cloud Console → APIs & Services → Credentials → OAuth client ID
 *    → Application type: Desktop app → Download JSON).
 * 2. Starts a localhost HTTP server, opens the consent URL in your browser
 *    with `https://www.googleapis.com/auth/gmail.send` scope.
 * 3. Receives the auth code on `?code=...`, exchanges it for a refresh_token.
 * 4. Writes `backend/config/gmail-oauth-token.json` (gitignored) with the
 *    refresh_token and the Gmail user it was issued for.
 *
 * Both files must exist on every machine that sends mail. Refresh tokens
 * don't expire unless the user revokes access or the OAuth client is deleted
 * from Google Cloud Console, so you only re-run this script when rotating
 * credentials.
 *
 * Uses Node stdlib only — no extra npm packages.
 */

const http = require("http");
const https = require("https");
const url = require("url");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const logger = require("../utils/logger");

// Load config.env so process.env.SMTP_MAIL is populated when this script
// is run standalone (`node backend/scripts/gmail-oauth-setup.js`).
// server.js does the same at boot; without this, SMTP_MAIL is undefined
// and the id_token email fallback chain collapses to null.
if (process.env.NODE_ENV?.toLowerCase() !== "production") {
  try {
    require("dotenv").config({
      path: path.join(__dirname, "..", "config", "config.env"),
      quiet: true,
    });
  } catch {
    /* dotenv optional — SMTP_MAIL just stays undefined */
  }
}

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/gmail.send";

const CREDS_PATH =
  process.env.GMAIL_OAUTH_CREDENTIALS_PATH ||
  path.join(__dirname, "..", "config", "gmail-oauth-credentials.json");
const TOKEN_PATH =
  process.env.GMAIL_OAUTH_TOKEN_PATH ||
  path.join(__dirname, "..", "config", "gmail-oauth-token.json");

function loadCredentials() {
  if (!fs.existsSync(CREDS_PATH)) {
    throw new Error(
      `Missing OAuth credentials at ${CREDS_PATH}.\n` +
        `Download a Desktop-app OAuth client JSON from Google Cloud Console ` +
        `and save it there.`
    );
  }
  const file = JSON.parse(fs.readFileSync(CREDS_PATH, "utf8"));
  const installed = file.installed || file.web;
  if (!installed) throw new Error("Credentials JSON missing `installed` or `web` block");
  const redirectUri =
    (Array.isArray(installed.redirect_uris) && installed.redirect_uris[0]) ||
    "http://localhost:3001";
  return {
    clientId: installed.client_id,
    clientSecret: installed.client_secret,
    redirectUri,
  };
}

function postForm(formUrl, params) {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams(params).toString();
    const u = new URL(formUrl);
    const req = https.request(
      {
        method: "POST",
        hostname: u.hostname,
        path: u.pathname,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let chunks = "";
        res.on("data", (c) => (chunks += c));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(chunks);
            if (res.statusCode >= 400) {
              return reject(
                new Error(
                  `HTTP ${res.statusCode}: ${parsed.error_description || parsed.error || chunks}`
                )
              );
            }
            resolve(parsed);
          } catch (e) {
            reject(new Error(`Bad JSON from ${formUrl}: ${chunks}`));
          }
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function waitForCode(port, redirectPath) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const parsed = url.parse(req.url, true);
      if (parsed.pathname !== redirectPath) {
        res.writeHead(404);
        res.end("Not Found");
        return;
      }
      if (parsed.query.error) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end(`OAuth error: ${parsed.query.error}\n${parsed.query.error_description || ""}`);
        server.close();
        reject(new Error(`OAuth error: ${parsed.query.error}`));
        return;
      }
      if (!parsed.query.code) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("Missing code");
        return;
      }
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(
        "<h2>Gmail OAuth setup complete</h2>" +
          "<p>You can close this tab and return to the terminal.</p>"
      );
      server.close();
      resolve(parsed.query.code);
    });
    server.on("error", reject);
    server.listen(port, "127.0.0.1", () => {
      logger.info(`Listening on http://127.0.0.1:${port}${redirectPath}`);
    });
  });
}

function openBrowser(authUrl) {
  // execFile (not exec) — no shell, so the URL is passed as a single
  // argv element and cannot inject shell metacharacters.
  const [bin, args] =
    process.platform === "darwin"
      ? ["open", [authUrl]]
      : process.platform === "win32"
        ? ["cmd", ["/c", "start", "", authUrl]]
        : ["xdg-open", [authUrl]];
  execFile(bin, args, (err) => {
    if (err) {
      logger.warn(`Could not open browser automatically. Visit:\n${authUrl}`);
    }
  });
}

async function main() {
  const creds = loadCredentials();
  const redirectUrl = new URL(creds.redirectUri);
  const port = Number(redirectUrl.port) || 80;
  const redirectPath = redirectUrl.pathname || "/";

  // Add this loopback redirect_uri to the OAuth client's Authorized redirect
  // URIs in Google Cloud Console, otherwise Google returns
  // `redirect_uri_mismatch`.
  const params = new URLSearchParams({
    client_id: creds.clientId,
    redirect_uri: creds.redirectUri,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline", // required for refresh_token
    prompt: "consent", // force re-issuing refresh_token
    include_granted_scopes: "true",
  });
  const authUrl = `${AUTH_ENDPOINT}?${params.toString()}`;

  console.log("\nOpening browser for Gmail OAuth consent…");
  console.log(`If the browser does not open, visit:\n${authUrl}\n`);
  openBrowser(authUrl);

  const code = await waitForCode(port, redirectPath);
  console.log("Received auth code, exchanging for refresh_token…");

  const token = await postForm(TOKEN_ENDPOINT, {
    code,
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
    redirect_uri: creds.redirectUri,
    grant_type: "authorization_code",
  });

  if (!token.refresh_token) {
    throw new Error(
      "No refresh_token returned. If you've already authorized this app, " +
        "revoke access at https://myaccount.google.com/permissions then re-run."
    );
  }

  // `id_token` is a JWT — decode the payload to recover the user email
  // without needing an extra `userinfo` call.
  let userEmail = process.env.SMTP_MAIL || null;
  if (token.id_token) {
    try {
      const payload = JSON.parse(
        Buffer.from(token.id_token.split(".")[1], "base64").toString("utf8")
      );
      userEmail = payload.email || userEmail;
    } catch {
      /* ignore */
    }
  }

  const out = {
    refresh_token: token.refresh_token,
    scope: token.scope || SCOPE,
    token_type: token.token_type || "Bearer",
    user: userEmail,
    obtained_at: new Date().toISOString(),
  };
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(out, null, 2), { mode: 0o600 });
  console.log(`\nWrote ${TOKEN_PATH}`);
  console.log(`User: ${out.user}`);
  console.log("\nDone. The backend will pick this up automatically — no restart needed.");
}

main().catch((err) => {
  console.error("\n[gmail-oauth-setup] FAILED:", err.message);
  process.exit(1);
});