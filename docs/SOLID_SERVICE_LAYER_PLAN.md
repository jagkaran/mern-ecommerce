# SOLID Refactoring Plan — Service Layer Extraction

## Why SOLID matters for this codebase

The project is a small-to-medium Express API. The controllers currently mix
**HTTP request handling** with **infrastructure concerns** (Cloudinary uploads,
email dispatch, file cleanup). This creates two concrete problems:

1. **Duplication**: Cloudinary destroy+upload appears in 5+ places across
   `userController.js` and `productController.js`. Any API change (new folder,
   different width/crop, retry logic) must be applied in every spot.
2. **Testability**: You cannot unit-test a controller that immediately calls
   `cloudinary.uploader.upload()` — the test needs real Cloudinary creds or a
   brittle mock.
3. **Substitutability**: Switching to S3, Supabase Storage, or a local disk
   store means editing every controller method that touches Cloudinary.

Applying SOLID's **D** (Dependency Inversion) and **S** (Single Responsibility)
via a thin service layer fixes all three with minimal risk.

> **Scope decision**: I will NOT split controllers into smaller controller files
> (which would also satisfy SRP). That is high-risk — route files must be
> updated in lock-step, and tests reference existing patterns. The service layer
> extraction is safe: it is purely additive (new files, no deleted behaviour),
> and existing tests don't touch the internals of Cloudinary calls.

---

## Applicable SOLID Principles

| Principle | Violation | Severity |
|-----------|-----------|----------|
| **S** — Single Responsibility | `createProduct` also handles image upload lifecycle (destroy + upload + assign) | Medium |
| **D** — Dependency Inversion | Controllers depend on concrete `cloudinary.uploader` | High |
| **D** — Dependency Inversion | Controllers depend on concrete `sendEmail` | Low (1 call site) |
| **O** — Open/Closed | Adding image compression / different CDN requires touching all controllers | Medium |

---

## Plan: Extract a `StorageService` (Cloudinary → service layer)

### New file: `backend/services/storageService.js`

```js
// backend/services/storageService.js
// Single responsibility: all Cloudinary upload / destroy operations.
// Import this in controllers; never import cloudinary directly outside tests.

const cloudinary = require("cloudinary").v2;
const logger = require("../utils/logger");

class StorageService {
  /**
   * Upload a single base64/data-URL image to Cloudinary.
   * @param {string} dataUri   — base64 string (e.g. "data:image/png;base64,...")
   * @param {string} folder    — Cloudinary folder path
   * @param {object} [options] — upload options (width, crop, etc.)
   * @returns {Promise<{public_id: string, url: string}>}
   */
  async uploadImage(dataUri, folder, options = {}) {
    try {
      const result = await cloudinary.uploader.upload(dataUri, {
        folder,
        ...options,
      });
      return { public_id: result.public_id, url: result.secure_url };
    } catch (error) {
      logger.error(`Cloudinary upload failed [${folder}]: ${error.message}`);
      throw new Error("Image upload failed. Please try again.");
    }
  }

  /**
   * Upload multiple images in parallel.
   * @param {string[]} dataUris
   * @param {string} folder
   * @param {object} [options]
   * @returns {Promise<{public_id: string, url: string}[]>}
   */
  async uploadMany(dataUris, folder, options = {}) {
    return Promise.all(dataUris.map((uri) => this.uploadImage(uri, folder, options)));
  }

  /**
   * Destroy a Cloudinary image by public_id. Swallows 404-level errors
   * (already deleted) so callers don't need to handle them individually.
   * @param {string} publicId
   */
  async destroyImage(publicId) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      logger.warn(`Cloudinary destroy failed [${publicId}]: ${error.message}`);
      // Don't throw — a failed destroy of an old image should not block a
      // profile update or product update.
    }
  }

  /**
   * Destroy multiple images in parallel. Used before re-uploading product images.
   * @param {{public_id: string}[]} images
   */
  async destroyMany(images) {
    return Promise.all(images.map((img) => this.destroyImage(img.public_id)));
  }

  /**
   * Upload an avatar image (resized to 200px wide, crop=scale).
   * @param {string} dataUri
   * @returns {Promise<{public_id: string, url: string}>}
   */
  async uploadAvatar(dataUri) {
    return this.uploadImage(dataUri, "avatars", { width: 200, crop: "scale" });
  }

  /**
   * Upload a product image (default folder "products").
   * @param {string} dataUri
   * @returns {Promise<{public_id: string, url: string}>}
   */
  async uploadProductImage(dataUri) {
    return this.uploadImage(dataUri, "products");
  }
}

// Singleton — Cloudinary v2 is already a configured singleton; this class
// is stateless so a single instance is fine.
module.exports = new StorageService();
```

### New file: `backend/services/emailService.js`

```js
// backend/services/emailService.js
// Single responsibility: all email dispatch.
// Wraps sendEmail utility so callers use named methods instead of
// constructing raw email text inline.

const sendEmail = require("../utils/sendEmail");
const logger = require("../utils/logger");

class EmailService {
  /**
   * Send a password-reset email.
   * @param {string} email   — recipient address
   * @param {string} url     — reset URL (already-tokenised)
   */
  async sendPasswordReset(email, url) {
    const subject = "Ecommerce Password Recovery";
    const message = `Your password reset link:\n\n${url}\n\nIf you did not request this, please ignore it.`;
    try {
      await sendEmail({ email, subject, message });
      logger.info(`Password reset email sent to ${email}`);
    } catch (error) {
      logger.error(`Password reset email failed for ${email}: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new EmailService();
```

---

## Controller refactoring (minimal changes)

The guiding rule: **replace `require("cloudinary").v2` calls with the
service, and inline email body construction with `EmailService` calls**.
No behaviour changes.

### `userController.js` changes

| Before (line) | After |
|----------------|-------|
| `const cloudinary = require("cloudinary").v2;` (line 7) | `const storage = require("../services/storageService");` |
| `const sendEmail = require("../utils/sendEmail");` (line 6) | `const emailService = require("../services/emailService");` |
| Lines 219-234 (destroy + upload in updateProfile) | `const myCloud = await storage.uploadAvatar(req.body.avatar);` |
| Lines 337-341 (destroy in deleteUser) | `await storage.destroyImage(user.profilePic.public_id);` |
| Lines 93-106 (forgotPassword inline email) | `const resetUrl = \`${req.protocol}://${req.get("host")}/password/reset/${resetToken}\`; await emailService.sendPasswordReset(user.email, resetUrl);` |

### `productController.js` changes

| Before (line) | After |
|----------------|-------|
| `const cloudinary = require("cloudinary").v2;` (line 5) | `const storage = require("../services/storageService");` |
| Lines 28-34 (uploadMany inline) | `const imagesLinks = await storage.uploadMany(images, "products");` |
| Lines 191-196 (destroyMany in update) | `await storage.destroyMany(product.images);` |
| Lines 199-210 (re-upload in update) | `const imagesLinks = await storage.uploadMany(images, "products");` |
| Lines 245-250 (destroyMany in delete) | `await storage.destroyMany(product.images);` |

---

## Test changes

The existing jest tests mock Cloudinary via `jest.mock("cloudinary")`. After
this refactor those mocks must move:

```js
// backend/__tests__/*.test.js
// BEFORE
jest.mock("cloudinary");

// AFTER
jest.mock("../services/storageService", () => ({
  uploadImage: jest.fn(),
  uploadMany: jest.fn(),
  destroyImage: jest.fn(),
  destroyMany: jest.fn(),
  uploadAvatar: jest.fn(),
  uploadProductImage: jest.fn(),
}));
```

Existing test assertions that check `cloudinary.uploader.upload.mock.calls`
must be updated to check `storageService.uploadImage.mock.calls` instead.

Estimated test diff: ~30 lines changed across 4-5 test files.

---

## Risk register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| StorageService import fails in tests (mock path wrong) | Medium | E2E block | Run jest immediately after each controller change |
| Profile update no longer destroys old image | Low | Storage leak | Verify `destroyImage` call order: destroy BEFORE upload in `updateProfile` |
| Email body format changed | Low | None functional | Same string passed to `sendEmail` via service |
| Stats / coverage metrics drop | Low | CI noise | Expected: `uploadMany` unit tests can be added at service level |

---

## Rollout order

1. Create `backend/services/storageService.js` — no existing code touched
2. Create `backend/services/emailService.js` — no existing code touched
3. Update `userController.js` — run jest
4. Update `productController.js` — run jest
5. Update jest mocks in affected test files — run jest + coverage
6. Final `npm test -- --coverage` to verify thresholds still met

Each step is independently releasable; no step depends on a later one.

---

## Estimated time

| Step | Time |
|------|------|
| Write storageService.js + emailService.js | ~15 min |
| Refactor userController.js | ~10 min |
| Refactor productController.js | ~10 min |
| Update jest mocks + fix test assertions | ~20 min |
| Full test suite run + stray failures | ~15 min |
| **Total** | **~70 min** |
