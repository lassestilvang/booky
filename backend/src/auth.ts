import jwt, { VerifyErrors } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

interface UserPayload {
  userId: number;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}

// Validate environment variables
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ error: "Unauthorized", message: "No token provided" });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET!,
    (err: VerifyErrors | null, decoded: unknown) => {
      if (err) {
        return res
          .status(403)
          .json({ error: "Forbidden", message: "Invalid token" });
      }

      if (typeof decoded === 'object' && decoded !== null) {
        req.user = decoded as UserPayload;
      } else {
        return res
          .status(403)
          .json({ error: "Forbidden", message: "Invalid token payload" });
      }

      next();
    }
  );
};
