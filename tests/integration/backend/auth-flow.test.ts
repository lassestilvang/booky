import request from "supertest";
import { createApp, setupTestDatabase, teardownTestDatabase } from "../setup";

// Test constants
const TEST_USER_EMAIL = "john.doe@example.com";
const TEST_USER_PASSWORD = "password1";
const TEST_USER_NAME = "John Doe";

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
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("user");
      expect(response.body.user.email).toBe(TEST_USER_EMAIL);
    });

    it("should return 400 for invalid credentials", async () => {
      const response = await request(app).post("/v1/auth/login").send({
        email: TEST_USER_EMAIL,
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
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      });
      token = response.body.token;
    });

    it("should return user info with valid token", async () => {
      const response = await request(app)
        .get("/v1/auth/user")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.email).toBe(TEST_USER_EMAIL);
      expect(response.body.name).toBe(TEST_USER_NAME);
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
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
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
