import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ProductCard from "../components/Product/ProductCard";

describe("ProductCard", () => {
  const baseProps = {
    id: "abc123",
    name: "Test Product",
    price: 49.99,
    ratings: 3.5,
    numOfReviews: 1,
    images: [{ url: "https://example.com/img.jpg" }],
    stock: 5,
    createdAt: new Date().toISOString(),
  };

  it("renders product name and price", () => {
    render(
      <MemoryRouter>
        <ProductCard {...baseProps} />
      </MemoryRouter>
    );
    expect(screen.getByText("Test Product")).toBeInTheDocument();
    expect(screen.getByText("$49.99")).toBeInTheDocument();
  });

  it("shows placeholder image when images array is empty", () => {
    render(
      <MemoryRouter>
        <ProductCard {...baseProps} images={[]} />
      </MemoryRouter>
    );
    const img = screen.getByRole("img");
    expect(img.getAttribute("src")).toMatch(/No image|svg/i);
  });

  it("shows 'Out of Stock' badge when stock is 0", () => {
    render(
      <MemoryRouter>
        <ProductCard {...baseProps} stock={0} />
      </MemoryRouter>
    );
    expect(screen.getByText("Out of Stock")).toBeInTheDocument();
  });

  it("shows '1 Review' singular when numOfReviews is 1", () => {
    render(
      <MemoryRouter>
        <ProductCard {...baseProps} numOfReviews={1} />
      </MemoryRouter>
    );
    expect(screen.getByText(/1 Review\b/)).toBeInTheDocument();
  });

  it("shows '2 Reviews' plural when numOfReviews is 2", () => {
    render(
      <MemoryRouter>
        <ProductCard {...baseProps} numOfReviews={2} />
      </MemoryRouter>
    );
    expect(screen.getByText(/2 Reviews/)).toBeInTheDocument();
  });
});
