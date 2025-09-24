describe("Routing and Navigation", () => {
  beforeEach(() => {
    cy.login("john.doe@example.com", "password123");
    cy.seedBookmarks();
    cy.seedCollections();
  });

  it("should navigate to home page", () => {
    cy.visit("/");
    cy.url().should("eq", Cypress.config().baseUrl + "/");
    cy.get("[data-cy=bookmarks-page]").should("be.visible");
  });

  it("should navigate to collection page", () => {
    cy.visit("/collections/1");
    cy.url().should("include", "/collections/1");
    cy.get("[data-cy=collection-title]").should("be.visible");
  });

  it("should navigate to search page", () => {
    cy.visit("/search");
    cy.url().should("include", "/search");
    cy.get("[data-cy=search-input]").should("be.visible");
  });

  it("should handle deep linking to specific bookmark", () => {
    cy.visit("/bookmarks/1");
    cy.url().should("include", "/bookmarks/1");
    cy.get("[data-cy=bookmark-detail]").should("be.visible");
  });

  it("should navigate using sidebar links", () => {
    cy.visit("/");
    cy.get("[data-cy=sidebar-collections]").contains("Tech Articles").click();
    cy.url().should("include", "/collections/1");
  });

  it("should navigate back using browser back button", () => {
    cy.visit("/");
    cy.get("[data-cy=sidebar-collections]").contains("Tech Articles").click();
    cy.url().should("include", "/collections/1");

    cy.go("back");
    cy.url().should("eq", Cypress.config().baseUrl + "/");
  });

  it("should navigate forward using browser forward button", () => {
    cy.visit("/");
    cy.get("[data-cy=sidebar-collections]").contains("Tech Articles").click();
    cy.url().should("include", "/collections/1");

    cy.go("back");
    cy.url().should("eq", Cypress.config().baseUrl + "/");

    cy.go("forward");
    cy.url().should("include", "/collections/1");
  });

  it("should handle invalid routes", () => {
    cy.visit("/invalid-route");
    cy.get("[data-cy=not-found]").should("be.visible");
  });

  it("should preserve query parameters in URL", () => {
    cy.visit("/search?q=react&collectionId=1");
    cy.get("[data-cy=search-input]").should("have.value", "react");
    cy.get("[data-cy=collection-filter]").should("have.value", "1");
  });

  it("should update URL when search parameters change", () => {
    cy.visit("/search");
    cy.get("[data-cy=search-input]").type("javascript");
    cy.get("[data-cy=search-submit]").click();
    cy.url().should("include", "q=javascript");
  });

  it("should handle route changes with authentication", () => {
    cy.clearLocalStorage();
    cy.visit("/collections/1");
    cy.url().should("include", "/login");
  });

  it("should redirect after login", () => {
    cy.clearLocalStorage();
    cy.visit("/collections/1");
    cy.url().should("include", "/login");

    cy.login("john.doe@example.com", "password123");
    cy.url().should("include", "/collections/1");
  });

  it("should handle nested routes", () => {
    cy.visit("/collections/1/bookmarks/1");
    cy.url().should("include", "/collections/1/bookmarks/1");
    cy.get("[data-cy=bookmark-detail]").should("be.visible");
  });

  it("should maintain scroll position on navigation", () => {
    cy.visit("/");
    cy.scrollTo(0, 500);
    cy.window().its("scrollY").should("eq", 500);

    cy.get("[data-cy=sidebar-collections]").contains("Tech Articles").click();
    cy.go("back");

    // Note: This might not work in all browsers, but tests the concept
    cy.window().its("scrollY").should("be.closeTo", 500, 50);
  });

  it("should handle route transitions smoothly", () => {
    cy.visit("/");
    cy.get("[data-cy=loading-spinner]").should("not.exist");

    cy.get("[data-cy=sidebar-collections]").contains("Tech Articles").click();
    cy.get("[data-cy=loading-spinner]").should("not.exist");
  });

  it("should support bookmarking URLs", () => {
    cy.visit("/collections/1");
    cy.url().should("include", "/collections/1");

    // Simulate bookmarking the URL
    cy.window().then((win) => {
      expect(win.location.pathname).to.include("/collections/1");
    });
  });

  it("should handle page refresh on any route", () => {
    cy.visit("/collections/1");
    cy.reload();
    cy.url().should("include", "/collections/1");
    cy.get("[data-cy=collection-title]").should("be.visible");
  });
});
