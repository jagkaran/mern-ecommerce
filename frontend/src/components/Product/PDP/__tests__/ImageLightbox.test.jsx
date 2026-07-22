import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import ImageLightbox from "../ImageLightbox";

describe("ImageLightbox", () => {
  const images = [
    { _id: "1", url: "u1" },
    { _id: "2", url: "u2" },
    { _id: "3", url: "u3" },
  ];

  afterEach(cleanup);

  it("renders dialog but without `open` attribute when open=false", () => {
    const { container } = render(
      <ImageLightbox images={images} open={false} onClose={() => {}} initialIndex={0} alt="Test" />
    );

    const dlg = container.querySelector("dialog");
    expect(dlg).toBeTruthy();
    expect(dlg.hasAttribute("open")).toBe(false);
  });

  it("renders dialog when open=true and shows first image", () => {
    const { container } = render(
      <ImageLightbox images={images} open={true} onClose={() => {}} initialIndex={0} alt="Test" />
    );
    const dlg = container.querySelector("dialog");

    expect(dlg).toBeTruthy();
    expect(dlg.hasAttribute("open")).toBe(true);
    expect(dlg.querySelector("img").getAttribute("src")).toBe("u1");
    expect(dlg.querySelector(".pdp__lightbox-counter").textContent).toBe("1 / 3");
  });

  it("close button calls onClose", () => {
    const onClose = vi.fn();
    const { container } = render(
      <ImageLightbox images={images} open={true} onClose={onClose} initialIndex={0} alt="Test" />
    );

    fireEvent.click(container.querySelector(".pdp__lightbox-close"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows image at initialIndex", () => {
    const { container } = render(
      <ImageLightbox images={images} open={true} onClose={() => {}} initialIndex={1} alt="Test" />
    );

    expect(container.querySelector("dialog img").getAttribute("src")).toBe("u2");
  });
});
