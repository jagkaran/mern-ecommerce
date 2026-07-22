import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ImageDots from "../ImageDots";

describe("ImageDots", () => {
  it("renders one dot per image", () => {
    render(
      <ImageDots
        images={[{ _id: "a" }, { _id: "b" }, { _id: "c" }]}
        selectedImage={0}
        onSelect={() => {}}
      />
    );
    expect(screen.getAllByRole("tab")).toHaveLength(3);
  });

  it("calls onSelect with clicked index", () => {
    const onSelect = vi.fn();
    render(
      <ImageDots
        images={[{ _id: "a" }, { _id: "b" }]}
        selectedImage={0}
        onSelect={onSelect}
      />
    );
    fireEvent.click(screen.getAllByRole("tab")[1]);
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it("returns null when no images", () => {
    const { container } = render(
      <ImageDots images={[]} selectedImage={0} onSelect={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });
});