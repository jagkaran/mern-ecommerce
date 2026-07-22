import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MainImage from "../MainImage";

describe("MainImage", () => {
  it("renders img with src inside a keyboard-accessible button", () => {
    render(<MainImage src="https://example.com/x.jpg" alt="alt" />);
    const btn = screen.getByRole("button", { name: /alt.*view larger|view larger image/i });
    const img = btn.querySelector("img");
    expect(img).toBeTruthy();
    expect(img.tagName).toBe("IMG");
    expect(img).toHaveAttribute("alt", "alt");
  });

  it("calls onOpen when the wrapper button is clicked", () => {
    const onOpen = vi.fn();
    render(<MainImage src="https://example.com/x.jpg" alt="alt" onOpen={onOpen} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("renders placeholder when no src", () => {
    const { container } = render(<MainImage src={null} alt="alt" />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("button")).toBeNull();
    expect(container.textContent).toMatch(/No image/i);
  });

  it("wrapper button is at least 44x44 hit area", () => {
    const { container } = render(<MainImage src="https://example.com/x.jpg" alt="alt" />);
    const btn = container.querySelector(".pdp__main-image-btn");
    expect(btn).toBeTruthy();
    expect(btn.style.minHeight).toBe("44px");
  });
});
