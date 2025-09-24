import request from "supertest";
import express from "express";
import bookmarksRouter from "../../../src/routes/bookmarks";
import {
  mockUsers,
  mockBookmarks,
  mockCollections,
} from "../../../../tests/fixtures/backend/mocks";
import pool from "../../../src/db";
import bookmarkQueue from "../../../src/queue";
import jwt from "jsonwebtoken";

// Get the mocked modules
const mockPool = pool as any;
const mockQueue = bookmarkQueue as any;
const mockJwt = jwt as any;

describe("Bookmarks Routes", () => {
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock JWT verification for authentication
    mockJwt.verify.mockImplementation(
      (
        token: string,
        secret: string,
        callback: (err: any, decoded: any) => void
      ) => {
        callback(null, { userId: 1 });
      }
    );
    app = express();
    app.use(express.json());
    app.use("/v1/bookmarks", bookmarksRouter);
  });

  describe("POST /v1/bookmarks", () => {
    it("should create bookmark successfully", async () => {
      const bookmarkData = {
        url: "https://example.com/new-article",
        collectionId: 1,
        notes: "Test notes",
      };

      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 3 }] });
      mockQueue.add.mockResolvedValueOnce({ id: "job-1" });

      const response = await request(app)
        .post("/v1/bookmarks")
        .set("Authorization", "Bearer valid-token")
        .send(bookmarkData)
        .expect(202);

      expect(response.body).toMatchObject({ id: 3 });
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO bookmarks"),
        expect.any(Array)
      );
      expect(mockQueue.add).toHaveBeenCalledWith("process-bookmark", {
        bookmarkId: 3,
      });
    });

    it("should return 400 for missing URL", async () => {
      const response = await request(app)
        .post("/v1/bookmarks")
        .set("Authorization", "Bearer valid-token")
        .send({ collectionId: 1 })
        .expect(400);

      expect(response.body).toMatchObject({ error: "URL is required" });
    });

    it("should return 500 for database error", async () => {
      mockPool.query.mockRejectedValueOnce(new Error("Database error"));

      const response = await request(app)
        .post("/v1/bookmarks")
        .set("Authorization", "Bearer valid-token")
        .send({ url: "https://example.com" })
        .expect(500);

      expect(response.body).toMatchObject({ error: "Internal server error" });
    });
  });

  describe("GET /v1/bookmarks", () => {
    it("should list bookmarks successfully", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: mockBookmarks });

      const response = await request(app)
        .get("/v1/bookmarks")
        .set("Authorization", "Bearer valid-token")
        .expect(200);

      expect(response.body).toEqual(
        mockBookmarks.map((bookmark) => ({
          ...bookmark,
          created_at: expect.any(String),
          updated_at: expect.any(String),
        }))
      );
    });

    it("should filter by collection", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [mockBookmarks[0]] });

      const response = await request(app)
        .get("/v1/bookmarks?collection=1")
        .set("Authorization", "Bearer valid-token")
        .expect(200);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("collection_id = $"),
        expect.any(Array)
      );
    });

    it("should search by query", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [mockBookmarks[0]] });

      const response = await request(app)
        .get("/v1/bookmarks?q=react")
        .set("Authorization", "Bearer valid-token")
        .expect(200);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("to_tsvector"),
        expect.any(Array)
      );
    });

    it("should filter by tags", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [mockBookmarks[0]] });

      const response = await request(app)
        .get("/v1/bookmarks?tags=react,javascript")
        .set("Authorization", "Bearer valid-token")
        .expect(200);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("bookmark_tags"),
        expect.any(Array)
      );
    });

    it("should return 500 for database error", async () => {
      mockPool.query.mockRejectedValueOnce(new Error("Database error"));

      const response = await request(app)
        .get("/v1/bookmarks")
        .set("Authorization", "Bearer valid-token")
        .expect(500);

      expect(response.body).toMatchObject({ error: "Internal server error" });
    });
  });

  describe("GET /v1/bookmarks/:id", () => {
    it("should get single bookmark successfully", async () => {
      const bookmark = mockBookmarks[0];
      const highlights: any[] = [];

      mockPool.query
        .mockResolvedValueOnce({ rows: [bookmark] })
        .mockResolvedValueOnce({ rows: highlights });

      const response = await request(app)
        .get("/v1/bookmarks/1")
        .set("Authorization", "Bearer valid-token")
        .expect(200);

      expect(response.body).toMatchObject({
        ...bookmark,
        created_at: expect.any(String),
        updated_at: expect.any(String),
        highlights
      });
    });

    it("should return 400 for invalid bookmark ID", async () => {
      const response = await request(app)
        .get("/v1/bookmarks/abc")
        .set("Authorization", "Bearer valid-token")
        .expect(400);

      expect(response.body).toMatchObject({ error: "Invalid bookmark ID" });
    });

    it("should return 404 for non-existent bookmark", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get("/v1/bookmarks/999")
        .set("Authorization", "Bearer valid-token")
        .expect(404);

      expect(response.body).toMatchObject({ error: "Bookmark not found" });
    });
  });

  describe("PUT /v1/bookmarks/:id", () => {
    it("should update bookmark successfully", async () => {
      const updateData = { title: "Updated Title", excerpt: "Updated excerpt" };
      const updatedBookmark = { ...mockBookmarks[0], ...updateData };

      mockPool.query.mockResolvedValueOnce({ rows: [updatedBookmark] });

      const response = await request(app)
        .put("/v1/bookmarks/1")
        .set("Authorization", "Bearer valid-token")
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        ...updatedBookmark,
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });
    });

    it("should return 404 for non-existent bookmark", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .put("/v1/bookmarks/999")
        .set("Authorization", "Bearer valid-token")
        .send({ title: "New Title" })
        .expect(404);

      expect(response.body).toMatchObject({ error: "Bookmark not found" });
    });
  });

  describe("DELETE /v1/bookmarks/:id", () => {
    it("should delete bookmark successfully", async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

      const response = await request(app)
        .delete("/v1/bookmarks/1")
        .set("Authorization", "Bearer valid-token")
        .expect(204);

      expect(response.status).toBe(204);
    });

    it("should return 404 for non-existent bookmark", async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 0 });

      const response = await request(app)
        .delete("/v1/bookmarks/999")
        .set("Authorization", "Bearer valid-token")
        .expect(404);

      expect(response.body).toMatchObject({ error: "Bookmark not found" });
    });
  });

  describe("POST /v1/bookmarks/bulk", () => {
    it("should move bookmarks successfully", async () => {
      const bulkData = {
        action: "move",
        bookmark_ids: [1, 2],
        collection_id: 2,
      };

      mockPool.query.mockResolvedValueOnce({ rowCount: 2 });

      const response = await request(app)
        .post("/v1/bookmarks/bulk")
        .set("Authorization", "Bearer valid-token")
        .send(bulkData)
        .expect(200);

      expect(response.body).toMatchObject({ updated: 2 });
    });

    it("should add tags to bookmarks successfully", async () => {
      const bulkData = {
        action: "add_tags",
        bookmark_ids: [1, 2],
        tags: ["react", "javascript"],
      };

      mockPool.query
        .mockResolvedValueOnce({
          rows: [
            { id: 1, name: "react" },
            { id: 2, name: "javascript" },
          ],
        })
        .mockResolvedValueOnce({}) // INSERT
        .mockResolvedValueOnce({}); // INSERT

      const response = await request(app)
        .post("/v1/bookmarks/bulk")
        .set("Authorization", "Bearer valid-token")
        .send(bulkData)
        .expect(200);

      expect(response.body).toMatchObject({ message: "Tags added" });
    });

    it("should return 400 for invalid action", async () => {
      const bulkData = {
        action: "invalid",
        bookmark_ids: [1, 2],
      };

      const response = await request(app)
        .post("/v1/bookmarks/bulk")
        .set("Authorization", "Bearer valid-token")
        .send(bulkData)
        .expect(400);

      expect(response.body).toMatchObject({ error: "Invalid action" });
    });
  });
});
