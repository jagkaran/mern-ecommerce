"use strict";
/**
 * utils-coverage.test.js
 *
 * Directly imports and exercises the utility modules that had 0% or very
 * low coverage, pushing the global statement/line totals past the 70%
 * threshold. All external I/O is mocked so no real SMTP, DB, or filesystem
 * access occurs.
 *
 * Covered:
 *   backend/utils/sendEmail.js   (was 42% — covers lines 21-48)
 *   backend/utils/logger.js      (was 50%  — covers lines 18-60)
 *   backend/config/database.js   (was 0%   — covers lines 1-33)
 */

// ─── sendEmail ────────────────────────────────────────────────────────────────
describe("sendEmail utility", () => {
  let sendEmail;
  let mockSendMail;
  let mockCreateTransport;

  beforeEach(() => {
    jest.resetModules();
    mockSendMail = jest.fn().mockResolvedValue({ messageId: "test-id" });
    mockCreateTransport = jest.fn().mockReturnValue({ sendMail: mockSendMail });

    jest.mock("nodemailer", () => ({ createTransport: mockCreateTransport }));
    sendEmail = require("../utils/sendEmail");
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.SMTP_SERVICE;
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
  });

  it("uses service-based transport when SMTP_SERVICE is set", async () => {
    process.env.SMTP_SERVICE  = "gmail";
    process.env.SMTP_MAIL     = "test@gmail.com";
    process.env.SMTP_PASSWORD = "app-password";

    await sendEmail({ email: "user@example.com", subject: "Hi", message: "Hello" });

    expect(mockCreateTransport).toHaveBeenCalledWith(
      expect.objectContaining({ service: "gmail" })
    );
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "user@example.com", subject: "Hi" })
    );
  });

  it("uses host/port transport when SMTP_SERVICE is not set", async () => {
    delete process.env.SMTP_SERVICE;
    process.env.SMTP_HOST     = "smtp.mailtrap.io";
    process.env.SMTP_PORT     = "2525";
    process.env.SMTP_MAIL     = "test@mailtrap.io";
    process.env.SMTP_PASSWORD = "secret";

    await sendEmail({ email: "dest@example.com", subject: "Test", message: "Body" });

    expect(mockCreateTransport).toHaveBeenCalledWith(
      expect.objectContaining({ host: "smtp.mailtrap.io", port: 2525, secure: false })
    );
  });

  it("uses secure:true when SMTP_PORT is 465", async () => {
    delete process.env.SMTP_SERVICE;
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_PORT = "465";

    await sendEmail({ email: "a@b.com", subject: "S", message: "M" });

    expect(mockCreateTransport).toHaveBeenCalledWith(
      expect.objectContaining({ secure: true })
    );
  });

  it("propagates sendMail rejection", async () => {
    process.env.SMTP_SERVICE = "gmail";
    mockSendMail.mockRejectedValueOnce(new Error("SMTP failure"));

    await expect(
      sendEmail({ email: "x@x.com", subject: "S", message: "M" })
    ).rejects.toThrow("SMTP failure");
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
