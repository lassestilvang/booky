describe("Collection Operations", () => {
  beforeEach(() => {
    cy.login("john.doe@example.com", "password123");
    cy.seedCollections();
    cy.visit("/");
  });

  it("should display collections in sidebar", () => {
    cy.waitForCollections();
    cy.get("[data-cy=collections-sidebar]").should("be.visible");
    cy.get("[data-cy=collection-item]").should("have.length.greaterThan", 0);
  });

  it("should create a new collection", () => {
    const newCollection = {
      name: "New Test Collection",
      description: "A collection for testing",
    };

    cy.intercept("POST", "/api/collections", {
      statusCode: 201,
      body: { ...newCollection, id: "new-collection-id" },
    }).as("createCollection");

    cy.get("[data-cy=add-collection]").click();
    cy.get("[data-cy=collection-name]").type(newCollection.name);
    cy.get("[data-cy=collection-description]").type(newCollection.description);
    cy.get("[data-cy=save-collection]").click();

    cy.wait("@createCollection");
    cy.get("[data-cy=collection-item]")
      .contains(newCollection.name)
      .should("be.visible");
  });

  it("should navigate to collection view", () => {
    cy.waitForCollections();

    cy.get("[data-cy=collection-item]").first().click();
    cy.url().should("include", "/collections/");

    cy.get("[data-cy=collection-title]").should("be.visible");
    cy.get("[data-cy=bookmark-item]").should("be.visible");
  });

  it("should share a collection", () => {
    cy.waitForCollections();

    cy.intercept("POST", "/api/collections/1/share", {
      statusCode: 200,
      body: { shareLink: "https://example.com/shared/collection/1" },
    }).as("shareCollection");

    cy.get("[data-cy=collection-item]")
      .first()
      .within(() => {
        cy.get("[data-cy=share-collection]").click();
      });

    cy.get("[data-cy=share-modal]").should("be.visible");
    cy.get("[data-cy=generate-link]").click();

    cy.wait("@shareCollection");
    cy.get("[data-cy=share-link]").should("contain", "shared/collection/1");
  });

  it("should edit collection details", () => {
    cy.waitForCollections();

    const updatedName = "Updated Collection Name";

    cy.intercept("PUT", "/api/collections/1", {
      statusCode: 200,
      body: { id: "1", name: updatedName },
    }).as("updateCollection");

    cy.get("[data-cy=collection-item]")
      .first()
      .within(() => {
        cy.get("[data-cy=edit-collection]").click();
      });

    cy.get("[data-cy=collection-name]").clear().type(updatedName);
    cy.get("[data-cy=save-collection]").click();

    cy.wait("@updateCollection");
    cy.get("[data-cy=collection-item]").first().should("contain", updatedName);
  });

  it("should delete a collection", () => {
    cy.waitForCollections();

    cy.intercept("DELETE", "/api/collections/1", {
      statusCode: 200,
    }).as("deleteCollection");

    cy.get("[data-cy=collection-item]")
      .first()
      .within(() => {
        cy.get("[data-cy=delete-collection]").click();
      });

    cy.get("[data-cy=confirm-delete]").click();

    cy.wait("@deleteCollection");
    cy.get("[data-cy=collection-item]").should("have.length.lessThan", 2);
  });

  it("should add bookmarks to collection", () => {
    cy.waitForCollections();
    cy.seedBookmarks();

    cy.get("[data-cy=collection-item]").first().click();

    cy.intercept("POST", "/api/collections/1/bookmarks", {
      statusCode: 200,
    }).as("addBookmarkToCollection");

    cy.get("[data-cy=add-bookmark-to-collection]").click();
    cy.get("[data-cy=bookmark-select]").select("1");
    cy.get("[data-cy=add-to-collection]").click();

    cy.wait("@addBookmarkToCollection");
    cy.get("[data-cy=collection-bookmarks]").should(
      "contain",
      "Understanding React Hooks"
    );
  });

  it("should remove bookmarks from collection", () => {
    cy.waitForCollections();

    cy.intercept("DELETE", "/api/collections/1/bookmarks/1", {
      statusCode: 200,
    }).as("removeBookmarkFromCollection");

    cy.get("[data-cy=collection-item]").first().click();
    cy.get("[data-cy=bookmark-item]")
      .first()
      .within(() => {
        cy.get("[data-cy=remove-from-collection]").click();
      });

    cy.wait("@removeBookmarkFromCollection");
    cy.get("[data-cy=bookmark-item]").should("have.length", 0);
  });

  it("should handle collection creation errors", () => {
    cy.intercept("POST", "/api/collections", {
      statusCode: 400,
      body: { error: "Collection name already exists" },
    }).as("createError");

    cy.get("[data-cy=add-collection]").click();
    cy.get("[data-cy=collection-name]").type("Existing Collection");
    cy.get("[data-cy=save-collection]").click();

    cy.wait("@createError");
    cy.get("[data-cy=error-message]").should(
      "contain",
      "Collection name already exists"
    );
  });

  it("should handle sharing permissions", () => {
    cy.waitForCollections();

    cy.intercept("POST", "/api/collections/1/share", {
      statusCode: 403,
      body: { error: "Insufficient permissions" },
    }).as("shareError");

    cy.get("[data-cy=collection-item]")
      .first()
      .within(() => {
        cy.get("[data-cy=share-collection]").click();
      });

    cy.get("[data-cy=generate-link]").click();

    cy.wait("@shareError");
    cy.get("[data-cy=error-message]").should(
      "contain",
      "Insufficient permissions"
    );
  });

  it("should access shared collection via link", () => {
    cy.intercept("GET", "/api/collections/shared/abc123", {
      statusCode: 200,
      body: {
        id: "shared-collection",
        name: "Shared Collection",
        bookmarks: [],
      },
    }).as("getSharedCollection");

    cy.visit("/shared/abc123");

    cy.wait("@getSharedCollection");
    cy.get("[data-cy=collection-title]").should("contain", "Shared Collection");
  });
});
