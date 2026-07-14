import reducer, { setField, setTouched, reset, hydrate } from "../checkoutSlice";

describe("checkoutSlice", () => {
  it("setField updates value and clears that error", () => {
    const s1 = reducer(undefined, setField({ name: "email", value: "x" }));
    expect(s1.email).toBe("x");
    const s2 = reducer(
      { ...s1, errors: { ...s1.errors, email: "bad" } },
      setField({ name: "email", value: "jane@x.io" })
    );
    expect(s2.errors.email).toBeUndefined();
  });
  it("setTouched marks field", () => {
    const s = reducer(undefined, setTouched("email"));
    expect(s.touched.email).toBe(true);
  });
  it("reset returns initial state", () => {
    const s = reducer(undefined, setField({ name: "email", value: "x" }));
    const r = reducer(s, reset());
    expect(r.email).toBe("");
  });
  it("hydrate replaces state", () => {
    const r = reducer(undefined, hydrate({ email: "y@x.io", isGuest: false }));
    expect(r.email).toBe("y@x.io");
    expect(r.isGuest).toBe(false);
  });
});
