import { type Handle } from '@sveltejs/kit/hooks';
import { createDb, createLocalDb } from './lib/server/db';
import { setDb } from './lib/server/auth/lucia';
import { getSessionUser } from './lib/server/auth/session';
import type { D1Database } from '@cloudflare/workers-types';

export const handle: Handle = async ({ event, resolve }) => {
	const d1 = event.platform?.env?.DB as D1Database | undefined;

	// Production memakai Cloudflare D1; `bun run dev` memakai SQLite lokal.
	const db = d1 ? createDb(d1) : createLocalDb();
	setDb(db);

	event.locals.db = db;
	event.locals.user = await getSessionUser(event);
	return resolve(event);
};
