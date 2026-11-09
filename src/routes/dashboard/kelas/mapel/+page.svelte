<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { fieldError, hasError } from '$lib/form-helpers';
	import { zodClient } from 'sveltekit-superforms/adapters/zod4';
	import { classSubjectSchema } from '$lib/validation/class-subject';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const { form, errors, message, enhance, submitting, reset } = superForm(data.form, {
		validators: zodClient(classSubjectSchema),
		onUpdated({ form: f }) {
			if (String(f.message).includes('berhasil')) {
				showAddModal = false;
				reset();
			}
		}
	});

	let showAddModal = $state(false);
	let editRelasi: (typeof data.classSubjects)[0] | null = $state(null);
	let deleteTarget: { id: number; name: string } | null = $state(null);

	function inputCls(err?: unknown) {
		const hasErr = Array.isArray(err)
			? err.length > 0
			: err != null && typeof err === 'object' && '_errors' in err
				? !!(err as any)._errors?.length
				: !!err;
		return `w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-colors ${
			hasErr ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
		}`;
	}
</script>

<svelte:head>
	<title>Kelas & Mata Pelajaran — SIS</title>
</svelte:head>

<div class="max-w-6xl">
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-xl font-bold text-gray-900">Kelas & Mata Pelajaran</h1>
			<p class="text-sm text-gray-500 mt-0.5">
				Tentukan siapa guru yang mengajar mata pelajaran apa di kelas mana
			</p>
		</div>
		<button
			onclick={() => (showAddModal = true)}
			class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
		>
			+ Tambah Relasi
		</button>
	</div>

	<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
		{#if data.classSubjects.length === 0}
			<div class="py-16 text-center text-gray-400 text-sm">Belum ada relasi kelas-mapel-guru.</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
				<thead class="bg-gray-50 border-b border-gray-200">
					<tr>
						<th class="text-left px-5 py-3 font-medium text-gray-500">Kelas</th>
						<th class="text-left px-5 py-3 font-medium text-gray-500">Mata Pelajaran</th>
						<th class="text-left px-5 py-3 font-medium text-gray-500">Guru</th>
						<th class="text-left px-5 py-3 font-medium text-gray-500">Tahun Ajaran</th>
						<th class="text-right px-5 py-3 font-medium text-gray-500">Aksi</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100">
					{#each data.classSubjects as cs (cs.id)}
						<tr class="hover:bg-gray-50 transition-colors">
							<td class="px-5 py-3.5 font-medium text-gray-900">
								{cs.class_name} ({cs.class_level})
							</td>
							<td class="px-5 py-3.5 text-gray-600">
								[{cs.subject_code}] {cs.subject_name}
							</td>
							<td class="px-5 py-3.5 text-gray-600">{cs.teacher_name}</td>
							<td class="px-5 py-3.5 text-gray-600 text-sm">
								{cs.academic_year_name} — Semester {cs.academic_year_semester}
							</td>
							<td class="px-5 py-3.5 text-right space-x-3">
								<button
									onclick={() => (editRelasi = cs)}
									class="text-xs text-blue-600 hover:text-blue-800 font-medium"
								>Edit</button>
								<button
									onclick={() => (deleteTarget = { id: cs.id, name: cs.class_name ?? '—' })}
									class="text-xs text-red-500 hover:text-red-700 font-medium"
								>Hapus</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
			</div>
		{/if}
	</div>

	<!-- MODAL TAMBAH -->
	{#if showAddModal}
		<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
			<div class="bg-white rounded-2xl shadow-xl w-full max-w-full sm:max-w-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
				<div class="flex items-center justify-between mb-5">
					<h2 class="text-lg font-bold text-gray-900">Tambah Relasi Kelas–Mapel–Guru</h2>
					<button onclick={() => (showAddModal = false)} class="text-gray-400 hover:text-gray-600">✕</button>
				</div>

				{#if $message}
					<div class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
						{$message}
					</div>
				{/if}

				<form method="POST" action="?/create" use:enhance class="space-y-4">
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Kelas *</label>
							<select name="class_id" bind:value={$form.class_id} class={inputCls(hasError($errors.class_id) ? ['e'] : undefined)}>
								<option value="">— Pilih Kelas —</option>
								{#each data.classes as c (c.id)}
									<option value={c.id}>{c.name} (Tingkat {c.level})</option>
								{/each}
							</select>
							{#if $errors.class_id}<p class="mt-1 text-xs text-red-600">{fieldError($errors.class_id)}</p>{/if}
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran *</label>
							<select name="subject_id" bind:value={$form.subject_id} class={inputCls(hasError($errors.subject_id) ? ['e'] : undefined)}>
								<option value="">— Pilih Mata Pelajaran —</option>
								{#each data.subjects as s (s.id)}
									<option value={s.id}>[{s.code}] {s.name}</option>
								{/each}
							</select>
							{#if $errors.subject_id}<p class="mt-1 text-xs text-red-600">{fieldError($errors.subject_id)}</p>{/if}
						</div>
					</div>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Guru *</label>
							<select name="teacher_id" bind:value={$form.teacher_id} class={inputCls(hasError($errors.teacher_id) ? ['e'] : undefined)}>
								<option value="">— Pilih Guru —</option>
								{#each data.teachers as t (t.id)}
									<option value={t.id}>{t.name}</option>
								{/each}
							</select>
							{#if $errors.teacher_id}<p class="mt-1 text-xs text-red-600">{fieldError($errors.teacher_id)}</p>{/if}
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Tahun Ajaran *</label>
							<select name="academic_year_id" bind:value={$form.academic_year_id} class={inputCls(hasError($errors.academic_year_id) ? ['e'] : undefined)}>
								<option value="">— Pilih Tahun Ajaran —</option>
								{#each data.academicYears as ay (ay.id)}
									<option value={ay.id}>{ay.name} — Semester {ay.semester}</option>
								{/each}
							</select>
							{#if $errors.academic_year_id}<p class="mt-1 text-xs text-red-600">{fieldError($errors.academic_year_id)}</p>{/if}
						</div>
					</div>
					<div class="flex justify-end gap-3 pt-2">
						<button type="button" onclick={() => (showAddModal = false)} class="px-4 py-2 text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors">
							Batal
						</button>
						<button type="submit" disabled={$submitting} class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors">
							{$submitting ? 'Menyimpan...' : 'Simpan'}
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- MODAL EDIT -->
	{#if editRelasi}
		{@const cs = editRelasi}
		<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
			<div class="bg-white rounded-2xl shadow-xl w-full max-w-full sm:max-w-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
				<div class="flex items-center justify-between mb-5">
					<h2 class="text-lg font-bold text-gray-900">Edit Relasi</h2>
					<button onclick={() => (editRelasi = null)} class="text-gray-400 hover:text-gray-600">✕</button>
				</div>

				<form method="POST" action="?/update" class="space-y-4">
					<input type="hidden" name="id" value={cs.id} />
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Kelas *</label>
							<select name="class_id" class={inputCls()}>
								<option value="">— Pilih Kelas —</option>
								{#each data.classes as c (c.id)}
									<option value={c.id} selected={cs.class_id === c.id}>{c.name} (Tingkat {c.level})</option>
								{/each}
							</select>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran *</label>
							<select name="subject_id" class={inputCls()}>
								<option value="">— Pilih Mata Pelajaran —</option>
								{#each data.subjects as s (s.id)}
									<option value={s.id} selected={cs.subject_id === s.id}>[{s.code}] {s.name}</option>
								{/each}
							</select>
						</div>
					</div>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Guru *</label>
							<select name="teacher_id" class={inputCls()}>
								<option value="">— Pilih Guru —</option>
								{#each data.teachers as t (t.id)}
									<option value={t.id} selected={cs.teacher_id === t.id}>{t.name}</option>
								{/each}
							</select>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Tahun Ajaran *</label>
							<select name="academic_year_id" class={inputCls()}>
								<option value="">— Pilih Tahun Ajaran —</option>
								{#each data.academicYears as ay (ay.id)}
									<option value={ay.id} selected={cs.academic_year_id === ay.id}>{ay.name} — Semester {ay.semester}</option>
								{/each}
							</select>
						</div>
					</div>
					<div class="flex justify-end gap-3 pt-2">
						<button type="button" onclick={() => (editRelasi = null)} class="px-4 py-2 text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors">
							Batal
						</button>
						<button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
							Simpan Perubahan
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- MODAL HAPUS -->
	{#if deleteTarget}
		<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
			<div class="bg-white rounded-2xl shadow-xl w-full max-w-full sm:max-w-sm p-4 sm:p-6">
				<h2 class="text-lg font-bold text-gray-900 mb-2">Hapus Relasi?</h2>
				<p class="text-sm text-gray-500 mb-6">
					Relasi untuk <strong>{deleteTarget.name}</strong> akan dihapus. Tindakan ini tidak dapat dibatalkan.
				</p>
				<div class="flex justify-end gap-3">
					<button onclick={() => (deleteTarget = null)} class="px-4 py-2 text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors">
						Batal
					</button>
					<form method="POST" action="?/delete">
						<input type="hidden" name="id" value={deleteTarget.id} />
						<button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
							Ya, Hapus
						</button>
					</form>
				</div>
			</div>
		</div>
	{/if}
</div>
