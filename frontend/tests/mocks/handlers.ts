import { http, HttpResponse } from "msw";

export const handlers = [
  // Mock login endpoint
  http.post("http://localhost:3000/v1/auth/login", async ({ request }) => {
    const { email, password } = (await request.json()) as {
      email: string;
      password: string;
    };

    if (email === "test@example.com" && password === "Password123!") {
      return HttpResponse.json({
        user: {
          id: "1",
          name: "Test User",
          email: "test@example.com",
        },
        token: "mock-jwt-token",
        refreshToken: "mock-refresh-token",
      });
    }

    return HttpResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }),

  // Mock refresh token endpoint
  http.post("http://localhost:3000/v1/auth/refresh", () => {
    return HttpResponse.json({
      token: "new-mock-jwt-token",
    });
  }),

  // Mock user endpoint
  http.get("http://localhost:3000/v1/auth/user", () => {
    return HttpResponse.json({
      id: "1",
      name: "Test User",
      email: "test@example.com",
    });
  }),
];
