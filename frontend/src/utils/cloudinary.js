// utils/cloudinary.js
// Pure helpers for Cloudinary URL transforms.
// Pass-through for non-Cloudinary URLs (dev seed images, external CDNs).

export function cld(url, { w, h } = {}) {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  const transforms = ['f_auto', 'q_auto'];
  if (w) transforms.push(`w_${w}`);
  if (h) transforms.push(`h_${h}`);
  const sep = url.includes('?') ? '&' : '?';
  return url.replace('/upload/', `/upload/${transforms.join(',')}/`);
}

export function srcset(url, widths = [320, 480, 768, 1200]) {
  return widths.map(w => `${cld(url, { w })} ${w}w`).join(', ');
}