import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import AdminSubNav from "../components/Admin/AdminSubNav";

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="*" element={<AdminSubNav />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("AdminSubNav", () => {
  it("renders the five admin section links", () => {
    renderAt("/dashboard");
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Products")).toBeInTheDocument();
    expect(screen.getByText("Orders")).toBeInTheDocument();
    expect(screen.getByText("Coupons")).toBeInTheDocument();
    expect(screen.getByText("Customers")).toBeInTheDocument();
  });

  it("marks the active pill based on pathname", () => {
    renderAt("/admin/orders");
    const ordersLink = screen.getByText("Orders").closest("a");
    expect(ordersLink.style.backgroundColor).toBe("var(--t-primary-600)");
    expect(ordersLink.style.color).toBe("rgb(255, 255, 255)");
  });

  it("non-active pills use neutral background", () => {
    renderAt("/admin/orders");
    const productsLink = screen.getByText("Products").closest("a");
    expect(productsLink.style.backgroundColor).toBe("var(--t-neutral-100)");
  });
});