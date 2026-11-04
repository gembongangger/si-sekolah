import { drizzle as drizzleD1, type DrizzleD1Database } from 'drizzle-orm/d1';
import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import type { D1Database } from '@cloudflare/workers-types';
import * as schema from './schema';

export type Database = DrizzleD1Database<typeof schema>;

/** Path ke database SQLite lokal yang dipakai drizzle-kit. */
const LOCAL_DB_URL = 'file:./drizzle/local.db';

/** Production: Cloudflare D1 binding. */
export function createDb(client: D1Database): Database {
	return drizzleD1(client, { schema });
}

/**
 * Development: `bun run dev` tidak menyediakan binding D1, jadi pakai
 * SQLite lokal lewat @libsql/client. Query builder Drizzle identik,
 * sehingga hasilnya aman di-cast ke tipe Database yang sama.
 */
export function createLocalDb(url = LOCAL_DB_URL): Database {
	const client = createClient({ url });
	return drizzleLibsql(client, { schema }) as unknown as Database;
}
