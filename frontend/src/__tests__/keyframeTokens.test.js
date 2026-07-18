import { TokenCSS } from "../design/tokens-css";

describe("CSS keyframe tokens", () => {
  function getKeyframe(name) {
    const css = TokenCSS().props.children;
    const match = css.match(/@keyframes\s+([A-Za-z0-9_-]+)\s*\{([\s\S]*?)\}/g);
    if (!match) return null;
    const found = match.find((m) => m.includes(`@keyframes ${name}`));
    return found || null;
  }

  it("defines hverdagFadeThrough", () => {
    expect(getKeyframe("hverdagFadeThrough")).not.toBeNull();
  });

  it("defines hverdagBadgePulse", () => {
    expect(getKeyframe("hverdagBadgePulse")).not.toBeNull();
  });

  it("exposes .hverdag-fade-through utility", () => {
    const css = TokenCSS().props.children;
    expect(css).toMatch(/\.hverdag-fade-through\s*\{/);
  });

  it("exposes .hverdag-badge-pulse utility", () => {
    const css = TokenCSS().props.children;
    expect(css).toMatch(/\.hverdag-badge-pulse\s*\{/);
  });
});
