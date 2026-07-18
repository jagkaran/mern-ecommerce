/**
 * Avatar URL helper.
 * Returns the user's uploaded picture when present, otherwise a DiceBear
 * initials URL as a safe fallback. DiceBear is keyless and CORS-friendly
 * (used as a plain <img src>), so no backend proxy is required.
 */

function getSeed(user) {
  if (!user) return "U";
  const raw = (user.name || user.email || "U").trim();
  return raw || "U";
}

/**
 * @param {object|null} user — user object (or null) with optional profilePic
 * @returns {string} absolute or relative image URL
 */
export function avatarUrl(user) {
  const pic = user?.profilePic?.url;
  if (pic && pic.length > 0) return pic;
  const seed = encodeURIComponent(getSeed(user));
  return `https://api.dicebear.com/9.x/initials/svg?seed=${seed}`;
}

export default avatarUrl;
