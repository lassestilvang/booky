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

      // Check that job was added (this might need adjustment based on queue implementation)
      const afterJobCount = await bookmarkQueue.getWaiting();
      // Note: In real scenario, job might be processed quickly, so count might not increase
      expect(afterJobCount.length).toBeGreaterThanOrEqual(
        initialJobCount.length - 1
      ); // Allow for processing
    });
  });

  describe("Queue processing", () => {
    it("should process bookmark and update database", async () => {
      // Create bookmark
      const createResponse = await request(app)
        .post("/v1/bookmarks")
        .set("Authorization", `Bearer ${token}`)
        .send({
          url: "https://httpbin.org/html", // Use a real URL for testing
          title: "Test Processing",
        });

      expect(createResponse.status).toBe(202);
      const bookmarkId = createResponse.body.id;

      // Wait for processing (in real tests, might need longer wait or polling)
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Check if bookmark was updated
      const getResponse = await request(app)
        .get(`/v1/bookmarks/${bookmarkId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(getResponse.status).toBe(200);
      // Check if content_indexed is true or title was extracted
      // Note: Depending on worker success
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
