import express from "express";
import { authenticateToken, AuthRequest } from "../auth";
import pool from "../db";

const router = express.Router();

// GET /v1/collections
router.get(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: express.Response) => {
    try {
      const userId = req.user!.userId;

      const query = `
        SELECT c.*, 'owner' as role FROM collections c WHERE c.owner_id = $1
        UNION
        SELECT c.*, cp.role FROM collections c
        JOIN collection_permissions cp ON c.id = cp.collection_id
        WHERE cp.user_id = $1
        ORDER BY created_at DESC
      `;

      const result = await pool.query(query, [userId]);
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /v1/collections
router.post(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: express.Response) => {
    const { title, icon } = req.body;

    if (!title || typeof title !== "string" || title.trim() === "") {
      return res
        .status(400)
        .json({ error: "Title is required and must be a non-empty string" });
    }

    try {
      const userId = req.user!.userId;

      const result = await pool.query(
        `INSERT INTO collections (owner_id, title, icon, created_at, updated_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        [userId, title.trim(), icon || null]
      );

      const collection = result.rows[0];
      collection.role = "owner"; // Since it's owned

      res.status(201).json(collection);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /v1/collections/:id
router.get(
  "/:id",
  authenticateToken,
  async (req: AuthRequest, res: express.Response) => {
    const collectionId = parseInt(req.params.id);
    if (isNaN(collectionId)) {
      return res.status(400).json({ error: "Invalid collection ID" });
    }

    try {
      const userId = req.user!.userId;

      // Check access: owner or has permission
      const accessQuery = `
        SELECT c.*,
               CASE WHEN c.owner_id = $2 THEN 'owner' ELSE cp.role END as role
        FROM collections c
        LEFT JOIN collection_permissions cp ON c.id = cp.collection_id AND cp.user_id = $2
        WHERE c.id = $1 AND (c.owner_id = $2 OR cp.user_id IS NOT NULL)
      `;

      const result = await pool.query(accessQuery, [collectionId, userId]);

      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ error: "Collection not found or access denied" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PUT /v1/collections/:id
router.put(
  "/:id",
  authenticateToken,
  async (req: AuthRequest, res: express.Response) => {
    const collectionId = parseInt(req.params.id);
    if (isNaN(collectionId)) {
      return res.status(400).json({ error: "Invalid collection ID" });
    }

    const { title, icon } = req.body;

    if (
      title !== undefined &&
      (typeof title !== "string" || title.trim() === "")
    ) {
      return res
        .status(400)
        .json({ error: "Title must be a non-empty string" });
    }

    try {
      const userId = req.user!.userId;

      // Check access and role
      const accessQuery = `
        SELECT c.owner_id,
               CASE WHEN c.owner_id = $2 THEN 'owner' ELSE cp.role END as role
        FROM collections c
        LEFT JOIN collection_permissions cp ON c.id = cp.collection_id AND cp.user_id = $2
        WHERE c.id = $1 AND (c.owner_id = $2 OR cp.user_id IS NOT NULL)
      `;

      const accessResult = await pool.query(accessQuery, [
        collectionId,
        userId,
      ]);

      if (accessResult.rows.length === 0) {
        return res
          .status(404)
          .json({ error: "Collection not found or access denied" });
      }

      const role = accessResult.rows[0].role;
      if (role !== "owner" && role !== "editor") {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      // Update
      const updateFields = [];
      const params = [collectionId];
      let paramIndex = 2;

      if (title !== undefined) {
        updateFields.push(`title = $${paramIndex}`);
        params.push(title.trim());
        paramIndex++;
      }

      if (icon !== undefined) {
        updateFields.push(`icon = $${paramIndex}`);
        params.push(icon);
        paramIndex++;
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ error: "No fields to update" });
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      const updateQuery = `
        UPDATE collections
        SET ${updateFields.join(", ")}
        WHERE id = $1
        RETURNING *
      `;

      const result = await pool.query(updateQuery, params);
      const collection = result.rows[0];
      collection.role = role;

      res.json(collection);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// DELETE /v1/collections/:id
router.delete(
  "/:id",
  authenticateToken,
  async (req: AuthRequest, res: express.Response) => {
    const collectionId = parseInt(req.params.id);
    if (isNaN(collectionId)) {
      return res.status(400).json({ error: "Invalid collection ID" });
    }

    try {
      const userId = req.user!.userId;

      // Check if owner
      const result = await pool.query(
        "DELETE FROM collections WHERE id = $1 AND owner_id = $2",
        [collectionId, userId]
      );

      if (result.rowCount === 0) {
        return res
          .status(404)
          .json({ error: "Collection not found or not owned by user" });
      }

      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /v1/collections/:id/share
router.post(
  "/:id/share",
  authenticateToken,
  async (req: AuthRequest, res: express.Response) => {
    const collectionId = parseInt(req.params.id);
    if (isNaN(collectionId)) {
      return res.status(400).json({ error: "Invalid collection ID" });
    }

    const { email, userId: targetUserId, role } = req.body;

    if (!role || !["viewer", "editor"].includes(role)) {
      return res
        .status(400)
        .json({ error: "Role must be 'viewer' or 'editor'" });
    }

    if (!email && !targetUserId) {
      return res.status(400).json({ error: "Email or userId is required" });
    }

    try {
      const ownerId = req.user!.userId;

      // Check if owner
      const collectionResult = await pool.query(
        "SELECT id FROM collections WHERE id = $1 AND owner_id = $2",
        [collectionId, ownerId]
      );

      if (collectionResult.rows.length === 0) {
        return res
          .status(404)
          .json({ error: "Collection not found or not owned by user" });
      }

      // Find target user
      let targetUser;
      if (targetUserId) {
        const userResult = await pool.query(
          "SELECT id, email FROM users WHERE id = $1",
          [targetUserId]
        );
        targetUser = userResult.rows[0];
      } else {
        const userResult = await pool.query(
          "SELECT id, email FROM users WHERE email = $1",
          [email]
        );
        targetUser = userResult.rows[0];
      }

      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      if (targetUser.id === ownerId) {
        return res.status(400).json({ error: "Cannot share with yourself" });
      }

      // Insert permission
      await pool.query(
        `INSERT INTO collection_permissions (collection_id, user_id, role)
         VALUES ($1, $2, $3)
         ON CONFLICT (collection_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
        [collectionId, targetUser.id, role]
      );

      res.status(201).json({ message: "Collection shared successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /v1/collections/:id/permissions
router.get(
  "/:id/permissions",
  authenticateToken,
  async (req: AuthRequest, res: express.Response) => {
    const collectionId = parseInt(req.params.id);
    if (isNaN(collectionId)) {
      return res.status(400).json({ error: "Invalid collection ID" });
    }

    try {
      const userId = req.user!.userId;

      // Check if owner
      const collectionResult = await pool.query(
        "SELECT id FROM collections WHERE id = $1 AND owner_id = $2",
        [collectionId, userId]
      );

      if (collectionResult.rows.length === 0) {
        return res.status(404).json({ error: "Collection not found or not owned by user" });
      }

      // Get permissions
      const permissionsQuery = `
        SELECT u.id, u.email, u.name, 'owner' as role
        FROM users u
        JOIN collections c ON u.id = c.owner_id
        WHERE c.id = $1
        UNION
        SELECT u.id, u.email, u.name, cp.role
        FROM users u
        JOIN collection_permissions cp ON u.id = cp.user_id
        WHERE cp.collection_id = $1
        ORDER BY role, email
      `;

      const result = await pool.query(permissionsQuery, [collectionId]);
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
