"use strict";
/**
 * emailService.test.js
 *
 * Covers backend/services/emailService.js. The transport (sendEmail) is
 * mocked globally by setup.js — we exercise the wrappers:
 *   sendPasswordReset   — subject/html/text composition, success log,
 *                          error log + rethrow
 *   sendOrderConfirmation — same, plus guest-vs-authed code paths, plus
 *                          that it does NOT rethrow on failure (best-effort)
 *
 * We don't re-mock ../utils/sendEmail here — re-mocking would produce a
 * new jest.fn() instance while emailService.js still holds the original
 * (setup-installed) reference, so calls would silently go to the wrong
 * function. We mutate the setup-installed mock directly via its module
 * export.
 */

const sendEmailModule = require("../utils/sendEmail");
const emailService = require("../services/emailService");

describe("EmailService.sendPasswordReset", () => {
  beforeEach(() => {
    sendEmailModule.mockReset();
    sendEmailModule.mockResolvedValue(undefined);
  });

  it("sends a themed password-reset email with HTML body", async () => {
    await emailService.sendPasswordReset(
      "user@example.com",
      "https://app/password/reset/abc",
      "Alex"
    );

    expect(sendEmailModule).toHaveBeenCalledTimes(1);
    const opts = sendEmailModule.mock.calls[0][0];
    expect(opts.email).toBe("user@example.com");
    expect(opts.subject).toBe("Reset your Click.it Store password");
    expect(opts.message).toContain("https://app/password/reset/abc");
    expect(opts.message).toContain("Hi Alex,");
    expect(opts.html).toMatch(/^<!doctype html>/i);
    expect(opts.html).toContain("Reset your password");
    expect(opts.html).toContain("https://app/password/reset/abc");
    // Brand colors must be present
    expect(opts.html).toContain("#92593f");
  });

  it("works without a name", async () => {
    await emailService.sendPasswordReset("a@b.com", "https://x/y");
    const opts = sendEmailModule.mock.calls[0][0];
    expect(opts.html).toContain("Hi,");
    expect(opts.message).toContain("Hi,");
  });

  it("logs info on success", async () => {
    const logger = require("../utils/logger");
    const infoSpy = jest.spyOn(logger, "info").mockImplementation(() => {});
    try {
      await emailService.sendPasswordReset("a@b.com", "http://x/y");
      expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining("a@b.com"));
    } finally {
      infoSpy.mockRestore();
    }
  });

  it("logs error and rethrows when sendEmail fails", async () => {
    const logger = require("../utils/logger");
    const errorSpy = jest.spyOn(logger, "error").mockImplementation(() => {});
    sendEmailModule.mockRejectedValueOnce(new Error("gmail refused"));
    try {
      await expect(
        emailService.sendPasswordReset("a@b.com", "http://x/y")
      ).rejects.toThrow("gmail refused");
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("a@b.com")
      );
    } finally {
      errorSpy.mockRestore();
    }
  });
});

describe("EmailService.sendOrderConfirmation", () => {
  const sampleOrder = {
    _id: "65f1a2b3c4d5e6f7a8b9c0d1",
    shippingInfo: {
      address: "123 Main St",
      city: "Brooklyn",
      state: "NY",
      country: "USA",
      zip: "11201",
      phone: 5551234567,
    },
    orderItems: [
      { name: "Trail Runner", price: 89, quantity: 1, image: "https://x/i.jpg" },
      { name: "Wool Socks", price: 14, quantity: 2, image: "https://x/s.jpg" },
    ],
    itemPrice: 117,
    shippingPrice: 8,
    taxPrice: 10.5,
    discount: 0,
    totalPrice: 135.5,
    currency: "USD",
    paidAt: Date.now(),
  };

  beforeEach(() => {
    sendEmailModule.mockReset();
    sendEmailModule.mockResolvedValue({ id: "gmail-msg-id" });
  });

  it("sends a themed order confirmation with HTML body and CTA", async () => {
    await emailService.sendOrderConfirmation("buyer@example.com", sampleOrder, "Sam");

    expect(sendEmailModule).toHaveBeenCalledTimes(1);
    const opts = sendEmailModule.mock.calls[0][0];
    expect(opts.email).toBe("buyer@example.com");
    expect(opts.subject).toContain("Order #");
    expect(opts.subject).toContain("confirmed");
    expect(opts.html).toMatch(/^<!doctype html>/i);
    expect(opts.html).toContain("Trail Runner");
    expect(opts.html).toContain("Wool Socks");
    expect(opts.html).toContain("Brooklyn");
    expect(opts.html).toContain("#92593f"); // brand primary
    // CTA — picks up CLIENT_URL set by setup.js
    expect(opts.html).toContain("View your order");
    expect(opts.html).toMatch(/\/order\/65f1a2b3c4d5e6f7a8b9c0d1/);
    // Plain-text fallback mirrors the CTA
    expect(opts.message).toContain("View your order:");
    expect(opts.message).toMatch(/\/order\/65f1a2b3c4d5e6f7a8b9c0d1/);
    // Money formatting
    expect(opts.html).toContain("$135.50");
    expect(opts.message).toContain("$135.50");
  });

  it("includes a discount line when discount > 0", async () => {
    await emailService.sendOrderConfirmation(
      "buyer@example.com",
      { ...sampleOrder, discount: 10, totalPrice: 125.5 },
      "Sam"
    );
    const opts = sendEmailModule.mock.calls[0][0];
    expect(opts.html).toMatch(/Discount/i);
    expect(opts.html).toContain("$10.00");
    expect(opts.html).toContain("$125.50");
  });

  it("does NOT rethrow when sendEmail fails (best-effort after payment)", async () => {
    const logger = require("../utils/logger");
    const errorSpy = jest.spyOn(logger, "error").mockImplementation(() => {});
    sendEmailModule.mockRejectedValueOnce(new Error("gmail down"));
    try {
      await expect(
        emailService.sendOrderConfirmation("buyer@example.com", sampleOrder, "Sam")
      ).resolves.toBeUndefined();
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("gmail down")
      );
    } finally {
      errorSpy.mockRestore();
    }
  });

  it("works without a name (guest checkout path)", async () => {
    await emailService.sendOrderConfirmation("guest@example.com", sampleOrder);
    const opts = sendEmailModule.mock.calls[0][0];
    expect(opts.html).toContain("Hi,");
    expect(opts.message).toContain("Hi,");
  });
});