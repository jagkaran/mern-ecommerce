const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const US = /^\d{5}(-\d{4})?$/;
const CA = /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i;
const GB = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i;
const IN_POSTAL = /^\d{6}$/;
const FALLBACK = /^\d{3,10}$/;

export function validateEmail(v) {
  if (!v) return "that email slipped away — try again?";
  return EMAIL.test(v) ? null : "that email slipped away — try again?";
}

const POSTAL_RULES = { US, CA, GB, IN: IN_POSTAL };
export function validatePostal(v, country) {
  if (!v) return "postcode needed";
  const re = POSTAL_RULES[country?.toUpperCase()] || FALLBACK;
  return re.test(String(v).trim()) ? null : "postcode looks off for that country";
}

export function validatePhone(v) {
  if (!v) return "phone needed";
  const cleaned = String(v).replace(/[\s\-()]/g, "");
  if (/^\+?\d{7,15}$/.test(cleaned)) return null;
  return "phone needs country code, e.g. +1…";
}

export function validateField(name, value, country) {
  switch (name) {
    case "email": return validateEmail(value);
    case "postal":
    case "zip":   return validatePostal(value, country);
    case "phone": return validatePhone(value);
    default: return null;
  }
}
