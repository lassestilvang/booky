import request from "supertest";
import express from "express";
import highlightsRouter from "../../../src/routes/highlights";
import {
  mockHighlights,
  mockBookmarks,
} from "../../../../tests/fixtures/backend/mocks";
import pool from "../../../src/db";
import jwt from "jsonwebtoken";

const mockPool = pool as any;
const mockJwt = jwt as any;

describe("Highlights Routes", () => {
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
    app.use("/v1/highlights", highlightsRouter);
  });

  describe("GET /v1/highlights/bookmarks/:bookmarkId/highlights", () => {
    it("should get highlights for bookmark successfully", async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [mockBookmarks[0]] }) // Check bookmark exists
        .mockResolvedValueOnce({ rows: mockHighlights }); // Get highlights

      const response = await request(app)
        .get("/v1/highlights/bookmarks/1/highlights")
        .set("Authorization", "Bearer valid-token")
        .expect(200);

      expect(response.body).toEqual(
        mockHighlights.map((highlight) => ({
          ...highlight,
          created_at: expect.any(String),
        }))
      );
    });

    it("should return 400 for invalid bookmark ID", async () => {
      const response = await request(app)
        .get("/v1/highlights/bookmarks/abc/highlights")
        .set("Authorization", "Bearer valid-token")
        .expect(400);

      expect(response.body).toMatchObject({ error: "Invalid bookmark ID" });
    });

    it("should return 404 for non-existent bookmark", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get("/v1/highlights/bookmarks/999/highlights")
        .set("Authorization", "Bearer valid-token")
        .expect(404);

      expect(response.body).toMatchObject({ error: "Bookmark not found" });
    });
  });

  describe("POST /v1/highlights", () => {
    it("should create highlight successfully", async () => {
      const highlightData = {
        bookmarkId: 1,
        text: "Important text",
        color: "#FFFF00",
        annotation_md: "Key insight",
        position_context: "Paragraph 5",
      };
      const createdHighlight = { id: 2, ...highlightData };

      mockPool.query
        .mockResolvedValueOnce({ rows: [mockBookmarks[0]] }) // Check bookmark exists
        .mockResolvedValueOnce({ rows: [createdHighlight] }); // Insert highlight

      const response = await request(app)
        .post("/v1/highlights")
        .set("Authorization", "Bearer valid-token")
        .send(highlightData)
        .expect(201);

      expect(response.body).toEqual(createdHighlight);
    });

    it("should return 400 for missing bookmarkId", async () => {
      const response = await request(app)
        .post("/v1/highlights")
        .set("Authorization", "Bearer valid-token")
        .send({ text: "Important text" })
        .expect(400);

      expect(response.body).toMatchObject({
        error: "bookmarkId and text are required",
      });
    });

    it("should return 400 for missing text", async () => {
      const response = await request(app)
        .post("/v1/highlights")
        .set("Authorization", "Bearer valid-token")
        .send({ bookmarkId: 1 })
        .expect(400);

      expect(response.body).toMatchObject({
        error: "bookmarkId and text are required",
      });
    });

    it("should return 400 for invalid bookmarkId", async () => {
      const response = await request(app)
        .post("/v1/highlights")
        .set("Authorization", "Bearer valid-token")
        .send({ bookmarkId: "abc", text: "Important text" })
        .expect(400);

      expect(response.body).toMatchObject({ error: "Invalid bookmarkId" });
    });

    it("should return 404 for non-existent bookmark", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post("/v1/highlights")
        .set("Authorization", "Bearer valid-token")
        .send({ bookmarkId: 999, text: "Important text" })
        .expect(404);

      expect(response.body).toMatchObject({ error: "Bookmark not found" });
    });
  });

  describe("PUT /v1/highlights/:id", () => {
    it("should update highlight successfully", async () => {
      const updateData = { color: "#FF0000", annotation_md: "Updated insight" };
      const updatedHighlight = { ...mockHighlights[0], ...updateData };

      mockPool.query.mockResolvedValueOnce({ rows: [updatedHighlight] });

      const response = await request(app)
        .put("/v1/highlights/1")
        .set("Authorization", "Bearer valid-token")
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        ...updatedHighlight,
        created_at: expect.any(String),
      });
    });

    it("should return 400 for invalid highlight ID", async () => {
      const response = await request(app)
        .put("/v1/highlights/abc")
        .set("Authorization", "Bearer valid-token")
        .send({ color: "#FF0000" })
        .expect(400);

      expect(response.body).toMatchObject({ error: "Invalid highlight ID" });
    });

    it("should return 400 for no fields to update", async () => {
      const response = await request(app)
        .put("/v1/highlights/1")
        .set("Authorization", "Bearer valid-token")
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        error: "At least one of color or annotation_md must be provided",
      });
    });

    it("should return 404 for non-existent highlight", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .put("/v1/highlights/999")
        .set("Authorization", "Bearer valid-token")
        .send({ color: "#FF0000" })
        .expect(404);

      expect(response.body).toMatchObject({ error: "Highlight not found" });
    });
  });

  describe("DELETE /v1/highlights/:id", () => {
    it("should delete highlight successfully", async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

      const response = await request(app)
        .delete("/v1/highlights/1")
        .set("Authorization", "Bearer valid-token")
        .expect(204);

      expect(response.status).toBe(204);
    });

    it("should return 400 for invalid highlight ID", async () => {
      const response = await request(app)
        .delete("/v1/highlights/abc")
        .set("Authorization", "Bearer valid-token")
        .expect(400);

      expect(response.body).toMatchObject({ error: "Invalid highlight ID" });
    });

    it("should return 404 for non-existent highlight", async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 0 });

      const response = await request(app)
        .delete("/v1/highlights/999")
        .set("Authorization", "Bearer valid-token")
        .expect(404);

      expect(response.body).toMatchObject({ error: "Highlight not found" });
    });
  });
});
