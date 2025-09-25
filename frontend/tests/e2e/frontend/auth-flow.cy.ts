describe("Authentication Flow", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it("should login successfully with valid credentials", () => {
    cy.intercept("POST", "http://localhost:3000/v1/auth/login", {
      statusCode: 200,
      body: {
        user: {
          id: "1",
          name: "John Doe",
          email: "john.doe@example.com",
        },
        token: "fake-jwt-token",
        refreshToken: "fake-refresh-token",
      },
    }).as("loginRequest");

    cy.visit("/login");

    // Fill in the login form
    cy.get("input[type='email']").type("john.doe@example.com");
    cy.get("input[type='password']").type("Password123!");
    cy.get("button[type='submit']").click();

    cy.wait("@loginRequest").its("request.body").should("deep.equal", {
      email: "john.doe@example.com",
      password: "Password123!",
    });

    cy.url().should("eq", Cypress.config().baseUrl + "/");
    cy.window().its("localStorage.accessToken").should("eq", "fake-jwt-token");
    cy.window()
      .its("localStorage.refreshToken")
      .should("eq", "fake-refresh-token");
  });

  it("should show error for invalid credentials", () => {
    cy.intercept("POST", "http://localhost:3000/v1/auth/login", {
      statusCode: 401,
      body: {
        error: "Invalid credentials",
      },
    }).as("loginError");

    cy.visit("/login");
    cy.get("input[type='email']").type("invalid@example.com");
    cy.get("input[type='password']").type("wrongpassword");
    cy.get("button[type='submit']").click();

    cy.wait("@loginError");
    cy.get(".text-red-600").should("contain", "Authentication failed");
    cy.url().should("include", "/login");
  });

  it("should logout successfully", () => {
    // Mock logged in state
    cy.window().then((win) => {
      win.localStorage.setItem("accessToken", "fake-jwt-token");
      win.localStorage.setItem("refreshToken", "fake-refresh-token");
    });

    cy.visit("/");
    cy.get("button").contains("Logout").click();

    cy.url().should("include", "/login");
    cy.window().its("localStorage.accessToken").should("be.undefined");
    cy.window().its("localStorage.refreshToken").should("be.undefined");
  });

  it("should redirect to login when accessing protected route without auth", () => {
    cy.visit("/");
    cy.url().should("include", "/login");
  });

  it("should persist login state across page reloads", () => {
    cy.intercept("POST", "http://localhost:3000/v1/auth/login", {
      statusCode: 200,
      body: {
        user: {
          id: "1",
          name: "John Doe",
          email: "john.doe@example.com",
        },
        token: "fake-jwt-token",
        refreshToken: "fake-refresh-token",
      },
    });

    cy.visit("/login");
    cy.get("input[type='email']").type("john.doe@example.com");
    cy.get("input[type='password']").type("Password123!");
    cy.get("button[type='submit']").click();

    cy.reload();
    cy.url().should("eq", Cypress.config().baseUrl + "/");
    cy.window().its("localStorage.accessToken").should("eq", "fake-jwt-token");
  });

  it("should handle network errors during login", () => {
    cy.intercept("POST", "http://localhost:3000/v1/auth/login", {
      forceNetworkError: true,
    }).as("networkError");

    cy.visit("/login");
    cy.get("input[type='email']").type("john.doe@example.com");
    cy.get("input[type='password']").type("Password123!");
    cy.get("button[type='submit']").click();

    cy.get(".text-red-600").should("contain", "Network error");
  });

  it("should handle session timeout", () => {
    cy.intercept("GET", "http://localhost:3000/v1/user", {
      statusCode: 401,
      body: { error: "Unauthorized" },
    }).as("sessionTimeout");

    cy.window().then((win) => {
      win.localStorage.setItem("accessToken", "expired-token");
    });

    cy.visit("/");
    cy.wait("@sessionTimeout");
    cy.url().should("include", "/login");
  });
});
