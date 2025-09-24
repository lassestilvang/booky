import request from "supertest";
import express from "express";
import tagsRouter from "../../../src/routes/tags";
import { mockTags } from "../../../../tests/fixtures/backend/mocks";
import pool from "../../../src/db";
import jwt from "jsonwebtoken";

const mockPool = pool as any;
const mockJwt = jwt as any;

describe("Tags Routes", () => {
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
    app.use("/v1/tags", tagsRouter);
  });

  describe("GET /v1/tags", () => {
    it("should list tags with usage count successfully", async () => {
      const tagsWithCount = mockTags.map((tag) => ({
        ...tag,
        usage_count: 5,
      }));

      mockPool.query.mockResolvedValueOnce({ rows: tagsWithCount });

      const response = await request(app)
        .get("/v1/tags")
        .set("Authorization", "Bearer valid-token")
        .expect(200);

      expect(response.body).toEqual(tagsWithCount);
    });

    it("should return 500 for database error", async () => {
      mockPool.query.mockRejectedValueOnce(new Error("Database error"));

      const response = await request(app)
        .get("/v1/tags")
        .set("Authorization", "Bearer valid-token")
        .expect(500);

      expect(response.body).toMatchObject({
        error: "Internal server error",
      });
    });
  });

  describe("POST /v1/tags", () => {
    it("should create tag successfully", async () => {
      const tagData = { name: "New Tag" };
      const createdTag = { id: 3, name: "New Tag" };

      mockPool.query.mockResolvedValueOnce({ rows: [createdTag] });

      const response = await request(app)
        .post("/v1/tags")
        .set("Authorization", "Bearer valid-token")
        .send(tagData)
        .expect(201);

      expect(response.body).toEqual(createdTag);
    });

    it("should return 400 for missing name", async () => {
      const response = await request(app)
        .post("/v1/tags")
        .set("Authorization", "Bearer valid-token")
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        error: "Tag name is required",
      });
    });

    it("should return 400 for empty name", async () => {
      const response = await request(app)
        .post("/v1/tags")
        .set("Authorization", "Bearer valid-token")
        .send({ name: "" })
        .expect(400);

      expect(response.body).toMatchObject({
        error: "Tag name is required",
      });
    });

    it("should return 409 for duplicate tag name", async () => {
      mockPool.query.mockRejectedValueOnce({
        code: "23505", // unique violation
        message: "duplicate key value",
      });

      const response = await request(app)
        .post("/v1/tags")
        .set("Authorization", "Bearer valid-token")
        .send({ name: "React" })
        .expect(409);

      expect(response.body).toMatchObject({
        error: "Tag name already exists",
      });
    });
  });

  describe("PUT /v1/tags/:id", () => {
    it("should update tag successfully", async () => {
      const updateData = { name: "Updated Tag" };
      const updatedTag = { id: 1, name: "Updated Tag" };

      mockPool.query.mockResolvedValueOnce({ rows: [updatedTag] });

      const response = await request(app)
        .put("/v1/tags/1")
        .set("Authorization", "Bearer valid-token")
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual(updatedTag);
    });

    it("should return 400 for invalid tag ID", async () => {
      const response = await request(app)
        .put("/v1/tags/abc")
        .set("Authorization", "Bearer valid-token")
        .send({ name: "New Name" })
        .expect(400);

      expect(response.body).toMatchObject({
        error: "Invalid tag ID",
      });
    });

    it("should return 400 for missing name", async () => {
      const response = await request(app)
        .put("/v1/tags/1")
        .set("Authorization", "Bearer valid-token")
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        error: "Tag name is required",
      });
    });

    it("should return 404 for non-existent tag", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .put("/v1/tags/999")
        .set("Authorization", "Bearer valid-token")
        .send({ name: "New Name" })
        .expect(404);

      expect(response.body).toMatchObject({
        error: "Tag not found",
      });
    });

    it("should return 409 for duplicate tag name on update", async () => {
      mockPool.query.mockRejectedValueOnce({
        code: "23505",
        message: "duplicate key value",
      });

      const response = await request(app)
        .put("/v1/tags/1")
        .set("Authorization", "Bearer valid-token")
        .send({ name: "Existing Tag" })
        .expect(409);

      expect(response.body).toMatchObject({
        error: "Tag name already exists",
      });
    });
  });

  describe("DELETE /v1/tags/:id", () => {
    it("should delete tag successfully", async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

      const response = await request(app)
        .delete("/v1/tags/1")
        .set("Authorization", "Bearer valid-token")
        .expect(204);

      expect(response.status).toBe(204);
    });

    it("should return 400 for invalid tag ID", async () => {
      const response = await request(app)
        .delete("/v1/tags/abc")
        .set("Authorization", "Bearer valid-token")
        .expect(400);

      expect(response.body).toMatchObject({
        error: "Invalid tag ID",
      });
    });

    it("should return 404 for non-existent tag", async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 0 });

      const response = await request(app)
        .delete("/v1/tags/999")
        .set("Authorization", "Bearer valid-token")
        .expect(404);

      expect(response.body).toMatchObject({
        error: "Tag not found",
      });
    });
  });

  describe("POST /v1/tags/merge", () => {
    it("should merge tags successfully", async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 2 }] }) // Check tags exist
        .mockResolvedValueOnce({
          rows: [{ bookmark_id: 1 }, { bookmark_id: 2 }],
        }) // Get bookmark IDs
        .mockResolvedValueOnce({}) // Add target tag to bookmarks
        .mockResolvedValueOnce({}); // Delete source tag

      const response = await request(app)
        .post("/v1/tags/merge")
        .set("Authorization", "Bearer valid-token")
        .send({ sourceTagId: 1, targetTagId: 2 })
        .expect(200);

      expect(response.body).toMatchObject({
        message: "Tags merged successfully",
      });
    });

    it("should return 400 for missing sourceTagId", async () => {
      const response = await request(app)
        .post("/v1/tags/merge")
        .set("Authorization", "Bearer valid-token")
        .send({ targetTagId: 2 })
        .expect(400);

      expect(response.body).toMatchObject({
        error:
          "Valid source and target tag IDs required, and they must be different",
      });
    });

    it("should return 400 for same source and target", async () => {
      const response = await request(app)
        .post("/v1/tags/merge")
        .set("Authorization", "Bearer valid-token")
        .send({ sourceTagId: 1, targetTagId: 1 })
        .expect(400);

      expect(response.body).toMatchObject({
        error:
          "Valid source and target tag IDs required, and they must be different",
      });
    });

    it("should return 404 for non-existent tags", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Only one tag found

      const response = await request(app)
        .post("/v1/tags/merge")
        .set("Authorization", "Bearer valid-token")
        .send({ sourceTagId: 1, targetTagId: 999 })
        .expect(404);

      expect(response.body).toMatchObject({
        error: "One or both tags not found",
      });
    });
  });
});
