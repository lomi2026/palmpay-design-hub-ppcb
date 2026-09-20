-- Backup migration for the AI case API. The API also creates this schema on first use.
CREATE TABLE IF NOT EXISTS ai_cases (
  id TEXT PRIMARY KEY,
  owner_id INTEGER NOT NULL,
  owner_username TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  link_url TEXT,
  file_url TEXT,
  file_name TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_cases_owner ON ai_cases(owner_id);
CREATE INDEX IF NOT EXISTS idx_ai_cases_created_at ON ai_cases(created_at DESC);

-- Small files use D1 storage first so Markdown and other lightweight attachments
-- do not depend on the external GitHub write path.
CREATE TABLE IF NOT EXISTS uploaded_files (
  id TEXT PRIMARY KEY,
  owner_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  content_base64 TEXT NOT NULL,
  content_type TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_uploaded_files_owner ON uploaded_files(owner_id);
