import request from "supertest";
import express from "express";
import collectionsRouter from "../../../src/routes/collections";
import {
  mockCollections,
  mockUsers,
} from "../../../../tests/fixtures/backend/mocks";
import pool from "../../../src/db";
import jwt from "jsonwebtoken";

const mockPool = pool as any;
const mockJwt = jwt as any;

describe("Collections Routes", () => {
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
    app.use("/v1/collections", collectionsRouter);
  });

  describe("GET /v1/collections", () => {
    it("should list collections successfully", async () => {
      const collectionsWithRole = mockCollections.map((c) => ({
        ...c,
        role: "owner",
      }));
      mockPool.query.mockResolvedValueOnce({ rows: collectionsWithRole });

      const response = await request(app)
        .get("/v1/collections")
        .set("Authorization", "Bearer valid-token")
        .expect(200);

      expect(response.body).toEqual(
        collectionsWithRole.map((collection) => ({
          ...collection,
          created_at: expect.any(String),
          updated_at: expect.any(String),
        }))
      );
    });

    it("should return 500 for database error", async () => {
      mockPool.query.mockRejectedValueOnce(new Error("Database error"));

      const response = await request(app)
        .get("/v1/collections")
        .set("Authorization", "Bearer valid-token")
        .expect(500);

      expect(response.body).toMatchObject({ error: "Internal server error" });
    });
  });

  describe("POST /v1/collections", () => {
    it("should create collection successfully", async () => {
      const collectionData = { title: "New Collection", icon: "📁" };
      const createdCollection = {
        id: 3,
        ...collectionData,
        owner_id: 1,
        role: "owner",
      };

      mockPool.query.mockResolvedValueOnce({ rows: [createdCollection] });

      const response = await request(app)
        .post("/v1/collections")
        .set("Authorization", "Bearer valid-token")
        .send(collectionData)
        .expect(201);

      expect(response.body).toEqual(createdCollection);
    });

    it("should return 400 for missing title", async () => {
      const response = await request(app)
        .post("/v1/collections")
        .set("Authorization", "Bearer valid-token")
        .send({ icon: "📁" })
        .expect(400);

      expect(response.body).toMatchObject({
        error: "Title is required and must be a non-empty string",
      });
    });

    it("should return 400 for empty title", async () => {
      const response = await request(app)
        .post("/v1/collections")
        .set("Authorization", "Bearer valid-token")
        .send({ title: "" })
        .expect(400);

      expect(response.body).toMatchObject({
        error: "Title is required and must be a non-empty string",
      });
    });
  });

  describe("GET /v1/collections/:id", () => {
    it("should get single collection successfully", async () => {
      const collection = { ...mockCollections[0], role: "owner" };
      mockPool.query.mockResolvedValueOnce({ rows: [collection] });

      const response = await request(app)
        .get("/v1/collections/1")
        .set("Authorization", "Bearer valid-token")
        .expect(200);

      expect(response.body).toEqual({
        ...collection,
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });
    });

    it("should return 400 for invalid collection ID", async () => {
      const response = await request(app)
        .get("/v1/collections/abc")
        .set("Authorization", "Bearer valid-token")
        .expect(400);

      expect(response.body).toMatchObject({ error: "Invalid collection ID" });
    });

    it("should return 404 for non-existent collection", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get("/v1/collections/999")
        .set("Authorization", "Bearer valid-token")
        .expect(404);

      expect(response.body).toMatchObject({
        error: "Collection not found or access denied",
      });
    });
  });

  describe("PUT /v1/collections/:id", () => {
    it("should update collection successfully", async () => {
      const updateData = { title: "Updated Title", icon: "📚" };
      const updatedCollection = {
        ...mockCollections[0],
        ...updateData,
        role: "owner",
      };

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ owner_id: 1, role: "owner" }] })
        .mockResolvedValueOnce({ rows: [updatedCollection] });

      const response = await request(app)
        .put("/v1/collections/1")
        .set("Authorization", "Bearer valid-token")
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        ...updatedCollection,
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });
    });

    it("should return 403 for insufficient permissions", async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ owner_id: 1, role: "viewer" }],
      });

      const response = await request(app)
        .put("/v1/collections/1")
        .set("Authorization", "Bearer valid-token")
        .send({ title: "New Title" })
        .expect(403);

      expect(response.body).toMatchObject({
        error: "Insufficient permissions",
      });
    });

    it("should return 400 for empty title update", async () => {
      const response = await request(app)
        .put("/v1/collections/1")
        .set("Authorization", "Bearer valid-token")
        .send({ title: "" })
        .expect(400);

      expect(response.body).toMatchObject({
        error: "Title must be a non-empty string",
      });
    });
  });

  describe("DELETE /v1/collections/:id", () => {
    it("should delete collection successfully", async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

      const response = await request(app)
        .delete("/v1/collections/1")
        .set("Authorization", "Bearer valid-token")
        .expect(204);

      expect(response.status).toBe(204);
    });

    it("should return 404 for non-existent collection", async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 0 });

      const response = await request(app)
        .delete("/v1/collections/999")
        .set("Authorization", "Bearer valid-token")
        .expect(404);

      expect(response.body).toMatchObject({
        error: "Collection not found or not owned by user",
      });
    });
  });

  describe("POST /v1/collections/:id/share", () => {
    it("should share collection successfully", async () => {
      const shareData = { email: "user@example.com", role: "viewer" };

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Check ownership
        .mockResolvedValueOnce({ rows: [{ id: 2, email: "user@example.com" }] }) // Find user
        .mockResolvedValueOnce({}); // Insert permission

      const response = await request(app)
        .post("/v1/collections/1/share")
        .set("Authorization", "Bearer valid-token")
        .send(shareData)
        .expect(201);

      expect(response.body).toMatchObject({
        message: "Collection shared successfully",
      });
    });

    it("should return 400 for invalid role", async () => {
      const shareData = { email: "user@example.com", role: "invalid" };

      const response = await request(app)
        .post("/v1/collections/1/share")
        .set("Authorization", "Bearer valid-token")
        .send(shareData)
        .expect(400);

      expect(response.body).toMatchObject({
        error: "Role must be 'viewer' or 'editor'",
      });
    });

    it("should return 404 for non-existent user", async () => {
      const shareData = { email: "nonexistent@example.com", role: "viewer" };

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Check ownership
        .mockResolvedValueOnce({ rows: [] }); // User not found

      const response = await request(app)
        .post("/v1/collections/1/share")
        .set("Authorization", "Bearer valid-token")
        .send(shareData)
        .expect(404);

      expect(response.body).toMatchObject({ error: "User not found" });
    });
  });

  describe("GET /v1/collections/:id/permissions", () => {
    it("should get permissions successfully", async () => {
      const permissions = [
        { id: 1, email: "owner@example.com", name: "Owner", role: "owner" },
        { id: 2, email: "viewer@example.com", name: "Viewer", role: "viewer" },
      ];

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Check ownership
        .mockResolvedValueOnce({ rows: permissions });

      const response = await request(app)
        .get("/v1/collections/1/permissions")
        .set("Authorization", "Bearer valid-token")
        .expect(200);

      expect(response.body).toEqual(permissions);
    });
  });
});
