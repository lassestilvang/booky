import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Header from "../../../frontend/src/components/Header";

describe("Header", () => {
  it("renders the header with correct title", () => {
    render(<Header />);

    expect(screen.getByText("Booky")).toBeInTheDocument();
  });

  it("renders as a header element", () => {
    render(<Header />);

    const header = screen.getByRole("banner");
    expect(header).toBeInTheDocument();
    expect(header.tagName).toBe("HEADER");
  });

  it("has proper styling classes", () => {
    const { container } = render(<Header />);
    const header = container.firstChild as HTMLElement;
    expect(header).toHaveClass("bg-white", "shadow", "p-4");
  });

  it("title has proper styling", () => {
    render(<Header />);

    const title = screen.getByText("Booky");
    expect(title).toHaveClass("text-xl", "font-bold");
  });

  it("is accessible with proper heading", () => {
    render(<Header />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Booky");
  });
});
