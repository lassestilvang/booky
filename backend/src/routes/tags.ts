import express from "express";
import { authenticateToken, AuthRequest } from "../auth";
import pool from "../db";

const router = express.Router();

// GET /v1/tags - list user's tags with usage count
router.get(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: express.Response) => {
    const ownerId = req.user!.id;

    try {
      const result = await pool.query(
        `SELECT t.id, t.name, COUNT(bt.bookmark_id) as usage_count
         FROM tags t
         LEFT JOIN bookmark_tags bt ON t.id = bt.tag_id
         WHERE t.owner_id = $1
         GROUP BY t.id, t.name
         ORDER BY t.name`,
        [ownerId]
      );

      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /v1/tags - create new tag
router.post(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: express.Response) => {
    const { name } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "Tag name is required" });
    }

    const trimmedName = name.trim();
    const normalizedName = trimmedName.toLowerCase();
    const ownerId = req.user!.id;

    try {
      const result = await pool.query(
        `INSERT INTO tags (owner_id, name, normalized_name)
         VALUES ($1, $2, $3)
         RETURNING id, name`,
        [ownerId, trimmedName, normalizedName]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      if (error.code === "23505") {
        // unique violation
        return res.status(409).json({ error: "Tag name already exists" });
      }
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PUT /v1/tags/:id - update tag name
router.put(
  "/:id",
  authenticateToken,
  async (req: AuthRequest, res: express.Response) => {
    const tagId = parseInt(req.params.id);
    if (isNaN(tagId)) {
      return res.status(400).json({ error: "Invalid tag ID" });
    }

    const { name } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "Tag name is required" });
    }

    const trimmedName = name.trim();
    const normalizedName = trimmedName.toLowerCase();
    const ownerId = req.user!.id;

    try {
      const result = await pool.query(
        `UPDATE tags
         SET name = $1, normalized_name = $2
         WHERE id = $3 AND owner_id = $4
         RETURNING id, name`,
        [trimmedName, normalizedName, tagId, ownerId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Tag not found" });
      }

      res.json(result.rows[0]);
    } catch (error: any) {
      if (error.code === "23505") {
        // unique violation
        return res.status(409).json({ error: "Tag name already exists" });
      }
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// DELETE /v1/tags/:id - delete tag and remove from bookmarks
router.delete(
  "/:id",
  authenticateToken,
  async (req: AuthRequest, res: express.Response) => {
    const tagId = parseInt(req.params.id);
    if (isNaN(tagId)) {
      return res.status(400).json({ error: "Invalid tag ID" });
    }

    const ownerId = req.user!.id;

    try {
      const result = await pool.query(
        "DELETE FROM tags WHERE id = $1 AND owner_id = $2",
        [tagId, ownerId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Tag not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /v1/tags/merge - merge two tags
router.post(
  "/merge",
  authenticateToken,
  async (req: AuthRequest, res: express.Response) => {
    const { sourceTagId, targetTagId } = req.body;

    if (!sourceTagId || !targetTagId || sourceTagId === targetTagId) {
      return res
        .status(400)
        .json({
          error:
            "Valid source and target tag IDs required, and they must be different",
        });
    }

    const ownerId = req.user!.id;

    try {
      // Check if both tags exist and belong to user
      const tagsResult = await pool.query(
        "SELECT id FROM tags WHERE id IN ($1, $2) AND owner_id = $3",
        [sourceTagId, targetTagId, ownerId]
      );

      if (tagsResult.rows.length !== 2) {
        return res.status(404).json({ error: "One or both tags not found" });
      }

      // Get all bookmark_ids that have the source tag
      const bookmarkIdsResult = await pool.query(
        "SELECT bookmark_id FROM bookmark_tags WHERE tag_id = $1",
        [sourceTagId]
      );

      const bookmarkIds = bookmarkIdsResult.rows.map((row) => row.bookmark_id);

      // Add target tag to all these bookmarks, ignoring conflicts
      if (bookmarkIds.length > 0) {
        const values = bookmarkIds
          .map((id) => `(${id}, ${targetTagId})`)
          .join(", ");
        await pool.query(
          `INSERT INTO bookmark_tags (bookmark_id, tag_id) VALUES ${values} ON CONFLICT DO NOTHING`
        );
      }

      // Remove source tag from all bookmarks
      await pool.query("DELETE FROM bookmark_tags WHERE tag_id = $1", [
        sourceTagId,
      ]);

      // Delete the source tag
      await pool.query("DELETE FROM tags WHERE id = $1", [sourceTagId]);

      res.json({ message: "Tags merged successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
