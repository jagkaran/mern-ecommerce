import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NotFound from "../components/NotFound";

describe("NotFound page", () => {
  it("renders themed empty-state copy", () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );
    expect(screen.getByText(/We can't find that page/i)).toBeInTheDocument();
    expect(screen.getByText(/Back to home/i)).toBeInTheDocument();
    expect(screen.getByText(/Browse the collection/i)).toBeInTheDocument();
  });

  it("renders an overline label", () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );
    expect(screen.getByText(/Lost in the workshop/i)).toBeInTheDocument();
  });
});
