"use strict";
/**
 * Jest module mock for Stripe.
 * Loaded via setupFiles so it runs before any test file requires app.js.
 * Prevents "Neither apiKey nor config.authenticator provided" crash
 * when STRIPE_SECRET_KEY is not set in the test environment.
 */
jest.mock("stripe", () => {
  return () => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({ client_secret: "test_secret" }),
    },
  });
});
