#!/usr/bin/env bun
/**
 * migrate-local-to-d1.ts
 *
 * Ekspor semua data non-deleted dari SQLite lokal ke file SQL,
 * siap dijalankan ke Cloudflare D1 via:
 *   bunx wrangler d1 execute school-info-db --remote --file /tmp/migrate.sql
 *
 * Usage:
 *   bun run scripts/migrate-local-to-d1.ts            # generate /tmp/migrate.sql
 *   bun run scripts/migrate-local-to-d1.ts --deploy   # generate + deploy langsung
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const LOCAL_DB = join(import.meta.dir, '../drizzle/local.db');
const OUT_FILE = '/tmp/migrate_local_to_d1.sql';
const D1_DB = process.env.D1_DB_NAME ?? 'school-info-db';

// ── Tables yang akan disinkronkan ────────────────────────────────────────
const TABLES = [
	'schools',
	'users',
	'academic_years',
	'ppdb_batches',
	'ppdb_tracks',
	'subjects',
	'classes',
	'teachers',
	'students',
	'class_subjects',
	'time_slots',
	'schedules',
	'teaching_journals',
	'violation_types',
	'student_violations',
	'sanctions',
	'student_sanctions',
	'student_point_summaries',
	'notifications',
	'sessions',
	'spp_settings',
	'spp_payments',
	'keuangan_transactions',
	'audit_logs',
	'ppdb_registrations',
	'ppdb_registration_documents',
	'collection_projects',
	'collection_project_targets',
	'collection_submissions',
];

// ── Konversi nilai SQL-safe ──────────────────────────────────────────────
function sqlVal(v: unknown): string {
	if (v === null || v === undefined) return 'NULL';
	if (typeof v === 'number') return String(v);
	if (v instanceof Date) return `'${v.toISOString()}'`;
	const s = String(v).replace(/\\/g, '\\\\').replace(/'/g, "''");
	return `'${s}'`;
}

// ── Main ─────────────────────────────────────────────────────────────────
async function main() {
	const args = process.argv.slice(2);
	const deploy = args.includes('--deploy');

	console.log(`📦 Local DB : ${LOCAL_DB}`);
	console.log(`🎯 Output   : ${OUT_FILE}`);
	console.log(deploy ? `🚀 Deploy ke D1 remote : ${D1_DB}` : '   (tanpa deploy — hanya generate SQL)\n');

	// Buka connection SQLite lokal (pakai sqlite package yang support promise)
	const db = await open({
		filename: LOCAL_DB,
		driver: sqlite3.Database
	});

	// Tambah slug ke schools jika belum ada
	try {
		await db.run(`ALTER TABLE schools ADD COLUMN slug TEXT`);
		console.log('  [info] Kolom slug ditambahkan ke schools');
	} catch (e: any) {
		if (!String(e).includes('duplicate')) {
			console.warn('  [warn] Gagal alter schools:', e.message);
		}
	}

	// Isi slug dari nama
	await db.run(`UPDATE schools SET slug = lower(replace(replace(name,' ','-'),'_','-')) WHERE slug IS NULL AND name IS NOT NULL`);

	const allStatements: string[] = [];
	allStatements.push(`-- Migrasi dari local SQLite → Cloudflare D1`);
	allStatements.push(`-- Generated: ${new Date().toISOString()}`);
	allStatements.push(`-- Database  : ${D1_DB}`);
	allStatements.push('');

	for (const tbl of TABLES) {
		try {
			// Cek apakah tabel punya kolom deleted_at
			const colsInfo = await db.all(`PRAGMA table_info(\`${tbl}\`)`);
			const colNames = colsInfo.map((c: any) => c.name);
			const hasDeletedAt = colNames.includes('deleted_at');

			let q = `SELECT * FROM \`${tbl}\``;
			if (hasDeletedAt) {
				q += ` WHERE deleted_at IS NULL OR deleted_at = 0`;
			}

			const rows = await db.all(q);
			if (!rows?.length) {
				console.log(`  [skip] ${tbl}: 0 rows`);
				continue;
			}

			// Skip superadmin (id=1) untuk users
			let filteredRows = rows;
			if (tbl === 'users') {
				filteredRows = rows.filter((r: any) => r.id !== 1);
				if (!filteredRows.length) {
					console.log(`  [skip] ${tbl}: hanya superadmin`);
					continue;
				}
			}

			const colList = colNames.map((c) => `\`${c}\``).join(', ');
			const statements = filteredRows.map((row: any) => {
				const valList = colNames.map((c) => sqlVal(row[c])).join(', ');
				return `INSERT OR IGNORE INTO \`${tbl}\` (${colList}) VALUES (${valList});`;
			});

			allStatements.push(`\n-- === ${tbl} (${statements.length} rows) ===`);
			allStatements.push(...statements);
			console.log(`  [ok]   ${tbl}: ${statements.length} rows`);
		} catch (e: any) {
			console.warn(`  [warn] ${tbl}: ${e.message}`);
		}
	}

	// Tulis file
	mkdirSync('/tmp', { recursive: true });
	require('node:fs').writeFileSync(OUT_FILE, allStatements.join('\n') + '\n');
	console.log(`\n✅ Ditulis ${allStatements.filter((l) => l.startsWith('INSERT')).length} statement → ${OUT_FILE}`);
	console.log(`   Ukuran: ${(require('node:fs').statSync(OUT_FILE).size / 1024).toFixed(1)} KB\n`);

	await db.close();

	// Deploy otomatis jika flag diberikan
	if (deploy) {
		console.log('🚀 Deploy ke D1 remote...\n');
		try {
			execSync(`bunx wrangler d1 execute ${D1_DB} --remote --file=${OUT_FILE}`, {
				stdio: 'inherit',
				cwd: join(import.meta.dir, '..')
			});
			console.log('\n✅ Migrasi berhasil!');
		} catch (e: any) {
			console.error('\n❌ Gagal deploy:', e.message);
			process.exit(1);
		}
	}
}

main().catch(console.error);