import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { lucia } from '$lib/server/auth/lucia';

export const POST: RequestHandler = async ({ cookies, locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	// Baca session id dari cookie
	const cookieHeader = cookies.get('auth_session');
	if (cookieHeader) {
		await lucia.invalidateSession(cookieHeader);
	}

	// Hapus cookie
	const blankCookie = lucia.createBlankSessionCookie();
	cookies.set(blankCookie.name, blankCookie.value, {
		path: blankCookie.attributes.path ?? '/',
		httpOnly: true,
		secure: blankCookie.attributes.secure ?? true,
		sameSite: (blankCookie.attributes.sameSite as 'lax' | 'strict' | 'none') ?? 'lax',
		maxAge: 0
	});

	throw redirect(302, '/login');
};
