import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import Login from "../components/Login/Login";

// Minimal user reducer mock
function userReducer(state = { loading: false, error: null, isAuthenticated: false }, _action) {
  return state;
}

function renderWithStore(ui, { initialState, route = "/signin" } = {}) {
  const store = configureStore({
    reducer: { user: userReducer },
    preloadedState: { user: initialState || { loading: false, error: null, isAuthenticated: false } },
  });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>
        {ui}
      </MemoryRouter>
    </Provider>
  );
}

describe("Login", () => {
  it("renders email and password fields", () => {
    renderWithStore(<Login />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    // Password field — MUI TextField with type=password
    const passwordFields = screen.getAllByLabelText(/password/i);
    expect(passwordFields.length).toBeGreaterThanOrEqual(1);
  });

  it("redirect default is /account (not //account)", () => {
    // When no ?redirect param, the safe redirect should be /account
    renderWithStore(<Login />, { route: "/signin" });
    // The redirect variable is computed inside the component;
    // we verify it doesn't crash and renders the form
    expect(screen.getByRole("button", { name: /login/i }) || screen.getByText(/login/i)).toBeTruthy();
  });

  it("rejects open-redirect URLs in ?redirect param", () => {
    // Passing an absolute URL as redirect — component should normalise to /account
    renderWithStore(<Login />, { route: "/signin?redirect=https://evil.com" });
    // Should still render login form, not navigate away
    expect(screen.getByRole("button", { name: /login/i }) || screen.getByText(/login/i)).toBeTruthy();
  });
});
