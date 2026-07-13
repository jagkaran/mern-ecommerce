import { validateEmail, validatePostal, validatePhone, validateField } from "../checkoutValidators";

describe("checkoutValidators", () => {
  it("email accepts jane@x.io", () => {
    expect(validateEmail("jane@x.io")).toBeNull();
    expect(validateEmail("nope")).toMatch(/email/i);
  });
  it("postal per-country", () => {
    expect(validatePostal("94107", "US")).toBeNull();
    expect(validatePostal("M5V 3A8", "CA")).toBeNull();
    expect(validatePostal("SW1A 1AA", "GB")).toBeNull();
    expect(validatePostal("abc", "US")).toMatch(/postcode/i);
  });
  it("phone accepts E.164 or 7-15 digits", () => {
    expect(validatePhone("+14155551234")).toBeNull();
    expect(validatePhone("4155551234")).toBeNull();
    expect(validatePhone("abc")).toMatch(/phone/i);
  });
  it("validateField routes by name", () => {
    expect(validateField("email", "not-an-email")).toMatch(/email/i);
    expect(validateField("postal", "abc", "US")).toMatch(/postcode/i);
    expect(validateField("zip", "abc", "US")).toMatch(/postcode/i);
  });
});
