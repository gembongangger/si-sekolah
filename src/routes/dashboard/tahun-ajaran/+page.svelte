<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { fieldError, hasError } from '$lib/form-helpers';
	import { zodClient } from 'sveltekit-superforms/adapters/zod4';
	import { academicYearSchema } from '$lib/validation/academic-year';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const { form, errors, message, enhance, submitting, reset } = superForm(data.form, {
		validators: zodClient(academicYearSchema),
		onUpdated({ form: f }) {
			if (String(f.message).includes('berhasil')) {
				showAddModal = false;
				reset();
			}
		}
	});

	let showAddModal = $state(false);
	let editYear: (typeof data.academicYears)[0] | null = $state(null);
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

	const semesterLabel: Record<string, string> = {
		ganjil: 'Ganjil',
		genap: 'Genap'
	};
</script>

<svelte:head>
	<title>Tahun Ajaran — SIS</title>
</svelte:head>

<div class="max-w-5xl">
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-xl font-bold text-gray-900">Tahun Ajaran</h1>
			<p class="text-sm text-gray-500 mt-0.5">Kelola tahun ajaran dan semester aktif</p>
		</div>
		<button
			onclick={() => (showAddModal = true)}
			class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
		>
			+ Tambah Tahun Ajaran
		</button>
	</div>

	<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
		{#if data.academicYears.length === 0}
			<div class="py-16 text-center text-gray-400 text-sm">Belum ada tahun ajaran terdaftar.</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
				<thead class="bg-gray-50 border-b border-gray-200">
					<tr>
						<th class="text-left px-5 py-3 font-medium text-gray-500">Nama</th>
						<th class="text-left px-5 py-3 font-medium text-gray-500">Semester</th>
						<th class="text-left px-5 py-3 font-medium text-gray-500">Periode</th>
						<th class="text-left px-5 py-3 font-medium text-gray-500">Status</th>
						<th class="text-right px-5 py-3 font-medium text-gray-500">Aksi</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100">
					{#each data.academicYears as ay (ay.id)}
						<tr class="hover:bg-gray-50 transition-colors">
							<td class="px-5 py-3.5 font-medium text-gray-900">{ay.name}</td>
							<td class="px-5 py-3.5 text-gray-600">{semesterLabel[ay.semester] ?? ay.semester}</td>
							<td class="px-5 py-3.5 text-gray-500 text-sm">{ay.start_date} — {ay.end_date}</td>
							<td class="px-5 py-3.5">
								{#if ay.is_active}
									<span class="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
										<span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>Aktif
									</span>
								{:else}
									<span class="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
										<span class="w-1.5 h-1.5 rounded-full bg-gray-400"></span>Nonaktif
									</span>
								{/if}
							</td>
							<td class="px-5 py-3.5 text-right space-x-3">
								<button
									onclick={() => (editYear = ay)}
									class="text-xs text-blue-600 hover:text-blue-800 font-medium"
								>Edit</button>
								<button
									onclick={() => (deleteTarget = { id: ay.id, name: ay.name })}
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
					<h2 class="text-lg font-bold text-gray-900">Tambah Tahun Ajaran</h2>
					<button onclick={() => (showAddModal = false)} class="text-gray-400 hover:text-gray-600">✕</button>
				</div>

				{#if $message}
					<div class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
						{$message}
					</div>
				{/if}

				<form method="POST" action="?/create" use:enhance class="space-y-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Nama Tahun Ajaran *</label>
						<input name="name" bind:value={$form.name} type="text" placeholder="Contoh: 2024/2025" class={inputCls(hasError($errors.name) ? ['e'] : undefined)} />
						{#if $errors.name}<p class="mt-1 text-xs text-red-600">{fieldError($errors.name)}</p>{/if}
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Semester *</label>
						<select name="semester" bind:value={$form.semester} class={inputCls(hasError($errors.semester) ? ['e'] : undefined)}>
							<option value="ganjil">Ganjil</option>
							<option value="genap">Genap</option>
						</select>
						{#if $errors.semester}<p class="mt-1 text-xs text-red-600">{fieldError($errors.semester)}</p>{/if}
					</div>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai *</label>
							<input name="start_date" bind:value={$form.start_date} type="date" class={inputCls(hasError($errors.start_date) ? ['e'] : undefined)} />
							{#if $errors.start_date}<p class="mt-1 text-xs text-red-600">{fieldError($errors.start_date)}</p>{/if}
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Selesai *</label>
							<input name="end_date" bind:value={$form.end_date} type="date" class={inputCls(hasError($errors.end_date) ? ['e'] : undefined)} />
							{#if $errors.end_date}<p class="mt-1 text-xs text-red-600">{fieldError($errors.end_date)}</p>{/if}
						</div>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
						<select name="is_active" bind:value={$form.is_active} class={inputCls()}>
							<option value={0}>Nonaktif</option>
							<option value={1}>Aktif</option>
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
	{#if editYear}
		{@const ay = editYear}
		<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
			<div class="bg-white rounded-2xl shadow-xl w-full max-w-full sm:max-w-lg p-4 sm:p-6">
				<div class="flex items-center justify-between mb-5">
					<h2 class="text-lg font-bold text-gray-900">Edit Tahun Ajaran</h2>
					<button onclick={() => (editYear = null)} class="text-gray-400 hover:text-gray-600">✕</button>
				</div>

				<form method="POST" action="?/update" class="space-y-4">
					<input type="hidden" name="id" value={ay.id} />
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Nama Tahun Ajaran *</label>
						<input name="name" value={ay.name} type="text" class={inputCls()} />
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Semester *</label>
						<select name="semester" class={inputCls()}>
							<option value="ganjil" selected={ay.semester === 'ganjil'}>Ganjil</option>
							<option value="genap" selected={ay.semester === 'genap'}>Genap</option>
						</select>
					</div>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai *</label>
							<input name="start_date" value={ay.start_date} type="date" class={inputCls()} />
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Selesai *</label>
							<input name="end_date" value={ay.end_date} type="date" class={inputCls()} />
						</div>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
						<select name="is_active" class={inputCls()}>
							<option value={0} selected={ay.is_active === 0}>Nonaktif</option>
							<option value={1} selected={ay.is_active === 1}>Aktif</option>
						</select>
					</div>
					<div class="flex justify-end gap-3 pt-2">
						<button type="button" onclick={() => (editYear = null)} class="px-4 py-2 text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors">
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
				<h2 class="text-lg font-bold text-gray-900 mb-2">Hapus Tahun Ajaran?</h2>
				<p class="text-sm text-gray-500 mb-6">
					Tahun ajaran <strong>{deleteTarget.name}</strong> akan dihapus. Tindakan ini tidak dapat dibatalkan.
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
