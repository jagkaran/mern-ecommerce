"use strict";
/**
 * Jest setup — runs before any module is required (setupFiles).
 * Sets NODE_ENV + LOG_LEVEL so Winston stays silent during tests.
 */

// Silence Winston — must be set before logger.js is required
process.env.NODE_ENV  = "test";
process.env.LOG_LEVEL = "silent";

// Auth / JWT env
process.env.JWT_SECRET        = "test_jwt_secret_for_jest_only";
process.env.JWT_EXPIRE        = "7d";
process.env.COOKIE_EXPIRE     = "7";
process.env.STRIPE_SECRET_KEY = "sk_test_mock";

// Stripe mock — covers paymentService.createPaymentIntent, retrievePaymentIntent, verifyWebhookSignature.
// Singleton instance so per-test `mockRejectedValueOnce` overrides on the test's
// `stripeInstance` reference are visible to the service's cached `getStripe()`.
let mockStripeSingleton;
jest.mock("stripe", () => (...args) => {
  if (!mockStripeSingleton) {
    mockStripeSingleton = {
      paymentIntents: {
        create: jest.fn().mockResolvedValue({ id: "pi_test", client_secret: "test_secret" }),
        retrieve: jest.fn().mockResolvedValue({ id: "pi_test", status: "succeeded", amount: 0 }),
      },
      webhooks: {
        // Default: parse the raw body so happy-path verify tests pass without
        // any per-test setup. Tests that need an error response override via
        // `stripeInstance.webhooks.constructEvent.mockImplementationOnce(...)`.
        constructEvent: jest.fn((rawBody) => JSON.parse(rawBody.toString())),
      },
    };
  }
  return mockStripeSingleton;
});

// Disposable-email + breach checks must never hit the network in tests.
// Both fail-open in production, so defaulting to "clean" preserves prod semantics
// (signup flows only block when an upstream definitively flags the input).
jest.mock("../services/emailQualityService", () => ({
  isDisposableEmail: jest.fn().mockResolvedValue(false),
}));
jest.mock("../services/passwordBreachService", () => ({
  isPasswordBreached: jest.fn().mockResolvedValue(false),
}));

// Cloudinary mock
jest.mock("cloudinary", () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload:  jest.fn().mockResolvedValue({ public_id: "test_id", secure_url: "http://test.url/img.jpg" }),
      destroy: jest.fn().mockResolvedValue({ result: "ok" }),
    },
  },
}));

// Storage service mock — delegates to same cloudinary inline mock so both
// `cloudinary.uploader.upload.mock.calls` AND `storageService.uploadImage.mock.calls`
// assertions keep working after the SOLID refactor.
jest.mock("../services/storageService", () => ({
  uploadImage: jest.fn().mockImplementation((_dataUri, _folder, opts) =>
    Promise.resolve({ public_id: "test_service_id", url: "http://test.service/img.jpg" })
  ),
  uploadMany: jest.fn().mockImplementation((uris, _folder, opts) =>
    Promise.resolve(uris.map((_, i) => ({ public_id: `test_svc_${i}`, url: `http://test.service/${i}.jpg` })))
  ),
  destroyImage: jest.fn().mockResolvedValue(undefined),
  destroyMany: jest.fn().mockResolvedValue(undefined),
  uploadAvatar: jest.fn().mockResolvedValue({ public_id: "test_avatar_id", url: "http://test.service/avatar.jpg" }),
  uploadProductImage: jest.fn().mockResolvedValue({ public_id: "test_prod_id", url: "http://test.service/prod.jpg" }),
}));
