# 📋 Panduan Kerja AI: Sistem Informasi Sekolah Multitenant

> **File ini adalah instruksi kerja (workflow guide) untuk AI coding assistant dalam membangun Sistem Informasi Sekolah dengan arsitektur multitenant (single database, shared schema dengan `school_id`).**

---

## 🎯 1. Gambaran Proyek

Bangun **Sistem Informasi Sekolah** berbasis web dengan fitur:

| Fitur | Deskripsi |
|---|---|
| **Jurnal Mengajar** | Guru mencatat kegiatan mengajar per pertemuan (kelas, mapel, materi, absensi, catatan) |
| **Poin Pelanggaran Siswa** | Pencatatan pelanggaran, kalkulasi poin otomatis, riwayat, sanksi |
| **Jadwal Sekolah** | Jadwal pelajaran per kelas, per guru, per mapel, per hari/jam |
| **Manajemen User & Role** | Superadmin, Admin Sekolah, Guru, Siswa |

**Arsitektur:** Multitenant — **satu database**, isolasi data via kolom `school_id` di setiap tabel tenant.

---

## 👥 2. Role & Hak Akses (Hierarki Kewenangan)

> **Aturan hierarki user management (WAJIB):**
> - **Superadmin** → mendaftarkan & mengelola **Admin Sekolah** (satu-satunya yang boleh membuat/menghapus akun admin sekolah).
> - **Admin Sekolah** → mengelola **Guru** & **Siswa** di lembaganya sendiri.
> - **Guru** & **Siswa** → **tidak** mengelola user lain.

### 2.1 Superadmin (Platform Owner)
- ✅ **Mendaftarkan Admin Sekolah** (create akun + assign ke `school_id`)
- ✅ **Mengelola Admin Sekolah** (edit, reset password, nonaktifkan, hapus)
- ✅ CRUD Sekolah (tenant)
- ✅ Melihat statistik global semua tenant (agregat, bukan data operasional detail)
- ❌ **TIDAK** mengelola data operasional sekolah: siswa, guru, jadwal, jurnal, pelanggaran
- ❌ **TIDAK** membuat akun guru/siswa

### 2.2 Admin Sekolah (Tenant Admin)
- ✅ **Mengelola Guru** di sekolahnya (create, edit, reset password, nonaktifkan, hapus)
- ✅ **Mengelola Siswa** di sekolahnya (create, edit, reset password, nonaktifkan, hapus)
- ✅ CRUD: kelas, mapel, jadwal, jenis pelanggaran, sanksi
- ✅ Melihat semua jurnal & poin di sekolahnya
- ✅ Verifikasi pelanggaran siswa
- ✅ Konfigurasi sekolah (tahun ajaran, semester aktif, bobot poin)
- ❌ **TIDAK** bisa membuat/mengubah akun Admin Sekolah (termasuk dirinya sendiri)
- ❌ **TIDAK** bisa mengakses data sekolah lain

### 2.3 Guru
- Scoped ke `school_id` + data miliknya
- CRUD jurnal mengajar miliknya sendiri
- Melihat jadwal mengajarnya
- Input pelanggaran siswa (opsional, dikonfigurasi admin)
- Melihat data siswa di kelas yang diajar
- ❌ **TIDAK** mengelola user

### 2.4 Siswa
- Scoped ke `school_id` + data miliknya
- Read-only: jadwal kelasnya, riwayat poin pelanggaran pribadi, rekap jurnal (opsional)
- ❌ **TIDAK** mengelola user

### 2.5 Matriks Kewenangan User Management

| Aksi | Superadmin | Admin Sekolah | Guru | Siswa |
|---|:---:|:---:|:---:|:---:|
| Create Admin Sekolah | ✅ | ❌ | ❌ | ❌ |
| Edit / Reset Password Admin Sekolah | ✅ | ❌ | ❌ | ❌ |
| Delete / Nonaktifkan Admin Sekolah | ✅ | ❌ | ❌ | ❌ |
| Create Guru | ❌ | ✅ | ❌ | ❌ |
| Edit / Reset Password Guru | ❌ | ✅ | ❌ | ❌ |
| Delete / Nonaktifkan Guru | ❌ | ✅ | ❌ | ❌ |
| Create Siswa | ❌ | ✅ | ❌ | ❌ |
| Edit / Reset Password Siswa | ❌ | ✅ | ❌ | ❌ |
| Delete / Nonaktifkan Siswa | ❌ | ✅ | ❌ | ❌ |
| Edit profil sendiri | ✅ | ✅ | ✅ | ✅ |

> **Catatan:** Guru & siswa boleh edit **profil sendiri** (nama, foto, kontak) tapi **tidak** bisa ubah role, `school_id`, atau akun user lain.

---

## 🛠️ 3. Stack Teknologi (FINAL)

> **Stack ini sudah ditetapkan. AI WAJIB menggunakan stack ini.**

| Layer | Teknologi |
|---|---|
| **Framework** | SvelteKit (Svelte 5, runes mode) |
| **Language** | TypeScript (strict mode) |
| **ORM** | Drizzle ORM |
| **Database** | Cloudflare D1 (SQLite-compatible) |
| **Hosting** | Cloudflare Pages / Workers |
| **Adapter** | `@sveltejs/adapter-cloudflare` |
| **Auth** | Lucia Auth v3 **atau** custom session cookie + `@oslojs/crypto` |
| **Password Hashing** | `bcryptjs` (pure JS untuk Workers) |
| **Validation** | Zod |
| **Styling** | TailwindCSS + shadcn-svelte (bits-ui) |
| **Form Handling** | SvelteKit form actions + `sveltekit-superforms` |
| **Testing** | Vitest + Playwright |
| **CI/CD** | GitHub Actions → Cloudflare Pages (auto-deploy on push) |
| **Package Manager** | pnpm |

### 3.1 Catatan Penting Cloudflare Workers/D1
- ❌ **Tidak ada `fs`** — semua upload file (bukti pelanggaran) ke **R2**.
- ❌ **Tidak ada long-running process** — cron via **Cloudflare Cron Triggers**.
- ⚠️ **D1 adalah SQLite** — tidak ada `ENUM` native, gunakan `TEXT` + `CHECK` constraint atau validasi Zod.
- ⚠️ **D1 tidak mendukung stored procedure/trigger kompleks** — logic di application layer.
- ⚠️ **Query D1 harus efisien** — gunakan batching `db.batch()`.
- ⚠️ **Session/auth** — cookie-based (HttpOnly, Secure, SameSite=Lax). Tidak ada state di memory.
- ⚠️ **Foreign key D1 default OFF per koneksi** — Drizzle menangani relasi di level aplikasi; constraint FK tetap dideklarasikan untuk dokumentasi & migrasi.
- ⚠️ **`PRAGMA foreign_keys = ON`** harus dijalankan di setiap koneksi (bisa via wrapper D1 atau `migrations`).

---

## 🗄️ 4. Desain Database (Single DB, Shared Schema)

### 4.1 Aturan Wajib Multitenant
> ⚠️ **SETIAP tabel operasional WAJIB punya kolom `school_id` (FK ke `schools.id`).**
> **SETIAP query WAJIB difilter `school_id`** kecuali diakses superadmin pada tabel `schools`.

### 4.2 Konvensi D1 (SQLite)
- Semua tabel pakai **snake_case**.
- Primary key: `INTEGER PRIMARY KEY AUTOINCREMENT`.
- Timestamp: `INTEGER` (Unix epoch **milliseconds**) — D1 tidak punya `TIMESTAMP` native.
- Boolean: `INTEGER NOT NULL DEFAULT 0 CHECK (kolom IN (0,1))`.
- Soft delete: kolom `deleted_at INTEGER` (nullable).
- FK constraint dideklarasikan dengan `ON DELETE` yang sesuai.
- Semua enum → `TEXT` + `CHECK`.

### 4.3 Skema SQL Lengkap

> Skema di bawah adalah **SQL referensi** untuk D1. Implementasi Drizzle **wajib menghasilkan SQL yang ekuivalen** (boleh beda format hasil `drizzle-kit generate`, tapi struktur, constraint, dan index **harus sama**).

```sql
-- =========================================================
-- 1. TENANT: SCHOOLS
-- =========================================================
CREATE TABLE schools (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  name              TEXT    NOT NULL,
  npsn              TEXT    NOT NULL UNIQUE,
  address           TEXT,
  phone             TEXT,
  email             TEXT,
  logo_url          TEXT,
  timezone          TEXT    NOT NULL DEFAULT 'Asia/Jakarta',
  is_active         INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  subscription_plan TEXT    NOT NULL DEFAULT 'free',
  created_at        INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
  updated_at        INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
  deleted_at        INTEGER
);
CREATE INDEX idx_schools_is_active ON schools(is_active);
CREATE INDEX idx_schools_deleted_at ON schools(deleted_at);

-- =========================================================
-- 2. USERS & SESSIONS
--    school_id NULL hanya untuk superadmin.
-- =========================================================
CREATE TABLE users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id     INTEGER REFERENCES schools(id) ON DELETE CASCADE,
  name          TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  role          TEXT    NOT NULL CHECK (role IN ('superadmin','admin_sekolah','guru','siswa')),
  is_active     INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  last_login_at INTEGER,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
  deleted_at    INTEGER,
  -- Aturan: superadmin tidak punya school_id; role lain wajib punya school_id.
  CHECK (
    (role = 'superadmin' AND school_id IS NULL)
    OR (role <> 'superadmin' AND school_id IS NOT NULL)
  )
);
CREATE INDEX idx_users_school_role ON users(school_id, role);
CREATE INDEX idx_users_email       ON users(email);
CREATE INDEX idx_users_deleted_at  ON users(deleted_at);

CREATE TABLE sessions (
  id         TEXT    PRIMARY KEY,           -- token (crypto.randomUUID / base64url)
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,              -- epoch ms
  created_at INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000)
);
CREATE INDEX idx_sessions_user_id    ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- =========================================================
-- 3. MASTER AKADEMIK
-- =========================================================
CREATE TABLE academic_years (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id  INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name       TEXT    NOT NULL,              -- cth: '2024/2025'
  semester   TEXT    NOT NULL CHECK (semester IN ('ganjil','genap')),
  start_date TEXT    NOT NULL,              -- 'YYYY-MM-DD'
  end_date   TEXT    NOT NULL,
  is_active  INTEGER NOT NULL DEFAULT 0 CHECK (is_active IN (0,1)),
  created_at INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000)
);
CREATE INDEX idx_academic_years_school_active ON academic_years(school_id, is_active);

CREATE TABLE subjects (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id  INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  code       TEXT    NOT NULL,
  name       TEXT    NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
  UNIQUE (school_id, code)
);
CREATE INDEX idx_subjects_school ON subjects(school_id);

CREATE TABLE classes (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id           INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  academic_year_id    INTEGER NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  name                TEXT    NOT NULL,     -- cth: 'X IPA 1'
  level               TEXT    NOT NULL,     -- cth: '10'
  homeroom_teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at          INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
  UNIQUE (school_id, academic_year_id, name)
);
CREATE INDEX idx_classes_school_year ON classes(school_id, academic_year_id);

-- =========================================================
-- 4. PROFIL GURU & SISWA
-- =========================================================
CREATE TABLE teachers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id  INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  nip        TEXT,
  gender     TEXT CHECK (gender IN ('L','P')),
  phone      TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
  UNIQUE (school_id, nip)
);
CREATE INDEX idx_teachers_school ON teachers(school_id);

CREATE TABLE students (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id    INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  user_id      INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  nis          TEXT,
  nisn         TEXT,
  gender       TEXT CHECK (gender IN ('L','P')),
  class_id     INTEGER REFERENCES classes(id) ON DELETE SET NULL,
  birth_date   TEXT,                        -- 'YYYY-MM-DD'
  address      TEXT,
  parent_name  TEXT,
  parent_phone TEXT,
  created_at   INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
  UNIQUE (school_id, nis)
);
CREATE INDEX idx_students_school_class ON students(school_id, class_id);
CREATE INDEX idx_students_school_nis   ON students(school_id, nis);

-- =========================================================
-- 5. RELASI KELAS–MAPEL–GURU
-- =========================================================
CREATE TABLE class_subjects (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id        INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id         INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id       INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  academic_year_id INTEGER NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  UNIQUE (school_id, class_id, subject_id, academic_year_id)
);
CREATE INDEX idx_class_subjects_school_teacher ON class_subjects(school_id, teacher_id);

-- =========================================================
-- 6. JURNAL MENGAJAR
-- =========================================================
CREATE TABLE teaching_journals (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id           INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  teacher_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_id            INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id          INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  academic_year_id    INTEGER NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  date                TEXT    NOT NULL,      -- 'YYYY-MM-DD'
  meeting_number      INTEGER NOT NULL,
  topic               TEXT    NOT NULL,
  learning_objectives TEXT,
  activities          TEXT,
  notes               TEXT,
  attendance_summary  TEXT,                  -- JSON string: {"hadir":30,"sakit":1,"izin":0,"alfa":0}
  created_at          INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
  updated_at          INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
  deleted_at          INTEGER,
  UNIQUE (school_id, teacher_id, class_id, subject_id, date, meeting_number)
);
CREATE INDEX idx_journals_school_teacher_date ON teaching_journals(school_id, teacher_id, date);
CREATE INDEX idx_journals_school_class_date   ON teaching_journals(school_id, class_id, date);

-- =========================================================
-- 7. POIN PELANGGARAN
-- =========================================================
CREATE TABLE violation_types (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id   INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  code        TEXT    NOT NULL,
  name        TEXT    NOT NULL,
  category    TEXT    NOT NULL CHECK (category IN ('ringan','sedang','berat')),
  points      INTEGER NOT NULL CHECK (points >= 0),
  description TEXT,
  is_active   INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at  INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
  UNIQUE (school_id, code)
);
CREATE INDEX idx_violation_types_school ON violation_types(school_id, is_active);

CREATE TABLE student_violations (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id         INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id        INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  violation_type_id INTEGER NOT NULL REFERENCES violation_types(id) ON DELETE RESTRICT,
  reported_by       INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  date              TEXT    NOT NULL,       -- 'YYYY-MM-DD'
  description       TEXT,
  points_snapshot   INTEGER NOT NULL,       -- poin saat dicatat (immutable)
  evidence_url      TEXT,                   -- URL R2
  status            TEXT    NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','verified','rejected')),
  verified_by       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  verified_at       INTEGER,
  created_at        INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
  deleted_at        INTEGER
);
CREATE INDEX idx_violations_school_student_date ON student_violations(school_id, student_id, date);
CREATE INDEX idx_violations_school_status       ON student_violations(school_id, status);

CREATE TABLE student_point_summaries (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id         INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id        INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  academic_year_id  INTEGER NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  total_points      INTEGER NOT NULL DEFAULT 0,
  last_violation_at INTEGER,
  updated_at        INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
  UNIQUE (school_id, student_id, academic_year_id)
);
CREATE INDEX idx_point_summaries_school_student ON student_point_summaries(school_id, student_id);

CREATE TABLE sanctions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id  INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  min_points INTEGER NOT NULL,
  max_points INTEGER NOT NULL,
  name       TEXT    NOT NULL,
  action     TEXT    NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
  CHECK (min_points >= 0 AND max_points >= min_points)
);
CREATE INDEX idx_sanctions_school ON sanctions(school_id, min_points);

-- =========================================================
-- 8. JADWAL SEKOLAH
-- =========================================================
CREATE TABLE time_slots (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id   INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  slot_number INTEGER NOT NULL,
  start_time  TEXT    NOT NULL,             -- 'HH:MM'
  end_time    TEXT    NOT NULL,
  is_break    INTEGER NOT NULL DEFAULT 0 CHECK (is_break IN (0,1)),
  UNIQUE (school_id, day_of_week, slot_number)
);
CREATE INDEX idx_time_slots_school_day ON time_slots(school_id, day_of_week);

CREATE TABLE schedules (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id        INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  academic_year_id INTEGER NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  class_id         INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id       INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  time_slot_id     INTEGER NOT NULL REFERENCES time_slots(id) ON DELETE CASCADE,
  room             TEXT,
  created_at       INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000),
  UNIQUE (school_id, time_slot_id, class_id),
  UNIQUE (school_id, time_slot_id, teacher_id)
);
CREATE INDEX idx_schedules_school_class   ON schedules(school_id, class_id, time_slot_id);
CREATE INDEX idx_schedules_school_teacher ON schedules(school_id, teacher_id, time_slot_id);

-- =========================================================
-- 9. AUDIT & NOTIFIKASI
-- =========================================================
CREATE TABLE audit_logs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id  INTEGER REFERENCES schools(id) ON DELETE CASCADE,
  user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action     TEXT    NOT NULL,               -- 'create' | 'update' | 'delete' | 'login' | ...
  model      TEXT    NOT NULL,               -- nama tabel/model
  model_id   INTEGER,
  changes    TEXT,                           -- JSON string before/after
  ip         TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000)
);
CREATE INDEX idx_audit_school_created ON audit_logs(school_id, created_at);

CREATE TABLE notifications (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id  INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT    NOT NULL,
  body       TEXT,
  read_at    INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch('subsec') * 1000)
);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read_at);