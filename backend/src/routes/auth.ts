import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import pool from "../db";
import redisClient from "../redis";
import { authenticateToken, AuthRequest } from "../auth";

// Validate environment variables
if (!process.env.JWT_REFRESH_SECRET) {
  throw new Error("JWT_REFRESH_SECRET environment variable is required");
}

const router = express.Router();

// POST /v1/auth/login
router.post("/login", async (req: express.Request, res: express.Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Email and password are required",
      });
    }

    // Check user in database
    const userResult = await pool.query(
      "SELECT id, email, password_hash, name FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      return res
        .status(401)
        .json({ error: "Unauthorized", message: "Invalid credentials" });
    }

    const user = userResult.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res
        .status(401)
        .json({ error: "Unauthorized", message: "Invalid credentials" });
    }

    // Generate tokens
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: "7d" }
    );

    // Store refresh token in Redis
    await redisClient.set(`refresh:${user.id}`, refreshToken, {
      EX: 7 * 24 * 60 * 60,
    }); // 7 days

    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
      refreshToken,
    });
  } catch (error) {
    console.error("Login error:", error);
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

    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET!
    ) as { userId: number };

    // Check if refresh token exists in Redis
    const storedToken = await redisClient.get(`refresh:${decoded.userId}`);
    if (!storedToken || storedToken !== refreshToken) {
      return res
        .status(401)
        .json({ error: "Unauthorized", message: "Invalid refresh token" });
    }

    // Generate new access token
    const newToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    );

    res.json({ token: newToken });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res
        .status(401)
        .json({ error: "Unauthorized", message: "Invalid refresh token" });
    }
    console.error("Refresh error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /v1/user
router.get(
  "/user",
  authenticateToken,
  async (req: AuthRequest, res: express.Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Fetch user from database
      const userResult = await pool.query(
        "SELECT id, email, name, created_at FROM users WHERE id = $1",
        [req.user.userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const user = userResult.rows[0];
      res.json({
        ...user,
        plan: "free", // Assuming default plan
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

export default router;
