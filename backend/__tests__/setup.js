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

// Stripe mock
jest.mock("stripe", () => () => ({
  paymentIntents: { create: jest.fn().mockResolvedValue({ client_secret: "test_secret" }) },
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
