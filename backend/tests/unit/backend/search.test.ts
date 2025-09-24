import request from "supertest";
import express from "express";
import searchRouter from "../../../src/routes/search";
import { mockSearchResults } from "../../../../tests/fixtures/backend/mocks";
import pool from "../../../src/db";
import meiliClient from "../../../src/meili";
import jwt from "jsonwebtoken";

const mockPool = pool as any;
const mockMeili = meiliClient as any;
const mockJwt = jwt as any;

describe("Search Routes", () => {
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
    app.use("/v1/search", searchRouter);
  });

  describe("GET /v1/search", () => {
    it("should search successfully with query", async () => {
      const mockMeiliResponse = {
        hits: [
          { id: 1, title: "React Hooks", tags: ["react"] },
          { id: 2, title: "TypeScript Guide", tags: ["typescript"] },
        ],
        estimatedTotalHits: 2,
      };

      mockMeili.index.mockReturnValue({
        search: jest.fn().mockResolvedValue(mockMeiliResponse),
      });

      mockPool.query.mockResolvedValueOnce({
        rows: mockSearchResults.map((r) => ({
          ...r,
          tags: JSON.stringify(r.tags),
        })),
      });

      const response = await request(app)
        .get("/v1/search?q=react")
        .set("Authorization", "Bearer valid-token")
        .expect(200);

      expect(response.body).toMatchObject({
        bookmarks: expect.any(Array),
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      expect(response.body.bookmarks).toHaveLength(2);
    });

    it("should handle fulltext search", async () => {
      const mockMeiliResponse = {
        hits: [{ id: 1, title: "React Hooks", content: "Full content" }],
        estimatedTotalHits: 1,
      };

      mockMeili.index.mockReturnValue({
        search: jest.fn().mockResolvedValue(mockMeiliResponse),
      });

      mockPool.query.mockResolvedValueOnce({
        rows: [mockSearchResults[0]],
      });

      const response = await request(app)
        .get("/v1/search?q=react&fulltext=true")
        .set("Authorization", "Bearer valid-token")
        .expect(200);

      expect(mockMeili.index().search).toHaveBeenCalledWith(
        "react",
        expect.objectContaining({
          attributesToSearchOn: ["title", "content"],
        })
      );
    });

    it("should filter by tags", async () => {
      const mockMeiliResponse = {
        hits: [{ id: 1, title: "React Hooks", tags: ["react"] }],
        estimatedTotalHits: 1,
      };

      mockMeili.index.mockReturnValue({
        search: jest.fn().mockResolvedValue(mockMeiliResponse),
      });

      mockPool.query.mockResolvedValueOnce({
        rows: [mockSearchResults[0]],
      });

      const response = await request(app)
        .get("/v1/search?q=react&tags=react,javascript")
        .set("Authorization", "Bearer valid-token")
        .expect(200);

      expect(mockMeili.index().search).toHaveBeenCalledWith(
        "react",
        expect.objectContaining({
          filter: expect.stringContaining("tags IN"),
        })
      );
    });

    it("should filter by type", async () => {
      const mockMeiliResponse = {
        hits: [{ id: 1, title: "React Article", type: "article" }],
        estimatedTotalHits: 1,
      };

      mockMeili.index.mockReturnValue({
        search: jest.fn().mockResolvedValue(mockMeiliResponse),
      });

      mockPool.query.mockResolvedValueOnce({
        rows: [mockSearchResults[0]],
      });

      const response = await request(app)
        .get("/v1/search?q=react&type=article")
        .set("Authorization", "Bearer valid-token")
        .expect(200);

      expect(mockMeili.index().search).toHaveBeenCalledWith(
        "react",
        expect.objectContaining({
          filter: expect.stringContaining('type = "article"'),
        })
      );
    });

    it("should filter by domain", async () => {
      const mockMeiliResponse = {
        hits: [{ id: 1, title: "React Article", domain: "example.com" }],
        estimatedTotalHits: 1,
      };

      mockMeili.index.mockReturnValue({
        search: jest.fn().mockResolvedValue(mockMeiliResponse),
      });

      mockPool.query.mockResolvedValueOnce({
        rows: [mockSearchResults[0]],
      });

      const response = await request(app)
        .get("/v1/search?q=react&domain=example.com")
        .set("Authorization", "Bearer valid-token")
        .expect(200);

      expect(mockMeili.index().search).toHaveBeenCalledWith(
        "react",
        expect.objectContaining({
          filter: expect.stringContaining('domain = "example.com"'),
        })
      );
    });

    it("should handle pagination", async () => {
      const mockMeiliResponse = {
        hits: [{ id: 1, title: "React Hooks" }],
        estimatedTotalHits: 1,
      };

      mockMeili.index.mockReturnValue({
        search: jest.fn().mockResolvedValue(mockMeiliResponse),
      });

      mockPool.query.mockResolvedValueOnce({
        rows: [mockSearchResults[0]],
      });

      const response = await request(app)
        .get("/v1/search?q=react&page=2&limit=10")
        .set("Authorization", "Bearer valid-token")
        .expect(200);

      expect(response.body).toMatchObject({
        page: 2,
        limit: 10,
      });

      expect(mockMeili.index().search).toHaveBeenCalledWith(
        "react",
        expect.objectContaining({
          page: 2,
          hitsPerPage: 10,
        })
      );
    });

    it("should return 400 for invalid pagination", async () => {
      const response = await request(app)
        .get("/v1/search?q=react&page=0&limit=150")
        .set("Authorization", "Bearer valid-token")
        .expect(400);

      expect(response.body).toMatchObject({
        error: "Invalid pagination parameters",
      });
    });

    it("should return empty results when no hits", async () => {
      const mockMeiliResponse = {
        hits: [],
        estimatedTotalHits: 0,
      };

      mockMeili.index.mockReturnValue({
        search: jest.fn().mockResolvedValue(mockMeiliResponse),
      });

      const response = await request(app)
        .get("/v1/search?q=nonexistent")
        .set("Authorization", "Bearer valid-token")
        .expect(200);

      expect(response.body).toMatchObject({
        bookmarks: [],
        total: 0,
        totalPages: 0,
      });
    });

    it("should return 500 for search error", async () => {
      mockMeili.index.mockReturnValue({
        search: jest.fn().mockRejectedValue(new Error("Search failed")),
      });

      const response = await request(app)
        .get("/v1/search?q=react")
        .set("Authorization", "Bearer valid-token")
        .expect(500);

      expect(response.body).toMatchObject({
        error: "Internal server error",
      });
    });
  });
});
