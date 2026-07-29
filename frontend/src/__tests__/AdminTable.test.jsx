import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AdminTable from "../design/AdminTable";

describe("AdminTable", () => {
  it("renders children inside a scrollable table", () => {
    render(
      <AdminTable>
        <thead>
          <tr>
            <th>Name</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Alice</td>
          </tr>
        </tbody>
      </AdminTable>
    );
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    const wrapper = screen.getByText("Name").closest("table").parentElement;
    expect(wrapper.style.overflowX).toBe("auto");
  });

  it("uses page-level sticky offset when stickyPage is set", () => {
    render(
      <AdminTable stickyPage>
        <thead>
          <tr><th>Col</th></tr>
        </thead>
        <tbody>
          <tr><td>v</td></tr>
        </tbody>
      </AdminTable>
    );
    const thead = screen.getByText("Col").closest("thead");
    expect(thead.style.top).toBe("calc(var(--t-headerHeight) + 48px)");
  });

  it("defaults to top:0 sticky offset", () => {
    render(
      <AdminTable>
        <thead>
          <tr><th>Col</th></tr>
        </thead>
        <tbody>
          <tr><td>v</td></tr>
        </tbody>
      </AdminTable>
    );
    expect(screen.getByText("Col").closest("thead").style.top).toBe("0px");
  });
});