-- PPDB Document Requirements & Uploads
-- Migration 0009

-- 1. Add document_requirements JSON column to ppdb_batches
ALTER TABLE ppdb_batches ADD COLUMN document_requirements JSON;

-- 2. Create ppdb_registration_documents table for per-document uploads
CREATE TABLE ppdb_registration_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  registration_id INTEGER NOT NULL REFERENCES ppdb_registrations(id) ON DELETE CASCADE,
  document_key TEXT NOT NULL,           -- 'foto', 'kk', 'akta', 'ijazah', 'rapor', etc.
  document_label TEXT NOT NULL,         -- Label for display
  url TEXT NOT NULL,                    -- R2 storage URL
  status TEXT NOT NULL DEFAULT 'pending', -- pending/verified/rejected
  rejected_reason TEXT,
  verified_by INTEGER REFERENCES users(id),
  verified_at INTEGER,
  uploaded_at INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
  UNIQUE(registration_id, document_key)
);

CREATE INDEX idx_ppdb_reg_docs_registration ON ppdb_registration_documents(registration_id);
CREATE INDEX idx_ppdb_reg_docs_status ON ppdb_registration_documents(status);