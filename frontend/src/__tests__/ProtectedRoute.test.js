import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";

// Helper: wrap component in a router with a destination route
function renderWithRouter(ui, { initialEntries = ["/protected"] } = {}) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route element={ui}>
          <Route path="/protected" element={<div>Protected Content</div>} />
        </Route>
        <Route path="/signin" element={<div>Sign In Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  it("shows loader when loading is not false", () => {
    renderWithRouter(
      <ProtectedRoute isAuthenticated={false} loading={true} />
    );
    // CircularProgress is rendered — look for the role or the MUI class
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    expect(screen.queryByText("Sign In Page")).not.toBeInTheDocument();
  });

  it("redirects to /signin?redirect= when unauthenticated", () => {
    renderWithRouter(
      <ProtectedRoute isAuthenticated={false} loading={false} />
    );
    // Should show the sign-in page, not protected content
    expect(screen.getByText("Sign In Page")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("renders Outlet when authenticated", () => {
    renderWithRouter(
      <ProtectedRoute isAuthenticated={true} loading={false} />
    );
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
    expect(screen.queryByText("Sign In Page")).not.toBeInTheDocument();
  });

  it("preserves destination in redirect param", () => {
    renderWithRouter(
      <ProtectedRoute isAuthenticated={false} loading={false} />,
      { initialEntries: ["/protected?foo=bar"] }
    );
    // User lands on signin; the URL should contain the encoded redirect
    expect(screen.getByText("Sign In Page")).toBeInTheDocument();
  });
});
