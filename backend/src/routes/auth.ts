import express from "express";
import jwt from "jsonwebtoken";
import pool from "../db";
import redisClient from "../redis";
import { authenticateToken, AuthRequest } from "../auth";

const router = express.Router();

// POST /v1/auth/login
router.post("/login", async (req: express.Request, res: express.Response) => {
  try {
    const { email, password } = req.body;

    // TODO: Validate input
    if (!email || !password) {
      return res
        .status(400)
        .json({
          error: "Bad Request",
          message: "Email and password are required",
        });
    }

    // TODO: Check user in database and verify password
    // For skeleton, assume user exists
    const user = { id: 1, email, name: "Test User" };

    // Generate tokens
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: "7d" }
    );

    // TODO: Store refresh token in Redis

    res.json({ user, token });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /v1/auth/refresh
router.post("/refresh", async (req: express.Request, res: express.Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res
        .status(400)
        .json({ error: "Bad Request", message: "Refresh token is required" });
    }

    // TODO: Verify refresh token and check in Redis
    jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET!,
      (err: any, decoded: any) => {
        if (err) {
          return res
            .status(401)
            .json({ error: "Unauthorized", message: "Invalid refresh token" });
        }

        const newToken = jwt.sign(
          { userId: decoded.userId },
          process.env.JWT_SECRET!,
          { expiresIn: "1h" }
        );
        res.json({ token: newToken });
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /v1/user
router.get(
  "/user",
  authenticateToken,
  async (req: AuthRequest, res: express.Response) => {
    try {
      // TODO: Fetch user from database
      const user = {
        id: req.user.userId,
        email: "test@example.com",
        name: "Test User",
        created_at: new Date(),
        plan: "free",
      };
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

export default router;
