-- =========================================================
-- SEED AWAL: Superadmin Platform
-- Password: admin123 (bcrypt hash)
-- GANTI password setelah login pertama!
-- =========================================================

-- Hash untuk "admin123" dengan bcrypt cost 12
-- Gunakan tool generate hash jika ingin password berbeda

INSERT OR IGNORE INTO users (
  id, school_id, name, email, password_hash, role, is_active,
  created_at, updated_at
) VALUES (
  1,
  NULL,
  'Super Admin',
  'admin@sis.id',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewFk6z/fJl.HJSMC',
  'superadmin',
  1,
  unixepoch('subsec') * 1000,
  unixepoch('subsec') * 1000
);

-- Catatan: hash di atas adalah contoh placeholder.
-- Generate hash baru dengan: bcrypt.hash('admin123', 12)
-- Atau gunakan endpoint /api/seed (hanya untuk development)
