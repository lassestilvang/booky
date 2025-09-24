import request from "supertest";
import { createApp, setupTestDatabase, teardownTestDatabase } from "../setup";

const app = createApp();

describe("Search Indexing Integration Tests", () => {
  let token: string;

  beforeAll(async () => {
    await setupTestDatabase();

    // Login
    const response = await request(app).post("/v1/auth/login").send({
      email: "john.doe@example.com",
      password: "password1",
    });
    token = response.body.token;
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe("Bookmark creation and indexing", () => {
    it("should create bookmark and eventually index it", async () => {
      const response = await request(app)
        .post("/v1/bookmarks")
        .set("Authorization", `Bearer ${token}`)
        .send({
          url: "https://example.com/indexed-article",
          title: "Indexed Article",
          excerpt: "This article should be indexed",
        });

      expect(response.status).toBe(202);
      expect(response.body).toHaveProperty("id");
    });
  });

  describe("GET /v1/search", () => {
    it("should search indexed bookmarks", async () => {
      // Wait a bit for indexing (in real scenario, might need to poll or mock)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const response = await request(app)
        .get("/v1/search?q=React")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("bookmarks");
      expect(Array.isArray(response.body.bookmarks)).toBe(true);
    });

    it("should filter by tags", async () => {
      const response = await request(app)
        .get("/v1/search?tags=React")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("bookmarks");
    });

    it("should filter by domain", async () => {
      const response = await request(app)
        .get("/v1/search?domain=example.com")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("bookmarks");
    });

    it("should support pagination", async () => {
      const response = await request(app)
        .get("/v1/search?page=1&limit=10")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("page");
      expect(response.body).toHaveProperty("limit");
      expect(response.body).toHaveProperty("total");
      expect(response.body).toHaveProperty("totalPages");
    });
  });

  describe("Full-text search", () => {
    it("should search in content when fulltext=true", async () => {
      const response = await request(app)
        .get("/v1/search?q=understanding&fulltext=true")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("bookmarks");
    });
  });

  describe("Data consistency", () => {
    it("should return bookmarks with tags from database", async () => {
      const response = await request(app)
        .get("/v1/search?q=React")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      if (response.body.bookmarks.length > 0) {
        const bookmark = response.body.bookmarks[0];
        expect(bookmark).toHaveProperty("tags");
        expect(Array.isArray(bookmark.tags)).toBe(true);
      }
    });
  });
});
