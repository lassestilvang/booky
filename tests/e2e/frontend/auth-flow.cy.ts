describe("Authentication Flow", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it("should login successfully with valid credentials", () => {
    cy.intercept("POST", "/api/auth/login", {
      statusCode: 200,
      body: {
        user: {
          id: "1",
          name: "John Doe",
          email: "john.doe@example.com",
        },
        token: "fake-jwt-token",
      },
    }).as("loginRequest");

    cy.login("john.doe@example.com", "password123");

    cy.wait("@loginRequest").its("request.body").should("deep.equal", {
      email: "john.doe@example.com",
      password: "password123",
    });

    cy.url().should("eq", Cypress.config().baseUrl + "/");
    cy.window().its("localStorage.token").should("eq", "fake-jwt-token");
  });

  it("should show error for invalid credentials", () => {
    cy.intercept("POST", "/api/auth/login", {
      statusCode: 401,
      body: {
        error: "Invalid credentials",
      },
    }).as("loginError");

    cy.visit("/login");
    cy.get("[data-cy=email]").type("invalid@example.com");
    cy.get("[data-cy=password]").type("wrongpassword");
    cy.get("[data-cy=submit]").click();

    cy.wait("@loginError");
    cy.get("[data-cy=error]").should("contain", "Invalid credentials");
    cy.url().should("include", "/login");
  });

  it("should logout successfully", () => {
    // Mock logged in state
    cy.window().then((win) => {
      win.localStorage.setItem("token", "fake-jwt-token");
    });

    cy.intercept("POST", "/api/auth/logout", {
      statusCode: 200,
    }).as("logoutRequest");

    cy.visit("/");
    cy.logout();

    cy.wait("@logoutRequest");
    cy.url().should("include", "/login");
    cy.window().its("localStorage.token").should("be.undefined");
  });

  it("should redirect to login when accessing protected route without auth", () => {
    cy.visit("/");
    cy.url().should("include", "/login");
  });

  it("should persist login state across page reloads", () => {
    cy.intercept("POST", "/api/auth/login", {
      statusCode: 200,
      body: {
        user: {
          id: "1",
          name: "John Doe",
          email: "john.doe@example.com",
        },
        token: "fake-jwt-token",
      },
    });

    cy.login("john.doe@example.com", "password123");

    cy.reload();
    cy.url().should("eq", Cypress.config().baseUrl + "/");
    cy.window().its("localStorage.token").should("eq", "fake-jwt-token");
  });

  it("should handle network errors during login", () => {
    cy.intercept("POST", "/api/auth/login", {
      forceNetworkError: true,
    }).as("networkError");

    cy.visit("/login");
    cy.get("[data-cy=email]").type("john.doe@example.com");
    cy.get("[data-cy=password]").type("password123");
    cy.get("[data-cy=submit]").click();

    cy.get("[data-cy=error]").should("contain", "Network error");
  });

  it("should handle session timeout", () => {
    cy.intercept("GET", "/api/user", {
      statusCode: 401,
      body: { error: "Unauthorized" },
    }).as("sessionTimeout");

    cy.window().then((win) => {
      win.localStorage.setItem("token", "expired-token");
    });

    cy.visit("/");
    cy.wait("@sessionTimeout");
    cy.url().should("include", "/login");
  });
});
