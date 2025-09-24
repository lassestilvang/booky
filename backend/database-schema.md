# Database Schema for Booky Backend

## Overview

This document describes the PostgreSQL database schema for the Booky application. The schema supports user management, bookmark collections, tagging, highlighting, file attachments, backups, and sharing permissions.

## Tables

### users

Stores user account information.

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    plan VARCHAR(50) DEFAULT 'free'
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
```

### collections

Stores bookmark collections owned by users.

```sql
CREATE TABLE collections (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    icon VARCHAR(255),
    is_public BOOLEAN DEFAULT FALSE,
    share_slug VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_collections_owner_id ON collections(owner_id);
CREATE INDEX idx_collections_share_slug ON collections(share_slug);
```

### bookmarks

Stores individual bookmarks within collections.

```sql
CREATE TABLE bookmarks (
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

-- Indexes
CREATE INDEX idx_bookmarks_owner_id ON bookmarks(owner_id);
CREATE INDEX idx_bookmarks_collection_id ON bookmarks(collection_id);
CREATE INDEX idx_bookmarks_url ON bookmarks(url);
CREATE INDEX idx_bookmarks_domain ON bookmarks(domain);
-- Full-text search index on title and excerpt
CREATE INDEX idx_bookmarks_fts ON bookmarks USING gin(to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(excerpt, '')));
```

### tags

Stores tags for categorization.

```sql
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    normalized_name VARCHAR(100) NOT NULL,
    UNIQUE(owner_id, normalized_name)
);

-- Indexes
CREATE INDEX idx_tags_owner_id ON tags(owner_id);
CREATE INDEX idx_tags_normalized_name ON tags(normalized_name);
```

### bookmark_tags

Junction table for many-to-many relationship between bookmarks and tags.

```sql
CREATE TABLE bookmark_tags (
    bookmark_id INTEGER NOT NULL REFERENCES bookmarks(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (bookmark_id, tag_id)
);

-- Indexes
CREATE INDEX idx_bookmark_tags_bookmark_id ON bookmark_tags(bookmark_id);
CREATE INDEX idx_bookmark_tags_tag_id ON bookmark_tags(tag_id);
```

### highlights

Stores highlights and annotations on bookmarks.

```sql
CREATE TABLE highlights (
    id SERIAL PRIMARY KEY,
    bookmark_id INTEGER NOT NULL REFERENCES bookmarks(id) ON DELETE CASCADE,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text_selected TEXT NOT NULL,
    color VARCHAR(7),
    annotation_md TEXT,
    position_context TEXT,
    snapshot_id INTEGER, -- Optional FK to files table if needed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_highlights_bookmark_id ON highlights(bookmark_id);
CREATE INDEX idx_highlights_owner_id ON highlights(owner_id);
```

### files

Stores file attachments for bookmarks.

```sql
CREATE TABLE files (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bookmark_id INTEGER REFERENCES bookmarks(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    mime VARCHAR(100),
    size BIGINT,
    s3_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_files_owner_id ON files(owner_id);
CREATE INDEX idx_files_bookmark_id ON files(bookmark_id);
```

### backups

Stores backup records.

```sql
CREATE TABLE backups (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    auto_generated BOOLEAN DEFAULT FALSE
);

-- Indexes
CREATE INDEX idx_backups_owner_id ON backups(owner_id);
```

### collection_permissions

Stores sharing permissions for collections.

```sql
CREATE TYPE permission_role AS ENUM ('viewer', 'editor', 'owner');

CREATE TABLE collection_permissions (
    id SERIAL PRIMARY KEY,
    collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role permission_role NOT NULL DEFAULT 'viewer',
    UNIQUE(collection_id, user_id)
);

-- Indexes
CREATE INDEX idx_collection_permissions_collection_id ON collection_permissions(collection_id);
CREATE INDEX idx_collection_permissions_user_id ON collection_permissions(user_id);
```

## Additional Constraints and Notes

- All foreign keys use `ON DELETE CASCADE` to maintain referential integrity.
- Unique constraints prevent duplicate emails, share slugs, and tag names per owner.
- Full-text search is enabled on bookmark titles and excerpts for efficient searching.
- Timestamps use `TIMESTAMP WITH TIME ZONE` for consistency.
- The `plan` field in users can be extended with check constraints if needed (e.g., CHECK (plan IN ('free', 'premium'))).
