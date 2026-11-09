<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { fieldError, hasError } from '$lib/form-helpers';
	import { zodClient } from 'sveltekit-superforms/adapters/zod4';
	import { sanctionSchema } from '$lib/validation/sanction';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const { form, errors, message, enhance, submitting, reset } = superForm(data.form, {
		validators: zodClient(sanctionSchema),
		onUpdated({ form: f }) {
			if (String(f.message).includes('berhasil')) {
				showAddModal = false;
				reset();
			}
		}
	});

	let showAddModal = $state(false);
	let editSanction: (typeof data.sanctions)[0] | null = $state(null);
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
	<title>Sanksi Poin — SIS</title>
</svelte:head>

<div class="max-w-5xl">
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-xl font-bold text-gray-900">Sanksi Poin Pelanggaran</h1>
			<p class="text-sm text-gray-500 mt-0.5">
				Tentukan sanksi berdasarkan jumlah poin pelanggaran siswa
			</p>
		</div>
		<button
			onclick={() => (showAddModal = true)}
			class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
		>
			+ Tambah Sanksi
		</button>
	</div>

	<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
		{#if data.sanctions.length === 0}
			<div class="py-16 text-center text-gray-400 text-sm">Belum ada sanksi terdaftar.</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
				<thead class="bg-gray-50 border-b border-gray-200">
					<tr>
						<th class="text-left px-5 py-3 font-medium text-gray-500">Rentang Poin</th>
						<th class="text-left px-5 py-3 font-medium text-gray-500">Nama Sanksi</th>
						<th class="text-left px-5 py-3 font-medium text-gray-500">Tindakan</th>
						<th class="text-right px-5 py-3 font-medium text-gray-500">Aksi</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100">
					{#each data.sanctions as s (s.id)}
						<tr class="hover:bg-gray-50 transition-colors">
							<td class="px-5 py-3.5 font-medium text-gray-900">
								{s.min_points} – {s.max_points} poin
							</td>
							<td class="px-5 py-3.5 text-gray-700">{s.name}</td>
							<td class="px-5 py-3.5 text-gray-600">{s.action}</td>
							<td class="px-5 py-3.5 text-right space-x-3">
								<button
									onclick={() => (editSanction = s)}
									class="text-xs text-blue-600 hover:text-blue-800 font-medium"
								>Edit</button>
								<button
									onclick={() => (deleteTarget = { id: s.id, name: s.name })}
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
					<h2 class="text-lg font-bold text-gray-900">Tambah Sanksi</h2>
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
							<label class="block text-sm font-medium text-gray-700 mb-1">Poin Minimal *</label>
							<input name="min_points" bind:value={$form.min_points} type="number" min="0" placeholder="0" class={inputCls(hasError($errors.min_points) ? ['e'] : undefined)} />
							{#if $errors.min_points}<p class="mt-1 text-xs text-red-600">{fieldError($errors.min_points)}</p>{/if}
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Poin Maksimal *</label>
							<input name="max_points" bind:value={$form.max_points} type="number" min="0" placeholder="100" class={inputCls(hasError($errors.max_points) ? ['e'] : undefined)} />
							{#if $errors.max_points}<p class="mt-1 text-xs text-red-600">{fieldError($errors.max_points)}</p>{/if}
						</div>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Nama Sanksi *</label>
						<input name="name" bind:value={$form.name} type="text" placeholder="Contoh: Panggilan Orang Tua" class={inputCls(hasError($errors.name) ? ['e'] : undefined)} />
						{#if $errors.name}<p class="mt-1 text-xs text-red-600">{fieldError($errors.name)}</p>{/if}
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Tindakan *</label>
						<input name="action" bind:value={$form.action} type="text" placeholder="Contoh: Panggilan wali murid ke sekolah" class={inputCls(hasError($errors.action) ? ['e'] : undefined)} />
						{#if $errors.action}<p class="mt-1 text-xs text-red-600">{fieldError($errors.action)}</p>{/if}
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
	{#if editSanction}
		{@const s = editSanction}
		<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
			<div class="bg-white rounded-2xl shadow-xl w-full max-w-full sm:max-w-lg p-4 sm:p-6">
				<div class="flex items-center justify-between mb-5">
					<h2 class="text-lg font-bold text-gray-900">Edit Sanksi</h2>
					<button onclick={() => (editSanction = null)} class="text-gray-400 hover:text-gray-600">✕</button>
				</div>

				<form method="POST" action="?/update" class="space-y-4">
					<input type="hidden" name="id" value={s.id} />
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Poin Minimal *</label>
							<input name="min_points" value={s.min_points} type="number" min="0" class={inputCls()} />
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Poin Maksimal *</label>
							<input name="max_points" value={s.max_points} type="number" min="0" class={inputCls()} />
						</div>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Nama Sanksi *</label>
						<input name="name" value={s.name} type="text" class={inputCls()} />
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Tindakan *</label>
						<input name="action" value={s.action} type="text" class={inputCls()} />
					</div>
					<div class="flex justify-end gap-3 pt-2">
						<button type="button" onclick={() => (editSanction = null)} class="px-4 py-2 text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors">
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
				<h2 class="text-lg font-bold text-gray-900 mb-2">Hapus Sanksi?</h2>
				<p class="text-sm text-gray-500 mb-6">
					Sanksi <strong>{deleteTarget.name}</strong> akan dihapus. Tindakan ini tidak dapat dibatalkan.
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
