"use strict";
/**
 * emailTemplates.test.js
 *
 * Locks in the structural shape of the themed transactional emails:
 * - shell (header bar, brand colors, preview text)
 * - escape / format helpers
 * - password reset content
 * - order confirmation content
 *
 * Doesn't snapshot full HTML (too brittle). Instead asserts presence of
 * key markers — buttons, brand color, totals, recipient name, address.
 */

const t = require("../utils/emailTemplates");

describe("emailTemplates helpers", () => {
  it("escapeHtml escapes HTML-significant characters", () => {
    expect(t.escapeHtml(`<img src="x" onerror='a'>&`)).toBe(
      "&lt;img src=&quot;x&quot; onerror=&#39;a&#39;&gt;&amp;"
    );
  });

  it("formatMoney uses USD when no currency given", () => {
    expect(t.formatMoney(12.5)).toMatch(/\$12\.50/);
  });

  it("formatMoney respects currency arg", () => {
    expect(t.formatMoney(99, "EUR")).toMatch(/99/);
  });

  it("formatMoney falls back to raw on garbage", () => {
    expect(t.formatMoney(Number.NaN, "USD")).toMatch(/0\.00/);
  });
});

describe("emailTemplates.passwordResetHtml", () => {
  it("includes brand color, button, and reset URL", () => {
    const html = t.passwordResetHtml({
      name: "Alex",
      resetUrl: "https://app.example/password/reset/xyz",
    });
    expect(html).toMatch(/^<!doctype html>/i);
    expect(html).toContain("#92593f"); // primary
    expect(html).toContain("Reset my password");
    expect(html).toContain("https://app.example/password/reset/xyz");
    expect(html).toContain("Hi Alex,");
    expect(html).toContain("15 minutes");
    // Preview text
    expect(html).toContain("link expires in 15 minutes");
  });

  it("greets generically when no name", () => {
    const html = t.passwordResetHtml({
      name: null,
      resetUrl: "https://x/y",
    });
    expect(html).toContain("Hi,");
  });

  it("escapes XSS in name and URL", () => {
    const html = t.passwordResetHtml({
      name: `<script>alert(1)</script>`,
      resetUrl: "https://x/<img onerror=x>",
    });
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain('<img onerror=x>');
  });
});

describe("emailTemplates.passwordResetText", () => {
  it("includes the URL and ignores-this-email line", () => {
    const text = t.passwordResetText({
      name: "Alex",
      resetUrl: "https://x/y",
    });
    expect(text).toContain("Hi Alex,");
    expect(text).toContain("https://x/y");
    expect(text).toContain("15 minutes");
    expect(text).toContain("safely ignore this email");
  });
});

describe("emailTemplates.orderConfirmationHtml", () => {
  const order = {
    _id: "65f1a2b3c4d5e6f7a8b9c0d1",
    shippingInfo: {
      address: "1 Main",
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

  it("renders items, totals, and shipping address", () => {
    const html = t.orderConfirmationHtml({
      name: "Sam",
      order,
      currency: "USD",
    });
    expect(html).toMatch(/^<!doctype html>/i);
    expect(html).toContain("Trail Runner");
    expect(html).toContain("Wool Socks");
    expect(html).toContain("$135.50");
    expect(html).toContain("Brooklyn");
    expect(html).toContain("Hi Sam,");
    // Brand color present
    expect(html).toContain("#92593f");
  });

  it("shows discount line when discount > 0", () => {
    const html = t.orderConfirmationHtml({
      name: "Sam",
      order: { ...order, discount: 10, totalPrice: 125.5 },
      currency: "USD",
    });
    expect(html).toMatch(/Discount/i);
    expect(html).toContain("$10.00");
    expect(html).toContain("$125.50");
  });

  it("hides discount line when discount is 0", () => {
    const html = t.orderConfirmationHtml({
      name: "Sam",
      order,
      currency: "USD",
    });
    expect(html).not.toContain("$-");
  });

  it("falls back gracefully with empty orderItems", () => {
    const html = t.orderConfirmationHtml({
      name: null,
      order: { ...order, orderItems: [] },
      currency: "USD",
    });
    expect(html).toContain("Hi,");
  });

  it("includes 'View your order' CTA when orderUrl is set", () => {
    const html = t.orderConfirmationHtml({
      name: "Sam",
      order,
      currency: "USD",
      orderUrl: "https://shop.example.com/order/65f1a2b3",
    });
    expect(html).toContain("View your order");
    expect(html).toContain('href="https://shop.example.com/order/65f1a2b3"');
    // CTA must use the brand primary color
    expect(html).toMatch(/#92593f[\s\S]*View your order/);
  });

  it("omits the CTA when orderUrl is not set", () => {
    const html = t.orderConfirmationHtml({
      name: "Sam",
      order,
      currency: "USD",
    });
    expect(html).not.toContain("View your order");
  });
});

describe("emailTemplates.orderConfirmationText", () => {
  const order = {
    _id: "abc",
    shippingInfo: { address: "1 Main", city: "NY", state: "NY", zip: "10001", country: "USA" },
    orderItems: [{ name: "Mug", price: 10, quantity: 1 }],
    itemPrice: 10,
    shippingPrice: 5,
    taxPrice: 1,
    discount: 0,
    totalPrice: 16,
    currency: "USD",
    paidAt: Date.now(),
  };

  it("lists items and totals", () => {
    const text = t.orderConfirmationText({ name: "Sam", order, currency: "USD" });
    expect(text).toContain("Mug x1");
    expect(text).toContain("$16.00");
    expect(text).toContain("Subtotal");
    expect(text).toContain("Shipping");
    expect(text).toContain("Tax");
    expect(text).toContain("Total");
  });

  it("includes discount line only when discount > 0", () => {
    const textWith = t.orderConfirmationText({
      name: "Sam",
      order: { ...order, discount: 5, totalPrice: 11 },
      currency: "USD",
    });
    expect(textWith).toMatch(/Discount: -\$/);
    const textWithout = t.orderConfirmationText({
      name: "Sam",
      order,
      currency: "USD",
    });
    expect(textWithout).not.toMatch(/Discount:/);
  });

  it("includes 'View your order' line when orderUrl is set", () => {
    const text = t.orderConfirmationText({
      name: "Sam",
      order,
      currency: "USD",
      orderUrl: "https://shop.example.com/order/abc",
    });
    expect(text).toContain("View your order: https://shop.example.com/order/abc");
  });

  it("omits the CTA line when orderUrl is not set", () => {
    const text = t.orderConfirmationText({ name: "Sam", order, currency: "USD" });
    expect(text).not.toContain("View your order");
  });
});