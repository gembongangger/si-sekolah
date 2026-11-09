# 📋 Progres Implementasi — Sistem Informasi Sekolah

## ✅ SELESAI (Semua fitur)

| # | Fitur | Route | Status | Detail |
|---|-------|-------|--------|--------|
| 1 | Database schema (23 tabel) | — | ✅ | Drizzle + migrasi lokal (5 migration files) |
| 2 | Auth (login/logout/session) | `/login`, `/logout` | ✅ | Lucia Auth + bcryptjs |
| 3 | Role-based guards | — | ✅ | superadmin, admin_sekolah, guru, siswa |
| 4 | Dashboard beranda | `/dashboard` | ✅ | Statistik per role |
| 5 | Manajemen Sekolah | `/dashboard/sekolah` | ✅ | CRUD superadmin |
| 6 | Manajemen Admin Sekolah | `/dashboard/admin-sekolah` | ✅ | CRUD superadmin |
| 7 | Manajemen Guru | `/dashboard/guru` | ✅ | CRUD admin_sekolah |
| 8 | Manajemen Siswa | `/dashboard/siswa` | ✅ | CRUD admin_sekolah |
| 9 | Jurnal Mengajar | `/dashboard/jurnal` | ✅ | CRUD guru/admin |
| 10 | Pelanggaran Siswa | `/dashboard/pelanggaran` | ✅ | Laporan, verifikasi, jenis, rekap poin |
| 11 | **Tahun Ajaran** | `/dashboard/tahun-ajaran` | ✅ | CRUD admin_sekolah (baru) |
| 12 | **Mata Pelajaran** | `/dashboard/mata-pelajaran` | ✅ | CRUD admin_sekolah (baru) |
| 13 | **Kelas** | `/dashboard/kelas` | ✅ | CRUD admin_sekolah (baru) |
| 14 | **Kelas–Mapel–Guru** | `/dashboard/kelas/mapel` | ✅ | CRUD admin_sekolah (baru) |
| 15 | **Jam Pelajaran** | `/dashboard/jam-pelajaran` | ✅ | CRUD admin_sekolah (baru) |
| 16 | **Jadwal Pelajaran** | `/dashboard/jadwal` | ✅ | CRUD + cek konflik waktu (baru) |
| 17 | **Sanksi Poin** | `/dashboard/sanksi` | ✅ | CRUD admin_sekolah (baru) |
| 18 | **Jalur Pendaftaran PPDB (configurable)** | `/dashboard/ppdb` | ✅ | CRUD admin_sekolah, validasi dinamis di formulir publik |
| 19 | Endpoint seed | `/api/seed` | ✅ | Dev only |
| 20 | Build production | `bun run build` | ✅ | Berhasil tanpa error |

---

## 🛠️ PERUBAHAN TEKNIS (sesi ini)

1. **vite.config.ts**: Ditambahkan alias `$lib` → `src/lib` (SvelteKit v3 hapus `$lib`)
2. **schema.ts**: Ditambahkan `deleted_at` dan `updated_at` ke tabel academic_years, subjects, classes, time_slots, sanctions, class_subjects, schedules
3. **Migration**: 5 file migration (0000–0004) applied ke `drizzle/local.db`
4. **Validation**: Semua schema dipindahkan dari `src/lib/server/validation/` ke `src/lib/validation/` agar bisa diimpor di sisi klien (build)
5. **Sidebar**: Ditambahkan nav item untuk Tahun Ajaran, Mata Pelajaran, Kelas, Kelas–Mapel–Guru, Jam Pelajaran, Jadwal, Sanksi Poin
6. **PPDB Jalur Pendaftaran (configurable)**:
   - Tabel baru `ppdb_tracks` (school_id, code, name, description, is_active)
   - Hapus CHECK constraint hardcoded di `ppdb_registrations.track` → validasi dinamis per sekolah
   - CRUD jalur di `/dashboard/ppdb` (create, edit, toggle aktif, hapus)
   - Auto-seed default 4 jalur (reguler, prestasi, zonasi, afirmasi) per sekolah bila kosong
   - Formulir publik `/ppdb/daftar` menampilkan jalur sesuai sekolah terpilih (fallback ke default jika belum dikonfigurasi)
   - Wizard 5 langkah mobile-friendly di formulir pendaftaran

---

---

## 📁 FILE BARU (17 file)

**Validation (7):**
- src/lib/validation/academic-year.ts
- src/lib/validation/subject.ts
- src/lib/validation/class.ts
- src/lib/validation/class-subject.ts
- src/lib/validation/time-slot.ts
- src/lib/validation/schedule.ts
- src/lib/validation/sanction.ts

**Routes server (7):**
- src/routes/dashboard/tahun-ajaran/+page.server.ts
- src/routes/dashboard/mata-pelajaran/+page.server.ts
- src/routes/dashboard/kelas/+page.server.ts
- src/routes/dashboard/kelas/mapel/+page.server.ts
- src/routes/dashboard/jam-pelajaran/+page.server.ts
- src/routes/dashboard/jadwal/+page.server.ts
- src/routes/dashboard/sanksi/+page.server.ts

**Routes UI (7):**
- src/routes/dashboard/tahun-ajaran/+page.svelte
- src/routes/dashboard/mata-pelajaran/+page.svelte
- src/routes/dashboard/kelas/+page.svelte
- src/routes/dashboard/kelas/mapel/+page.svelte
- src/routes/dashboard/jam-pelajaran/+page.svelte
- src/routes/dashboard/jadwal/+page.svelte
- src/routes/dashboard/sanksi/+page.svelte

## 📱 RESPONSIVENESS (Mobile & Tablet) — Selesai

| Area | Perubahan |
|------|-----------|
| Sidebar | Toggle hamburger di mobile (`lg:hidden`), overlay backdrop, drawer slide-in |
| Modal dialogs | `max-w-full sm:max-w-lg/2xl/sm`, padding `p-4 sm:p-6`, max-height `max-h-[90vh] overflow-y-auto` |
| Data tables | Semua tabel dibungkus `overflow-x-auto` untuk scroll horizontal di layar kecil |
| Grid layout | `grid-cols-1 sm:grid-cols-2` (2 kolom → 1 kolom di mobile) |
| Attendance input (Jurnal) | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` (4 kolom di desktop, 2 di tablet, 1 di mobile) |
| Login card | `w-full max-w-full sm:max-w-md`, padding `p-8 sm:p-8` |
| Main content | `flex-1 p-6` dengan `min-w-0`, top bar mobile-only (`lg:hidden`) |

File yang diubah:
- src/routes/dashboard/+layout.svelte (sidebar mobile toggle sudah ada, diperbaiki)
- Semua halaman dashboard (+page.svelte): sekolah, guru, admin-sekolah, siswa, jurnal, pelanggaran, tahun-ajaran, mata-pelajaran, kelas, kelas/mapel, jam-pelajaran, jadwal, sanksi
- src/routes/login/+page.svelte (kartu login responsif)

---

## 🚀 CARA JALANKAN

```bash
cd "/mnt/data/web and program/sistem_informasi_sekolah"
bun run dev       # development server
bun run build     # production build
bun run preview   # preview production build
```

Login default: `admin@sis.id` / `superadmin123` (superadmin, via seed atau `drizzle/seed.sql`)

Semua route `/dashboard/*` dilindungi auth guard — redirect ke `/login` jika belum login.

---

## 🔧 PERBAIKAN DB LOKAL & LOGIN (sesi ini)

**Masalah:** `POST /login` gagal 500 dengan `TypeError: Cannot read properties of undefined (reading 'prepare')` saat `bun run dev`.

**Akar masalah:** `bun run dev` (Vite) tidak menyediakan binding Cloudflare D1, sehingga `event.platform?.env?.DB` bernilai `undefined`. `createDb(undefined)` menghasilkan instance rusak dan query login gagal.

**Perbaikan:**
1. `src/lib/server/db/index.ts`
   - `createDb(d1)` tetap untuk production (Cloudflare D1, `drizzle-orm/d1`).
   - Tambah `createLocalDb(url = 'file:./drizzle/local.db')` memakai `@libsql/client` + `drizzle-orm/libsql` untuk dev lokal.
2. `src/hooks.server.ts`
   - Pilih otomatis: D1 bila `event.platform.env.DB` ada, selain itu SQLite lokal.
   - Menyimpan instance Drizzle ke Lucia lewat `setDb(db)`.
3. `src/lib/server/auth/lucia.ts`
   - `setDbClient(client)` diganti `setDb(db: Database)` agar menerima instance Drizzle (D1 maupun libsql), bukan raw client.
4. Cookie session: `secure: !dev` (bukan selalu `true`) agar login berfungsi di `http://localhost` dan saat diuji dari tablet/HP lewat LAN.

**Verifikasi:**
- `bun run build` → berhasil.
- `POST /login` → `302 /dashboard` + cookie `auth_session`.
- `GET /dashboard` dengan session → `200`; tanpa session → `302 /login`.
- Tidak ada error `prepare`/`undefined` di log dev server.

**Kredensial superadmin:** `admin@sis.id` / `superadmin123` (lihat `kredential.txt`).

**Catatan Tambahan (SvelteKit v3 API):**
- `import { type Handle } from '@sveltejs/kit'` → `@sveltejs/kit/hooks` (`Handle` dipindah).
- `import { dev } from '$app/environment'` → `'$app/env'` (`dev` resmi di `@sveltejs/kit/types`).
- Cookie session: `secure: !dev` supaya login bisa dipakai di dev via `http://localhost`/LAN.

---

## ☁️ DEPLOYMENT CLOUDFLARE (sesi ini)

**Status:** ✅ Worker `school-info-system` berhasil di-deploy (manual via wrangler + via GitHub Actions).

- **Worker:** `https://school-info-system.gembongangger.workers.dev`
- **Binding:** D1 `school-info-db` (id: `15e3ddc5-dda1-464c-b0d8-c97e52a3a4c9`), Assets, ENVIRONMENT=production, AUTH_SECRET.
- **Migrasi D1** (0000–0003) + **seed superadmin** (`admin@sis.id` / `superadmin123`) di-apply ke production.

**Masalah production:** Worker production tampil 500 pada route SSR (`GET /login`) — penyebabnya `event.platform?.env?.DB` tidak terisi di build Worker (SvelteKit worker build tidak meneruskan platform via respond options), sehingga hook jatuh ke fallback SQLite lokal (`file:`) → gagal di workerd.

**Perbaikan production:**
1. `src/hooks.server.ts` — logika baru: `dev ? createLocalDb() : createDb(env dari 'cloudflare:workers')`.
2. `src/app.d.ts` — tambah `/// <reference types="@cloudflare/workers-types/experimental" />` agar modul `cloudflare:workers` ter-typable.

**Verifikasi production:**
- `GET /login` → **200** ✅ (sebelum: 500).
- `POST /login` (dengan Origin, seperti browser) → session cookie `auth_session` + redirect ke `/dashboard`.
- `GET /dashboard` dengan cookie → **200** (render "Dashboard").

**GitHub Actions:** `.github/workflows/deploy.yml` (push ke `main` → `wrangler deploy`).
- Workflow pertama kali **gagal** karena secret `CLOUDFLARE_API_TOKEN` belum diset di GitHub repo.
- **Langkah yang perlu dilakukan user:** tambahkan repo secrets di GitHub:
  - `CLOUDFLARE_API_TOKEN` — token Cloudflare (scope: Workers Scripts Deploy / Edit)
  - `CLOUDFLARE_ACCOUNT_ID` — `e528c3f3d0361f2fe3a1ab4fdf9c1722`

**Catatan sisa:**
- R2 bucket `school-evidence` belum diaktifkan di akun Cloudflare (harus lewat dashboard) → blokir deploy jika ditambahkan kembali.
- `AUTH_SECRET` di `wrangler.toml` masih placeholder → ganti sebelum dipakai serius.