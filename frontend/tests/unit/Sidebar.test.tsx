import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Sidebar from "../../../frontend/src/components/Sidebar";

describe("Sidebar", () => {
  it("renders the sidebar with collections heading", () => {
    render(<Sidebar />);

    expect(screen.getByText("Collections")).toBeInTheDocument();
  });

  it("renders default collection links", () => {
    render(<Sidebar />);

    expect(screen.getByText("All Bookmarks")).toBeInTheDocument();
    expect(screen.getByText("Favorites")).toBeInTheDocument();
  });

  it("renders as an aside element", () => {
    render(<Sidebar />);

    const aside = screen.getByRole("complementary");
    expect(aside).toBeInTheDocument();
    expect(aside.tagName).toBe("ASIDE");
  });

  it("has proper styling classes", () => {
    const { container } = render(<Sidebar />);
    const aside = container.firstChild as HTMLElement;
    expect(aside).toHaveClass("w-64", "bg-gray-100", "p-4");
  });

  it("heading has proper styling", () => {
    render(<Sidebar />);

    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveClass("text-lg", "font-semibold", "mb-4");
  });

  it("links have proper styling", () => {
    render(<Sidebar />);

    const links = screen.getAllByRole("link");
    links.forEach((link) => {
      expect(link).toHaveClass("text-blue-600");
    });
  });

  it("renders links as anchor elements", () => {
    render(<Sidebar />);

    const links = screen.getAllByRole("link");
    links.forEach((link) => {
      expect(link.tagName).toBe("A");
      expect(link).toHaveAttribute("href", "#");
    });
  });

  it("has proper list structure", () => {
    const { container } = render(<Sidebar />);
    const ul = container.querySelector("ul");
    expect(ul).toBeInTheDocument();

    const lis = container.querySelectorAll("li");
    expect(lis).toHaveLength(2);
    lis.forEach((li) => {
      expect(li).toHaveClass("mb-2");
    });
  });

  it("is accessible with proper navigation structure", () => {
    render(<Sidebar />);

    const nav = screen.getByRole("complementary");
    expect(nav).toBeInTheDocument();
  });
});
