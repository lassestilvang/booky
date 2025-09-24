import express from "express";
import { authenticateToken, AuthRequest } from "../auth";
import pool from "../db";
import bookmarkQueue from "../queue";

const router = express.Router();

// POST /v1/bookmarks
router.post(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: express.Response) => {
    const { url, collectionId, tags, notes } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      const domain = new URL(url).hostname;

      const result = await pool.query(
        `INSERT INTO bookmarks (owner_id, collection_id, url, excerpt, domain)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [req.user!.id, collectionId || null, url, notes || null, domain]
      );

      const bookmarkId = result.rows[0].id;

      // Add job to queue
      await bookmarkQueue.add("process-bookmark", { bookmarkId });

      res.status(202).json({ id: bookmarkId });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /v1/bookmarks
router.get(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: express.Response) => {
    const { collection, tags, q, view, limit = 20, offset = 0 } = req.query;
    const ownerId = req.user!.id;

    let query = `SELECT * FROM bookmarks WHERE owner_id = $${1}`;
    let params: any[] = [ownerId];
    let paramIndex = 2;

    if (collection) {
      query += ` AND collection_id = $${paramIndex}`;
      params.push(parseInt(collection as string));
      paramIndex++;
    }

    if (q) {
      query += ` AND to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(excerpt, '')) @@ plainto_tsquery('english', $${paramIndex})`;
      params.push(q);
      paramIndex++;
    }

    if (tags) {
      const tagArray = (tags as string).split(",").map((t) => t.trim());
      query += ` AND id IN (SELECT bt.bookmark_id FROM bookmark_tags bt JOIN tags t ON bt.tag_id = t.id WHERE t.name = ANY($${paramIndex}) AND t.owner_id = $${
        paramIndex + 1
      })`;
      params.push(tagArray, ownerId);
      paramIndex += 2;
    }

    let orderBy = "created_at DESC";
    if (view === "oldest") {
      orderBy = "created_at ASC";
    } else if (view === "updated") {
      orderBy = "updated_at DESC";
    }

    query += ` ORDER BY ${orderBy} LIMIT $${paramIndex} OFFSET $${
      paramIndex + 1
    }`;
    params.push(
      parseInt(limit as string) || 20,
      parseInt(offset as string) || 0
    );

    try {
      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /v1/bookmarks/:id
router.get(
  "/:id",
  authenticateToken,
  async (req: AuthRequest, res: express.Response) => {
    const bookmarkId = parseInt(req.params.id);
    if (isNaN(bookmarkId)) {
      return res.status(400).json({ error: "Invalid bookmark ID" });
    }

    try {
      // Fetch bookmark
      const bookmarkResult = await pool.query(
        "SELECT * FROM bookmarks WHERE id = $1 AND owner_id = $2",
        [bookmarkId, req.user!.id]
      );

      if (bookmarkResult.rows.length === 0) {
        return res.status(404).json({ error: "Bookmark not found" });
      }

      const bookmark = bookmarkResult.rows[0];

      // Fetch highlights
      const highlightsResult = await pool.query(
        "SELECT * FROM highlights WHERE bookmark_id = $1 AND owner_id = $2 ORDER BY created_at",
        [bookmarkId, req.user!.id]
      );

      const highlights = highlightsResult.rows;

      res.json({ ...bookmark, highlights });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PUT /v1/bookmarks/:id
router.put(
  "/:id",
  authenticateToken,
  async (req: AuthRequest, res: express.Response) => {
    const bookmarkId = parseInt(req.params.id);
    if (isNaN(bookmarkId)) {
      return res.status(400).json({ error: "Invalid bookmark ID" });
    }

    const { title, excerpt, collection_id } = req.body;

    try {
      const result = await pool.query(
        `UPDATE bookmarks
         SET title = COALESCE($1, title),
             excerpt = COALESCE($2, excerpt),
             collection_id = COALESCE($3, collection_id),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4 AND owner_id = $5
         RETURNING *`,
        [title, excerpt, collection_id, bookmarkId, req.user!.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Bookmark not found" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// DELETE /v1/bookmarks/:id
router.delete(
  "/:id",
  authenticateToken,
  async (req: AuthRequest, res: express.Response) => {
    const bookmarkId = parseInt(req.params.id);
    if (isNaN(bookmarkId)) {
      return res.status(400).json({ error: "Invalid bookmark ID" });
    }

    try {
      const result = await pool.query(
        "DELETE FROM bookmarks WHERE id = $1 AND owner_id = $2",
        [bookmarkId, req.user!.id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Bookmark not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /v1/bookmarks/bulk
router.post(
  "/bulk",
  authenticateToken,
  async (req: AuthRequest, res: express.Response) => {
    const { action, bookmark_ids, tags, collection_id } = req.body;

    if (!action || !bookmark_ids || !Array.isArray(bookmark_ids)) {
      return res.status(400).json({ error: "Invalid request" });
    }

    const ownerId = req.user!.id;

    try {
      if (action === "move") {
        if (!collection_id) {
          return res
            .status(400)
            .json({ error: "collection_id required for move" });
        }

        const result = await pool.query(
          "UPDATE bookmarks SET collection_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = ANY($2) AND owner_id = $3",
          [collection_id, bookmark_ids, ownerId]
        );

        res.json({ updated: result.rowCount });
      } else if (action === "add_tags") {
        if (!tags || !Array.isArray(tags)) {
          return res.status(400).json({ error: "tags required for add_tags" });
        }

        // Get tag ids
        const tagResult = await pool.query(
          "SELECT id, name FROM tags WHERE name = ANY($1) AND owner_id = $2",
          [tags, ownerId]
        );

        const tagMap = new Map(tagResult.rows.map((t) => [t.name, t.id]));

        // For each bookmark and tag, insert if not exists
        for (const bookmarkId of bookmark_ids) {
          for (const tagName of tags) {
            const tagId = tagMap.get(tagName);
            if (tagId) {
              await pool.query(
                "INSERT INTO bookmark_tags (bookmark_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
                [bookmarkId, tagId]
              );
            }
          }
        }

        res.json({ message: "Tags added" });
      } else if (action === "remove_tags") {
        if (!tags || !Array.isArray(tags)) {
          return res
            .status(400)
            .json({ error: "tags required for remove_tags" });
        }

        // Get tag ids
        const tagResult = await pool.query(
          "SELECT id FROM tags WHERE name = ANY($1) AND owner_id = $2",
          [tags, ownerId]
        );

        const tagIds = tagResult.rows.map((t) => t.id);

        // Delete
        const result = await pool.query(
          "DELETE FROM bookmark_tags WHERE bookmark_id = ANY($1) AND tag_id = ANY($2)",
          [bookmark_ids, tagIds]
        );

        res.json({ removed: result.rowCount });
      } else {
        res.status(400).json({ error: "Invalid action" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /v1/collections/:collectionId/bookmarks
router.get(
  "/collections/:collectionId/bookmarks",
  authenticateToken,
  async (req: AuthRequest, res: express.Response) => {
    // TODO: Fetch bookmarks in collection
    res.json([]);
  }
);

// POST /v1/collections/:collectionId/bookmarks
router.post(
  "/collections/:collectionId/bookmarks",
  authenticateToken,
  async (req: AuthRequest, res: express.Response) => {
    // TODO: Create bookmark in collection
    res.status(201).json({});
  }
);

export default router;
