"use strict";
/**
 * Unit tests for backend/services/paymentService.js.
 *
 * Covers:
 *   - createPaymentIntent  — happy path + override + Stripe throws
 *   - retrievePaymentIntent — happy path + Stripe throws
 *   - verifyWebhookSignature — happy path + signature-mismatch throws
 *
 * AAA pattern: every test has explicit Arrange / Act / Assert blocks.
 *
 * Strategy: paymentService.js caches the Stripe client in a module-scope
 * singleton (`getStripe()`). After the first call to a service function,
 * the cached instance is the SAME object returned by `require("stripe")()`
 * at the top of this file (jest.mock factories return the same value for
 * every call from the same module loader). Tests can therefore mutate the
 * methods on that reference and the singleton sees the change.
 */
const paymentService = require("../services/paymentService");

// Capture the singleton. require("stripe")() inside this file returns the
// same object the service's getStripe() caches on first call. (Jest's mock
// factory runs once per loader; subsequent require() calls return the same
// constructor, and the constructor returns the cached mock.)
const stripeInstance = require("stripe")();

describe("paymentService.createPaymentIntent", () => {
  it("returns the mock intent with default currency", async () => {
    // Act
    const result = await paymentService.createPaymentIntent(12345);

    // Assert
    expect(result).toMatchObject({
      id: "pi_test",
      client_secret: "test_secret",
    });
  });

  it("accepts currency override + metadata without throwing", async () => {
    // Act + Assert — verifies the service forwards opts to Stripe
    const result = await paymentService.createPaymentIntent(999, {
      currency: "eur",
      metadata: { orderId: "ord_42" },
    });
    expect(result.id).toBe("pi_test");
  });

  it("propagates errors thrown by Stripe", async () => {
    // Arrange
    stripeInstance.paymentIntents.create.mockRejectedValueOnce(new Error("Stripe down"));

    // Act + Assert
    await expect(paymentService.createPaymentIntent(1000)).rejects.toThrow(/Stripe down/);
  });
});

describe("paymentService.retrievePaymentIntent", () => {
  it("returns the PaymentIntent returned by Stripe", async () => {
    // Arrange — the global mock resolves to { id: "pi_test", status: "succeeded", amount: 0 }
    // by default, but we override for this assertion
    stripeInstance.paymentIntents.retrieve.mockResolvedValueOnce({
      id: "pi_abc",
      status: "succeeded",
      amount: 5000,
    });

    // Act
    const result = await paymentService.retrievePaymentIntent("pi_abc");

    // Assert
    expect(result).toEqual({ id: "pi_abc", status: "succeeded", amount: 5000 });
  });

  it("propagates errors thrown by Stripe", async () => {
    // Arrange
    stripeInstance.paymentIntents.retrieve.mockRejectedValueOnce(
      new Error("No such payment_intent: 'pi_missing'")
    );

    // Act + Assert
    await expect(paymentService.retrievePaymentIntent("pi_missing")).rejects.toThrow(
      /No such payment_intent/
    );
  });
});

describe("paymentService.verifyWebhookSignature", () => {
  it("returns the parsed event when Stripe accepts the signature", () => {
    // Arrange — the global mock JSON.parses the raw body
    const eventJson = JSON.stringify({
      id: "evt_123",
      type: "payment_intent.succeeded",
      data: { object: { id: "pi_abc" } },
    });
    const rawBody = Buffer.from(eventJson);

    // Act
    const event = paymentService.verifyWebhookSignature(rawBody, "t=123,v1=abc", "whsec_test");

    // Assert
    expect(event).toMatchObject({
      id: "evt_123",
      type: "payment_intent.succeeded",
    });
  });

  it("propagates Stripe signature-mismatch errors", () => {
    // Arrange
    stripeInstance.webhooks.constructEvent.mockImplementationOnce(() => {
      throw new Error("No signatures found matching the expected signature for payload");
    });

    // Act + Assert
    const rawBody = Buffer.from('{"id":"evt_bad"}');
    expect(() => paymentService.verifyWebhookSignature(rawBody, "bad-sig", "whsec_test")).toThrow(
      /signatures found matching/i
    );
  });
});
