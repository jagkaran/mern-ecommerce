"use strict";
/**
 * Jest setupFiles — runs BEFORE any module is loaded in each test worker.
 * 1. Mock Stripe so paymentController loads without a real API key.
 * 2. Mock Cloudinary so product routes don't need real cloud credentials.
 * 3. Set STRIPE_SECRET_KEY env so stripe() call doesn't throw.
 */

// Must come before any require() of the modules
jest.mock("stripe", () => {
  return () => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({ client_secret: "test_secret" }),
    },
  });
});

jest.mock("cloudinary", () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload:  jest.fn().mockResolvedValue({ public_id: "test_id", secure_url: "http://test.url/img.jpg" }),
      destroy: jest.fn().mockResolvedValue({ result: "ok" }),
    },
  },
}));

process.env.STRIPE_SECRET_KEY  = "sk_test_mock";
process.env.JWT_SECRET         = "test_jwt_secret_for_jest_only";
process.env.JWT_EXPIRE         = "7d";
process.env.COOKIE_EXPIRE      = "7";
