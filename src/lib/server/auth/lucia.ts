import {
	Lucia,
	type Adapter,
	type DatabaseSession,
	type DatabaseUser,
	TimeSpan
} from 'lucia';
import { eq, lt } from 'drizzle-orm';
import { dev } from '$app/env';
import type { Database } from '../db';
import { sessions, users } from '../db/schema';

let dbInstance: Database | null = null;

export function setDb(db: Database): void {
	dbInstance = db;
}

function getDb(): Database {
	if (!dbInstance) {
		throw new Error('Database is not initialized');
	}
	return dbInstance;
}

const adapter: Adapter = {
	async getSessionAndUser(sessionId) {
		const db = getDb();

		const sessionRows = await db.select().from(sessions).where(eq(sessions.id, sessionId));
		const session = sessionRows[0];
		if (!session) {
			return [null, null];
		}

		const userRows = await db.select().from(users).where(eq(users.id, session.user_id));
		const user = userRows[0];
		if (!user) {
			return [null, null];
		}

		const databaseSession: DatabaseSession = {
			id: sessionId,
			userId: String(user.id),
			expiresAt: new Date(session.expires_at),
			attributes: {}
		};
		const databaseUser: DatabaseUser = {
			id: String(user.id),
			attributes: {}
		};

		return [databaseSession, databaseUser];
	},

	async getUserSessions(userId) {
		const db = getDb();
		const rows = await db
			.select()
			.from(sessions)
			.where(eq(sessions.user_id, Number(userId)));
		return rows.map((row) => ({
			id: row.id,
			userId: String(userId),
			expiresAt: new Date(row.expires_at),
			attributes: {}
		}));
	},

	async setSession(session) {
		const db = getDb();
		const now = Date.now();
		await db
			.insert(sessions)
			.values({
				id: session.id,
				user_id: Number(session.userId),
				expires_at: session.expiresAt.getTime(),
				created_at: now
			});
	},

	async updateSessionExpiration(sessionId, expiresAt) {
		const db = getDb();
		await db
			.update(sessions)
			.set({ expires_at: expiresAt.getTime() })
			.where(eq(sessions.id, sessionId));
	},

	async deleteSession(sessionId) {
		const db = getDb();
		await db.delete(sessions).where(eq(sessions.id, sessionId));
	},

	async deleteUserSessions(userId) {
		const db = getDb();
		await db.delete(sessions).where(eq(sessions.user_id, Number(userId)));
	},

	async deleteExpiredSessions() {
		const db = getDb();
		await db.delete(sessions).where(lt(sessions.expires_at, Date.now()));
	}
};

export const lucia = new Lucia(adapter, {
	sessionExpiresIn: new TimeSpan(7, 'd'),
	sessionCookie: {
		name: 'auth_session',
		attributes: {
			path: '/',
			// dev=false di production (Cloudflare). Di dev harus false agar
			// cookie tetap terpasang saat diakses lewat LAN/http (tablet/HP).
			secure: !dev,
			sameSite: 'lax'
		}
	}
});
