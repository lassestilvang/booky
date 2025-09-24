import request from "supertest";
import { createApp, setupTestDatabase, teardownTestDatabase } from "../setup";

const app = createApp();

describe("Auth Flow Integration Tests", () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe("POST /v1/auth/login", () => {
    it("should login with valid credentials and return token", async () => {
      const response = await request(app).post("/v1/auth/login").send({
        email: "john.doe@example.com",
        password: "password1", // Assuming this matches the hash
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("user");
      expect(response.body.user.email).toBe("john.doe@example.com");
    });

    it("should return 400 for invalid credentials", async () => {
      const response = await request(app).post("/v1/auth/login").send({
        email: "john.doe@example.com",
        password: "wrongpassword",
      });

      expect(response.status).toBe(400);
    });
  });

  describe("GET /v1/auth/user", () => {
    let token: string;

    beforeAll(async () => {
      // Login to get token
      const response = await request(app).post("/v1/auth/login").send({
        email: "john.doe@example.com",
        password: "password1",
      });
      token = response.body.token;
    });

    it("should return user info with valid token", async () => {
      const response = await request(app)
        .get("/v1/auth/user")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.email).toBe("john.doe@example.com");
      expect(response.body.name).toBe("John Doe");
    });

    it("should return 401 without token", async () => {
      const response = await request(app).get("/v1/auth/user");

      expect(response.status).toBe(401);
    });
  });

  describe("Authenticated Operations", () => {
    let token: string;

    beforeAll(async () => {
      const response = await request(app).post("/v1/auth/login").send({
        email: "john.doe@example.com",
        password: "password1",
      });
      token = response.body.token;
    });

    it("should create a bookmark with authentication", async () => {
      const response = await request(app)
        .post("/v1/bookmarks")
        .set("Authorization", `Bearer ${token}`)
        .send({
          url: "https://example.com/new-article",
          title: "New Article",
        });

      expect(response.status).toBe(202);
      expect(response.body).toHaveProperty("id");
    });

    it("should get bookmarks with authentication", async () => {
      const response = await request(app)
        .get("/v1/bookmarks")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
