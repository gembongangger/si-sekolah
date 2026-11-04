<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { fieldError, hasError } from '$lib/form-helpers';
	import { zodClient } from 'sveltekit-superforms/adapters/zod4';
	import { timeSlotSchema } from '$lib/validation/time-slot';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const _formData = $derived(() => data.form);
	const { form, errors, message, enhance, submitting, reset } = superForm(_formData, {
		validators: zodClient(timeSlotSchema),
		onUpdated({ form: f }) {
			if (String(f.message).includes('berhasil')) {
				showAddModal = false;
				reset();
			}
		}
	});

	let showAddModal = $state(false);
	let editSlot: (typeof data.timeSlots)[0] | null = $state(null);
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
	<title>Jam Pelajaran — SIS</title>
</svelte:head>

<div class="max-w-5xl">
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-xl font-bold text-gray-900">Jam Pelajaran</h1>
			<p class="text-sm text-gray-500 mt-0.5">
				Tentukan slot waktu pelajaran per hari dalam seminggu
			</p>
		</div>
		<button
			onclick={() => (showAddModal = true)}
			class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
		>
			+ Tambah Slot Waktu
		</button>
	</div>

	<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
		{#if data.timeSlots.length === 0}
			<div class="py-16 text-center text-gray-400 text-sm">Belum ada slot waktu terdaftar.</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
				<thead class="bg-gray-50 border-b border-gray-200">
					<tr>
						<th class="text-left px-5 py-3 font-medium text-gray-500">Hari</th>
						<th class="text-left px-5 py-3 font-medium text-gray-500">Slot ke-</th>
						<th class="text-left px-5 py-3 font-medium text-gray-500">Mulai</th>
						<th class="text-left px-5 py-3 font-medium text-gray-500">Selesai</th>
						<th class="text-left px-5 py-3 font-medium text-gray-500">Jenis</th>
						<th class="text-right px-5 py-3 font-medium text-gray-500">Aksi</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100">
					{#each data.timeSlots as ts (ts.id)}
						<tr class="hover:bg-gray-50 transition-colors">
							<td class="px-5 py-3.5 font-medium text-gray-900">{data.dayLabels[ts.day_of_week] ?? ts.day_of_week}</td>
							<td class="px-5 py-3.5 text-gray-600">{ts.slot_number}</td>
							<td class="px-5 py-3.5 text-gray-600 font-mono text-xs">{ts.start_time}</td>
							<td class="px-5 py-3.5 text-gray-600 font-mono text-xs">{ts.end_time}</td>
							<td class="px-5 py-3.5">
								{#if ts.is_break}
									<span class="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
										Istirahat
									</span>
								{:else}
									<span class="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
										Pelajaran
									</span>
								{/if}
							</td>
							<td class="px-5 py-3.5 text-right space-x-3">
								<button
									onclick={() => (editSlot = ts)}
									class="text-xs text-blue-600 hover:text-blue-800 font-medium"
								>Edit</button>
								<button
									onclick={() => (deleteTarget = { id: ts.id, name: `Hari ${data.dayLabels[ts.day_of_week] ?? ts.day_of_week} Slot ${ts.slot_number}` })}
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
					<h2 class="text-lg font-bold text-gray-900">Tambah Slot Waktu</h2>
					<button onclick={() => (showAddModal = false)} class="text-gray-400 hover:text-gray-600">✕</button>
				</div>

				{#if $message}
					<div class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
						{$message}
					</div>
				{/if}

				<form method="POST" action="?/create" use:enhance class="space-y-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Hari *</label>
						<select name="day_of_week" bind:value={$form.day_of_week} class={inputCls(hasError($errors.day_of_week) ? ['e'] : undefined)}>
							<option value="1">Senin</option>
							<option value="2">Selasa</option>
							<option value="3">Rabu</option>
							<option value="4">Kamis</option>
							<option value="5">Jumat</option>
							<option value="6">Sabtu</option>
							<option value="7">Minggu</option>
						</select>
						{#if $errors.day_of_week}<p class="mt-1 text-xs text-red-600">{fieldError($errors.day_of_week)}</p>{/if}
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Slot ke- *</label>
						<input name="slot_number" bind:value={$form.slot_number} type="number" min="1" placeholder="1" class={inputCls(hasError($errors.slot_number) ? ['e'] : undefined)} />
						{#if $errors.slot_number}<p class="mt-1 text-xs text-red-600">{fieldError($errors.slot_number)}</p>{/if}
					</div>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Waktu Mulai *</label>
							<input name="start_time" bind:value={$form.start_time} type="time" class={inputCls(hasError($errors.start_time) ? ['e'] : undefined)} />
							{#if $errors.start_time}<p class="mt-1 text-xs text-red-600">{fieldError($errors.start_time)}</p>{/if}
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Waktu Selesai *</label>
							<input name="end_time" bind:value={$form.end_time} type="time" class={inputCls(hasError($errors.end_time) ? ['e'] : undefined)} />
							{#if $errors.end_time}<p class="mt-1 text-xs text-red-600">{fieldError($errors.end_time)}</p>{/if}
						</div>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Jenis</label>
						<select name="is_break" bind:value={$form.is_break} class={inputCls()}>
							<option value={0}>Pelajaran</option>
							<option value={1}>Istirahat</option>
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
	{#if editSlot}
		{@const ts = editSlot}
		<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
			<div class="bg-white rounded-2xl shadow-xl w-full max-w-full sm:max-w-lg p-4 sm:p-6">
				<div class="flex items-center justify-between mb-5">
					<h2 class="text-lg font-bold text-gray-900">Edit Slot Waktu</h2>
					<button onclick={() => (editSlot = null)} class="text-gray-400 hover:text-gray-600">✕</button>
				</div>

				<form method="POST" action="?/update" class="space-y-4">
					<input type="hidden" name="id" value={ts.id} />
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Hari *</label>
						<select name="day_of_week" class={inputCls()}>
							<option value="1" selected={ts.day_of_week === 1}>Senin</option>
							<option value="2" selected={ts.day_of_week === 2}>Selasa</option>
							<option value="3" selected={ts.day_of_week === 3}>Rabu</option>
							<option value="4" selected={ts.day_of_week === 4}>Kamis</option>
							<option value="5" selected={ts.day_of_week === 5}>Jumat</option>
							<option value="6" selected={ts.day_of_week === 6}>Sabtu</option>
							<option value="7" selected={ts.day_of_week === 7}>Minggu</option>
						</select>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Slot ke- *</label>
						<input name="slot_number" value={ts.slot_number} type="number" min="1" class={inputCls()} />
					</div>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Waktu Mulai *</label>
							<input name="start_time" value={ts.start_time} type="time" class={inputCls()} />
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Waktu Selesai *</label>
							<input name="end_time" value={ts.end_time} type="time" class={inputCls()} />
						</div>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Jenis</label>
						<select name="is_break" class={inputCls()}>
							<option value={0} selected={ts.is_break === 0}>Pelajaran</option>
							<option value={1} selected={ts.is_break === 1}>Istirahat</option>
						</select>
					</div>
					<div class="flex justify-end gap-3 pt-2">
						<button type="button" onclick={() => (editSlot = null)} class="px-4 py-2 text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors">
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
				<h2 class="text-lg font-bold text-gray-900 mb-2">Hapus Slot Waktu?</h2>
				<p class="text-sm text-gray-500 mb-6">
					Slot waktu <strong>{deleteTarget.name}</strong> akan dihapus. Tindakan ini tidak dapat dibatalkan.
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
