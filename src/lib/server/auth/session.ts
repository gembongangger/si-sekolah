import { eq } from 'drizzle-orm';
import { lucia } from './lucia';
import { users } from '../db/schema';
import type { Database } from '../db';

export interface SessionUser {
	userId: number;
	role: string;
	schoolId: number | null;
	name: string;
	email: string;
	isActive: number;
}

export interface AuthContext {
	user: SessionUser | null;
	sessionId: string | null;
}

export async function getSessionUser(event: {
	request: Request;
	locals: { db: Database; user: SessionUser | null };
}): Promise<SessionUser | null> {
	const cookieHeader = event.request.headers.get('cookie');
	const sessionId = lucia.readSessionCookie(cookieHeader ?? '');
	if (!sessionId) {
		return null;
	}

	const { user, session } = await lucia.validateSession(sessionId);
	if (!user || !session) {
		return null;
	}

	const db = event.locals.db;
	const userRows = await db.select().from(users).where(eq(users.id, Number(user.id)));
	const userRow = userRows[0];
	if (!userRow || userRow.deleted_at) {
		return null;
	}

	return {
		userId: Number(userRow.id),
		role: userRow.role,
		schoolId: userRow.school_id,
		name: userRow.name,
		email: userRow.email,
		isActive: userRow.is_active
	};
}
