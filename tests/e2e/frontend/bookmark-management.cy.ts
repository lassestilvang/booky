describe("Bookmark Management", () => {
  beforeEach(() => {
    cy.login("john.doe@example.com", "password123");
    cy.seedBookmarks();
    cy.seedCollections();
    cy.visit("/");
  });

  it("should display bookmarks in grid view by default", () => {
    cy.waitForBookmarks();
    cy.get("[data-cy=bookmark-grid]").should("be.visible");
    cy.get("[data-cy=bookmark-item]").should("have.length.greaterThan", 0);
  });

  it("should switch between different view modes", () => {
    cy.waitForBookmarks();

    // Test grid view
    cy.get("[data-cy=view-grid]").click();
    cy.get("[data-cy=bookmark-grid]").should("be.visible");

    // Test list view
    cy.get("[data-cy=view-list]").click();
    cy.get("[data-cy=bookmark-list]").should("be.visible");

    // Test masonry view
    cy.get("[data-cy=view-masonry]").click();
    cy.get("[data-cy=bookmark-masonry]").should("be.visible");

    // Test headlines view
    cy.get("[data-cy=view-headlines]").click();
    cy.get("[data-cy=bookmark-headlines]").should("be.visible");
  });

  it("should create a new bookmark", () => {
    const newBookmark = {
      title: "New Test Bookmark",
      url: "https://example.com/test",
      description: "A test bookmark",
      tags: ["test", "automation"],
      collectionId: "1",
    };

    cy.intercept("POST", "/api/bookmarks", {
      statusCode: 201,
      body: { ...newBookmark, id: "new-id" },
    }).as("createBookmark");

    cy.get("[data-cy=add-bookmark]").click();
    cy.get("[data-cy=bookmark-title]").type(newBookmark.title);
    cy.get("[data-cy=bookmark-url]").type(newBookmark.url);
    cy.get("[data-cy=bookmark-description]").type(newBookmark.description);
    cy.get("[data-cy=bookmark-tags]").type(newBookmark.tags.join(", "));
    cy.get("[data-cy=bookmark-collection]").select(newBookmark.collectionId);
    cy.get("[data-cy=save-bookmark]").click();

    cy.wait("@createBookmark");
    cy.get("[data-cy=bookmark-item]")
      .contains(newBookmark.title)
      .should("be.visible");
  });

  it("should search bookmarks", () => {
    cy.waitForBookmarks();

    cy.get("[data-cy=search-input]").type("React");
    cy.get("[data-cy=search-submit]").click();

    cy.get("[data-cy=bookmark-item]").each(($el) => {
      cy.wrap($el).should("contain", "React");
    });
  });

  it("should filter bookmarks by tags", () => {
    cy.waitForBookmarks();

    cy.get("[data-cy=tag-filter]").contains("react").click();

    cy.get("[data-cy=bookmark-item]").each(($el) => {
      cy.wrap($el).should("contain", "react");
    });
  });

  it("should organize bookmarks into collections", () => {
    cy.waitForCollections();

    cy.get("[data-cy=bookmark-item]")
      .first()
      .within(() => {
        cy.get("[data-cy=move-to-collection]").click();
      });

    cy.get("[data-cy=collection-select]").select("2");
    cy.get("[data-cy=confirm-move]").click();

    cy.get("[data-cy=collection-2]").should("contain", "Recipes");
  });

  it("should edit bookmark details", () => {
    cy.waitForBookmarks();

    const updatedTitle = "Updated Bookmark Title";

    cy.intercept("PUT", "/api/bookmarks/1", {
      statusCode: 200,
      body: { id: "1", title: updatedTitle },
    }).as("updateBookmark");

    cy.get("[data-cy=bookmark-item]")
      .first()
      .within(() => {
        cy.get("[data-cy=edit-bookmark]").click();
      });

    cy.get("[data-cy=bookmark-title]").clear().type(updatedTitle);
    cy.get("[data-cy=save-bookmark]").click();

    cy.wait("@updateBookmark");
    cy.get("[data-cy=bookmark-item]").first().should("contain", updatedTitle);
  });

  it("should delete a bookmark", () => {
    cy.waitForBookmarks();

    cy.intercept("DELETE", "/api/bookmarks/1", {
      statusCode: 200,
    }).as("deleteBookmark");

    cy.get("[data-cy=bookmark-item]")
      .first()
      .within(() => {
        cy.get("[data-cy=delete-bookmark]").click();
      });

    cy.get("[data-cy=confirm-delete]").click();

    cy.wait("@deleteBookmark");
    cy.get("[data-cy=bookmark-item]").should("have.length.lessThan", 3);
  });

  it("should handle bookmark creation errors", () => {
    cy.intercept("POST", "/api/bookmarks", {
      statusCode: 400,
      body: { error: "Invalid URL" },
    }).as("createError");

    cy.get("[data-cy=add-bookmark]").click();
    cy.get("[data-cy=bookmark-title]").type("Test");
    cy.get("[data-cy=bookmark-url]").type("invalid-url");
    cy.get("[data-cy=save-bookmark]").click();

    cy.wait("@createError");
    cy.get("[data-cy=error-message]").should("contain", "Invalid URL");
  });

  it("should load more bookmarks on scroll", () => {
    cy.waitForBookmarks();

    cy.intercept("GET", "/api/bookmarks?page=2", {
      statusCode: 200,
      body: {
        data: [
          {
            id: "4",
            title: "Additional Bookmark",
            url: "https://example.com/additional",
            description: "Additional bookmark",
            tags: ["additional"],
            collectionId: "1",
          },
        ],
        total: 4,
        page: 2,
        limit: 10,
      },
    }).as("loadMore");

    cy.scrollTo("bottom");
    cy.wait("@loadMore");

    cy.get("[data-cy=bookmark-item]").should("have.length", 4);
  });

  it("should handle network errors when loading bookmarks", () => {
    cy.intercept("GET", "/api/bookmarks*", {
      forceNetworkError: true,
    }).as("networkError");

    cy.visit("/");
    cy.get("[data-cy=error-message]").should(
      "contain",
      "Failed to load bookmarks"
    );
  });
});
