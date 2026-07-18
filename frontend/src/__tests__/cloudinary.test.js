import { cld, srcset } from "../utils/cloudinary";

describe("cld", () => {
  it("appends f_auto,q_auto,w_<w> to Cloudinary URLs", () => {
    const url = "https://res.cloudinary.com/demo/image/upload/v1/shoes.jpg";
    expect(cld(url, { w: 480 })).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_480/v1/shoes.jpg"
    );
  });

  it("appends h_<h> when provided", () => {
    const url = "https://res.cloudinary.com/demo/image/upload/v1/shoes.jpg";
    expect(cld(url, { w: 320, h: 240 })).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_320,h_240/v1/shoes.jpg"
    );
  });

  it("passes through non-Cloudinary URLs unchanged", () => {
    const url = "https://images.unsplash.com/photo-123";
    expect(cld(url, { w: 480 })).toBe(url);
  });

  it("passes through undefined and empty strings", () => {
    expect(cld(undefined, { w: 480 })).toBeUndefined();
    expect(cld("", { w: 480 })).toBe("");
  });

  it("preserves existing query string with & separator", () => {
    const url = "https://res.cloudinary.com/demo/image/upload/v1/shoes.jpg?public_id=abc";
    expect(cld(url, { w: 480 })).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_480/v1/shoes.jpg?public_id=abc"
    );
  });
});

describe("srcset", () => {
  it("returns default widths when no arg", () => {
    const url = "https://res.cloudinary.com/demo/image/upload/v1/shoes.jpg";
    expect(srcset(url)).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_320/v1/shoes.jpg 320w, " +
        "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_480/v1/shoes.jpg 480w, " +
        "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_768/v1/shoes.jpg 768w, " +
        "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_1200/v1/shoes.jpg 1200w"
    );
  });

  it("accepts custom widths array", () => {
    const url = "https://res.cloudinary.com/demo/image/upload/v1/shoes.jpg";
    expect(srcset(url, [100, 200])).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_100/v1/shoes.jpg 100w, " +
        "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_200/v1/shoes.jpg 200w"
    );
  });
});
