<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { fieldError, hasError } from '$lib/form-helpers';
	import { zodClient } from 'sveltekit-superforms/adapters/zod4';
	import { siswaCreateSchema } from '$lib/validation/siswa';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const _formData = $derived(() => data.form);
	const { form, errors, message, enhance, submitting, reset } = superForm(_formData, {
		validators: zodClient(siswaCreateSchema),
		onUpdated({ form: f }) {
			if (String(f.message).includes('berhasil')) {
				showAddModal = false;
				reset();
			}
		}
	});

	let showAddModal = $state(false);
	let editSiswa: (typeof data.siswas)[0] | null = $state(null);
	let deleteTarget: { id: number; name: string } | null = $state(null);

	function inputCls(err?: unknown) {
		const hasErr = Array.isArray(err) ? err.length > 0 : (err != null && typeof err === 'object' && '_errors' in err ? !!(err as any)._errors?.length : !!err);
		return `w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-colors ${
			hasErr ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
		}`;
	}
</script>

<svelte:head>
	<title>Manajemen Siswa — SIS</title>
</svelte:head>

<div class="max-w-6xl">
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-xl font-bold text-gray-900">Manajemen Siswa</h1>
			<p class="text-sm text-gray-500 mt-0.5">Kelola data siswa di sekolah Anda</p>
		</div>
		<button
			onclick={() => (showAddModal = true)}
			class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
		>
			+ Tambah Siswa
		</button>
	</div>

	<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
		{#if data.siswas.length === 0}
			<div class="py-16 text-center text-gray-400 text-sm">Belum ada siswa terdaftar.</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead class="bg-gray-50 border-b border-gray-200">
						<tr>
							<th class="text-left px-5 py-3 font-medium text-gray-500">Nama</th>
							<th class="text-left px-5 py-3 font-medium text-gray-500">Email</th>
							<th class="text-left px-5 py-3 font-medium text-gray-500">NIS</th>
							<th class="text-left px-5 py-3 font-medium text-gray-500">Kelas</th>
							<th class="text-left px-5 py-3 font-medium text-gray-500">L/P</th>
							<th class="text-left px-5 py-3 font-medium text-gray-500">Status</th>
							<th class="text-right px-5 py-3 font-medium text-gray-500">Aksi</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100">
						{#each data.siswas as siswa (siswa.id)}
							<tr class="hover:bg-gray-50 transition-colors">
								<td class="px-5 py-3.5 font-medium text-gray-900">{siswa.name}</td>
								<td class="px-5 py-3.5 text-gray-500">{siswa.email}</td>
								<td class="px-5 py-3.5 text-gray-500 font-mono text-xs">{siswa.nis ?? '—'}</td>
								<td class="px-5 py-3.5 text-gray-500">{siswa.class_name ?? '—'}</td>
								<td class="px-5 py-3.5 text-gray-500">{siswa.gender ?? '—'}</td>
								<td class="px-5 py-3.5">
									{#if siswa.is_active}
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
									<button onclick={() => (editSiswa = siswa)} class="text-xs text-blue-600 hover:text-blue-800 font-medium">Edit</button>
									<button onclick={() => (deleteTarget = { id: siswa.id, name: siswa.name })} class="text-xs text-red-500 hover:text-red-700 font-medium">Hapus</button>
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
		<div class="bg-white rounded-2xl shadow-xl w-full max-w-full sm:max-w-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between mb-5">
				<h2 class="text-lg font-bold text-gray-900">Tambah Siswa</h2>
				<button onclick={() => (showAddModal = false)} class="text-gray-400 hover:text-gray-600">✕</button>
			</div>
			{#if $message}
				<div class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{$message}</div>
			{/if}
			<form method="POST" action="?/create" use:enhance class="space-y-4">
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div class="col-span-2">
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
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">NIS</label>
						<input name="nis" bind:value={$form.nis} type="text" class={inputCls()} />
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">NISN</label>
						<input name="nisn" bind:value={$form.nisn} type="text" class={inputCls()} />
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
						<select name="class_id" bind:value={$form.class_id} class={inputCls()}>
							<option value="">— Pilih Kelas —</option>
							{#each data.kelas as k (k.id)}
								<option value={k.id}>{k.name}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
						<select name="gender" bind:value={$form.gender} class={inputCls()}>
							<option value="">— Pilih —</option>
							<option value="L">Laki-laki</option>
							<option value="P">Perempuan</option>
						</select>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label>
						<input name="birth_date" bind:value={$form.birth_date} type="date" class={inputCls()} />
					</div>
					<div class="col-span-2">
						<label class="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
						<textarea name="address" bind:value={$form.address} rows="2" class="{inputCls()} resize-none"></textarea>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Nama Orang Tua</label>
						<input name="parent_name" bind:value={$form.parent_name} type="text" class={inputCls()} />
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Telepon Orang Tua</label>
						<input name="parent_phone" bind:value={$form.parent_phone} type="text" class={inputCls()} />
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
						<select name="is_active" bind:value={$form.is_active} class={inputCls()}>
							<option value={1}>Aktif</option>
							<option value={0}>Nonaktif</option>
						</select>
					</div>
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
{#if editSiswa}
	{@const s = editSiswa}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
		<div class="bg-white rounded-2xl shadow-xl w-full max-w-full sm:max-w-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between mb-5">
				<h2 class="text-lg font-bold text-gray-900">Edit Siswa</h2>
				<button onclick={() => (editSiswa = null)} class="text-gray-400 hover:text-gray-600">✕</button>
			</div>
			<form method="POST" action="?/update" class="space-y-4">
				<input type="hidden" name="id" value={s.id} />
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div class="col-span-2">
						<label class="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
						<input name="name" value={s.name} type="text" class={inputCls()} />
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
						<input name="email" value={s.email} type="email" class={inputCls()} />
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Password Baru <span class="text-gray-400 font-normal">(kosongkan jika tidak diubah)</span></label>
						<input name="password" type="password" class={inputCls()} />
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">NIS</label>
						<input name="nis" value={s.nis ?? ''} type="text" class={inputCls()} />
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">NISN</label>
						<input name="nisn" value={s.nisn ?? ''} type="text" class={inputCls()} />
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
						<select name="class_id" class={inputCls()}>
							<option value="">— Pilih Kelas —</option>
							{#each data.kelas as k (k.id)}
								<option value={k.id} selected={s.class_id === k.id}>{k.name}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
						<select name="gender" class={inputCls()}>
							<option value="">— Pilih —</option>
							<option value="L" selected={s.gender === 'L'}>Laki-laki</option>
							<option value="P" selected={s.gender === 'P'}>Perempuan</option>
						</select>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label>
						<input name="birth_date" value={s.birth_date ?? ''} type="date" class={inputCls()} />
					</div>
					<div class="col-span-2">
						<label class="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
						<textarea name="address" rows="2" class="{inputCls()} resize-none">{s.address ?? ''}</textarea>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Nama Orang Tua</label>
						<input name="parent_name" value={s.parent_name ?? ''} type="text" class={inputCls()} />
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Telepon Orang Tua</label>
						<input name="parent_phone" value={s.parent_phone ?? ''} type="text" class={inputCls()} />
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
						<select name="is_active" class={inputCls()}>
							<option value={1} selected={s.is_active === 1}>Aktif</option>
							<option value={0} selected={s.is_active === 0}>Nonaktif</option>
						</select>
					</div>
				</div>
				<div class="flex justify-end gap-3 pt-2">
					<button type="button" onclick={() => (editSiswa = null)} class="px-4 py-2 text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors">Batal</button>
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
			<h2 class="text-lg font-bold text-gray-900 mb-2">Hapus Siswa?</h2>
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
