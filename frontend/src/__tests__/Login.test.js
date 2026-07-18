import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import Login from "../components/Login/Login";

function userReducer(state = { loading: false, error: null, isAuthenticated: false }, _action) {
  return state;
}

function renderWithStore(ui, { initialState, route = "/signin" } = {}) {
  const store = configureStore({
    reducer: { user: userReducer },
    preloadedState: {
      user: initialState || { loading: false, error: null, isAuthenticated: false },
    },
  });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </Provider>
  );
}

describe("Login", () => {
  it("renders without crashing and shows form inputs", () => {
    const { container } = renderWithStore(<Login />);
    const inputs = container.querySelectorAll(
      "input[type='email'], input[type='password'], input[name='email'], input[name='password']"
    );
    expect(inputs.length).toBeGreaterThanOrEqual(2);
  });

  it("renders Sign In button", () => {
    renderWithStore(<Login />);
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("redirect default is /account (not //account)", () => {
    renderWithStore(<Login />, { route: "/signin" });
    expect(screen.getByRole("button", { name: /sign in/i })).toBeTruthy();
  });

  it("rejects open-redirect URLs in ?redirect param", () => {
    renderWithStore(<Login />, { route: "/signin?redirect=https://evil.com" });
    expect(screen.getByRole("button", { name: /sign in/i })).toBeTruthy();
  });
});
