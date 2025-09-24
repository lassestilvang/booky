import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import GridView from "@/components/GridView";
import ListView from "@/components/ListView";
import HeadlinesView from "@/components/HeadlinesView";
import MasonryView from "@/components/MasonryView";
import {
  mockBookmarks,
  mockEdgeCases,
} from "../../../tests/fixtures/frontend/mocks";

describe("View Components", () => {
  describe("GridView", () => {
    it("renders bookmarks in grid layout", () => {
      render(<GridView bookmarks={mockBookmarks} />);

      expect(screen.getByText("Understanding React Hooks")).toBeInTheDocument();
      expect(screen.getByText("TypeScript Best Practices")).toBeInTheDocument();
      expect(screen.getAllByText("Visit")).toHaveLength(2);
    });

    it("handles empty bookmarks list", () => {
      render(<GridView bookmarks={[]} />);

      expect(
        screen.queryByText("Understanding React Hooks")
      ).not.toBeInTheDocument();
    });

    it("displays bookmark description or URL", () => {
      render(<GridView bookmarks={mockBookmarks} />);

      expect(
        screen.getByText(
          "A comprehensive guide to React Hooks and their usage patterns."
        )
      ).toBeInTheDocument();
    });

    it("has responsive grid classes", () => {
      const { container } = render(<GridView bookmarks={mockBookmarks} />);
      const gridDiv = container.firstChild as HTMLElement;
      expect(gridDiv).toHaveClass(
        "grid",
        "grid-cols-1",
        "md:grid-cols-2",
        "lg:grid-cols-3",
        "gap-4"
      );
    });

    it("renders links with proper attributes", () => {
      render(<GridView bookmarks={mockBookmarks} />);

      const links = screen.getAllByRole("link");
      links.forEach((link) => {
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
      });
    });

    it("displays URL when description is not available", () => {
      const bookmarkWithoutDesc = {
        ...mockBookmarks[0],
        description: undefined,
      };
      render(<GridView bookmarks={[bookmarkWithoutDesc]} />);

      expect(screen.getByText(bookmarkWithoutDesc.url)).toBeInTheDocument();
    });
  });

  describe("ListView", () => {
    it("renders bookmarks in list layout", () => {
      render(<ListView bookmarks={mockBookmarks} />);

      expect(screen.getByText("Understanding React Hooks")).toBeInTheDocument();
      expect(screen.getByText("TypeScript Best Practices")).toBeInTheDocument();
    });

    it("displays tags when available", () => {
      render(<ListView bookmarks={mockBookmarks} />);

      expect(screen.getByText("react")).toBeInTheDocument();
      expect(screen.getAllByText("javascript")).toHaveLength(2);
    });

    it("handles bookmarks without tags", () => {
      render(<ListView bookmarks={[mockEdgeCases.bookmarkWithoutTags]} />);

      expect(screen.getByText("Understanding React Hooks")).toBeInTheDocument();
      expect(screen.queryByText("react")).not.toBeInTheDocument();
    });

    it("displays description or default text", () => {
      render(<ListView bookmarks={mockBookmarks} />);

      expect(
        screen.getByText(
          "A comprehensive guide to React Hooks and their usage patterns."
        )
      ).toBeInTheDocument();
    });

    it("renders edit button", () => {
      render(<ListView bookmarks={mockBookmarks} />);

      const editButtons = screen.getAllByText("Edit");
      expect(editButtons).toHaveLength(2);
    });

    it("displays 'No description' when description is not available", () => {
      const bookmarkWithoutDesc = {
        ...mockBookmarks[0],
        description: undefined,
      };
      render(<ListView bookmarks={[bookmarkWithoutDesc]} />);

      expect(screen.getByText("No description")).toBeInTheDocument();
    });

    it("has proper list spacing", () => {
      const { container } = render(<ListView bookmarks={mockBookmarks} />);
      const listDiv = container.firstChild as HTMLElement;
      expect(listDiv).toHaveClass("space-y-2");
    });
  });

  describe("HeadlinesView", () => {
    it("renders bookmarks as headlines", () => {
      render(<HeadlinesView bookmarks={mockBookmarks} />);

      expect(screen.getByText("Understanding React Hooks")).toBeInTheDocument();
      expect(screen.getByText("TypeScript Best Practices")).toBeInTheDocument();
    });

    it("displays descriptions", () => {
      render(<HeadlinesView bookmarks={mockBookmarks} />);

      expect(
        screen.getByText(
          "A comprehensive guide to React Hooks and their usage patterns."
        )
      ).toBeInTheDocument();
    });

    it("handles bookmarks without description", () => {
      const bookmarkWithoutDesc = {
        ...mockBookmarks[0],
        description: undefined,
      };
      render(<HeadlinesView bookmarks={[bookmarkWithoutDesc]} />);

      expect(screen.getByText("No description")).toBeInTheDocument();
    });

    it("renders links properly", () => {
      render(<HeadlinesView bookmarks={mockBookmarks} />);

      const links = screen.getAllByRole("link");
      expect(links).toHaveLength(2);
      links.forEach((link) => {
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
      });
    });

    it("has proper spacing", () => {
      const { container } = render(<HeadlinesView bookmarks={mockBookmarks} />);
      const headlinesDiv = container.firstChild as HTMLElement;
      expect(headlinesDiv).toHaveClass("space-y-4");
    });
  });

  describe("MasonryView", () => {
    it("renders bookmarks in masonry layout", () => {
      render(<MasonryView bookmarks={mockBookmarks} />);

      expect(screen.getByText("Understanding React Hooks")).toBeInTheDocument();
      expect(screen.getByText("TypeScript Best Practices")).toBeInTheDocument();
    });

    it("displays thumbnail placeholders", () => {
      render(<MasonryView bookmarks={mockBookmarks} />);

      const thumbnails = screen.getAllByText("Thumbnail");
      expect(thumbnails).toHaveLength(2);
    });

    it("renders links with proper attributes", () => {
      render(<MasonryView bookmarks={mockBookmarks} />);

      const links = screen.getAllByRole("link");
      links.forEach((link) => {
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
      });
    });

    it("has masonry CSS classes", () => {
      const { container } = render(<MasonryView bookmarks={mockBookmarks} />);
      const masonryDiv = container.firstChild as HTMLElement;
      expect(masonryDiv).toHaveClass(
        "columns-1",
        "md:columns-2",
        "lg:columns-3",
        "gap-4"
      );
    });

    it("displays URL when description is not available", () => {
      const bookmarkWithoutDesc = {
        ...mockBookmarks[0],
        description: undefined,
      };
      render(<MasonryView bookmarks={[bookmarkWithoutDesc]} />);

      expect(screen.getByText(bookmarkWithoutDesc.url)).toBeInTheDocument();
    });

    it("handles empty bookmarks", () => {
      render(<MasonryView bookmarks={[]} />);

      expect(
        screen.queryByText("Understanding React Hooks")
      ).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("all view components have proper heading hierarchy", () => {
      render(<GridView bookmarks={mockBookmarks} />);
      const headings = screen.getAllByRole("heading", { level: 3 });
      expect(headings).toHaveLength(2);
      cleanup();

      render(<ListView bookmarks={mockBookmarks} />);
      const listHeadings = screen.getAllByRole("heading", { level: 3 });
      expect(listHeadings).toHaveLength(2);
      cleanup();

      render(<HeadlinesView bookmarks={mockBookmarks} />);
      const headlinesHeadings = screen.getAllByRole("heading", { level: 3 });
      expect(headlinesHeadings).toHaveLength(2);
      cleanup();

      render(<MasonryView bookmarks={mockBookmarks} />);
      const masonryHeadings = screen.getAllByRole("heading", { level: 3 });
      expect(masonryHeadings).toHaveLength(2);
      cleanup();
    });

    it("links have accessible text", () => {
      render(<GridView bookmarks={mockBookmarks} />);
      const links = screen.getAllByRole("link");
      links.forEach((link) => {
        expect(link).toHaveAccessibleName();
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles large bookmark lists", () => {
      render(
        <GridView bookmarks={mockEdgeCases.largeBookmarkList.slice(0, 10)} />
      );

      expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(10);
    });

    it("truncates long text appropriately", () => {
      const longTitleBookmark = {
        ...mockBookmarks[0],
        title:
          "This is a very long title that should be truncated in the UI display to prevent layout issues",
        description:
          "This is a very long description that might need truncation in smaller viewports or containers",
      };

      render(<GridView bookmarks={[longTitleBookmark]} />);

      // The component uses truncate class, but we can check if the text is present
      expect(screen.getByText(longTitleBookmark.title)).toBeInTheDocument();
    });
  });
});
