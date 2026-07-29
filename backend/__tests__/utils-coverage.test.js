"use strict";
/**
 * utils-coverage.test.js
 *
 * Directly imports and exercises the utility modules that had 0% or very
 * low coverage, pushing the global statement/line totals past the 70%
 * threshold. All external I/O is mocked so no real network, DB, or
 * filesystem access occurs.
 *
 * Covered:
 *   backend/utils/sendEmail.js   (OAuth-only path)
 *   backend/utils/logger.js      (lines 18-60)
 *   backend/config/database.js   (lines 1-33)
 */

// The global setup file mocks sendEmail/gmailOAuth/emailService so that
// integration tests never hit the network. This file explicitly exercises
// the real implementations, so unmock them.
jest.unmock("../utils/sendEmail");
jest.unmock("../utils/gmailOAuth");
jest.unmock("../services/emailService");

// ─── sendEmail ────────────────────────────────────────────────────────────────
// sendEmail is OAuth-only — it uses Gmail API exclusively. No nodemailer,
// no SMTP. The legacy SMTP_* env vars are read solely to keep the helper
// from throwing "SMTP_MAIL not set" when the From-address isn't loaded
// from the env yet.
describe("sendEmail utility", () => {
  let sendEmail;
  let mockGetAccessToken;
  let mockSendViaGmailApi;

  beforeEach(() => {
    jest.resetModules();

    // Default: OAuth unavailable. Each test opts in via
    // `mockGetAccessToken.mockResolvedValueOnce(...)`.
    mockGetAccessToken = jest.fn().mockResolvedValue(null);
    mockSendViaGmailApi = jest.fn().mockResolvedValue({ id: "gmail-msg-id" });
    jest.doMock("../utils/gmailOAuth", () => ({
      getAccessToken: mockGetAccessToken,
      sendViaGmailApi: mockSendViaGmailApi,
      _resetCache: jest.fn(),
    }));

    sendEmail = require("../utils/sendEmail");
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.dontMock("../utils/gmailOAuth");
    delete process.env.SMTP_MAIL;
  });

  it("uses Gmail API via sendViaGmailApi when OAuth is configured", async () => {
    process.env.SMTP_MAIL = "worldwidesingh@gmail.com";
    mockGetAccessToken.mockResolvedValueOnce({
      user: "worldwidesingh@gmail.com",
      clientId: "cid",
      clientSecret: "csec",
      accessToken: "ya29.fake-access",
      refreshToken: "1//fake-refresh",
    });

    const result = await sendEmail({
      email: "user@example.com",
      subject: "Reset",
      message: "Click here",
    });

    expect(mockSendViaGmailApi).toHaveBeenCalledWith(
      expect.objectContaining({
        user: "worldwidesingh@gmail.com",
        accessToken: "ya29.fake-access",
        from: `"Click.it Store" <worldwidesingh@gmail.com>`,
        to: "user@example.com",
        subject: "Reset",
        text: "Click here",
      })
    );
    expect(result).toEqual({ id: "gmail-msg-id" });
  });

  it("throws when OAuth token is unavailable", async () => {
    process.env.SMTP_MAIL = "noauth@gmail.com";
    mockGetAccessToken.mockResolvedValueOnce(null);

    await expect(
      sendEmail({ email: "u@e.com", subject: "S", message: "M" })
    ).rejects.toThrow(/Gmail OAuth not configured/);
    expect(mockSendViaGmailApi).not.toHaveBeenCalled();
  });

  it("propagates sendViaGmailApi rejection", async () => {
    process.env.SMTP_MAIL = "auth@gmail.com";
    mockGetAccessToken.mockResolvedValueOnce({
      user: "auth@gmail.com",
      accessToken: "ya29.x",
      refreshToken: "1//r",
    });
    mockSendViaGmailApi.mockRejectedValueOnce(new Error("Gmail API send failed: 401"));

    await expect(
      sendEmail({ email: "u@e.com", subject: "S", message: "M" })
    ).rejects.toThrow("Gmail API send failed: 401");
  });

  it("does not require nodemailer at all", async () => {
    process.env.SMTP_MAIL = "auth@gmail.com";
    mockGetAccessToken.mockResolvedValueOnce({
      user: "auth@gmail.com",
      accessToken: "ya29.x",
      refreshToken: "1//r",
    });

    // If sendEmail still tried to require nodemailer, the absence of any
    // mock would throw MODULE_NOT_FOUND. The fact that this resolves
    // proves the SMTP path is gone.
    await expect(
      sendEmail({ email: "u@e.com", subject: "S", message: "M" })
    ).resolves.toEqual({ id: "gmail-msg-id" });
  });
});

// ─── logger ───────────────────────────────────────────────────────────────────
describe("logger utility", () => {
  it("exports a winston logger with expected methods", () => {
    const logger = require("../utils/logger");
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.error).toBe("function");
  });

  it("can log info without throwing", () => {
    const logger = require("../utils/logger");
    expect(() => logger.info("test info message")).not.toThrow();
  });

  it("can log warn without throwing", () => {
    const logger = require("../utils/logger");
    expect(() => logger.warn("test warn message")).not.toThrow();
  });

  it("can log error without throwing", () => {
    const logger = require("../utils/logger");
    expect(() => logger.error("test error message")).not.toThrow();
  });

  it("can log an Error object with stack trace", () => {
    const logger = require("../utils/logger");
    expect(() => logger.error(new Error("boom"))).not.toThrow();
  });
});

// ─── database ─────────────────────────────────────────────────────────────────
describe("database connectDB", () => {
  let connectDB;
  let mockConnect;
  let mockLoggerInfo;
  let mockLoggerError;
  let mockExit;

  beforeEach(() => {
    jest.resetModules();

    mockConnect      = jest.fn();
    mockLoggerInfo   = jest.fn();
    mockLoggerError  = jest.fn();
    mockExit         = jest.spyOn(process, "exit").mockImplementation(() => {});

    jest.mock("mongoose", () => ({ connect: mockConnect }));
    jest.mock("../utils/logger", () => ({
      info:  mockLoggerInfo,
      warn:  jest.fn(),
      error: mockLoggerError,
    }));

    connectDB = require("../config/database");
    process.env.DB_URI = "mongodb://localhost/test";
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("logs host and resolves on successful connection", async () => {
    const fakeData = { connection: { host: "localhost" } };
    mockConnect.mockResolvedValueOnce(fakeData);

    connectDB();
    // Let the resolved promise callbacks run
    await new Promise((r) => setImmediate(r));

    expect(mockConnect).toHaveBeenCalledWith(
      "mongodb://localhost/test",
      expect.objectContaining({ maxPoolSize: 20 })
    );
    expect(mockLoggerInfo).toHaveBeenCalledWith(
      expect.stringContaining("localhost")
    );
  });

  it("logs error and calls process.exit(1) on connection failure", async () => {
    mockConnect.mockRejectedValueOnce(new Error("connection refused"));

    connectDB();
    await new Promise((r) => setImmediate(r));

    expect(mockLoggerError).toHaveBeenCalledWith(
      expect.stringContaining("connection refused")
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});
