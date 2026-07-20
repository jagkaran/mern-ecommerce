import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Table } from "../design/primitives/Table";

describe("Table primitive", () => {
  const cols = [
    { key: "name", label: "Name" },
    { key: "count", label: "Items" },
    { key: "amount", label: "Amount", align: "right" },
  ];
  const rows = [
    { _id: "1", name: "Wooden bowl", count: 2, amount: 60 },
    { _id: "2", name: "Linen apron", count: 1, amount: 90 },
  ];

  it("renders header labels and rows", () => {
    render(<Table columns={cols} rows={rows} />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Wooden bowl")).toBeInTheDocument();
    expect(screen.getByText("60")).toBeInTheDocument();
  });

  it("shows empty message when no rows", () => {
    render(<Table columns={cols} rows={[]} emptyMessage="None yet." />);
    expect(screen.getByText("None yet.")).toBeInTheDocument();
  });

  it("invokes onSortChange when a sortable header clicked", () => {
    const onSortChange = vi.fn();
    const colsWithSort = [...cols, { key: "price", label: "Price", sortable: true }];
    render(
      <Table
        columns={colsWithSort}
        rows={rows}
        sortBy="price"
        sortDir="asc"
        onSortChange={onSortChange}
      />
    );
    fireEvent.click(screen.getByText("Price"));
    expect(onSortChange).toHaveBeenCalledWith("price", "desc");
  });

  it("fires onRowClick when row clicked", () => {
    const onRowClick = vi.fn();
    render(<Table columns={cols} rows={rows} onRowClick={onRowClick} />);
    fireEvent.click(screen.getByText("Wooden bowl").closest("tr"));
    expect(onRowClick).toHaveBeenCalledWith(rows[0]);
  });

  it("does not render nested th inside columns th", () => {
    const { container } = render(<Table columns={cols} rows={rows} />);
    const headers = container.querySelectorAll("thead th");
    expect(headers.length).toBeGreaterThan(0);
    headers.forEach((th) => {
      expect(th.querySelector("th")).toBeNull();
    });
  });
});
