import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MainImage from "../MainImage";

describe("MainImage", () => {
  it("renders img with src", () => {
    render(<MainImage src="https://example.com/x.jpg" alt="alt" />);
    const img = screen.getByAltText("alt");
    expect(img.tagName).toBe("IMG");
  });

  it("calls onOpen on click", () => {
    const onOpen = vi.fn();
    render(<MainImage src="https://example.com/x.jpg" alt="alt" onOpen={onOpen} />);
    fireEvent.click(screen.getByAltText("alt"));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("renders placeholder when no src", () => {
    const { container } = render(<MainImage src={null} alt="alt" />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toMatch(/No image/i);
  });
});
