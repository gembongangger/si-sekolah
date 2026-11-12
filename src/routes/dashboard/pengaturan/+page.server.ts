import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import type { PageServerLoad, Actions } from './$types';
import { requireAdminSekolah } from '$lib/server/auth/guard';
import { schools } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Format warna harus #RRGGBB');
const themeSchema = z.object({
	primary_color: hex,
	secondary_color: hex,
	accent_success: hex,
	accent_danger: hex,
	accent_warning: hex,
	accent_info: hex
});

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireAdminSekolah(locals.user);
	const [school] = await locals.db.select().from(schools).where(eq(schools.id, user.schoolId));
	if (!school) throw fail(404, { message: 'Sekolah tidak ditemukan' });
	return { school };
};

export const actions: Actions = {
	updateTheme: async ({ request, locals }) => {
		const user = requireAdminSekolah(locals.user);
		const formData = await request.formData();
		const parsed = themeSchema.safeParse(Object.fromEntries(formData));
		if (!parsed.success) {
			return fail(400, { success: false, message: 'Format warna tidak valid (#RRGGBB)' });
		}
		await locals.db
			.update(schools)
			.set({ ...parsed.data, updated_at: Date.now() })
			.where(eq(schools.id, user.schoolId));
		return { success: true, message: 'Warna tema berhasil disimpan' };
	}
};
