-- 0011: jam pelajaran per minggu pada mata pelajaran
ALTER TABLE subjects ADD COLUMN hours_per_week integer NOT NULL DEFAULT 2;
