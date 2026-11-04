<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { fieldError, hasError } from '$lib/form-helpers';
	import { zodClient } from 'sveltekit-superforms/adapters/zod4';
	import { classSchema } from '$lib/validation/class';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const _formData = $derived(() => data.form);
	const { form, errors, message, enhance, submitting, reset } = superForm(_formData, {
		validators: zodClient(classSchema),
		onUpdated({ form: f }) {
			if (String(f.message).includes('berhasil')) {
				showAddModal = false;
				reset();
			}
		}
	});

	let showAddModal = $state(false);
	let editKelas: (typeof data.classes)[0] | null = $state(null);
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
	<title>Kelas & Mapel — SIS</title>
</svelte:head>

<div class="max-w-5xl">
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-xl font-bold text-gray-900">Kelas</h1>
			<p class="text-sm text-gray-500 mt-0.5">Kelola data kelas per tahun ajaran</p>
		</div>
		<button
			onclick={() => (showAddModal = true)}
			class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
		>
			+ Tambah Kelas
		</button>
	</div>

	<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
		{#if data.classes.length === 0}
			<div class="py-16 text-center text-gray-400 text-sm">Belum ada kelas terdaftar.</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
				<thead class="bg-gray-50 border-b border-gray-200">
					<tr>
						<th class="text-left px-5 py-3 font-medium text-gray-500">Nama Kelas</th>
						<th class="text-left px-5 py-3 font-medium text-gray-500">Tingkat</th>
						<th class="text-left px-5 py-3 font-medium text-gray-500">Tahun Ajaran</th>
						<th class="text-left px-5 py-3 font-medium text-gray-500">Wali Kelas</th>
						<th class="text-right px-5 py-3 font-medium text-gray-500">Aksi</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100">
					{#each data.classes as c (c.id)}
						<tr class="hover:bg-gray-50 transition-colors">
							<td class="px-5 py-3.5 font-medium text-gray-900">{c.name}</td>
							<td class="px-5 py-3.5 text-gray-600">{c.level}</td>
							<td class="px-5 py-3.5 text-gray-600 text-sm">{c.academic_year_name ?? '—'} ({c.academic_year_semester ?? '—'})</td>
							<td class="px-5 py-3.5 text-gray-600">{c.homeroom_teacher_name ?? '—'}</td>
							<td class="px-5 py-3.5 text-right space-x-3">
								<button
									onclick={() => (editKelas = c)}
									class="text-xs text-blue-600 hover:text-blue-800 font-medium"
								>Edit</button>
								<button
									onclick={() => (deleteTarget = { id: c.id, name: c.name })}
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
			<div class="bg-white rounded-2xl shadow-xl w-full max-w-full sm:max-w-lg p-4 sm:p-6">
				<div class="flex items-center justify-between mb-5">
					<h2 class="text-lg font-bold text-gray-900">Tambah Kelas</h2>
					<button onclick={() => (showAddModal = false)} class="text-gray-400 hover:text-gray-600">✕</button>
				</div>

				{#if $message}
					<div class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
						{$message}
					</div>
				{/if}

				<form method="POST" action="?/create" use:enhance class="space-y-4">
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
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Nama Kelas *</label>
						<input name="name" bind:value={$form.name} type="text" placeholder="Contoh: X IPA 1" class={inputCls(hasError($errors.name) ? ['e'] : undefined)} />
						{#if $errors.name}<p class="mt-1 text-xs text-red-600">{fieldError($errors.name)}</p>{/if}
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Tingkat *</label>
						<input name="level" bind:value={$form.level} type="text" placeholder="Contoh: 10" class={inputCls(hasError($errors.level) ? ['e'] : undefined)} />
						{#if $errors.level}<p class="mt-1 text-xs text-red-600">{fieldError($errors.level)}</p>{/if}
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Wali Kelas</label>
						<select name="homeroom_teacher_id" bind:value={$form.homeroom_teacher_id} class={inputCls()}>
							<option value="">— Pilih Guru —</option>
							{#each data.teachers as t (t.id)}
								<option value={t.id}>{t.name}</option>
							{/each}
						</select>
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
	{#if editKelas}
		{@const c = editKelas}
		<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
			<div class="bg-white rounded-2xl shadow-xl w-full max-w-full sm:max-w-lg p-4 sm:p-6">
				<div class="flex items-center justify-between mb-5">
					<h2 class="text-lg font-bold text-gray-900">Edit Kelas</h2>
					<button onclick={() => (editKelas = null)} class="text-gray-400 hover:text-gray-600">✕</button>
				</div>

				<form method="POST" action="?/update" class="space-y-4">
					<input type="hidden" name="id" value={c.id} />
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Tahun Ajaran *</label>
						<select name="academic_year_id" class={inputCls()}>
							<option value="">— Pilih Tahun Ajaran —</option>
							{#each data.academicYears as ay (ay.id)}
								<option value={ay.id} selected={c.academic_year_id === ay.id}>{ay.name} — Semester {ay.semester}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Nama Kelas *</label>
						<input name="name" value={c.name} type="text" class={inputCls()} />
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Tingkat *</label>
						<input name="level" value={c.level} type="text" class={inputCls()} />
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Wali Kelas</label>
						<select name="homeroom_teacher_id" class={inputCls()}>
							<option value="">— Pilih Guru —</option>
							{#each data.teachers as t (t.id)}
								<option value={t.id} selected={c.homeroom_teacher_id === t.id}>{t.name}</option>
							{/each}
						</select>
					</div>
					<div class="flex justify-end gap-3 pt-2">
						<button type="button" onclick={() => (editKelas = null)} class="px-4 py-2 text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors">
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
				<h2 class="text-lg font-bold text-gray-900 mb-2">Hapus Kelas?</h2>
				<p class="text-sm text-gray-500 mb-6">
					Kelas <strong>{deleteTarget.name}</strong> akan dihapus. Tindakan ini tidak dapat dibatalkan.
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
