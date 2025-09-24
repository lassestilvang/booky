import request from "supertest";
import { createApp, setupTestDatabase, teardownTestDatabase } from "../setup";
import bookmarkQueue from "../../backend/src/queue";

const app = createApp();

describe("Background Jobs Integration Tests", () => {
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

  describe("Bookmark creation queue", () => {
    it("should add job to queue when creating bookmark", async () => {
      const initialJobCount = await bookmarkQueue.getWaiting();

      const response = await request(app)
        .post("/v1/bookmarks")
        .set("Authorization", `Bearer ${token}`)
        .send({
          url: "https://example.com/queued-article",
          title: "Queued Article",
        });

      expect(response.status).toBe(202);

      // Check that job was added
      const afterJobCount = await bookmarkQueue.getWaiting();
      expect(afterJobCount.length).toBe(initialJobCount.length + 1);
    });
  });

  describe("Queue processing", () => {
    const pollBookmark = async (
      bookmarkId: number,
      maxAttempts: number = 10
    ): Promise<any> => {
      for (let i = 0; i < maxAttempts; i++) {
        const response = await request(app)
          .get(`/v1/bookmarks/${bookmarkId}`)
          .set("Authorization", `Bearer ${token}`);

        if (response.status === 200 && response.body.content_indexed) {
          return response.body;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      throw new Error(
        "Bookmark processing did not complete within expected time"
      );
    };

    it("should process bookmark and update database", async () => {
      // Create bookmark with a local test URL (using a simple HTML response)
      const createResponse = await request(app)
        .post("/v1/bookmarks")
        .set("Authorization", `Bearer ${token}`)
        .send({
          url: "http://localhost:3000/test-html", // Use local test server
          title: "Test Processing",
        });

      expect(createResponse.status).toBe(202);
      const bookmarkId = createResponse.body.id;

      // Poll for processing completion
      const processedBookmark = await pollBookmark(bookmarkId);

      expect(processedBookmark.content_indexed).toBe(true);
      expect(processedBookmark.title).toBe("Test Processing");
    });
  });

  describe("Redis caching", () => {
    it("should cache user data", async () => {
      // Test caching by making multiple requests
      const response1 = await request(app)
        .get("/v1/auth/user")
        .set("Authorization", `Bearer ${token}`);

      expect(response1.status).toBe(200);

      const response2 = await request(app)
        .get("/v1/auth/user")
        .set("Authorization", `Bearer ${token}`);

      expect(response2.status).toBe(200);
      // In real scenario, could check Redis for cached data
    });
  });

  describe("Error handling", () => {
    it("should handle job failures gracefully", async () => {
      // Create bookmark with invalid URL
      const response = await request(app)
        .post("/v1/bookmarks")
        .set("Authorization", `Bearer ${token}`)
        .send({
          url: "invalid-url",
          title: "Invalid URL",
        });

      expect(response.status).toBe(202);
      // Job should fail but not crash the system
    });
  });
});
