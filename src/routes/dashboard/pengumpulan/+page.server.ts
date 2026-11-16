import { error, redirect } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters/zod4';
import type { PageServerLoad, Actions } from './$types';
import { requireAdminSekolah, requireRole } from '$lib/server/auth/guard';
import {
	collectionProjects,
	collectionProjectTargets,
	collectionSubmissions,
	teachers,
	users
} from '$lib/server/db/schema';
import { eq, and, isNull, desc, inArray } from 'drizzle-orm';
import { collectionProjectSchema } from '$lib/validation/pengumpulan';

type TeacherRow = { id: number; name: string; nip: string | null };

/** Ambil guru yang menjadi target sebuah proyek. */
function resolveExpectedTeachers(
	projectId: number,
	targets: { project_id: number; target_type: string; target_id: number | null }[],
	allTeachers: TeacherRow[]
) {
	const pt = targets.filter((t) => t.project_id === projectId);
	if (pt.some((t) => t.target_type === 'all')) return allTeachers;
	const ids = new Set(pt.filter((t) => t.target_type === 'teacher').map((t) => t.target_id));
	return allTeachers.filter((t) => ids.has(t.id));
}

function parseTargetIds(formData: FormData) {
	return [
		...new Set(
			formData
				.getAll('target_ids')
				.map((v) => Number(v))
				.filter((n) => Number.isInteger(n) && n > 0)
		)
	];
}

async function saveTargets(
	db: App.Locals['db'],
	projectId: number,
	targetType: string,
	targetIds: number[]
) {
	await db.delete(collectionProjectTargets).where(eq(collectionProjectTargets.project_id, projectId));
	if (targetType === 'all') {
		await db.insert(collectionProjectTargets).values({
			project_id: projectId,
			target_type: 'all',
			target_id: null
		});
	} else {
		await db.insert(collectionProjectTargets).values(
			targetIds.map((id) => ({ project_id: projectId, target_type: 'teacher', target_id: id }))
		);
	}
}

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireRole(locals.user, 'admin_sekolah', 'guru');
	const db = locals.db;
	const schoolId = user.schoolId!;
	const isAdmin = user.role === 'admin_sekolah';

	const allTeachers: TeacherRow[] = await db
		.select({ id: teachers.id, name: users.name, nip: teachers.nip })
		.from(teachers)
		.innerJoin(users, eq(users.id, teachers.user_id))
		.where(and(eq(teachers.school_id, schoolId), isNull(users.deleted_at)))
		.orderBy(users.name);

	if (!isAdmin) {
		const [me] = await db
			.select({ id: teachers.id })
			.from(teachers)
			.where(and(eq(teachers.user_id, user.userId), eq(teachers.school_id, schoolId)));

		if (!me)
			return {
				isAdmin,
				teacherId: null,
				classes: [],
				teachers: allTeachers,
				projects: [],
				form: await superValidate(zod(collectionProjectSchema))
			};

		const projectRows = await db
			.select()
			.from(collectionProjects)
			.where(
				and(
					eq(collectionProjects.school_id, schoolId),
					eq(collectionProjects.is_active, 1),
					isNull(collectionProjects.deleted_at)
				)
			)
			.orderBy(desc(collectionProjects.created_at));

		const ids = projectRows.map((p) => p.id);
		const targets = ids.length
			? await db
					.select()
					.from(collectionProjectTargets)
					.where(inArray(collectionProjectTargets.project_id, ids))
			: [];
		const subs = ids.length
			? await db
					.select()
					.from(collectionSubmissions)
					.where(
						and(
							inArray(collectionSubmissions.project_id, ids),
							eq(collectionSubmissions.teacher_id, me.id)
						)
					)
			: [];

		const expected = projectRows.filter((p) => {
			const pt = targets.filter((t) => t.project_id === p.id);
			return pt.some(
				(t) => t.target_type === 'all' || (t.target_type === 'teacher' && t.target_id === me.id)
			);
		});

		return {
			isAdmin,
			teacherId: me.id,
			classes: [],
			teachers: allTeachers,
			projects: expected.map((p) => {
				const sub = subs.find((s) => s.project_id === p.id);
				return {
					...p,
					target_type: 'all',
					target_ids: [] as number[],
					total: 0,
					submitted_count: 0,
					teachers: [],
					submitted: !!sub,
					submitted_at: sub?.submitted_at ?? null,
					file_url: sub?.file_url ?? null,
					note: sub?.note ?? null
				};
			}),
			form: await superValidate(zod(collectionProjectSchema))
		};
	}

	// Admin
	const projectRows = await db
		.select()
		.from(collectionProjects)
		.where(and(eq(collectionProjects.school_id, schoolId), isNull(collectionProjects.deleted_at)))
		.orderBy(desc(collectionProjects.created_at));

	const ids = projectRows.map((p) => p.id);
	const targets = ids.length
		? await db
				.select()
				.from(collectionProjectTargets)
				.where(inArray(collectionProjectTargets.project_id, ids))
		: [];
	const submissions = ids.length
		? await db
				.select()
				.from(collectionSubmissions)
				.where(inArray(collectionSubmissions.project_id, ids))
		: [];

	const projects = projectRows.map((p) => {
		const pt = targets.filter((t) => t.project_id === p.id);
		const expected = resolveExpectedTeachers(p.id, targets, allTeachers);
		const subs = submissions.filter((s) => s.project_id === p.id);
		const subMap = new Map(subs.map((s) => [s.teacher_id, s]));
		const teacherReport = expected.map((t) => {
			const sub = subMap.get(t.id);
			return {
				teacher_id: t.id,
				name: t.name,
				nip: t.nip,
				submitted: !!sub,
				submitted_at: sub?.submitted_at ?? null,
				file_url: sub?.file_url ?? null,
				note: sub?.note ?? null
			};
		});
		return {
			...p,
			target_type: pt.some((t) => t.target_type === 'all') ? 'all' : 'teacher',
			target_ids: pt
				.filter((t) => t.target_type === 'teacher' && t.target_id != null)
				.map((t) => t.target_id as number),
			total: teacherReport.length,
			submitted_count: teacherReport.filter((t) => t.submitted).length,
			teachers: teacherReport,
			submitted: false,
			submitted_at: null,
			file_url: null,
			note: null
		};
	});

	const form = await superValidate(zod(collectionProjectSchema));

	return {
		isAdmin,
		teacherId: null,
		classes: [],
		teachers: allTeachers,
		projects,
		form
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const user = requireAdminSekolah(locals.user);
		const db = locals.db;
		const schoolId = user.schoolId;

		const formData = await request.formData();
		const form = await superValidate(formData, zod(collectionProjectSchema));
		const targetIds = parseTargetIds(formData);
		if (form.data.target_type === 'teacher' && targetIds.length === 0) {
			return message(form, 'Pilih minimal satu guru target', { status: 400 });
		}
		if (!form.valid) return message(form, 'Data tidak valid', { status: 400 });

		const now = Date.now();
		const [created] = await db
			.insert(collectionProjects)
			.values({
				school_id: schoolId,
				title: form.data.title,
				description: form.data.description || null,
				deadline: form.data.deadline || null,
				is_active: form.data.is_active,
				created_by: user.userId,
				created_at: now,
				updated_at: now
			})
			.returning({ id: collectionProjects.id });

		await saveTargets(db, created.id, form.data.target_type, targetIds);

		return message(form, 'Proyek berhasil diterbitkan');
	},

	update: async ({ request, locals }) => {
		requireAdminSekolah(locals.user);
		const db = locals.db;

		const formData = await request.formData();
		const id = Number(formData.get('id'));
		if (!id) throw error(400, 'ID tidak valid');

		const form = await superValidate(formData, zod(collectionProjectSchema));
		const targetIds = parseTargetIds(formData);
		if (form.data.target_type === 'teacher' && targetIds.length === 0) {
			return message(form, 'Pilih minimal satu guru target', { status: 400 });
		}
		if (!form.valid) return message(form, 'Data tidak valid', { status: 400 });

		await db
			.update(collectionProjects)
			.set({
				title: form.data.title,
				description: form.data.description || null,
				deadline: form.data.deadline || null,
				is_active: form.data.is_active,
				updated_at: Date.now()
			})
			.where(eq(collectionProjects.id, id));

		await saveTargets(db, id, form.data.target_type, targetIds);

		return message(form, 'Proyek berhasil diperbarui');
	},

	delete: async ({ request, locals }) => {
		requireAdminSekolah(locals.user);
		const formData = await request.formData();
		const id = Number(formData.get('id'));
		if (!id) throw error(400, 'ID tidak valid');

		await locals.db
			.update(collectionProjects)
			.set({ deleted_at: Date.now() })
			.where(eq(collectionProjects.id, id));

		throw redirect(303, '/dashboard/pengumpulan');
	},

	submit: async ({ request, locals }) => {
		const user = requireRole(locals.user, 'guru');
		const db = locals.db;
		const schoolId = user.schoolId!;

		const formData = await request.formData();
		const projectId = Number(formData.get('project_id'));
		const fileUrl = String(formData.get('file_url') ?? '').trim();
		const note = String(formData.get('note') ?? '').trim();
		if (!projectId) throw error(400, 'Proyek tidak valid');
		try {
			new URL(fileUrl);
		} catch {
			throw error(400, 'Link berkas wajib diisi dengan URL valid');
		}

		const [me] = await db
			.select({ id: teachers.id })
			.from(teachers)
			.where(and(eq(teachers.user_id, user.userId), eq(teachers.school_id, schoolId)));
		if (!me) throw error(403, 'Data guru tidak ditemukan');

		const now = Date.now();
		await db
			.insert(collectionSubmissions)
			.values({
				school_id: schoolId,
				project_id: projectId,
				teacher_id: me.id,
				file_url: fileUrl,
				note: note || null,
				submitted_at: now
			})
			.onConflictDoUpdate({
				target: [collectionSubmissions.project_id, collectionSubmissions.teacher_id],
				set: { file_url: fileUrl, note: note || null, submitted_at: now }
			});

		return { success: true, message: 'Pengumpulan berhasil dicatat' };
	}
};
