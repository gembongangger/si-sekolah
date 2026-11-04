<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { fieldError, hasError } from '$lib/form-helpers';
	import { zodClient } from 'sveltekit-superforms/adapters/zod4';
	import { guruCreateSchema } from '$lib/validation/guru';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const _formData = $derived(() => data.form);
	const { form, errors, message, enhance, submitting, reset } = superForm(_formData, {
		validators: zodClient(guruCreateSchema),
		onUpdated({ form: f }) {
			if (String(f.message).includes('berhasil')) {
				showAddModal = false;
				reset();
			}
		}
	});

	let showAddModal = $state(false);
	let editGuru: (typeof data.gurus)[0] | null = $state(null);
	let deleteTarget: { id: number; name: string } | null = $state(null);

	function inputCls(err?: unknown) {
		const hasErr = Array.isArray(err) ? err.length > 0 : (err != null && typeof err === 'object' && '_errors' in err ? !!(err as any)._errors?.length : !!err);
		return `w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-colors ${
			hasErr ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
		}`;
	}
</script>

<svelte:head>
	<title>Manajemen Guru — SIS</title>
</svelte:head>

<div class="max-w-5xl">
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-xl font-bold text-gray-900">Manajemen Guru</h1>
			<p class="text-sm text-gray-500 mt-0.5">Kelola data guru di sekolah Anda</p>
		</div>
		<button
			onclick={() => (showAddModal = true)}
			class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
		>
			+ Tambah Guru
		</button>
	</div>

	<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
		{#if data.gurus.length === 0}
			<div class="py-16 text-center text-gray-400 text-sm">Belum ada guru terdaftar.</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
				<thead class="bg-gray-50 border-b border-gray-200">
					<tr>
						<th class="text-left px-5 py-3 font-medium text-gray-500">Nama</th>
						<th class="text-left px-5 py-3 font-medium text-gray-500">Email</th>
						<th class="text-left px-5 py-3 font-medium text-gray-500">NIP</th>
						<th class="text-left px-5 py-3 font-medium text-gray-500">L/P</th>
						<th class="text-left px-5 py-3 font-medium text-gray-500">Status</th>
						<th class="text-right px-5 py-3 font-medium text-gray-500">Aksi</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100">
					{#each data.gurus as guru (guru.id)}
						<tr class="hover:bg-gray-50 transition-colors">
							<td class="px-5 py-3.5 font-medium text-gray-900">{guru.name}</td>
							<td class="px-5 py-3.5 text-gray-500">{guru.email}</td>
							<td class="px-5 py-3.5 text-gray-500 font-mono text-xs">{guru.nip ?? '—'}</td>
							<td class="px-5 py-3.5 text-gray-500">{guru.gender ?? '—'}</td>
							<td class="px-5 py-3.5">
								{#if guru.is_active}
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
								<button onclick={() => (editGuru = guru)} class="text-xs text-blue-600 hover:text-blue-800 font-medium">Edit</button>
								<button onclick={() => (deleteTarget = { id: guru.id, name: guru.name })} class="text-xs text-red-500 hover:text-red-700 font-medium">Hapus</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
			</div>
		{/if}
	</div>
</div>

<!-- MODAL TAMBAH -->
{#if showAddModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
		<div class="bg-white rounded-2xl shadow-xl w-full max-w-full sm:max-w-lg p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between mb-5">
				<h2 class="text-lg font-bold text-gray-900">Tambah Guru</h2>
				<button onclick={() => (showAddModal = false)} class="text-gray-400 hover:text-gray-600">✕</button>
			</div>
			{#if $message}
				<div class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{$message}</div>
			{/if}
			<form method="POST" action="?/create" use:enhance class="space-y-4">
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
					<input name="name" bind:value={$form.name} type="text" class={inputCls(hasError($errors.name) ? ['e'] : undefined)} />
					{#if $errors.name}<p class="mt-1 text-xs text-red-600">{fieldError($errors.name)}</p>{/if}
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
					<input name="email" bind:value={$form.email} type="email" class={inputCls(hasError($errors.email) ? ['e'] : undefined)} />
					{#if $errors.email}<p class="mt-1 text-xs text-red-600">{fieldError($errors.email)}</p>{/if}
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Password *</label>
					<input name="password" bind:value={$form.password} type="password" placeholder="Min. 8 karakter" class={inputCls(hasError($errors.password) ? ['e'] : undefined)} />
					{#if $errors.password}<p class="mt-1 text-xs text-red-600">{fieldError($errors.password)}</p>{/if}
				</div>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">NIP</label>
						<input name="nip" bind:value={$form.nip} type="text" class={inputCls()} />
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
						<select name="gender" bind:value={$form.gender} class={inputCls()}>
							<option value="">— Pilih —</option>
							<option value="L">Laki-laki</option>
							<option value="P">Perempuan</option>
						</select>
					</div>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
					<input name="phone" bind:value={$form.phone} type="text" class={inputCls()} />
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
					<select name="is_active" bind:value={$form.is_active} class={inputCls()}>
						<option value={1}>Aktif</option>
						<option value={0}>Nonaktif</option>
					</select>
				</div>
				<div class="flex justify-end gap-3 pt-2">
					<button type="button" onclick={() => (showAddModal = false)} class="px-4 py-2 text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors">Batal</button>
					<button type="submit" disabled={$submitting} class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors">
						{$submitting ? 'Menyimpan...' : 'Simpan'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- MODAL EDIT -->
{#if editGuru}
	{@const g = editGuru}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
		<div class="bg-white rounded-2xl shadow-xl w-full max-w-full sm:max-w-lg p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between mb-5">
				<h2 class="text-lg font-bold text-gray-900">Edit Guru</h2>
				<button onclick={() => (editGuru = null)} class="text-gray-400 hover:text-gray-600">✕</button>
			</div>
			<form method="POST" action="?/update" class="space-y-4">
				<input type="hidden" name="id" value={g.id} />
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
					<input name="name" value={g.name} type="text" class={inputCls()} />
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
					<input name="email" value={g.email} type="email" class={inputCls()} />
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Password Baru <span class="text-gray-400 font-normal">(kosongkan jika tidak diubah)</span></label>
					<input name="password" type="password" class={inputCls()} />
				</div>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">NIP</label>
						<input name="nip" value={g.nip ?? ''} type="text" class={inputCls()} />
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
						<select name="gender" class={inputCls()}>
							<option value="">— Pilih —</option>
							<option value="L" selected={g.gender === 'L'}>Laki-laki</option>
							<option value="P" selected={g.gender === 'P'}>Perempuan</option>
						</select>
					</div>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
					<input name="phone" value={g.phone ?? ''} type="text" class={inputCls()} />
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
					<select name="is_active" class={inputCls()}>
						<option value={1} selected={g.is_active === 1}>Aktif</option>
						<option value={0} selected={g.is_active === 0}>Nonaktif</option>
					</select>
				</div>
				<div class="flex justify-end gap-3 pt-2">
					<button type="button" onclick={() => (editGuru = null)} class="px-4 py-2 text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors">Batal</button>
					<button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Simpan Perubahan</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- MODAL HAPUS -->
{#if deleteTarget}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
		<div class="bg-white rounded-2xl shadow-xl w-full max-w-full sm:max-w-sm p-4 sm:p-6">
			<h2 class="text-lg font-bold text-gray-900 mb-2">Hapus Guru?</h2>
			<p class="text-sm text-gray-500 mb-6">
				Akun <strong>{deleteTarget.name}</strong> akan dihapus. Tindakan ini tidak dapat dibatalkan.
			</p>
			<div class="flex justify-end gap-3">
				<button onclick={() => (deleteTarget = null)} class="px-4 py-2 text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors">Batal</button>
				<form method="POST" action="?/delete">
					<input type="hidden" name="id" value={deleteTarget.id} />
					<button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">Ya, Hapus</button>
				</form>
			</div>
		</div>
	</div>
{/if}
