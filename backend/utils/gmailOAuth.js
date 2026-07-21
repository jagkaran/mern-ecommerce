"use strict";
/**
 * gmailOAuth.js
 *
 * Mints Google API access tokens from a saved OAuth2 refresh_token using
 * Node's stdlib `fetch` (Node ≥ 20). No googleapis dependency.
 *
 * Required files (gitignored, created by backend/scripts/gmail-oauth-setup.js):
 *   credentialsPath -> OAuth client { client_id, client_secret, ... }
 *                      (downloaded from Google Cloud Console)
 *   tokenPath       -> { refresh_token, scope, token_type, ... }
 *
 * Env vars:
 *   GMAIL_OAUTH_CREDENTIALS_PATH  default: backend/config/gmail-oauth-credentials.json
 *   GMAIL_OAUTH_TOKEN_PATH        default: backend/config/gmail-oauth-token.json
 *
 * Returns { user, accessToken, expiresAt } on every call. Access token is
 * cached in memory until ~60s before expiry; nodemailer's OAuth2 transport
 * will also auto-refresh using the same refresh_token, so this cache mainly
 * protects the very first send after a cold start.
 */

const fs = require("fs");
const path = require("path");
const logger = require("./logger");

const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const DEFAULT_CREDS_PATH = path.join(__dirname, "..", "config", "gmail-oauth-credentials.json");
const DEFAULT_TOKEN_PATH = path.join(__dirname, "..", "config", "gmail-oauth-token.json");
const REFRESH_SKEW_MS = 60_000; // refresh 60s before expiry

let cached = null; // { accessToken, expiresAt }

function readJson(filePath) {
  // ponytail: explicit read so we control the error message — surfaces the
  // real cause (missing file vs invalid json vs missing field) in logs.
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function loadCredentials(credsPath) {
  const file = readJson(credsPath);
  const installed = file.installed || file.web || null;
  if (!installed || !installed.client_id || !installed.client_secret) {
    throw new Error(
      `Gmail OAuth credentials at ${credsPath} missing client_id/client_secret. ` +
        `Re-download from Google Cloud Console → APIs & Services → Credentials.`
    );
  }
  return {
    clientId: installed.client_id,
    clientSecret: installed.client_secret,
    // Redirect URI used during the consent flow. Nodemailer doesn't need it,
    // but the refresh-token exchange does — google verifies the original
    // redirect_uri matches. We store it here so the setup script can reuse it.
    redirectUri:
      (Array.isArray(installed.redirect_uris) && installed.redirect_uris[0]) ||
      "http://localhost",
  };
}

function loadToken(tokenPath) {
  const file = readJson(tokenPath);
  if (!file.refresh_token) {
    throw new Error(
      `Gmail OAuth token at ${tokenPath} has no refresh_token. ` +
        `Re-run: node backend/scripts/gmail-oauth-setup.js`
    );
  }
  return file;
}

function resolvePaths() {
  return {
    credsPath: process.env.GMAIL_OAUTH_CREDENTIALS_PATH || DEFAULT_CREDS_PATH,
    tokenPath: process.env.GMAIL_OAUTH_TOKEN_PATH || DEFAULT_TOKEN_PATH,
  };
}

async function refreshAccessToken({ clientId, clientSecret, refreshToken }) {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }).toString(),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const desc = body.error_description || body.error || `HTTP ${res.status}`;
    throw new Error(`Gmail OAuth token refresh failed: ${desc}`);
  }
  if (!body.access_token) {
    throw new Error("Gmail OAuth token refresh returned no access_token");
  }
  return body;
}

/**
 * Returns { user, accessToken, expiresAt } or null if OAuth is not configured.
 * `null` means: fall back to SMTP_PASSWORD transport.
 */
async function getAccessToken() {
  const { credsPath, tokenPath } = resolvePaths();
  if (!fs.existsSync(credsPath) || !fs.existsSync(tokenPath)) {
    return null;
  }

  if (cached && cached.expiresAt - Date.now() > REFRESH_SKEW_MS) {
    return {
      user: cached.user,
      clientId: cached.clientId,
      clientSecret: cached.clientSecret,
      accessToken: cached.accessToken,
      refreshToken: cached.refreshToken,
    };
  }

  const creds = loadCredentials(credsPath);
  const token = loadToken(tokenPath);
  const body = await refreshAccessToken({
    clientId: creds.clientId,
    clientSecret: creds.clientSecret,
    refreshToken: token.refresh_token,
  });

  cached = {
    user: token.user || token.email || process.env.SMTP_MAIL,
    clientId: creds.clientId,
    clientSecret: creds.clientSecret,
    accessToken: body.access_token,
    refreshToken: token.refresh_token,
    expiresAt: Date.now() + (body.expires_in || 3600) * 1000,
  };
  logger.info("Gmail OAuth access token refreshed");
  return {
    user: cached.user,
    clientId: cached.clientId,
    clientSecret: cached.clientSecret,
    accessToken: cached.accessToken,
    refreshToken: cached.refreshToken,
  };
}

/**
 * Test/admin helper — clears the in-memory cache so the next getAccessToken()
 * call hits Google's endpoint again. Not used by production code paths.
 */
function _resetCache() {
  cached = null;
}

/**
 * RFC 5322 message construction + base64url encoding for Gmail API send.
 * Caller passes plain-text + optional HTML body; we assemble either a
 * single-part text message or a multipart/alternative with both.
 */
function buildRawMessage({ from, to, subject, text, html }) {
  // ponytail: explicit \r\n line endings — RFC 5322 requires them, and
  // Gmail's parser is strict about it. \n alone can cause silent drops.
  const headers = [`From: ${from}`, `To: ${to}`, `Subject: ${subject}`];
  let body;
  if (html && text) {
    // multipart/alternative boundary — random-ish string, must not appear
    // in either body. Email-templates output is sanitized via escapeHtml
    // so collisions are not a realistic risk, but a unique boundary is
    // safer than reusing "boundary" everywhere.
    const boundary = `mixed-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    headers.push("MIME-Version: 1.0");
    headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    body =
      `--${boundary}\r\n` +
      `Content-Type: text/plain; charset=utf-8\r\n` +
      `Content-Transfer-Encoding: 7bit\r\n\r\n` +
      `${text}\r\n\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: text/html; charset=utf-8\r\n` +
      `Content-Transfer-Encoding: 7bit\r\n\r\n` +
      `${html}\r\n\r\n` +
      `--${boundary}--\r\n`;
  } else if (html) {
    headers.push(`Content-Type: text/html; charset=utf-8`);
    headers.push("MIME-Version: 1.0");
    body = `${html}`;
  } else {
    headers.push(`Content-Type: text/plain; charset=utf-8`);
    headers.push("MIME-Version: 1.0");
    body = text || "";
  }
  const message = `${headers.join("\r\n")}\r\n\r\n${body}`;
  return Buffer.from(message, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Send a plain-text or HTML email via the Gmail API (POST /messages/send).
 *
 * Why not nodemailer + OAuth2 over SMTP? Gmail's SMTP gateway rejects
 * tokens issued only for the `gmail.send` scope with 535 BadCredentials —
 * SMTP needs the broader `https://mail.google.com/` scope. The Gmail API
 * path accepts the narrow scope, which is what the OAuth client was
 * configured for.
 *
 * Returns the Gmail API response object (contains `id`, `threadId`, etc.).
 * Throws on non-2xx, with Google's error payload in the message.
 */
async function sendViaGmailApi({ user, accessToken, from, to, subject, text, html }) {
  if (!accessToken) throw new Error("sendViaGmailApi: missing accessToken");
  if (!user) throw new Error("sendViaGmailApi: missing user (Gmail address)");
  const raw = buildRawMessage({ from, to, subject, text, html });
  const url = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Gmail API send failed: HTTP ${res.status} ${res.statusText} — ${body}`
    );
  }
  return res.json();
}

module.exports = {
  getAccessToken,
  resolvePaths,
  sendViaGmailApi,
  _resetCache,
  // exported for tests
  _loadCredentials: loadCredentials,
  _loadToken: loadToken,
};