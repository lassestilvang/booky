describe("Error Handling and Edge Cases", () => {
  beforeEach(() => {
    cy.login("john.doe@example.com", "password123");
  });

  it("should handle network failures gracefully", () => {
    cy.intercept("GET", "/api/bookmarks*", {
      forceNetworkError: true,
    }).as("networkError");

    cy.visit("/");
    cy.get("[data-cy=error-message]").should("contain", "Network error");
    cy.get("[data-cy=retry-button]").should("be.visible");
  });

  it("should handle API timeouts", () => {
    cy.intercept("GET", "/api/bookmarks*", {
      delay: 15000, // Longer than default timeout
      statusCode: 200,
      body: [],
    }).as("timeoutError");

    cy.visit("/");
    cy.get("[data-cy=error-message]").should("contain", "Request timeout");
  });

  it("should handle 404 errors", () => {
    cy.intercept("GET", "/api/bookmarks*", {
      statusCode: 404,
      body: { error: "Not found" },
    }).as("notFound");

    cy.visit("/");
    cy.get("[data-cy=error-message]").should("contain", "Not found");
  });

  it("should handle 500 server errors", () => {
    cy.intercept("POST", "/api/bookmarks", {
      statusCode: 500,
      body: { error: "Internal server error" },
    }).as("serverError");

    cy.get("[data-cy=add-bookmark]").click();
    cy.get("[data-cy=bookmark-title]").type("Test");
    cy.get("[data-cy=bookmark-url]").type("https://example.com");
    cy.get("[data-cy=save-bookmark]").click();

    cy.get("[data-cy=error-message]").should(
      "contain",
      "Internal server error"
    );
  });

  it("should handle validation errors", () => {
    cy.intercept("POST", "/api/bookmarks", {
      statusCode: 400,
      body: {
        error: "Validation failed",
        details: {
          url: "Invalid URL format",
          title: "Title is required",
        },
      },
    }).as("validationError");

    cy.get("[data-cy=add-bookmark]").click();
    cy.get("[data-cy=bookmark-url]").type("invalid-url");
    cy.get("[data-cy=save-bookmark]").click();

    cy.get("[data-cy=error-message]").should("contain", "Validation failed");
    cy.get("[data-cy=url-error]").should("contain", "Invalid URL format");
    cy.get("[data-cy=title-error]").should("contain", "Title is required");
  });

  it("should handle empty states", () => {
    cy.intercept("GET", "/api/bookmarks*", {
      statusCode: 200,
      body: [],
    }).as("emptyBookmarks");

    cy.visit("/");
    cy.get("[data-cy=empty-state]").should("be.visible");
    cy.get("[data-cy=empty-state-message]").should(
      "contain",
      "No bookmarks found"
    );
  });

  it("should handle malformed API responses", () => {
    cy.intercept("GET", "/api/bookmarks*", {
      statusCode: 200,
      body: "invalid json",
    }).as("malformedResponse");

    cy.visit("/");
    cy.get("[data-cy=error-message]").should("contain", "Invalid response");
  });

  it("should handle large data sets", () => {
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      id: `${i + 1}`,
      title: `Bookmark ${i + 1}`,
      url: `https://example.com/${i + 1}`,
      description: `Description ${i + 1}`,
      tags: ["test"],
      collectionId: "1",
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2023-01-01T00:00:00Z",
    }));

    cy.intercept("GET", "/api/bookmarks*", {
      statusCode: 200,
      body: largeDataset,
    }).as("largeDataset");

    cy.visit("/");
    cy.get("[data-cy=bookmark-item]").should("have.length", 1000);
  });

  it("should handle concurrent requests", () => {
    cy.intercept("POST", "/api/bookmarks", { delay: 100 }).as("createBookmark");

    // Trigger multiple bookmark creations
    for (let i = 0; i < 5; i++) {
      cy.get("[data-cy=add-bookmark]").click();
      cy.get("[data-cy=bookmark-title]").type(`Test ${i}`);
      cy.get("[data-cy=bookmark-url]").type(`https://example.com/${i}`);
      cy.get("[data-cy=save-bookmark]").click();
    }

    cy.wait(Array(5).fill("@createBookmark"));
    cy.get("[data-cy=bookmark-item]").should("have.length.at.least", 5);
  });

  it("should handle session expiration", () => {
    cy.intercept("GET", "/api/bookmarks*", {
      statusCode: 401,
      body: { error: "Unauthorized" },
    }).as("sessionExpired");

    cy.visit("/");
    cy.wait("@sessionExpired");
    cy.url().should("include", "/login");
  });

  it("should handle rate limiting", () => {
    cy.intercept("POST", "/api/bookmarks", {
      statusCode: 429,
      body: { error: "Too many requests" },
    }).as("rateLimited");

    cy.get("[data-cy=add-bookmark]").click();
    cy.get("[data-cy=bookmark-title]").type("Test");
    cy.get("[data-cy=bookmark-url]").type("https://example.com");
    cy.get("[data-cy=save-bookmark]").click();

    cy.get("[data-cy=error-message]").should("contain", "Too many requests");
  });

  it("should handle browser offline state", () => {
    cy.window().then((win) => {
      // Simulate going offline
      win.dispatchEvent(new Event("offline"));
    });

    cy.get("[data-cy=add-bookmark]").click();
    cy.get("[data-cy=bookmark-title]").type("Test");
    cy.get("[data-cy=bookmark-url]").type("https://example.com");
    cy.get("[data-cy=save-bookmark]").click();

    cy.get("[data-cy=error-message]").should(
      "contain",
      "No internet connection"
    );
  });

  it("should handle corrupted local storage", () => {
    cy.window().then((win) => {
      win.localStorage.setItem("bookmarks", "invalid json");
    });

    cy.visit("/");
    // Should handle gracefully and not crash
    cy.get("[data-cy=bookmarks-page]").should("be.visible");
  });
});
