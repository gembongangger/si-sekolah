import { redirect, type Actions } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters/zod4';
import { loginSchema } from '$lib/validation/auth';
import { eq } from 'drizzle-orm';
import { users } from '$lib/server/db/schema';
import { lucia } from '$lib/server/auth/lucia';
import bcrypt from 'bcryptjs';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Jika sudah login, redirect ke dashboard
	if (locals.user) {
		throw redirect(302, '/dashboard');
	}

	const form = await superValidate(zod(loginSchema));
	return { form };
};

export const actions: Actions = {
	default: async ({ request, cookies, locals }) => {
		const form = await superValidate(request, zod(loginSchema));

		if (!form.valid) {
			return message(form, 'Data tidak valid', { status: 400 });
		}

		const { email, password } = form.data;

		// Cari user berdasarkan email
		const userRows = await locals.db.select().from(users).where(eq(users.email, email));
		const user = userRows[0];

		if (!user) {
			return message(form, 'Email atau password salah', { status: 401 });
		}

		if (!user.is_active || user.deleted_at) {
			return message(form, 'Akun tidak aktif atau telah dihapus', { status: 403 });
		}

		const passwordValid = await bcrypt.compare(password, user.password_hash);
		if (!passwordValid) {
			return message(form, 'Email atau password salah', { status: 401 });
		}

		// Buat session Lucia
		const session = await lucia.createSession(String(user.id), {});
		const sessionCookie = lucia.createSessionCookie(session.id);

		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: sessionCookie.attributes.path ?? '/',
			httpOnly: true,
			secure: sessionCookie.attributes.secure ?? true,
			sameSite: (sessionCookie.attributes.sameSite as 'lax' | 'strict' | 'none') ?? 'lax',
			maxAge: sessionCookie.attributes.maxAge
		});

		// Update last_login_at
		await locals.db
			.update(users)
			.set({ last_login_at: Date.now() })
			.where(eq(users.id, user.id));

		throw redirect(302, '/dashboard');
	}
};
