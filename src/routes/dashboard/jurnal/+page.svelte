<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { fieldError, hasError } from '$lib/form-helpers';
	import { zodClient } from 'sveltekit-superforms/adapters/zod4';
	import { jurnalSchema } from '$lib/validation/jurnal';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const _formData = $derived(() => data.form);
	const { form, errors, message, enhance, submitting, reset } = superForm(_formData, {
		validators: zodClient(jurnalSchema),
		onUpdated({ form: f }) {
			if (String(f.message).includes('berhasil')) {
				showAddModal = false;
				editJurnal = null;
				reset();
			}
		}
	});

	let showAddModal = $state(false);
	let editJurnal: (typeof data.jurnals)[0] | null = $state(null);
	let deleteTarget: { id: number; topic: string } | null = $state(null);

	function inputCls(err?: unknown) {
		const hasErr = Array.isArray(err) ? err.length > 0 : (err != null && typeof err === 'object' && '_errors' in err ? !!(err as any)._errors?.length : !!err);
		return `w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-colors ${
			hasErr ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
		}`;
	}

	function parseAttendance(summary: string | null) {
		if (!summary) return { hadir: 0, sakit: 0, izin: 0, alfa: 0 };
		try { return JSON.parse(summary); }
		catch { return { hadir: 0, sakit: 0, izin: 0, alfa: 0 }; }
	}

	const today = new Date().toISOString().slice(0, 10);

	// Filter mapel berdasarkan kelas yang dipilih
	const filteredSubjects = $derived(
		$form.class_id
			? data.kelasPelajaran.filter(k => k.class_id === Number($form.class_id))
			: data.kelasPelajaran
	);

	// Deduplicated classes
	const uniqueClasses = $derived(
		[...new Map(data.kelasPelajaran.map(k => [k.class_id, k])).values()]
	);
</script>

<svelte:head>
	<title>Jurnal Mengajar — SIS</title>
</svelte:head>

<div class="max-w-6xl">
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-xl font-bold text-gray-900">Jurnal Mengajar</h1>
			<p class="text-sm text-gray-500 mt-0.5">
				{data.isGuru ? 'Catatan kegiatan mengajar Anda' : 'Rekap jurnal mengajar semua guru'}
			</p>
		</div>
		{#if data.isGuru}
			<button
				onclick={() => (showAddModal = true)}
				class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
			>
				+ Isi Jurnal
			</button>
		{/if}
	</div>

	{#if data.isGuru && data.kelasPelajaran.length === 0}
		<div class="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
			Anda belum ditugaskan ke kelas/mata pelajaran apapun. Hubungi Admin Sekolah untuk pengaturan jadwal mengajar.
		</div>
	{/if}

	<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
		{#if data.jurnals.length === 0}
			<div class="py-16 text-center text-gray-400 text-sm">Belum ada jurnal mengajar.</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead class="bg-gray-50 border-b border-gray-200">
						<tr>
							<th class="text-left px-4 py-3 font-medium text-gray-500">Tanggal</th>
							<th class="text-left px-4 py-3 font-medium text-gray-500">Kelas</th>
							<th class="text-left px-4 py-3 font-medium text-gray-500">Mata Pelajaran</th>
							{#if !data.isGuru}
								<th class="text-left px-4 py-3 font-medium text-gray-500">Guru</th>
							{/if}
							<th class="text-left px-4 py-3 font-medium text-gray-500">Topik</th>
							<th class="text-center px-4 py-3 font-medium text-gray-500">Ptm</th>
							<th class="text-left px-4 py-3 font-medium text-gray-500">Absensi</th>
							{#if data.isGuru}
								<th class="text-right px-4 py-3 font-medium text-gray-500">Aksi</th>
							{/if}
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100">
						{#each data.jurnals as jurnal (jurnal.id)}
							{@const att = parseAttendance(jurnal.attendance_summary)}
							<tr class="hover:bg-gray-50 transition-colors">
								<td class="px-4 py-3 text-gray-600 whitespace-nowrap">{jurnal.date}</td>
								<td class="px-4 py-3 font-medium text-gray-900">{jurnal.class_name ?? '—'}</td>
								<td class="px-4 py-3 text-gray-600">{jurnal.subject_name ?? '—'}</td>
								{#if !data.isGuru}
									<td class="px-4 py-3 text-gray-600">{jurnal.teacher_name ?? '—'}</td>
								{/if}
								<td class="px-4 py-3 text-gray-700 max-w-xs">
									<p class="truncate">{jurnal.topic}</p>
								</td>
								<td class="px-4 py-3 text-center text-gray-500">{jurnal.meeting_number}</td>
								<td class="px-4 py-3 text-xs whitespace-nowrap">
									<span class="text-green-600 font-medium">H:{att.hadir}</span>
									<span class="mx-1 text-gray-300">·</span>
									<span class="text-yellow-600">S:{att.sakit}</span>
									<span class="mx-1 text-gray-300">·</span>
									<span class="text-blue-600">I:{att.izin}</span>
									<span class="mx-1 text-gray-300">·</span>
									<span class="text-red-500">A:{att.alfa}</span>
								</td>
								{#if data.isGuru}
									<td class="px-4 py-3 text-right space-x-3">
										<button onclick={() => (editJurnal = jurnal)} class="text-xs text-blue-600 hover:text-blue-800 font-medium">Edit</button>
										<button onclick={() => (deleteTarget = { id: jurnal.id, topic: jurnal.topic })} class="text-xs text-red-500 hover:text-red-700 font-medium">Hapus</button>
									</td>
								{/if}
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
				<h2 class="text-lg font-bold text-gray-900">Isi Jurnal Mengajar</h2>
				<button onclick={() => (showAddModal = false)} class="text-gray-400 hover:text-gray-600">✕</button>
			</div>
			{#if $message}
				<div class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{$message}</div>
			{/if}
			<form method="POST" action="?/create" use:enhance class="space-y-4">
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Kelas *</label>
						<select name="class_id" bind:value={$form.class_id} class={inputCls(hasError($errors.class_id) ? ['e'] : undefined)}>
							<option value="">— Pilih Kelas —</option>
							{#each uniqueClasses as kp (kp.class_id)}
								<option value={kp.class_id}>{kp.class_name}</option>
							{/each}
						</select>
						{#if $errors.class_id}<p class="mt-1 text-xs text-red-600">{fieldError($errors.class_id)}</p>{/if}
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran *</label>
						<select name="subject_id" bind:value={$form.subject_id} class={inputCls(hasError($errors.subject_id) ? ['e'] : undefined)}>
							<option value="">— Pilih Mapel —</option>
							{#each filteredSubjects as kp (kp.subject_id)}
								<option value={kp.subject_id}>{kp.subject_name}</option>
							{/each}
						</select>
						{#if $errors.subject_id}<p class="mt-1 text-xs text-red-600">{fieldError($errors.subject_id)}</p>{/if}
					</div>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Tahun Ajaran *</label>
					<select name="academic_year_id" bind:value={$form.academic_year_id} class={inputCls(hasError($errors.academic_year_id) ? ['e'] : undefined)}>
						<option value="">— Pilih Tahun Ajaran —</option>
						{#each data.tahunAjaran as ta (ta.id)}
							<option value={ta.id}>{ta.name} — Semester {ta.semester}</option>
						{/each}
					</select>
					{#if $errors.academic_year_id}<p class="mt-1 text-xs text-red-600">{fieldError($errors.academic_year_id)}</p>{/if}
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Tanggal *</label>
						<input name="date" bind:value={$form.date} type="date" class={inputCls(hasError($errors.date) ? ['e'] : undefined)} />
						{#if $errors.date}<p class="mt-1 text-xs text-red-600">{fieldError($errors.date)}</p>{/if}
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Pertemuan ke- *</label>
						<input name="meeting_number" bind:value={$form.meeting_number} type="number" min="1" class={inputCls(hasError($errors.meeting_number) ? ['e'] : undefined)} />
						{#if $errors.meeting_number}<p class="mt-1 text-xs text-red-600">{fieldError($errors.meeting_number)}</p>{/if}
					</div>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Topik / Materi *</label>
					<input name="topic" bind:value={$form.topic} type="text" class={inputCls(hasError($errors.topic) ? ['e'] : undefined)} />
					{#if $errors.topic}<p class="mt-1 text-xs text-red-600">{fieldError($errors.topic)}</p>{/if}
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Tujuan Pembelajaran</label>
					<textarea name="learning_objectives" bind:value={$form.learning_objectives} rows="2" class="{inputCls()} resize-none"></textarea>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Kegiatan Pembelajaran</label>
					<textarea name="activities" bind:value={$form.activities} rows="3" class="{inputCls()} resize-none"></textarea>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
					<textarea name="notes" bind:value={$form.notes} rows="2" class="{inputCls()} resize-none"></textarea>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">Absensi Siswa</label>
					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
						<div>
							<label class="block text-xs text-green-600 font-medium mb-1">Hadir</label>
							<input name="att_hadir" bind:value={$form.att_hadir} type="number" min="0" class={inputCls()} />
						</div>
						<div>
							<label class="block text-xs text-yellow-600 font-medium mb-1">Sakit</label>
							<input name="att_sakit" bind:value={$form.att_sakit} type="number" min="0" class={inputCls()} />
						</div>
						<div>
							<label class="block text-xs text-blue-600 font-medium mb-1">Izin</label>
							<input name="att_izin" bind:value={$form.att_izin} type="number" min="0" class={inputCls()} />
						</div>
						<div>
							<label class="block text-xs text-red-500 font-medium mb-1">Alfa</label>
							<input name="att_alfa" bind:value={$form.att_alfa} type="number" min="0" class={inputCls()} />
						</div>
					</div>
				</div>

				<div class="flex justify-end gap-3 pt-2">
					<button type="button" onclick={() => (showAddModal = false)} class="px-4 py-2 text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors">Batal</button>
					<button type="submit" disabled={$submitting} class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors">
						{$submitting ? 'Menyimpan...' : 'Simpan Jurnal'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- MODAL HAPUS -->
{#if deleteTarget}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
		<div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
			<h2 class="text-lg font-bold text-gray-900 mb-2">Hapus Jurnal?</h2>
			<p class="text-sm text-gray-500 mb-6">
				Jurnal "<strong>{deleteTarget.topic}</strong>" akan dihapus. Tindakan ini tidak dapat dibatalkan.
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
