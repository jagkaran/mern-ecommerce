// utils/cloudinary.js
// Pure helpers for Cloudinary URL transforms.
// Pass-through for non-Cloudinary URLs (dev seed images, external CDNs).

export function cld(url, { w, h } = {}) {
  if (!url || !isCloudinary(url)) return url;
  const transforms = ["f_auto", "q_auto"];
  if (w) transforms.push(`w_${w}`);
  if (h) transforms.push(`h_${h}`);
  return url.replace("/upload/", `/upload/${transforms.join(",")}/`);
}

// Match on the parsed hostname, not a substring. `url.includes("res.cloudinary.com")`
// also matched hostile URLs like https://evil.com/?x=res.cloudinary.com
// (CodeQL js/incomplete-url-substring-sanitization). Relative/malformed URLs
// throw in the URL constructor and correctly fall through as non-Cloudinary.
function isCloudinary(url) {
  try {
    const { hostname } = new URL(url, "http://localhost");
    return hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

export function srcset(url, widths = [320, 480, 768, 1200]) {
  return widths.map((w) => `${cld(url, { w })} ${w}w`).join(", ");
}
