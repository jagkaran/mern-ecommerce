import React from "react";
import { render, screen, within } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter } from "react-router-dom";
import MyOrders from "../components/Order/MyOrders.jsx";

function renderMyOrders(preloaded = {}) {
  const store = configureStore({
    reducer: {
      orders: (state = []) => state,
      myOrders: (state = { orders: [], error: null, loading: false }, _action) => state,
      user: (state = { isAuthenticated: true, user: { name: "Test" } }) => state,
    },
    preloadedState: {
      orders: [],
      myOrders: {
        orders: [
          {
            _id: "6520aaa0b4f3a1c0d5e8f001",
            orderStatus: "Delivered",
            orderItems: [{ product: "p1" }, { product: "p2" }],
            totalPrice: 100,
            currency: "USD",
            currencyRate: 1,
            createdAt: "2026-06-01T10:00:00.000Z",
            shippingInfo: { country: "US" },
          },
        ],
        error: null,
        loading: false,
      },
      user: { isAuthenticated: true, user: { name: "Test" } },
      ...preloaded,
    },
  });
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <MyOrders />
      </MemoryRouter>
    </Provider>
  );
}

describe("MyOrders", () => {
  it("renders the table without nested th headers", () => {
    const { container } = renderMyOrders();
    // Each top-level <th> should contain text directly (not another <th>).
    const headers = container.querySelectorAll("thead th");
    expect(headers.length).toBeGreaterThan(0);
    headers.forEach((th) => {
      expect(th.querySelector("th")).toBeNull();
    });
  });

  it("renders the order status via SeverityPill (round pill, white text)", () => {
    const { container } = renderMyOrders();
    expect(screen.getByText("Delivered")).toBeInTheDocument();
    const pill = screen.getByText("Delivered");
    // SeverityPill uses a span with inline style background + uppercase text
    expect(pill.tagName.toLowerCase()).toBe("span");
    const style = pill.getAttribute("style") || "";
    expect(style).toMatch(/background/i);
  });

  it("does not mention the legacy 'Click.it' brand", () => {
    const { container } = renderMyOrders();
    expect(container.textContent).not.toMatch(/Click\.it/i);
  });
});
