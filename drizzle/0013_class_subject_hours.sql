-- 0013: bobot jam per pekan per kelas-mapel (override subjects.hours_per_week)
ALTER TABLE class_subjects ADD COLUMN hours_per_week integer;
