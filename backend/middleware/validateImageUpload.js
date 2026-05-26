const ErrorHandler = require("../utils/errorHandler");

// Allowed MIME type prefixes for images sent as base64 data URIs.
// Format: data:<mime>;base64,<data>
// We check the declared MIME type AND the actual magic bytes so a
// renamed .exe cannot bypass the check by changing its extension.
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

// Magic byte signatures for each allowed type (first bytes of the
// base64-decoded binary). We only need the first 4 bytes.
const MAGIC_BYTES = [
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png",  bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/gif",  bytes: [0x47, 0x49, 0x46] },
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF header
];

/**
 * Validate a single base64 data URI.
 * Returns an error message string if invalid, or null if valid.
 */
function validateDataUri(dataUri) {
  if (typeof dataUri !== "string") return "Image must be a string.";

  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return "Image must be a valid base64 data URI.";

  const [, declaredMime, b64Data] = match;

  // 1. Check declared MIME type
  if (!ALLOWED_MIME_TYPES.has(declaredMime.toLowerCase())) {
    return `Image type '${declaredMime}' is not allowed. Allowed types: JPEG, PNG, WebP, GIF.`;
  }

  // 2. Verify magic bytes match declared type
  let binary;
  try {
    binary = Buffer.from(b64Data, "base64");
  } catch {
    return "Image data is not valid base64.";
  }

  const sig = MAGIC_BYTES.find((s) =>
    s.bytes.every((byte, i) => binary[i] === byte)
  );

  if (!sig) return "Image binary signature does not match a recognised image format.";

  // For WebP, also verify the WEBP marker at bytes 8-11
  if (sig.mime === "image/webp") {
    const webpMarker = binary.slice(8, 12).toString("ascii");
    if (webpMarker !== "WEBP") return "File is not a valid WebP image.";
  }

  return null; // valid
}

/**
 * Express middleware — validates req.body.avatar (single image)
 * Attach to any route that accepts an avatar upload.
 */
exports.validateAvatarUpload = (req, res, next) => {
  const avatar = req.body.avatar;

  // If no avatar is being changed, skip validation
  if (!avatar || avatar === "undefined") return next();

  const error = validateDataUri(avatar);
  if (error) {
    return next(new ErrorHandler(`Invalid avatar: ${error}`, 400));
  }
  next();
};

/**
 * Express middleware — validates req.body.images (array of images)
 * Attach to any route that accepts product image uploads.
 */
exports.validateProductImages = (req, res, next) => {
  let images = req.body.images;
  if (!images) return next();

  // Normalise to array
  if (typeof images === "string") images = [images];

  // Reject suspiciously large image arrays
  if (images.length > 10) {
    return next(new ErrorHandler("Maximum 10 images per product.", 400));
  }

  for (let i = 0; i < images.length; i++) {
    const error = validateDataUri(images[i]);
    if (error) {
      return next(new ErrorHandler(`Invalid image at index ${i}: ${error}`, 400));
    }
  }
  next();
};
