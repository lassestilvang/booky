import request from "supertest";
import { createApp, setupTestDatabase, teardownTestDatabase } from "../setup";

const app = createApp();

describe("Bookmark Workflow Integration Tests", () => {
  let token: string;
  let bookmarkId: number;

  beforeAll(async () => {
    await setupTestDatabase();

    // Login to get token
    const response = await request(app).post("/v1/auth/login").send({
      email: "john.doe@example.com",
      password: "password1",
    });
    token = response.body.token;
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe("POST /v1/bookmarks", () => {
    it("should create a new bookmark", async () => {
      const response = await request(app)
        .post("/v1/bookmarks")
        .set("Authorization", `Bearer ${token}`)
        .send({
          url: "https://example.com/test-article",
          title: "Test Article",
          excerpt: "This is a test article",
          collectionId: 1,
        });

      expect(response.status).toBe(202);
      expect(response.body).toHaveProperty("id");
      bookmarkId = response.body.id;
    });
  });

  describe("POST /v1/tags", () => {
    it("should create tags", async () => {
      const response = await request(app)
        .post("/v1/tags")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Test Tag",
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
    });
  });

  describe("POST /v1/bookmarks/bulk (add_tags)", () => {
    it("should add tags to bookmark", async () => {
      const response = await request(app)
        .post("/v1/bookmarks/bulk")
        .set("Authorization", `Bearer ${token}`)
        .send({
          action: "add_tags",
          bookmark_ids: [bookmarkId],
          tags: ["React", "Test Tag"],
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message");
    });
  });

  describe("GET /v1/bookmarks (with tags filter)", () => {
    it("should filter bookmarks by tags", async () => {
      const response = await request(app)
        .get("/v1/bookmarks?tags=React")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      // Check that bookmarks have the tag
    });
  });

  describe("GET /v1/bookmarks (search)", () => {
    it("should search bookmarks by query", async () => {
      const response = await request(app)
        .get("/v1/bookmarks?q=React")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe("PUT /v1/bookmarks/:id", () => {
    it("should update bookmark", async () => {
      const response = await request(app)
        .put(`/v1/bookmarks/${bookmarkId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Updated Test Article",
          excerpt: "Updated excerpt",
        });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe("Updated Test Article");
    });
  });

  describe("GET /v1/bookmarks/:id", () => {
    it("should get bookmark details", async () => {
      const response = await request(app)
        .get(`/v1/bookmarks/${bookmarkId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe("Updated Test Article");
      expect(response.body).toHaveProperty("highlights");
    });
  });

  describe("DELETE /v1/bookmarks/:id", () => {
    it("should delete bookmark", async () => {
      const response = await request(app)
        .delete(`/v1/bookmarks/${bookmarkId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(204);
    });
  });
});
