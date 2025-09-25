import db from "./db";

async function migrate() {
  try {
    console.log("Starting database migration...");

    // Create users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          name VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          plan VARCHAR(50) DEFAULT 'free'
      );
    `);
    console.log("✓ Created users table");

    // Create indexes for users
    await db.query(
      `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`
    );
    console.log("✓ Created users indexes");

    // Create collections table
    await db.query(`
      CREATE TABLE IF NOT EXISTS collections (
          id SERIAL PRIMARY KEY,
          owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          icon VARCHAR(255),
          is_public BOOLEAN DEFAULT FALSE,
          share_slug VARCHAR(255) UNIQUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✓ Created collections table");

    // Create indexes for collections
    await db.query(
      `CREATE INDEX IF NOT EXISTS idx_collections_owner_id ON collections(owner_id);`
    );
    await db.query(
      `CREATE INDEX IF NOT EXISTS idx_collections_share_slug ON collections(share_slug);`
    );
    console.log("✓ Created collections indexes");

    // Create bookmarks table
    await db.query(`
      CREATE TABLE IF NOT EXISTS bookmarks (
          id SERIAL PRIMARY KEY,
          owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          collection_id INTEGER REFERENCES collections(id) ON DELETE CASCADE,
          title VARCHAR(500),
          url TEXT NOT NULL,
          excerpt TEXT,
          content_snapshot_path TEXT,
          content_indexed BOOLEAN DEFAULT FALSE,
          type VARCHAR(50),
          domain VARCHAR(255),
          cover_url TEXT,
          is_duplicate BOOLEAN DEFAULT FALSE,
          is_broken BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✓ Created bookmarks table");

    // Create indexes for bookmarks
    await db.query(
      `CREATE INDEX IF NOT EXISTS idx_bookmarks_owner_id ON bookmarks(owner_id);`
    );
    await db.query(
      `CREATE INDEX IF NOT EXISTS idx_bookmarks_collection_id ON bookmarks(collection_id);`
    );
    await db.query(
      `CREATE INDEX IF NOT EXISTS idx_bookmarks_url ON bookmarks(url);`
    );
    await db.query(
      `CREATE INDEX IF NOT EXISTS idx_bookmarks_domain ON bookmarks(domain);`
    );
    await db.query(
      `CREATE INDEX IF NOT EXISTS idx_bookmarks_fts ON bookmarks USING gin(to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(excerpt, '')));`
    );
    console.log("✓ Created bookmarks indexes");

    // Create tags table
    await db.query(`
      CREATE TABLE IF NOT EXISTS tags (
          id SERIAL PRIMARY KEY,
          owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(100) NOT NULL,
          normalized_name VARCHAR(100) NOT NULL,
          UNIQUE(owner_id, normalized_name)
      );
    `);
    console.log("✓ Created tags table");

    // Create indexes for tags
    await db.query(
      `CREATE INDEX IF NOT EXISTS idx_tags_owner_id ON tags(owner_id);`
    );
    await db.query(
      `CREATE INDEX IF NOT EXISTS idx_tags_normalized_name ON tags(normalized_name);`
    );
    console.log("✓ Created tags indexes");

    // Create bookmark_tags table
    await db.query(`
      CREATE TABLE IF NOT EXISTS bookmark_tags (
          bookmark_id INTEGER NOT NULL REFERENCES bookmarks(id) ON DELETE CASCADE,
          tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
          PRIMARY KEY (bookmark_id, tag_id)
      );
    `);
    console.log("✓ Created bookmark_tags table");

    // Create indexes for bookmark_tags
    await db.query(
      `CREATE INDEX IF NOT EXISTS idx_bookmark_tags_bookmark_id ON bookmark_tags(bookmark_id);`
    );
    await db.query(
      `CREATE INDEX IF NOT EXISTS idx_bookmark_tags_tag_id ON bookmark_tags(tag_id);`
    );
    console.log("✓ Created bookmark_tags indexes");

    // Create highlights table
    await db.query(`
      CREATE TABLE IF NOT EXISTS highlights (
          id SERIAL PRIMARY KEY,
          bookmark_id INTEGER NOT NULL REFERENCES bookmarks(id) ON DELETE CASCADE,
          owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          text_selected TEXT NOT NULL,
          color VARCHAR(7),
          annotation_md TEXT,
          position_context TEXT,
          snapshot_id INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✓ Created highlights table");

    // Create indexes for highlights
    await db.query(
      `CREATE INDEX IF NOT EXISTS idx_highlights_bookmark_id ON highlights(bookmark_id);`
    );
    await db.query(
      `CREATE INDEX IF NOT EXISTS idx_highlights_owner_id ON highlights(owner_id);`
    );
    console.log("✓ Created highlights indexes");

    // Create files table
    await db.query(`
      CREATE TABLE IF NOT EXISTS files (
          id SERIAL PRIMARY KEY,
          owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          bookmark_id INTEGER REFERENCES bookmarks(id) ON DELETE CASCADE,
          filename VARCHAR(255) NOT NULL,
          mime VARCHAR(100),
          size BIGINT,
          s3_path TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✓ Created files table");

    // Create indexes for files
    await db.query(
      `CREATE INDEX IF NOT EXISTS idx_files_owner_id ON files(owner_id);`
    );
    await db.query(
      `CREATE INDEX IF NOT EXISTS idx_files_bookmark_id ON files(bookmark_id);`
    );
    console.log("✓ Created files indexes");

    // Create backups table
    await db.query(`
      CREATE TABLE IF NOT EXISTS backups (
          id SERIAL PRIMARY KEY,
          owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          file_path TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          auto_generated BOOLEAN DEFAULT FALSE
      );
    `);
    console.log("✓ Created backups table");

    // Create indexes for backups
    await db.query(
      `CREATE INDEX IF NOT EXISTS idx_backups_owner_id ON backups(owner_id);`
    );
    console.log("✓ Created backups indexes");

    // Create permission_role enum
    await db.query(`DROP TYPE IF EXISTS permission_role;`);
    await db.query(
      `CREATE TYPE permission_role AS ENUM ('viewer', 'editor', 'owner');`
    );
    console.log("✓ Created permission_role enum");

    // Create collection_permissions table
    await db.query(`
      CREATE TABLE IF NOT EXISTS collection_permissions (
          id SERIAL PRIMARY KEY,
          collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          role permission_role NOT NULL DEFAULT 'viewer',
          UNIQUE(collection_id, user_id)
      );
    `);
    console.log("✓ Created collection_permissions table");

    // Create indexes for collection_permissions
    await db.query(
      `CREATE INDEX IF NOT EXISTS idx_collection_permissions_collection_id ON collection_permissions(collection_id);`
    );
    await db.query(
      `CREATE INDEX IF NOT EXISTS idx_collection_permissions_user_id ON collection_permissions(user_id);`
    );
    console.log("✓ Created collection_permissions indexes");

    console.log("Database migration completed successfully!");
  } catch (error) {
    console.error("Error during migration:", error);
    throw error;
  } finally {
    await db.end();
  }
}

migrate();
