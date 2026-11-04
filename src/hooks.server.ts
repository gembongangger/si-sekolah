import { type Handle } from '@sveltejs/kit/hooks';
import { createDb, createLocalDb } from './lib/server/db';
import { setDb } from './lib/server/auth/lucia';
import { getSessionUser } from './lib/server/auth/session';
import { dev } from '$app/env';
import { env } from 'cloudflare:workers';
import type { D1Database } from '@cloudflare/workers-types';

export const handle: Handle = async ({ event, resolve }) => {
	// Production (Cloudflare Worker) memakai D1 binding.
	// Dev (`bun run dev`) memakai SQLite lokal via @libsql/client.
	const cloudflareEnv = env as unknown as { DB: D1Database };
	const db = dev ? createLocalDb() : createDb(cloudflareEnv.DB);
	setDb(db);

	event.locals.db = db;
	event.locals.user = await getSessionUser(event);
	return resolve(event);
};
