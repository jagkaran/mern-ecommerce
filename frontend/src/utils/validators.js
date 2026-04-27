/**
 * Shared form validation rules — used by all hooks across the app.
 * Each validator returns "" on pass, or an error message string on fail.
 */

export const validators = {
  required: (value, label = "This field") =>
    value?.toString().trim() ? "" : `${label} is required.`,

  email: (value) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value?.trim())
      ? ""
      : "Enter a valid email address.",

  password: (value) =>
    /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/.test(value)
      ? ""
      : "Password must be 6\u201316 characters with at least one number and one special character.",

  confirmPassword: (value, original) =>
    value === original ? "" : "Passwords do not match.",

  phone: (value) =>
    /^\d{10}$/.test(value?.trim()) ? "" : "Phone number must be exactly 10 digits.",

  zip: (value) =>
    /^\d{4,10}$/.test(value?.trim()) ? "" : "Enter a valid ZIP / Postal code.",

  minLength: (value, min, label = "This field") =>
    (value?.trim().length ?? 0) >= min
      ? ""
      : `${label} must be at least ${min} characters.`,

  maxLength: (value, max, label = "This field") =>
    (value?.trim().length ?? 0) <= max
      ? ""
      : `${label} must be at most ${max} characters.`,

  positiveNumber: (value, label = "Value") =>
    Number(value) > 0 ? "" : `${label} must be greater than 0.`,

  nonNegativeInt: (value, label = "Value") =>
    Number.isInteger(Number(value)) && Number(value) >= 0
      ? ""
      : `${label} must be a non-negative whole number.`,

  name: (value, label = "Name") =>
    /^[a-zA-Z\s\-'.]{2,50}$/.test(value?.trim())
      ? ""
      : `${label} must be 2\u201350 characters (letters only).`,
};
