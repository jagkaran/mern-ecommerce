import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminTable from "../design/AdminTable";

function renderTable(props) {
  return render(
    <MemoryRouter>
      <AdminTable {...props}>
        <thead>
          <tr><th>Col</th></tr>
        </thead>
        <tbody>
          <tr><td>v</td></tr>
        </tbody>
      </AdminTable>
    </MemoryRouter>
  );
}

describe("AdminTable", () => {
  it("renders title, count, and action in header row", () => {
    renderTable({
      title: "All Orders",
      count: 42,
      action: { to: "/admin/order/new", label: "New" },
    });
    expect(screen.getByText("All Orders")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("makes thead sticky to top of scroll wrapper", () => {
    renderTable({ title: "X", count: 1 });
    const thead = screen.getByText("Col").closest("thead");
    expect(thead.style.position).toBe("sticky");
    expect(thead.style.top).toBe("0px");
  });

  it("renders only children when no title/count/action supplied", () => {
    renderTable({});
    expect(screen.getByText("Col")).toBeInTheDocument();
  });
});