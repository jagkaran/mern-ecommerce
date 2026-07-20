import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import ProductCard from "../components/Product/ProductCard";
import { wishlistReducer } from "../reducers/wishlistReducer";
import { userReducer } from "../reducers/User";

function renderWithProviders(ui) {
  const store = configureStore({
    reducer: {
      wishlist: wishlistReducer,
      user: userReducer,
    },
    preloadedState: {
      wishlist: { items: [], ids: [], loading: false, error: null },
      user: { isAuthenticated: false, user: null },
    },
  });
  return render(
    <Provider store={store}>
      <MemoryRouter>{ui}</MemoryRouter>
    </Provider>
  );
}

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
    renderWithProviders(<ProductCard {...baseProps} />);
    expect(screen.getByText("Test Product")).toBeInTheDocument();
    expect(screen.getByText("$49.99")).toBeInTheDocument();
  });

  it("shows 'No image' text when images array is empty", () => {
    renderWithProviders(<ProductCard {...baseProps} images={[]} />);
    expect(screen.getByText("No image")).toBeInTheDocument();
  });

  it("shows 'Out of Stock' badge when stock is 0", () => {
    renderWithProviders(<ProductCard {...baseProps} stock={0} />);
    expect(screen.getByText("Out of Stock")).toBeInTheDocument();
  });

  it("shows singular '1 review' when review count is 1", () => {
    renderWithProviders(<ProductCard {...baseProps} numOfReviews={1} />);
    expect(screen.getByText("1 review")).toBeInTheDocument();
  });

  it("shows plural review count text", () => {
    renderWithProviders(<ProductCard {...baseProps} numOfReviews={2} />);
    expect(screen.getByText("2 reviews")).toBeInTheDocument();
  });
});
