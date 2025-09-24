// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable;
      logout(): Chainable;
      seedBookmarks(): Chainable;
      seedCollections(): Chainable;
      mockApiResponse(endpoint: string, fixture: string): Chainable;
      interceptApi(endpoint: string, response: any): Chainable;
      waitForBookmarks(): Chainable;
      waitForCollections(): Chainable;
      // Add more custom commands here
    }
  }
}

Cypress.Commands.add("login", (email: string, password: string) => {
  cy.visit("/login");
  cy.get("[data-cy=email]").type(email);
  cy.get("[data-cy=password]").type(password);
  cy.get("[data-cy=submit]").click();
  cy.url().should("not.include", "/login");
});

Cypress.Commands.add("logout", () => {
  cy.get("[data-cy=logout]").click();
  cy.url().should("include", "/login");
});

Cypress.Commands.add("seedBookmarks", () => {
  cy.fixture("frontend/bookmarks").then((bookmarks) => {
    cy.intercept("GET", "/api/bookmarks*", { body: bookmarks }).as(
      "getBookmarks"
    );
  });
});

Cypress.Commands.add("seedCollections", () => {
  cy.fixture("frontend/collections").then((collections) => {
    cy.intercept("GET", "/api/collections*", { body: collections }).as(
      "getCollections"
    );
  });
});

Cypress.Commands.add("mockApiResponse", (endpoint: string, fixture: string) => {
  cy.fixture(`frontend/${fixture}`).then((data) => {
    cy.intercept("GET", `/api/${endpoint}*`, { body: data }).as(
      `mock${endpoint}`
    );
  });
});

Cypress.Commands.add("interceptApi", (endpoint: string, response: any) => {
  cy.intercept("GET", `/api/${endpoint}*`, { body: response }).as(
    `intercept${endpoint}`
  );
});

Cypress.Commands.add("waitForBookmarks", () => {
  cy.wait("@getBookmarks");
});

Cypress.Commands.add("waitForCollections", () => {
  cy.wait("@getCollections");
});

// Add more custom commands here
