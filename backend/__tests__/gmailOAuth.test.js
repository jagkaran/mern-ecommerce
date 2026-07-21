"use strict";
/**
 * gmailOAuth.test.js
 *
 * Unit tests for backend/utils/gmailOAuth.js — exercises the OAuth2 token
 * refresh path, in-memory cache, malformed-credentials handling, and the
 * "OAuth not configured" fallback that lets sendEmail drop to SMTP.
 */

jest.unmock("../utils/gmailOAuth");
jest.unmock("../utils/sendEmail");
jest.unmock("../services/emailService");

const fs = require("fs");
const path = require("path");
const os = require("os");

let gmailOAuth;

const TMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "gmail-oauth-test-"));
const CREDS_PATH = path.join(TMP_DIR, "creds.json");
const TOKEN_PATH = path.join(TMP_DIR, "token.json");

function writeCreds(clientId = "cid", clientSecret = "csec") {
  fs.writeFileSync(
    CREDS_PATH,
    JSON.stringify({
      installed: {
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uris: ["http://localhost:3001"],
      },
    })
  );
}
function writeToken(refreshToken = "1//refresh", user = "you@gmail.com") {
  fs.writeFileSync(
    TOKEN_PATH,
    JSON.stringify({ refresh_token: refreshToken, user })
  );
}

beforeAll(() => {
  process.env.GMAIL_OAUTH_CREDENTIALS_PATH = CREDS_PATH;
  process.env.GMAIL_OAUTH_TOKEN_PATH = TOKEN_PATH;
  process.env.SMTP_MAIL = "env-fallback@gmail.com";
});

beforeEach(() => {
  gmailOAuth = require("../utils/gmailOAuth");
  gmailOAuth._resetCache();
});

afterAll(() => {
  fs.rmSync(TMP_DIR, { recursive: true, force: true });
  delete process.env.GMAIL_OAUTH_CREDENTIALS_PATH;
  delete process.env.GMAIL_OAUTH_TOKEN_PATH;
  delete process.env.SMTP_MAIL;
});

function mockFetchResponse(status, body) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
}

describe("gmailOAuth.getAccessToken", () => {
  it("returns null when credential/token files don't exist", async () => {
    fs.rmSync(CREDS_PATH, { force: true });
    fs.rmSync(TOKEN_PATH, { force: true });
    expect(await gmailOAuth.getAccessToken()).toBeNull();
    writeCreds(); // restore for subsequent tests
    writeToken();
  });

  it("mints a fresh access token on first call", async () => {
    writeCreds();
    writeToken();
    mockFetchResponse(200, { access_token: "ya29.first", expires_in: 3600 });

    const out = await gmailOAuth.getAccessToken();

    expect(out).toEqual({
      user: "you@gmail.com",
      clientId: "cid",
      clientSecret: "csec",
      accessToken: "ya29.first",
      refreshToken: "1//refresh",
    });
    expect(global.fetch).toHaveBeenCalledWith(
      "https://oauth2.googleapis.com/token",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("grant_type=refresh_token"),
      })
    );
  });

  it("caches the token and skips the refresh round-trip while it's fresh", async () => {
    writeCreds();
    writeToken();
    mockFetchResponse(200, { access_token: "ya29.cached", expires_in: 3600 });

    await gmailOAuth.getAccessToken();
    global.fetch.mockClear();
    mockFetchResponse(200, { access_token: "ya29.cached", expires_in: 3600 });

    const out = await gmailOAuth.getAccessToken();
    expect(out.accessToken).toBe("ya29.cached");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("refreshes when the cached token is within 60s of expiry", async () => {
    writeCreds();
    writeToken();
    // First call: 30s expiry → still fresh enough to skip next call? Actually
    // 30s < 60s skew, so the next call SHOULD refresh.
    mockFetchResponse(200, { access_token: "ya29.short", expires_in: 30 });

    await gmailOAuth.getAccessToken();
    mockFetchResponse(200, { access_token: "ya29.renewed", expires_in: 3600 });

    const out = await gmailOAuth.getAccessToken();
    expect(out.accessToken).toBe("ya29.renewed");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("throws with Google's error_description when refresh fails", async () => {
    writeCreds();
    writeToken();
    mockFetchResponse(400, {
      error: "invalid_grant",
      error_description: "Token has been expired or revoked.",
    });

    await expect(gmailOAuth.getAccessToken()).rejects.toThrow(/expired or revoked/);
  });

  it("throws when credentials JSON is missing client_id/client_secret", async () => {
    writeCreds(); // valid
    writeToken();
    fs.writeFileSync(
      CREDS_PATH,
      JSON.stringify({ installed: { client_secret: "x" /* no client_id */ } })
    );
    gmailOAuth._resetCache();

    await expect(gmailOAuth.getAccessToken()).rejects.toThrow(/client_id/);
  });

  it("throws when token JSON has no refresh_token", async () => {
    writeCreds();
    fs.writeFileSync(TOKEN_PATH, JSON.stringify({ access_token: "old" }));
    gmailOAuth._resetCache();

    await expect(gmailOAuth.getAccessToken()).rejects.toThrow(/refresh_token/);
  });

  it("falls back to SMTP_MAIL env var when token has no user field", async () => {
    writeCreds();
    fs.writeFileSync(TOKEN_PATH, JSON.stringify({ refresh_token: "1//r" /* no user */ }));
    gmailOAuth._resetCache();
    mockFetchResponse(200, { access_token: "ya29.x", expires_in: 3600 });

    const out = await gmailOAuth.getAccessToken();
    expect(out.user).toBe("env-fallback@gmail.com");
  });
});

describe("gmailOAuth.sendViaGmailApi", () => {
  beforeEach(() => {
    gmailOAuth = require("../utils/gmailOAuth");
  });

  function mockFetch(status, body) {
    global.fetch = jest.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? "OK" : "Error",
      json: async () => body,
      text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
    });
  }

  function decodeRaw(callIdx = 0) {
    const body = JSON.parse(global.fetch.mock.calls[callIdx][1].body);
    expect(body.raw).toMatch(/^[A-Za-z0-9_-]+$/);
    return Buffer.from(
      body.raw.replace(/-/g, "+").replace(/_/g, "/"),
      "base64"
    ).toString("utf8");
  }

  it("POSTs text-only message when html is absent", async () => {
    mockFetch(200, { id: "msg-1", threadId: "t-1" });

    const result = await gmailOAuth.sendViaGmailApi({
      user: "you@gmail.com",
      accessToken: "ya29.x",
      from: `"Test" <you@gmail.com>`,
      to: "dest@example.com",
      subject: "Hi",
      text: "Body line 1\nBody line 2",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer ya29.x",
          "Content-Type": "application/json",
        }),
      })
    );

    const decoded = decodeRaw();
    expect(decoded).toMatch(/^From: "Test" <you@gmail\.com>/);
    expect(decoded).toMatch(/^To: dest@example\.com/m);
    expect(decoded).toMatch(/^Subject: Hi/m);
    expect(decoded).toMatch(/Content-Type: text\/plain; charset=utf-8/);
    expect(decoded).toContain("Body line 1");
    expect(result).toEqual({ id: "msg-1", threadId: "t-1" });
  });

  it("builds multipart/alternative when both text and html are present", async () => {
    mockFetch(200, { id: "msg-2" });

    await gmailOAuth.sendViaGmailApi({
      user: "you@gmail.com",
      accessToken: "ya29.x",
      from: "you@gmail.com",
      to: "dest@example.com",
      subject: "Hi",
      text: "Plain version",
      html: "<p>HTML version</p>",
    });

    const decoded = decodeRaw();
    expect(decoded).toMatch(/Content-Type: multipart\/alternative; boundary="mixed-/);
    expect(decoded).toContain("Content-Type: text/plain; charset=utf-8");
    expect(decoded).toContain("Content-Type: text/html; charset=utf-8");
    expect(decoded).toContain("Plain version");
    expect(decoded).toContain("<p>HTML version</p>");
    // Multipart close boundary at end
    expect(decoded.trimEnd()).toMatch(/--mixed-[a-z0-9-]+--$/);
  });

  it("builds text/html single-part when only html is present", async () => {
    mockFetch(200, { id: "msg-3" });

    await gmailOAuth.sendViaGmailApi({
      user: "you@gmail.com",
      accessToken: "ya29.x",
      from: "you@gmail.com",
      to: "dest@example.com",
      subject: "Hi",
      html: "<p>Only HTML</p>",
    });

    const decoded = decodeRaw();
    expect(decoded).toMatch(/Content-Type: text\/html; charset=utf-8/);
    expect(decoded).toContain("<p>Only HTML</p>");
    expect(decoded).not.toContain("multipart/alternative");
  });

  it("throws with HTTP status + Google body when API returns non-2xx", async () => {
    mockFetch(403, {
      error: { code: 403, message: "Insufficient Permission", status: "PERMISSION_DENIED" },
    });

    await expect(
      gmailOAuth.sendViaGmailApi({
        user: "you@gmail.com",
        accessToken: "ya29.x",
        from: "you@gmail.com",
        to: "dest@example.com",
        subject: "S",
        text: "T",
      })
    ).rejects.toThrow(/403.*Insufficient Permission/);
  });

  it("rejects when accessToken is missing", async () => {
    await expect(
      gmailOAuth.sendViaGmailApi({
        user: "you@gmail.com",
        accessToken: "",
        from: "you@gmail.com",
        to: "dest@example.com",
        subject: "S",
        text: "T",
      })
    ).rejects.toThrow(/accessToken/);
  });

  it("rejects when user is missing", async () => {
    await expect(
      gmailOAuth.sendViaGmailApi({
        user: "",
        accessToken: "ya29.x",
        from: "you@gmail.com",
        to: "dest@example.com",
        subject: "S",
        text: "T",
      })
    ).rejects.toThrow(/user/);
  });
});