-- 0010: slug sekolah untuk URL pendaftaran publik per sekolah
ALTER TABLE schools ADD COLUMN slug text;

-- generate slug dari name untuk data lama (fallback id jika nama kosong)
UPDATE schools SET slug = lower(replace(name, ' ', '-')) WHERE slug IS NULL AND name IS NOT NULL;

-- pastikan unique setelah diisi (slahkan duplikat manual jika terjadi)
CREATE UNIQUE INDEX idx_schools_slug_unique ON schools(slug) WHERE slug IS NOT NULL;
