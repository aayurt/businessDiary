-- ============================================================================
-- PostgreSQL Migration: 001_initial_schema
-- Description: Creates all tables for the application database schema
-- Includes: users, categories, tags, md_files, junction tables, votes,
--           budget_items, feasibility_entries
-- ============================================================================

-- Enable UUID extension (optional, used for alternative ID generation)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- --------------------------------------------------------------------------
-- 1. Users
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id            TEXT        PRIMARY KEY,
    email         TEXT        NOT NULL UNIQUE,
    email_verified TIMESTAMP WITH TIME ZONE,
    name          TEXT,
    image         TEXT,
    hashed_password TEXT,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 2. Categories
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id          TEXT        PRIMARY KEY,
    name        TEXT        NOT NULL,
    slug        TEXT        NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 3. Tags
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tags (
    id         TEXT        PRIMARY KEY,
    name       TEXT        NOT NULL,
    slug       TEXT        NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 4. MD Files
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS md_files (
    id          TEXT        PRIMARY KEY,
    title       TEXT        NOT NULL,
    slug        TEXT        NOT NULL UNIQUE,
    content     TEXT        NOT NULL,
    description TEXT,
    cover_image TEXT,
    published   BOOLEAN     NOT NULL DEFAULT FALSE,
    author_id   TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 5. File-Category Junction (many-to-many)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS file_categories (
    file_id     TEXT NOT NULL REFERENCES md_files(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (file_id, category_id)
);

-- --------------------------------------------------------------------------
-- 6. File-Tag Junction (many-to-many)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS file_tags (
    file_id TEXT NOT NULL REFERENCES md_files(id) ON DELETE CASCADE,
    tag_id  TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (file_id, tag_id)
);

-- --------------------------------------------------------------------------
-- 7. Votes
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS votes (
    id         TEXT        PRIMARY KEY,
    file_id    TEXT        NOT NULL REFERENCES md_files(id) ON DELETE CASCADE,
    user_id    TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    value      INTEGER     NOT NULL CHECK (value IN (-1, 0, 1)),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (file_id, user_id)
);

-- --------------------------------------------------------------------------
-- 8. Budget Items
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS budget_items (
    id           TEXT        PRIMARY KEY,
    file_id      TEXT        NOT NULL REFERENCES md_files(id) ON DELETE CASCADE,
    label        TEXT        NOT NULL,
    amount       DOUBLE PRECISION NOT NULL,
    type         TEXT        NOT NULL CHECK (type IN ('revenue', 'cost', 'investment')),
    created_by_id TEXT       REFERENCES users(id) ON DELETE SET NULL,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 9. Feasibility Entries
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feasibility_entries (
    id         TEXT        PRIMARY KEY,
    file_id    TEXT        NOT NULL REFERENCES md_files(id) ON DELETE CASCADE,
    country    TEXT        NOT NULL,
    place      TEXT,
    score      DOUBLE PRECISION NOT NULL CHECK (score >= 0 AND score <= 100),
    notes      TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- Indexes
-- --------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_md_files_author_id     ON md_files(author_id);
CREATE INDEX IF NOT EXISTS idx_md_files_published      ON md_files(published);
CREATE INDEX IF NOT EXISTS idx_md_files_created_at     ON md_files(created_at);
CREATE INDEX IF NOT EXISTS idx_file_categories_file_id    ON file_categories(file_id);
CREATE INDEX IF NOT EXISTS idx_file_categories_category_id ON file_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_file_tags_file_id       ON file_tags(file_id);
CREATE INDEX IF NOT EXISTS idx_file_tags_tag_id        ON file_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_votes_file_id           ON votes(file_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id           ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_file_id    ON budget_items(file_id);
CREATE INDEX IF NOT EXISTS idx_feasibility_entries_file_id ON feasibility_entries(file_id);
CREATE INDEX IF NOT EXISTS idx_feasibility_entries_country  ON feasibility_entries(country);
