describe("Search Functionality", () => {
  beforeEach(() => {
    cy.login("john.doe@example.com", "password123");
    cy.seedBookmarks();
    cy.seedCollections();
    cy.visit("/");
  });

  it("should perform basic text search", () => {
    cy.waitForBookmarks();

    cy.intercept("GET", "/api/search*", {
      fixture: "frontend/search-results",
    }).as("searchRequest");

    cy.get("[data-cy=search-input]").type("React");
    cy.get("[data-cy=search-submit]").click();

    cy.wait("@searchRequest").its("request.url").should("include", "q=React");

    cy.get("[data-cy=search-results]").should("be.visible");
    cy.get("[data-cy=search-result-item]").should("have.length.greaterThan", 0);
  });

  it("should filter search results by collection", () => {
    cy.waitForBookmarks();

    cy.intercept("GET", "/api/search*", {
      fixture: "frontend/search-results",
    }).as("filteredSearch");

    cy.get("[data-cy=search-input]").type("test");
    cy.get("[data-cy=collection-filter]").select("1");
    cy.get("[data-cy=search-submit]").click();

    cy.wait("@filteredSearch")
      .its("request.url")
      .should("include", "collectionId=1");

    cy.get("[data-cy=search-result-item]").each(($el) => {
      cy.wrap($el).should("have.attr", "data-collection-id", "1");
    });
  });

  it("should filter search results by tags", () => {
    cy.waitForBookmarks();

    cy.intercept("GET", "/api/search*", {
      fixture: "frontend/search-results",
    }).as("tagFilteredSearch");

    cy.get("[data-cy=search-input]").type("javascript");
    cy.get("[data-cy=tag-filter]").contains("react").click();
    cy.get("[data-cy=search-submit]").click();

    cy.wait("@tagFilteredSearch")
      .its("request.url")
      .should("include", "tags=react");

    cy.get("[data-cy=search-result-item]").each(($el) => {
      cy.wrap($el).find("[data-cy=tags]").should("contain", "react");
    });
  });

  it("should handle pagination", () => {
    cy.waitForBookmarks();

    cy.intercept("GET", "/api/search?page=1*", {
      statusCode: 200,
      body: {
        data: [
          {
            id: "1",
            title: "Page 1 Result",
            url: "https://example.com/1",
            description: "First page result",
            tags: ["test"],
            collectionId: "1",
          },
        ],
        total: 25,
        page: 1,
        limit: 10,
      },
    }).as("searchPage1");

    cy.intercept("GET", "/api/search?page=2*", {
      statusCode: 200,
      body: {
        data: [
          {
            id: "11",
            title: "Page 2 Result",
            url: "https://example.com/11",
            description: "Second page result",
            tags: ["test"],
            collectionId: "1",
          },
        ],
        total: 25,
        page: 2,
        limit: 10,
      },
    }).as("searchPage2");

    cy.get("[data-cy=search-input]").type("test");
    cy.get("[data-cy=search-submit]").click();

    cy.wait("@searchPage1");
    cy.get("[data-cy=search-result-item]").should("have.length", 1);
    cy.get("[data-cy=search-result-item]")
      .first()
      .should("contain", "Page 1 Result");

    cy.get("[data-cy=next-page]").click();
    cy.wait("@searchPage2");
    cy.get("[data-cy=search-result-item]").should("contain", "Page 2 Result");
  });

  it("should navigate to search page via URL", () => {
    cy.visit("/search?q=react");

    cy.get("[data-cy=search-input]").should("have.value", "react");
    cy.get("[data-cy=search-results]").should("be.visible");
  });

  it("should clear search results", () => {
    cy.waitForBookmarks();

    cy.get("[data-cy=search-input]").type("test");
    cy.get("[data-cy=search-submit]").click();

    cy.get("[data-cy=search-results]").should("be.visible");

    cy.get("[data-cy=clear-search]").click();
    cy.get("[data-cy=search-input]").should("have.value", "");
    cy.get("[data-cy=search-results]").should("not.be.visible");
  });

  it("should show no results message", () => {
    cy.intercept("GET", "/api/search*", {
      statusCode: 200,
      body: {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      },
    }).as("emptySearch");

    cy.get("[data-cy=search-input]").type("nonexistent");
    cy.get("[data-cy=search-submit]").click();

    cy.wait("@emptySearch");
    cy.get("[data-cy=no-results]").should("be.visible");
  });

  it("should handle search errors", () => {
    cy.intercept("GET", "/api/search*", {
      statusCode: 500,
      body: { error: "Search service unavailable" },
    }).as("searchError");

    cy.get("[data-cy=search-input]").type("test");
    cy.get("[data-cy=search-submit]").click();

    cy.wait("@searchError");
    cy.get("[data-cy=error-message]").should(
      "contain",
      "Search service unavailable"
    );
  });

  it("should perform advanced search with multiple filters", () => {
    cy.waitForBookmarks();

    cy.intercept("GET", "/api/search*", {
      fixture: "frontend/search-results",
    }).as("advancedSearch");

    cy.get("[data-cy=search-input]").type("javascript");
    cy.get("[data-cy=collection-filter]").select("1");
    cy.get("[data-cy=tag-filter]").contains("react").click();
    cy.get("[data-cy=date-from]").type("2023-01-01");
    cy.get("[data-cy=date-to]").type("2023-12-31");
    cy.get("[data-cy=search-submit]").click();

    cy.wait("@advancedSearch")
      .its("request.url")
      .should("include", "q=javascript")
      .and("include", "collectionId=1")
      .and("include", "tags=react")
      .and("include", "dateFrom=2023-01-01")
      .and("include", "dateTo=2023-12-31");
  });

  it("should save search queries", () => {
    cy.waitForBookmarks();

    cy.get("[data-cy=search-input]").type("saved query");
    cy.get("[data-cy=save-search]").click();

    cy.get("[data-cy=saved-searches]").should("contain", "saved query");
  });

  it("should load saved search", () => {
    cy.get("[data-cy=saved-searches]").contains("saved query").click();

    cy.get("[data-cy=search-input]").should("have.value", "saved query");
  });
});
