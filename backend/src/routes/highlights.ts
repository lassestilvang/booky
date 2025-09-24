import express from "express";
import { authenticateToken, AuthRequest } from "../auth";
import pool from "../db";

const router = express.Router();

// GET /v1/highlights/bookmarks/:bookmarkId/highlights
router.get(
  "/bookmarks/:bookmarkId/highlights",
  authenticateToken,
  async (req: AuthRequest, res: express.Response) => {
    const bookmarkId = parseInt(req.params.bookmarkId);
    if (isNaN(bookmarkId)) {
      return res.status(400).json({ error: "Invalid bookmark ID" });
    }

    try {
      // Check if bookmark exists and is owned by user
      const bookmarkResult = await pool.query(
        "SELECT id FROM bookmarks WHERE id = $1 AND owner_id = $2",
        [bookmarkId, req.user!.userId]
      );

      if (bookmarkResult.rows.length === 0) {
        return res.status(404).json({ error: "Bookmark not found" });
      }

      // Fetch highlights
      const highlightsResult = await pool.query(
        "SELECT id, bookmark_id, text_selected, color, annotation_md, position_context, created_at FROM highlights WHERE bookmark_id = $1 AND owner_id = $2 ORDER BY created_at",
        [bookmarkId, req.user!.userId]
      );

      res.json(highlightsResult.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /v1/highlights
router.post(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: express.Response) => {
    const { bookmarkId, text, color, annotation_md, position_context } =
      req.body;

    if (!bookmarkId || !text) {
      return res
        .status(400)
        .json({ error: "bookmarkId and text are required" });
    }

    const bookmarkIdNum = parseInt(bookmarkId);
    if (isNaN(bookmarkIdNum)) {
      return res.status(400).json({ error: "Invalid bookmarkId" });
    }

    try {
      // Check if bookmark exists and is owned by user
      const bookmarkResult = await pool.query(
        "SELECT id FROM bookmarks WHERE id = $1 AND owner_id = $2",
        [bookmarkIdNum, req.user!.userId]
      );

      if (bookmarkResult.rows.length === 0) {
        return res.status(404).json({ error: "Bookmark not found" });
      }

      // Insert highlight
      const result = await pool.query(
        `INSERT INTO highlights (bookmark_id, owner_id, text_selected, color, annotation_md, position_context)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, bookmark_id, text_selected, color, annotation_md, position_context, created_at`,
        [
          bookmarkIdNum,
          req.user!.userId,
          text,
          color || null,
          annotation_md || null,
          position_context || null,
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PUT /v1/highlights/:id
router.put(
  "/:id",
  authenticateToken,
  async (req: AuthRequest, res: express.Response) => {
    const highlightId = parseInt(req.params.id);
    if (isNaN(highlightId)) {
      return res.status(400).json({ error: "Invalid highlight ID" });
    }

    const { color, annotation_md } = req.body;

    if (color === undefined && annotation_md === undefined) {
      return res
        .status(400)
        .json({
          error: "At least one of color or annotation_md must be provided",
        });
    }

    try {
      const result = await pool.query(
        `UPDATE highlights
         SET color = COALESCE($1, color),
             annotation_md = COALESCE($2, annotation_md)
         WHERE id = $3 AND owner_id = $4
         RETURNING id, bookmark_id, text_selected, color, annotation_md, position_context, created_at`,
        [color, annotation_md, highlightId, req.user!.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Highlight not found" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// DELETE /v1/highlights/:id
router.delete(
  "/:id",
  authenticateToken,
  async (req: AuthRequest, res: express.Response) => {
    const highlightId = parseInt(req.params.id);
    if (isNaN(highlightId)) {
      return res.status(400).json({ error: "Invalid highlight ID" });
    }

    try {
      const result = await pool.query(
        "DELETE FROM highlights WHERE id = $1 AND owner_id = $2",
        [highlightId, req.user!.userId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Highlight not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
