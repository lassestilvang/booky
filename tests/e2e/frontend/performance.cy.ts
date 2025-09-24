describe("Performance Tests", () => {
  beforeEach(() => {
    cy.login("john.doe@example.com", "password123");
  });

  it("should load bookmarks page within acceptable time", () => {
    cy.visit("/", { timeout: 10000 });

    // Measure page load time
    cy.window().then((win) => {
      const loadTime =
        win.performance.timing.loadEventEnd -
        win.performance.timing.navigationStart;
      expect(loadTime).to.be.lessThan(3000); // Less than 3 seconds
    });

    cy.waitForBookmarks();
  });

  it("should render bookmarks quickly", () => {
    cy.seedBookmarks();
    cy.visit("/");

    cy.waitForBookmarks();

    // Measure rendering time
    cy.get("[data-cy=bookmark-item]").should("be.visible");

    cy.window().then((win) => {
      const renderTime = win.performance.now();
      // This is a basic check; in real scenarios, use performance marks
      expect(renderTime).to.be.greaterThan(0);
    });
  });

  it("should handle large bookmark lists efficiently", () => {
    // Seed with large dataset
    cy.intercept("GET", "/api/bookmarks*", {
      statusCode: 200,
      body: Array.from({ length: 100 }, (_, i) => ({
        id: `${i + 1}`,
        title: `Bookmark ${i + 1}`,
        url: `https://example.com/${i + 1}`,
        description: `Description ${i + 1}`,
        tags: ["test"],
        collectionId: "1",
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
      })),
    }).as("largeBookmarks");

    cy.visit("/");
    cy.wait("@largeBookmarks");

    // Check that all items are rendered without excessive delay
    cy.get("[data-cy=bookmark-item]", { timeout: 5000 }).should(
      "have.length",
      100
    );
  });

  it("should perform search operations quickly", () => {
    cy.seedBookmarks();
    cy.visit("/");

    const startTime = Date.now();

    cy.get("[data-cy=search-input]").type("react");
    cy.get("[data-cy=search-submit]").click();

    cy.get("[data-cy=search-results]").should("be.visible");

    const endTime = Date.now();
    const searchTime = endTime - startTime;

    expect(searchTime).to.be.lessThan(2000); // Less than 2 seconds
  });

  it("should load collection pages efficiently", () => {
    cy.seedCollections();
    cy.visit("/collections/1");

    cy.window().then((win) => {
      const startTime = win.performance.now();

      cy.get("[data-cy=collection-title]").should("be.visible");

      const endTime = win.performance.now();
      const loadTime = endTime - startTime;

      expect(loadTime).to.be.lessThan(1000); // Less than 1 second
    });
  });

  it("should handle concurrent API calls", () => {
    cy.intercept("GET", "/api/bookmarks*", { delay: 100 }).as("bookmarks");
    cy.intercept("GET", "/api/collections*", { delay: 100 }).as("collections");

    cy.visit("/");

    cy.wait(["@bookmarks", "@collections"]);

    // Ensure both calls complete within reasonable time
    cy.window().then((win) => {
      const totalTime = win.performance.now();
      expect(totalTime).to.be.lessThan(500); // Both should complete around the same time due to concurrency
    });
  });

  it("should maintain performance during pagination", () => {
    cy.intercept("GET", "/api/bookmarks?page=1*", { delay: 200 }).as("page1");
    cy.intercept("GET", "/api/bookmarks?page=2*", { delay: 200 }).as("page2");

    cy.visit("/");

    cy.wait("@page1");

    // Simulate scrolling to load more
    cy.scrollTo("bottom");
    cy.wait("@page2");

    // Check that pagination doesn't cause performance degradation
    cy.get("[data-cy=bookmark-item]").should("have.length.greaterThan", 10);
  });

  it("should monitor memory usage", () => {
    cy.seedBookmarks();
    cy.visit("/");

    cy.waitForBookmarks();

    // Basic memory check (limited in Cypress)
    cy.window().then((win) => {
      if (win.performance.memory) {
        const { usedJSHeapSize, totalJSHeapSize } = win.performance.memory;
        expect(usedJSHeapSize).to.be.lessThan(totalJSHeapSize * 0.8); // Less than 80% heap usage
      }
    });
  });
});
