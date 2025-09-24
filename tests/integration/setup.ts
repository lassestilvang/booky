import express from "express";
import dotenv from "dotenv";
import pool from "../../backend/src/db";
import authRoutes from "../../backend/src/routes/auth";
import collectionsRoutes from "../../backend/src/routes/collections";
import bookmarksRoutes from "../../backend/src/routes/bookmarks";
import highlightsRoutes from "../../backend/src/routes/highlights";
import searchRoutes from "../../backend/src/routes/search";
import tagsRoutes from "../../backend/src/routes/tags";
import usersFixture from "../fixtures/backend/users.json";
import collectionsFixture from "../fixtures/backend/collections.json";
import bookmarksFixture from "../fixtures/backend/bookmarks.json";
import tagsFixture from "../fixtures/backend/tags.json";

dotenv.config({ path: "../../backend/.env.test" });

export const createApp = () => {
  const app = express();

  // Middleware
  app.use(express.json());

  // Routes
  app.use("/v1/auth", authRoutes);
  app.use("/v1/collections", collectionsRoutes);
  app.use("/v1/bookmarks", bookmarksRoutes);
  app.use("/v1/highlights", highlightsRoutes);
  app.use("/v1/search", searchRoutes);
  app.use("/v1/tags", tagsRoutes);

  // Error handling middleware
  app.use(
    (
      err: any,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      console.error(err.stack);
      res
        .status(500)
        .json({ error: "Internal Server Error", message: err.message });
    }
  );

  // 404 handler
  app.use((req: express.Request, res: express.Response) => {
    res.status(404).json({ error: "Not Found" });
  });

  return app;
};

export const clearDatabase = async () => {
  const tables = [
    "collection_permissions",
    "bookmark_tags",
    "highlights",
    "files",
    "backups",
    "bookmarks",
    "tags",
    "collections",
    "users",
  ];

  for (const table of tables) {
    await pool.query(`DELETE FROM ${table}`);
  }
};

export const seedDatabase = async () => {
  // Insert users
  for (const user of usersFixture) {
    await pool.query(
      `INSERT INTO users (id, email, password_hash, name, created_at, plan)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [
        user.id,
        user.email,
        user.password_hash,
        user.name,
        user.created_at,
        user.plan,
      ]
    );
  }

  // Insert collections
  for (const collection of collectionsFixture) {
    await pool.query(
      `INSERT INTO collections (id, owner_id, title, icon, is_public, share_slug, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [
        collection.id,
        collection.owner_id,
        collection.title,
        collection.icon,
        collection.is_public,
        collection.share_slug,
        collection.created_at,
        collection.updated_at,
      ]
    );
  }

  // Insert tags
  for (const tag of tagsFixture) {
    await pool.query(
      `INSERT INTO tags (id, owner_id, name, normalized_name)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING`,
      [tag.id, tag.owner_id, tag.name, tag.normalized_name]
    );
  }

  // Insert bookmarks
  for (const bookmark of bookmarksFixture) {
    await pool.query(
      `INSERT INTO bookmarks (id, owner_id, collection_id, title, url, excerpt, content_snapshot_path, content_indexed, type, domain, cover_url, is_duplicate, is_broken, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       ON CONFLICT (id) DO NOTHING`,
      [
        bookmark.id,
        bookmark.owner_id,
        bookmark.collection_id,
        bookmark.title,
        bookmark.url,
        bookmark.excerpt,
        bookmark.content_snapshot_path,
        bookmark.content_indexed,
        bookmark.type,
        bookmark.domain,
        bookmark.cover_url,
        bookmark.is_duplicate,
        bookmark.is_broken,
        bookmark.created_at,
        bookmark.updated_at,
      ]
    );
  }

  // Insert bookmark_tags if any
  // Assuming fixtures have bookmark_tags, but not shown, so skip for now
};

export const setupTestDatabase = async () => {
  await clearDatabase();
  await seedDatabase();
};

export const teardownTestDatabase = async () => {
  await clearDatabase();
  await pool.end();
};
