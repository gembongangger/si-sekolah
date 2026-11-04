<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { fieldError, hasError } from '$lib/form-helpers';
	import { zodClient } from 'sveltekit-superforms/adapters/zod4';
	import { studentViolationSchema, violationTypeSchema } from '$lib/validation/pelanggaran';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Form catat pelanggaran
	const {
		form: vForm,
		errors: vErrors,
		message: vMessage,
		enhance: vEnhance,
		submitting: vSubmitting,
		reset: vReset
	} = superForm(data.violationForm, {
		validators: zodClient(studentViolationSchema),
		onUpdated({ form: f }) {
			if (String(f.message).includes('berhasil')) {
				showReportModal = false;
				vReset();
			}
		}
	});

	// Form jenis pelanggaran
	const {
		form: vtForm,
		errors: vtErrors,
		message: vtMessage,
		enhance: vtEnhance,
		submitting: vtSubmitting,
		reset: vtReset
	} = superForm(data.vtypeForm, {
		validators: zodClient(violationTypeSchema),
		onUpdated({ form: f }) {
			if (String(f.message).includes('berhasil')) {
				showVtypeModal = false;
				vtReset();
			}
		}
	});

	let showReportModal = $state(false);
	let showVtypeModal = $state(false);
	let activeTab: 'violations' | 'types' | 'summary' = $state('violations');
	let deleteTarget: { id: number } | null = $state(null);

	function inputCls(err?: unknown) {
		const hasErr = Array.isArray(err) ? err.length > 0 : (err != null && typeof err === 'object' && '_errors' in err ? !!(err as any)._errors?.length : !!err);
		return `w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-colors ${
			hasErr ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
		}`;
	}

	const categoryLabel: Record<string, string> = {
		ringan: 'Ringan',
		sedang: 'Sedang',
		berat: 'Berat'
	};
	const categoryColor: Record<string, string> = {
		ringan: 'text-yellow-700 bg-yellow-50 border-yellow-200',
		sedang: 'text-orange-700 bg-orange-50 border-orange-200',
		berat: 'text-red-700 bg-red-50 border-red-200'
	};
	const statusColor: Record<string, string> = {
		pending: 'text-gray-600 bg-gray-100 border-gray-200',
		verified: 'text-green-700 bg-green-50 border-green-200',
		rejected: 'text-red-600 bg-red-50 border-red-200'
	};
	const statusLabel: Record<string, string> = {
		pending: 'Menunggu',
		verified: 'Terverifikasi',
		rejected: 'Ditolak'
	};

	const today = new Date().toISOString().slice(0, 10);
</script>

<svelte:head>
	<title>Pelanggaran Siswa — SIS</title>
</svelte:head>

<div class="max-w-6xl">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-xl font-bold text-gray-900">Poin Pelanggaran Siswa</h1>
			<p class="text-sm text-gray-500 mt-0.5">
				{data.isAdmin ? 'Kelola dan verifikasi pelanggaran siswa' : 'Catat pelanggaran siswa'}
			</p>
		</div>
		<div class="flex gap-2">
			{#if data.isAdmin}
				<button
					onclick={() => (showVtypeModal = true)}
					class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
				>
					Kelola Jenis
				</button>
			{/if}
			<button
				onclick={() => (showReportModal = true)}
				class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
			>
				+ Catat Pelanggaran
			</button>
		</div>
	</div>

	<!-- Tabs (admin only) -->
	{#if data.isAdmin}
		<div class="flex gap-1 mb-5 bg-gray-100 p-1 rounded-lg w-fit">
			{#each [['violations','Daftar Pelanggaran'],['types','Jenis Pelanggaran'],['summary','Rekap Poin']] as [tab, label]}
				<button
					onclick={() => (activeTab = tab as typeof activeTab)}
					class="px-4 py-1.5 text-sm font-medium rounded-md transition-colors {
						activeTab === tab
							? 'bg-white text-gray-900 shadow-sm'
							: 'text-gray-500 hover:text-gray-700'
					}"
				>
					{label}
				</button>
			{/each}
		</div>
	{/if}

	<!-- TAB: Daftar Pelanggaran -->
	{#if activeTab === 'violations'}
		<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
			{#if data.violations.length === 0}
				<div class="py-16 text-center text-gray-400 text-sm">Belum ada data pelanggaran.</div>
			{:else}
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead class="bg-gray-50 border-b border-gray-200">
							<tr>
								<th class="text-left px-4 py-3 font-medium text-gray-500">Tanggal</th>
								<th class="text-left px-4 py-3 font-medium text-gray-500">Siswa</th>
								<th class="text-left px-4 py-3 font-medium text-gray-500">Pelanggaran</th>
								<th class="text-left px-4 py-3 font-medium text-gray-500">Kategori</th>
								<th class="text-center px-4 py-3 font-medium text-gray-500">Poin</th>
								<th class="text-left px-4 py-3 font-medium text-gray-500">Status</th>
								<th class="text-right px-4 py-3 font-medium text-gray-500">Aksi</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-100">
							{#each data.violations as v (v.id)}
								<tr class="hover:bg-gray-50 transition-colors">
									<td class="px-4 py-3 text-gray-600 whitespace-nowrap">{v.date}</td>
									<td class="px-4 py-3">
										<p class="font-medium text-gray-900">{v.student_name ?? '—'}</p>
										{#if v.student_nis}<p class="text-xs text-gray-400">NIS: {v.student_nis}</p>{/if}
									</td>
									<td class="px-4 py-3 text-gray-700">
										<p>{v.violation_name ?? '—'}</p>
										{#if v.description}<p class="text-xs text-gray-400 truncate max-w-xs">{v.description}</p>{/if}
									</td>
									<td class="px-4 py-3">
										{#if v.violation_category}
											<span class="inline-flex text-xs font-medium px-2 py-0.5 rounded-full border {categoryColor[v.violation_category] ?? ''}">
												{categoryLabel[v.violation_category] ?? v.violation_category}
											</span>
										{/if}
									</td>
									<td class="px-4 py-3 text-center font-bold text-red-600">{v.points_snapshot}</td>
									<td class="px-4 py-3">
										<span class="inline-flex text-xs font-medium px-2 py-0.5 rounded-full border {statusColor[v.status] ?? ''}">
											{statusLabel[v.status] ?? v.status}
										</span>
									</td>
									<td class="px-4 py-3 text-right">
										{#if data.isAdmin && v.status === 'pending'}
											<form method="POST" action="?/verify" class="inline-flex gap-2">
												<input type="hidden" name="id" value={v.id} />
												<button name="status" value="verified" class="text-xs text-green-600 hover:text-green-800 font-medium">Verifikasi</button>
												<button name="status" value="rejected" class="text-xs text-red-500 hover:text-red-700 font-medium">Tolak</button>
											</form>
										{:else}
											<button
												onclick={() => (deleteTarget = { id: v.id })}
												class="text-xs text-red-500 hover:text-red-700 font-medium"
											>Hapus</button>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	{/if}

	<!-- TAB: Jenis Pelanggaran (admin) -->
	{#if activeTab === 'types' && data.isAdmin}
		<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
			{#if data.allViolationTypes.length === 0}
				<div class="py-16 text-center text-gray-400 text-sm">
					Belum ada jenis pelanggaran. Tambahkan lewat tombol "Kelola Jenis".
				</div>
			{:else}
				<table class="w-full text-sm">
					<thead class="bg-gray-50 border-b border-gray-200">
						<tr>
							<th class="text-left px-4 py-3 font-medium text-gray-500">Kode</th>
							<th class="text-left px-4 py-3 font-medium text-gray-500">Nama Pelanggaran</th>
							<th class="text-left px-4 py-3 font-medium text-gray-500">Kategori</th>
							<th class="text-center px-4 py-3 font-medium text-gray-500">Poin</th>
							<th class="text-left px-4 py-3 font-medium text-gray-500">Status</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100">
						{#each data.allViolationTypes as vt (vt.id)}
							<tr class="hover:bg-gray-50 transition-colors">
								<td class="px-4 py-3 font-mono text-xs text-gray-600">{vt.code}</td>
								<td class="px-4 py-3 font-medium text-gray-900">
									{vt.name}
									{#if vt.description}<p class="text-xs text-gray-400">{vt.description}</p>{/if}
								</td>
								<td class="px-4 py-3">
									<span class="inline-flex text-xs font-medium px-2 py-0.5 rounded-full border {categoryColor[vt.category] ?? ''}">
										{categoryLabel[vt.category] ?? vt.category}
									</span>
								</td>
								<td class="px-4 py-3 text-center font-bold text-red-600">{vt.points}</td>
								<td class="px-4 py-3">
									{#if vt.is_active}
										<span class="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
											<span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>Aktif
										</span>
									{:else}
										<span class="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
											<span class="w-1.5 h-1.5 rounded-full bg-gray-400"></span>Nonaktif
										</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</div>
	{/if}

	<!-- TAB: Rekap Poin (admin) -->
	{#if activeTab === 'summary' && data.isAdmin}
		<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
			{#if data.pointSummaries.length === 0}
				<div class="py-16 text-center text-gray-400 text-sm">Belum ada rekap poin.</div>
			{:else}
				<table class="w-full text-sm">
					<thead class="bg-gray-50 border-b border-gray-200">
						<tr>
							<th class="text-left px-4 py-3 font-medium text-gray-500">Peringkat</th>
							<th class="text-left px-4 py-3 font-medium text-gray-500">Nama Siswa</th>
							<th class="text-left px-4 py-3 font-medium text-gray-500">NIS</th>
							<th class="text-center px-4 py-3 font-medium text-gray-500">Total Poin</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100">
						{#each data.pointSummaries as ps, i (ps.student_id)}
							<tr class="hover:bg-gray-50 transition-colors">
								<td class="px-4 py-3 text-gray-500">
									{#if i === 0}
										<span class="text-red-500 font-bold">#{i + 1}</span>
									{:else}
										<span class="text-gray-400">#{i + 1}</span>
									{/if}
								</td>
								<td class="px-4 py-3 font-medium text-gray-900">{ps.student_name ?? '—'}</td>
								<td class="px-4 py-3 text-gray-500 font-mono text-xs">{ps.student_nis ?? '—'}</td>
								<td class="px-4 py-3 text-center">
									<span class="inline-flex items-center justify-center min-w-[3rem] px-2.5 py-1 rounded-lg font-bold text-sm {
										ps.total_points >= 100 ? 'bg-red-100 text-red-700' :
										ps.total_points >= 50 ? 'bg-orange-100 text-orange-700' :
										'bg-yellow-100 text-yellow-700'
									}">
										{ps.total_points}
									</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</div>
	{/if}
</div>

<!-- MODAL CATAT PELANGGARAN -->
{#if showReportModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
		<div class="bg-white rounded-2xl shadow-xl w-full max-w-full sm:max-w-lg p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between mb-5">
				<h2 class="text-lg font-bold text-gray-900">Catat Pelanggaran Siswa</h2>
				<button onclick={() => (showReportModal = false)} class="text-gray-400 hover:text-gray-600">✕</button>
			</div>
			{#if $vMessage}
				<div class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{$vMessage}</div>
			{/if}
			<form method="POST" action="?/report" use:vEnhance class="space-y-4">
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Siswa *</label>
					<select name="student_id" bind:value={$vForm.student_id} class={inputCls($vErrors.student_id)}>
						<option value="">— Pilih Siswa —</option>
						{#each data.siswas as s (s.id)}
							<option value={s.id}>{s.name}{s.nis ? ` (${s.nis})` : ''}</option>
						{/each}
					</select>
					{#if $vErrors.student_id}<p class="mt-1 text-xs text-red-600">{$vErrors.student_id[0]}</p>{/if}
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Jenis Pelanggaran *</label>
					<select name="violation_type_id" bind:value={$vForm.violation_type_id} class={inputCls($vErrors.violation_type_id)}>
						<option value="">— Pilih Jenis —</option>
						{#each data.violationTypes as vt (vt.id)}
							<option value={vt.id}>[{vt.category.toUpperCase()}] {vt.name} — {vt.points} poin</option>
						{/each}
					</select>
					{#if $vErrors.violation_type_id}<p class="mt-1 text-xs text-red-600">{$vErrors.violation_type_id[0]}</p>{/if}
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Tahun Ajaran *</label>
					<select name="academic_year_id" bind:value={$vForm.academic_year_id} class={inputCls($vErrors.academic_year_id)}>
						<option value="">— Pilih Tahun Ajaran —</option>
						{#each data.tahunAjaran as ta (ta.id)}
							<option value={ta.id}>{ta.name} — Semester {ta.semester}</option>
						{/each}
					</select>
					{#if $vErrors.academic_year_id}<p class="mt-1 text-xs text-red-600">{$vErrors.academic_year_id[0]}</p>{/if}
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Kejadian *</label>
					<input name="date" bind:value={$vForm.date} type="date" class={inputCls($vErrors.date)} />
					{#if $vErrors.date}<p class="mt-1 text-xs text-red-600">{$vErrors.date[0]}</p>{/if}
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
					<textarea name="description" bind:value={$vForm.description} rows="3" placeholder="Deskripsi singkat kejadian..." class="{inputCls()} resize-none"></textarea>
				</div>

				<div class="flex justify-end gap-3 pt-2">
					<button type="button" onclick={() => (showReportModal = false)} class="px-4 py-2 text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors">Batal</button>
					<button type="submit" disabled={$vSubmitting} class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors">
						{$vSubmitting ? 'Menyimpan...' : 'Catat Pelanggaran'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- MODAL JENIS PELANGGARAN -->
{#if showVtypeModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
		<div class="bg-white rounded-2xl shadow-xl w-full max-w-full sm:max-w-lg p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between mb-5">
				<h2 class="text-lg font-bold text-gray-900">Tambah Jenis Pelanggaran</h2>
				<button onclick={() => (showVtypeModal = false)} class="text-gray-400 hover:text-gray-600">✕</button>
			</div>
			{#if $vtMessage}
				<div class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{$vtMessage}</div>
			{/if}
			<form method="POST" action="?/createViolationType" use:vtEnhance class="space-y-4">
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Kode *</label>
						<input name="code" bind:value={$vtForm.code} type="text" placeholder="Mis: P001" class={inputCls($vtErrors.code)} />
						{#if $vtErrors.code}<p class="mt-1 text-xs text-red-600">{$vtErrors.code[0]}</p>{/if}
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Kategori *</label>
						<select name="category" bind:value={$vtForm.category} class={inputCls($vtErrors.category)}>
							<option value="ringan">Ringan</option>
							<option value="sedang">Sedang</option>
							<option value="berat">Berat</option>
						</select>
					</div>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Nama Pelanggaran *</label>
					<input name="name" bind:value={$vtForm.name} type="text" placeholder="Mis: Terlambat masuk kelas" class={inputCls($vtErrors.name)} />
					{#if $vtErrors.name}<p class="mt-1 text-xs text-red-600">{$vtErrors.name[0]}</p>{/if}
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Poin *</label>
					<input name="points" bind:value={$vtForm.points} type="number" min="0" placeholder="0" class={inputCls($vtErrors.points)} />
					{#if $vtErrors.points}<p class="mt-1 text-xs text-red-600">{$vtErrors.points[0]}</p>{/if}
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
					<textarea name="description" bind:value={$vtForm.description} rows="2" class="{inputCls()} resize-none"></textarea>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
					<select name="is_active" bind:value={$vtForm.is_active} class={inputCls()}>
						<option value={1}>Aktif</option>
						<option value={0}>Nonaktif</option>
					</select>
				</div>
				<div class="flex justify-end gap-3 pt-2">
					<button type="button" onclick={() => (showVtypeModal = false)} class="px-4 py-2 text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors">Batal</button>
					<button type="submit" disabled={$vtSubmitting} class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors">
						{$vtSubmitting ? 'Menyimpan...' : 'Simpan'}
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
			<h2 class="text-lg font-bold text-gray-900 mb-2">Hapus Catatan Pelanggaran?</h2>
			<p class="text-sm text-gray-500 mb-6">Catatan pelanggaran ini akan dihapus secara permanen.</p>
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
