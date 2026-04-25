"use strict";
// setupFiles: runs before modules load — mock Stripe + Cloudinary
jest.mock("stripe", () => () => ({
  paymentIntents: { create: jest.fn().mockResolvedValue({ client_secret: "test_secret" }) },
}));
jest.mock("cloudinary", () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload:  jest.fn().mockResolvedValue({ public_id: "test_id", secure_url: "http://test.url/img.jpg" }),
      destroy: jest.fn().mockResolvedValue({ result: "ok" }),
    },
  },
}));
process.env.STRIPE_SECRET_KEY = "sk_test_mock";
process.env.JWT_SECRET        = "test_jwt_secret_for_jest_only";
process.env.JWT_EXPIRE        = "7d";
process.env.COOKIE_EXPIRE     = "7";
