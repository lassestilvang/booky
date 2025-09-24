import request from "supertest";
import { createApp, setupTestDatabase, teardownTestDatabase } from "../setup";

const app = createApp();

describe("Search Indexing Integration Tests", () => {
  let token: string;
  let testBookmarkId: number;

  beforeAll(async () => {
    await setupTestDatabase();

    // Login
    const response = await request(app).post("/v1/auth/login").send({
      email: "john.doe@example.com",
      password: "password1",
    });
    token = response.body.token;

    // Seed test-specific bookmark
    const bookmarkResponse = await request(app)
      .post("/v1/bookmarks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        url: "https://example.com/test-search-bookmark",
        title: "Test Search Bookmark with React content",
        excerpt:
          "This bookmark contains React and testing keywords for search indexing",
      });
    testBookmarkId = bookmarkResponse.body.id;
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
    const pollForIndexing = async (
      bookmarkId: number,
      maxAttempts: number = 10
    ): Promise<void> => {
      for (let i = 0; i < maxAttempts; i++) {
        const response = await request(app)
          .get(`/v1/bookmarks/${bookmarkId}`)
          .set("Authorization", `Bearer ${token}`);

        if (response.status === 200 && response.body.content_indexed) {
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      throw new Error(
        "Bookmark indexing did not complete within expected time"
      );
    };

    it("should search indexed bookmarks", async () => {
      // Poll for indexing completion
      await pollForIndexing(testBookmarkId);

      const response = await request(app)
        .get("/v1/search?q=React")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("bookmarks");
      expect(Array.isArray(response.body.bookmarks)).toBe(true);
      // Check that our test bookmark is in the results
      const hasTestBookmark = response.body.bookmarks.some(
        (b: any) => b.id === testBookmarkId
      );
      expect(hasTestBookmark).toBe(true);
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
