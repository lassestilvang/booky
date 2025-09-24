import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Main from "../../../frontend/src/components/Main";

describe("Main", () => {
  it("renders the main content area", () => {
    render(<Main />);

    expect(screen.getByText("Bookmarks")).toBeInTheDocument();
  });

  it("renders as a main element", () => {
    render(<Main />);

    const main = screen.getByRole("main");
    expect(main).toBeInTheDocument();
    expect(main.tagName).toBe("MAIN");
  });

  it("has proper styling classes", () => {
    const { container } = render(<Main />);
    const main = container.firstChild as HTMLElement;
    expect(main).toHaveClass("flex-1", "p-4");
  });

  it("heading has proper styling", () => {
    render(<Main />);

    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveClass("text-2xl", "font-bold", "mb-4");
  });

  it("renders placeholder bookmark items", () => {
    render(<Main />);

    expect(screen.getByText("Bookmark 1")).toBeInTheDocument();
    expect(screen.getByText("Bookmark 2")).toBeInTheDocument();
    expect(screen.getByText("Bookmark 3")).toBeInTheDocument();
  });

  it("placeholder items have proper styling", () => {
    const { container } = render(<Main />);
    const gridDiv = container.querySelector(".grid");
    expect(gridDiv).toHaveClass(
      "grid",
      "grid-cols-1",
      "md:grid-cols-2",
      "lg:grid-cols-3",
      "gap-4"
    );

    const bookmarkDivs = container.querySelectorAll(".bg-white");
    expect(bookmarkDivs).toHaveLength(3);
    bookmarkDivs.forEach((div) => {
      expect(div).toHaveClass("bg-white", "p-4", "shadow", "rounded");
    });
  });

  it("has responsive grid layout", () => {
    const { container } = render(<Main />);
    const gridContainer = container.querySelector(".grid");
    expect(gridContainer).toBeInTheDocument();
  });

  it("is accessible with proper heading hierarchy", () => {
    render(<Main />);

    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveTextContent("Bookmarks");
  });
});
