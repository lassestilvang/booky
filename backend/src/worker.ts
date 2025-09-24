import { Worker } from "bullmq";
import axios from "axios";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";
import pool from "./db";
import meiliClient from "./meili";

const worker = new Worker(
  "bookmark-processing",
  async (job) => {
    const { bookmarkId } = job.data;

    try {
      // Get bookmark from DB
      const bookmarkResult = await pool.query(
        "SELECT url FROM bookmarks WHERE id = $1",
        [bookmarkId]
      );

      if (bookmarkResult.rows.length === 0) {
        throw new Error("Bookmark not found");
      }

      const { url } = bookmarkResult.rows[0];

      // Validate URL
      try {
        new URL(url);
      } catch {
        throw new Error(`Invalid URL: ${url}`);
      }

      // Fetch HTML with size limit for performance
      const response = await axios.get(url, {
        timeout: 10000,
        maxContentLength: 5 * 1024 * 1024, // 5MB limit
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; BookyBot/1.0)",
        },
      });

      const html = response.data;
      const $ = cheerio.load(html);

      // Extract content
      const title = $("title").text().trim() || url;
      const bodyText = $("body").text().replace(/\s+/g, " ").trim();

      // Save snapshot
      const snapshotsDir = path.join(__dirname, "..", "snapshots");
      if (!fs.existsSync(snapshotsDir)) {
        fs.mkdirSync(snapshotsDir, { recursive: true });
      }

      const snapshotPath = path.join(snapshotsDir, `${bookmarkId}.html`);
      fs.writeFileSync(snapshotPath, html);

      // Get full bookmark data including tags
      const bookmarkDataResult = await pool.query(
        `SELECT b.*, COALESCE(json_agg(t.name) FILTER (WHERE t.id IS NOT NULL), '[]') as tags
         FROM bookmarks b
         LEFT JOIN bookmark_tags bt ON b.id = bt.bookmark_id
         LEFT JOIN tags t ON bt.tag_id = t.id
         WHERE b.id = $1
         GROUP BY b.id`,
        [bookmarkId]
      );

      if (bookmarkDataResult.rows.length === 0) {
        throw new Error("Bookmark data not found");
      }

      const bookmarkData = bookmarkDataResult.rows[0];

      // Index in MeiliSearch
      const index = meiliClient.index("bookmarks");
      await index.addDocuments([
        {
          id: bookmarkData.id,
          owner_id: bookmarkData.owner_id,
          collection_id: bookmarkData.collection_id,
          title: bookmarkData.title || title,
          content: bodyText,
          url: bookmarkData.url,
          type: bookmarkData.type,
          domain: bookmarkData.domain,
          tags: bookmarkData.tags || [],
          created_at: bookmarkData.created_at.toISOString(),
          updated_at: bookmarkData.updated_at.toISOString(),
        },
      ]);

      // Update bookmark in DB
      await pool.query(
        "UPDATE bookmarks SET title = $1, content_snapshot_path = $2, content_indexed = $3 WHERE id = $4",
        [title, snapshotPath, true, bookmarkId]
      );
    } catch (error) {
      console.error(`Error processing bookmark ${bookmarkId}:`, error);
      throw error;
    }
  },
  {
    connection: {
      host:
        process.env.REDIS_URL?.replace("redis://", "").split(":")[0] ||
        "localhost",
      port: parseInt(process.env.REDIS_URL?.split(":")[2] || "6379"),
    },
  }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

export default worker;
