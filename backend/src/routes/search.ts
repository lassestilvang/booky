import express from "express";
import { authenticateToken, AuthRequest } from "../auth";
import meiliClient from "../meili";
import pool from "../db";

interface SearchQuery {
  q?: string;
  fulltext?: string; // boolean as string
  tags?: string;
  type?: string;
  domain?: string;
  date_from?: string;
  date_to?: string;
  page?: string;
  limit?: string;
}

interface Bookmark {
  id: number;
  owner_id: number;
  collection_id?: number;
  title?: string;
  url: string;
  excerpt?: string;
  content_snapshot_path?: string;
  content_indexed: boolean;
  type?: string;
  domain?: string;
  cover_url?: string;
  is_duplicate: boolean;
  is_broken: boolean;
  created_at: string;
  updated_at: string;
  tags: string[];
}

interface PaginatedBookmarks {
  bookmarks: Bookmark[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const router = express.Router();

// GET /v1/search
router.get(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: express.Response) => {
    try {
      const query: SearchQuery = req.query as any;
      const userId = req.user!.userId;

      // Parse parameters
      const searchQuery = query.q || "";
      const fulltext = query.fulltext === "true";
      const tags = query.tags ? query.tags.split(",").map((t) => t.trim()) : [];
      const type = query.type;
      const domain = query.domain;
      const dateFrom = query.date_from;
      const dateTo = query.date_to;
      const page = parseInt(query.page || "1", 10);
      const limit = Math.min(parseInt(query.limit || "20", 10), 100); // Max 100

      if (page < 1 || limit < 1) {
        return res.status(400).json({ error: "Invalid pagination parameters" });
      }

      // Build MeiliSearch filter
      const filters: string[] = [`owner_id = ${userId}`];

      if (tags.length > 0) {
        // Assuming tags are stored as array in MeiliSearch
        const tagFilters = tags.map((tag) => `tags IN ["${tag}"]`);
        filters.push(`(${tagFilters.join(" OR ")})`);
      }

      if (type) {
        filters.push(`type = "${type}"`);
      }

      if (domain) {
        filters.push(`domain = "${domain}"`);
      }

      if (dateFrom) {
        filters.push(`created_at >= ${dateFrom}`);
      }

      if (dateTo) {
        filters.push(`created_at <= ${dateTo}`);
      }

      const filterString = filters.join(" AND ");

      // Search in MeiliSearch
      const index = meiliClient.index("bookmarks");
      const searchOptions: any = {
        filter: filterString,
        page,
        hitsPerPage: limit,
      };

      if (fulltext) {
        // Full-text search on content
        searchOptions.attributesToSearchOn = ["title", "content"];
      } else {
        // Search only on title
        searchOptions.attributesToSearchOn = ["title"];
      }

      const searchResults = await index.search(searchQuery, searchOptions);

      // Get bookmark IDs from results
      const bookmarkIds = searchResults.hits.map((hit: any) => hit.id);

      if (bookmarkIds.length === 0) {
        return res.json({
          bookmarks: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        });
      }

      // Fetch full bookmark data from database with tags
      const placeholders = bookmarkIds.map((_, i) => `$${i + 1}`).join(",");
      const bookmarksQuery = `
        SELECT b.*,
               COALESCE(json_agg(t.name) FILTER (WHERE t.id IS NOT NULL), '[]') as tags
        FROM bookmarks b
        LEFT JOIN bookmark_tags bt ON b.id = bt.bookmark_id
        LEFT JOIN tags t ON bt.tag_id = t.id
        WHERE b.id IN (${placeholders})
        GROUP BY b.id
        ORDER BY array_position(ARRAY[${placeholders}], b.id::text)
      `;

      const bookmarksResult = await pool.query(bookmarksQuery, bookmarkIds);

      const bookmarks = bookmarksResult.rows.map((row) => ({
        ...row,
        tags: row.tags || [],
      }));

      const totalHits =
        searchResults.estimatedTotalHits || searchResults.hits.length;
      const totalPages = Math.ceil(totalHits / limit);

      const response: PaginatedBookmarks = {
        bookmarks,
        total: totalHits,
        page,
        limit,
        totalPages,
      };

      res.json(response);
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
