import request from "supertest";
import express from "express";
import authRouter from "../../../src/routes/auth";
import {
  mockUsers,
  mockAuthRequest,
} from "../../../../tests/fixtures/backend/mocks";
import pool from "../../../src/db";
import redisClient from "../../../src/redis";
import jwt from "jsonwebtoken";

// Get the mocked modules
const mockPool = pool as any;
const mockRedisClient = redisClient as any;
const mockJwt = jwt as any;

describe("Auth Routes", () => {
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use("/v1/auth", authRouter);
  });

  describe("POST /v1/auth/login", () => {
    it("should login successfully with valid credentials", async () => {
      // Mock successful user lookup and JWT signing
      mockPool.query.mockResolvedValueOnce({ rows: [mockUsers[0]] });
      mockJwt.sign
        .mockReturnValueOnce("access-token")
        .mockReturnValueOnce("refresh-token");

      const response = await request(app)
        .post("/v1/auth/login")
        .send(mockAuthRequest)
        .expect(200);

      expect(response.body).toMatchObject({
        user: expect.any(Object),
        token: expect.any(String),
      });
      expect(response.body.user.email).toBe(mockAuthRequest.email);
    });

    it("should return 400 for missing email", async () => {
      const response = await request(app)
        .post("/v1/auth/login")
        .send({ password: "password123" })
        .expect(400);

      expect(response.body).toMatchObject({
        error: "Bad Request",
        message: "Email and password are required",
      });
    });

    it("should return 400 for missing password", async () => {
      const response = await request(app)
        .post("/v1/auth/login")
        .send({ email: "test@example.com" })
        .expect(400);

      expect(response.body).toMatchObject({
        error: "Bad Request",
        message: "Email and password are required",
      });
    });

    it("should return 500 for database error", async () => {
      mockPool.query.mockRejectedValueOnce(
        new Error("Database connection failed")
      );

      const response = await request(app)
        .post("/v1/auth/login")
        .send(mockAuthRequest)
        .expect(500);

      expect(response.body).toMatchObject({
        error: "Internal Server Error",
        message: "Database error",
      });
    });
  });

  describe("POST /v1/auth/refresh", () => {
    it("should refresh token successfully", async () => {
      const refreshToken = "valid-refresh-token";
      const decoded = { userId: 1 };

      mockJwt.verify.mockImplementationOnce(
        (
          token: string,
          secret: string,
          callback: (err: any, decoded: any) => void
        ) => {
          callback(null, decoded);
        }
      );
      mockJwt.sign.mockReturnValueOnce("new-access-token");

      const response = await request(app)
        .post("/v1/auth/refresh")
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toMatchObject({
        token: "new-access-token",
      });
    });

    it("should return 400 for missing refresh token", async () => {
      const response = await request(app)
        .post("/v1/auth/refresh")
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        error: "Bad Request",
        message: "Refresh token is required",
      });
    });

    it("should return 401 for invalid refresh token", async () => {
      mockJwt.verify.mockImplementationOnce(
        (
          token: string,
          secret: string,
          callback: (err: any, decoded: any) => void
        ) => {
          callback(new Error("Invalid token"), null);
        }
      );

      const response = await request(app)
        .post("/v1/auth/refresh")
        .send({ refreshToken: "invalid-token" })
        .expect(401);

      expect(response.body).toMatchObject({
        error: "Unauthorized",
        message: "Invalid refresh token",
      });
    });
  });

  describe("GET /v1/auth/user", () => {
    it("should return user info for authenticated request", async () => {
      const token = "valid-token";
      const decoded = { userId: 1 };

      mockJwt.verify.mockImplementationOnce(
        (
          token: string,
          secret: string,
          callback: (err: any, decoded: any) => void
        ) => {
          callback(null, decoded);
        }
      );

      const response = await request(app)
        .get("/v1/auth/user")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: 1,
        email: "test@example.com",
        name: "Test User",
        plan: "free",
      });
    });

    it("should return 401 for missing authorization header", async () => {
      const response = await request(app).get("/v1/auth/user").expect(401);

      expect(response.body).toMatchObject({
        error: "Unauthorized",
        message: "No token provided",
      });
    });

    it("should return 401 for invalid token", async () => {
      const token = "invalid-token";

      mockJwt.verify.mockImplementationOnce(
        (
          token: string,
          secret: string,
          callback: (err: any, decoded: any) => void
        ) => {
          callback(new Error("Invalid token"), null);
        }
      );

      const response = await request(app)
        .get("/v1/auth/user")
        .set("Authorization", `Bearer ${token}`)
        .expect(403);

      expect(response.body).toMatchObject({
        error: "Forbidden",
        message: "Invalid token",
      });
    });
  });
});
