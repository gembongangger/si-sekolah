<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { fieldError, hasError } from '$lib/form-helpers';
	import { zodClient } from 'sveltekit-superforms/adapters/zod4';
	import { studentViolationSchema, violationTypeSchema } from '$lib/validation/pelanggaran';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Pagination } from '$lib/components/ui/pagination/index.js';
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
				siswaQuery = '';
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

	// Pagination & filter violations
	let pageViolations = $state(1);
	let pageSizeViolations = $state(10);
	let filterVDate = $state('');
	let filterVStudent = $state('');
	let filterVName = $state('');
	let filterVCategory = $state('');
	let filterVStatus = $state('');

	let hasActiveVFilter = $derived(
		Boolean(filterVDate || filterVStudent || filterVName || filterVCategory || filterVStatus)
	);

	function resetVFilters() {
		filterVDate = '';
		filterVStudent = '';
		filterVName = '';
		filterVCategory = '';
		filterVStatus = '';
		pageViolations = 1;
	}

	let filteredViolations = $derived(
		data.violations.filter((v) => {
			if (filterVDate && !(v.date ?? '').includes(filterVDate.trim())) return false;
			if (filterVStudent) {
				const full = `${v.student_name ?? ''} ${v.student_nis ?? ''}`.toLowerCase();
				if (!full.includes(filterVStudent.toLowerCase())) return false;
			}
			if (filterVName && !(v.violation_name ?? '').toLowerCase().includes(filterVName.toLowerCase())) return false;
			if (filterVCategory && v.violation_category !== filterVCategory) return false;
			if (filterVStatus && v.status !== filterVStatus) return false;
			return true;
		})
	);

	let paginatedViolations = $derived(
		filteredViolations.slice((pageViolations - 1) * pageSizeViolations, pageViolations * pageSizeViolations)
	);

	// Pagination & filter types
	let pageTypes = $state(1);
	let pageSizeTypes = $state(10);
	let filterTypeCode = $state('');
	let filterTypeName = $state('');
	let filterTypeCategory = $state('');

	let hasActiveTypeFilter = $derived(
		Boolean(filterTypeCode || filterTypeName || filterTypeCategory)
	);

	function resetTypeFilters() {
		filterTypeCode = '';
		filterTypeName = '';
		filterTypeCategory = '';
		pageTypes = 1;
	}

	let filteredTypes = $derived(
		data.allViolationTypes.filter((vt) => {
			if (filterTypeCode && !(vt.code ?? '').toLowerCase().includes(filterTypeCode.toLowerCase())) return false;
			if (filterTypeName && !(vt.name ?? '').toLowerCase().includes(filterTypeName.toLowerCase())) return false;
			if (filterTypeCategory && vt.category !== filterTypeCategory) return false;
			return true;
		})
	);

	let paginatedTypes = $derived(
		filteredTypes.slice((pageTypes - 1) * pageSizeTypes, pageTypes * pageSizeTypes)
	);

	// Pagination & filter summary
	let pageSummary = $state(1);
	let pageSizeSummary = $state(10);
	let filterSummaryStudent = $state('');

	let filteredSummary = $derived(
		data.pointSummaries.filter((ps) => {
			if (filterSummaryStudent) {
				const full = `${ps.student_name ?? ''} ${ps.student_nis ?? ''}`.toLowerCase();
				if (!full.includes(filterSummaryStudent.toLowerCase())) return false;
			}
			return true;
		})
	);

	let paginatedSummary = $derived(
		filteredSummary.slice((pageSummary - 1) * pageSizeSummary, pageSummary * pageSizeSummary)
	);

	// Combobox siswa (pencarian nama/NIS)
	let siswaQuery = $state('');
	let siswaOpen = $state(false);
	const siswaResults = $derived.by(() => {
		const q = siswaQuery.trim().toLowerCase();
		const list = q
			? data.siswas.filter(s => (s.name ?? '').toLowerCase().includes(q) || String(s.nis ?? '').includes(q))
			: data.siswas;
		return list.slice(0, 8);
	});

	function pickSiswa(s: (typeof data.siswas)[0]) {
		$vForm.student_id = s.id;
		siswaQuery = `${s.name}${s.nis ? ` (${s.nis})` : ''}`;
		siswaOpen = false;
	}

	function inputCls(err?: unknown) {
		const hasErr = Array.isArray(err) ? err.length > 0 : (err != null && typeof err === 'object' && '_errors' in err ? !!(err as any)._errors?.length : !!err);
		return `w-full px-3.5 py-2.5 rounded-lg border text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-colors ${
			hasErr ? 'border-destructive focus:ring-destructive' : 'border-input focus:ring-ring focus:border-ring'
		}`;
	}

	const categoryLabel: Record<string, string> = {
		ringan: 'Ringan',
		sedang: 'Sedang',
		berat: 'Berat'
	};
	const categoryColor: Record<string, string> = {
		ringan: 'text-warning-foreground bg-warning/10 border-border',
		sedang: 'text-orange-700 bg-orange-50 border-orange-200',
		berat: 'text-destructive bg-destructive/10 border-border'
	};
	const statusColor: Record<string, string> = {
		pending: 'text-muted-foreground bg-muted border-border',
		verified: 'text-success-foreground bg-success/10 border-border',
		rejected: 'text-destructive bg-destructive/10 border-border'
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
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
		<div>
			<h1 class="text-xl font-bold text-foreground">Poin Pelanggaran Siswa</h1>
			<p class="text-sm text-muted-foreground mt-0.5">
				{data.isAdmin ? 'Kelola dan verifikasi pelanggaran siswa' : 'Catat pelanggaran siswa'}
			</p>
		</div>
		<div class="flex gap-2">
			{#if data.isAdmin}
				<button
					onclick={() => (showVtypeModal = true)}
					class="flex-1 sm:flex-none min-h-11 px-4 py-2 bg-muted hover:bg-muted text-foreground text-sm font-medium rounded-lg transition-colors"
				>
					Kelola Jenis
				</button>
			{/if}
			<button
				onclick={() => (showReportModal = true)}
				class="flex-1 sm:flex-none min-h-11 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors"
			>
				+ Catat Pelanggaran
			</button>
		</div>
	</div>

	<!-- Tabs (admin only) -->
	{#if data.isAdmin}
		<div class="grid grid-cols-3 gap-1 mb-5 bg-muted p-1 rounded-lg sm:flex sm:w-fit">
			{#each [['violations','Daftar Pelanggaran'],['types','Jenis Pelanggaran'],['summary','Rekap Poin']] as [tab, label]}
				<button
					onclick={() => (activeTab = tab as typeof activeTab)}
					class="min-h-10 px-2 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors {
						activeTab === tab
							? 'bg-card text-foreground shadow-sm'
							: 'text-muted-foreground hover:text-foreground'
					}"
				>
					{label}
				</button>
			{/each}
		</div>
	{/if}

	<!-- TAB: Daftar Pelanggaran -->
	{#if activeTab === 'violations'}
		<div class="bg-card rounded-xl border border-border overflow-hidden">
			{#if data.violations.length === 0}
				<div class="py-16 text-center text-muted-foreground text-sm">Belum ada data pelanggaran.</div>
			{:else}
				<!-- Mobile filter bar -->
				<div class="md:hidden p-3 bg-muted/30 border-b border-border space-y-2">
					<div class="grid grid-cols-2 gap-2">
						<Input
							placeholder="Cari siswa/NIS..."
							bind:value={filterVStudent}
							oninput={() => (pageViolations = 1)}
							class="h-8 text-xs bg-background"
						/>
						<Input
							placeholder="Cari pelanggaran..."
							bind:value={filterVName}
							oninput={() => (pageViolations = 1)}
							class="h-8 text-xs bg-background"
						/>
					</div>
					<div class="grid grid-cols-2 gap-2">
						<select
							bind:value={filterVCategory}
							onchange={() => (pageViolations = 1)}
							class="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
						>
							<option value="">Semua Kategori</option>
							<option value="ringan">Ringan</option>
							<option value="sedang">Sedang</option>
							<option value="berat">Berat</option>
						</select>
						<select
							bind:value={filterVStatus}
							onchange={() => (pageViolations = 1)}
							class="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
						>
							<option value="">Semua Status</option>
							<option value="pending">Menunggu</option>
							<option value="verified">Terverifikasi</option>
							<option value="rejected">Ditolak</option>
						</select>
					</div>
					{#if hasActiveVFilter}
						<button
							onclick={resetVFilters}
							class="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground pt-1"
						>
							<RotateCcw class="size-3" /> Reset Filter
						</button>
					{/if}
				</div>

				<!-- Mobile: kartu -->
				<div class="md:hidden divide-y divide-border">
					{#if paginatedViolations.length === 0}
						<div class="py-12 text-center text-muted-foreground text-sm">
							Tidak ada pelanggaran yang sesuai filter.
						</div>
					{:else}
						{#each paginatedViolations as v (v.id)}
							<div class="p-4 space-y-2.5">
								<div class="flex items-start justify-between gap-3">
									<div class="min-w-0">
										<p class="font-medium text-foreground truncate">{v.student_name ?? '—'}</p>
										<p class="text-xs text-muted-foreground">
											{v.date}{#if v.student_nis} · NIS {v.student_nis}{/if}
										</p>
									</div>
									<span class="shrink-0 text-sm font-bold text-destructive">{v.points_snapshot} poin</span>
								</div>
								<div class="flex flex-wrap items-center gap-1.5">
									<span class="text-sm text-foreground">{v.violation_name ?? '—'}</span>
									{#if v.violation_category}
										<span class="inline-flex text-xs font-medium px-2 py-0.5 rounded-full border {categoryColor[v.violation_category] ?? ''}">
											{categoryLabel[v.violation_category] ?? v.violation_category}
										</span>
									{/if}
									<span class="inline-flex text-xs font-medium px-2 py-0.5 rounded-full border {statusColor[v.status] ?? ''}">
										{statusLabel[v.status] ?? v.status}
									</span>
								</div>
								{#if v.description}
									<p class="text-xs text-muted-foreground">{v.description}</p>
								{/if}
								<div class="flex items-center gap-2 pt-0.5">
									{#if data.isAdmin && v.status === 'pending'}
										<form method="POST" action="?/verify" class="flex gap-2">
											<input type="hidden" name="id" value={v.id} />
											<button name="status" value="verified" class="min-h-10 px-3 rounded-lg bg-success/10 text-success-foreground text-sm font-medium">Verifikasi</button>
											<button name="status" value="rejected" class="min-h-10 px-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium">Tolak</button>
										</form>
									{:else}
										<button
											onclick={() => (deleteTarget = { id: v.id })}
											class="min-h-10 px-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium inline-flex items-center gap-1.5"
										><Trash2Icon class="size-4" />Hapus</button>
									{/if}
								</div>
							</div>
						{/each}
					{/if}
				</div>

				<!-- Desktop: tabel -->
				<div class="hidden md:block overflow-x-auto">
					<table class="w-full text-sm">
						<thead class="bg-muted/50 border-b border-border">
							<tr>
								<th class="text-left px-4 py-3 font-medium text-muted-foreground">Tanggal</th>
								<th class="text-left px-4 py-3 font-medium text-muted-foreground">Siswa</th>
								<th class="text-left px-4 py-3 font-medium text-muted-foreground">Pelanggaran</th>
								<th class="text-left px-4 py-3 font-medium text-muted-foreground">Kategori</th>
								<th class="text-center px-4 py-3 font-medium text-muted-foreground">Poin</th>
								<th class="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
								<th class="text-right px-4 py-3 font-medium text-muted-foreground">
									{#if hasActiveVFilter}
										<button onclick={resetVFilters} class="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
											<RotateCcw class="size-3" /> Reset
										</button>
									{:else}
										Aksi
									{/if}
								</th>
							</tr>
							<tr class="bg-muted/30">
								<th class="px-2 py-1.5 font-normal">
									<Input
										placeholder="Cari tgl..."
										bind:value={filterVDate}
										oninput={() => (pageViolations = 1)}
										class="h-8 text-xs bg-background"
									/>
								</th>
								<th class="px-2 py-1.5 font-normal">
									<Input
										placeholder="Cari siswa/NIS..."
										bind:value={filterVStudent}
										oninput={() => (pageViolations = 1)}
										class="h-8 text-xs bg-background"
									/>
								</th>
								<th class="px-2 py-1.5 font-normal">
									<Input
										placeholder="Cari pelanggaran..."
										bind:value={filterVName}
										oninput={() => (pageViolations = 1)}
										class="h-8 text-xs bg-background"
									/>
								</th>
								<th class="px-2 py-1.5 font-normal">
									<select
										bind:value={filterVCategory}
										onchange={() => (pageViolations = 1)}
										class="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
									>
										<option value="">Semua</option>
										<option value="ringan">Ringan</option>
										<option value="sedang">Sedang</option>
										<option value="berat">Berat</option>
									</select>
								</th>
								<th class="px-2 py-1.5 font-normal"></th>
								<th class="px-2 py-1.5 font-normal">
									<select
										bind:value={filterVStatus}
										onchange={() => (pageViolations = 1)}
										class="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
									>
										<option value="">Semua</option>
										<option value="pending">Menunggu</option>
										<option value="verified">Terverifikasi</option>
										<option value="rejected">Ditolak</option>
									</select>
								</th>
								<th class="px-2 py-1.5 font-normal"></th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							{#if paginatedViolations.length === 0}
								<tr>
									<td colspan="7" class="py-12 text-center text-muted-foreground text-sm">
										Tidak ada pelanggaran yang sesuai filter.
									</td>
								</tr>
							{:else}
								{#each paginatedViolations as v (v.id)}
									<tr class="hover:bg-muted/50 transition-colors">
										<td class="px-4 py-3 text-muted-foreground whitespace-nowrap">{v.date}</td>
										<td class="px-4 py-3">
											<p class="font-medium text-foreground">{v.student_name ?? '—'}</p>
											{#if v.student_nis}<p class="text-xs text-muted-foreground">NIS: {v.student_nis}</p>{/if}
										</td>
										<td class="px-4 py-3 text-foreground">
											<p>{v.violation_name ?? '—'}</p>
											{#if v.description}<p class="text-xs text-muted-foreground truncate max-w-xs">{v.description}</p>{/if}
										</td>
										<td class="px-4 py-3">
											{#if v.violation_category}
												<span class="inline-flex text-xs font-medium px-2 py-0.5 rounded-full border {categoryColor[v.violation_category] ?? ''}">
													{categoryLabel[v.violation_category] ?? v.violation_category}
												</span>
											{/if}
										</td>
										<td class="px-4 py-3 text-center font-bold text-destructive">{v.points_snapshot}</td>
										<td class="px-4 py-3">
											<span class="inline-flex text-xs font-medium px-2 py-0.5 rounded-full border {statusColor[v.status] ?? ''}">
												{statusLabel[v.status] ?? v.status}
											</span>
										</td>
										<td class="px-4 py-3 text-right">
											{#if data.isAdmin && v.status === 'pending'}
												<form method="POST" action="?/verify" class="inline-flex gap-2">
													<input type="hidden" name="id" value={v.id} />
													<button name="status" value="verified" class="text-xs text-success-foreground hover:text-success-foreground font-medium min-h-8">Verifikasi</button>
													<button name="status" value="rejected" class="text-xs text-destructive hover:text-destructive font-medium min-h-8">Tolak</button>
												</form>
											{:else}
												<button
													onclick={() => (deleteTarget = { id: v.id })}
													class="inline-flex items-center gap-1 text-xs text-destructive hover:text-destructive font-medium min-h-8"
												><Trash2Icon class="size-3.5" />Hapus</button>
											{/if}
										</td>
									</tr>
								{/each}
							{/if}
						</tbody>
					</table>
				</div>

				<div class="p-4 border-t border-border">
					<Pagination
						bind:page={pageViolations}
						bind:pageSize={pageSizeViolations}
						totalItems={filteredViolations.length}
					/>
				</div>
			{/if}
		</div>
	{/if}

	<!-- TAB: Jenis Pelanggaran (admin) -->
	{#if activeTab === 'types' && data.isAdmin}
		<div class="bg-card rounded-xl border border-border overflow-hidden">
			{#if data.allViolationTypes.length === 0}
				<div class="py-16 text-center text-muted-foreground text-sm">
					Belum ada jenis pelanggaran. Tambahkan lewat tombol "Kelola Jenis".
				</div>
			{:else}
				<table class="w-full text-sm">
					<thead class="bg-muted/50 border-b border-border">
						<tr>
							<th class="text-left px-4 py-3 font-medium text-muted-foreground">Kode</th>
							<th class="text-left px-4 py-3 font-medium text-muted-foreground">Nama Pelanggaran</th>
							<th class="text-left px-4 py-3 font-medium text-muted-foreground">Kategori</th>
							<th class="text-center px-4 py-3 font-medium text-muted-foreground">Poin</th>
							<th class="text-left px-4 py-3 font-medium text-muted-foreground">
								{#if hasActiveTypeFilter}
									<button onclick={resetTypeFilters} class="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
										<RotateCcw class="size-3" /> Reset
									</button>
								{:else}
									Status
								{/if}
							</th>
						</tr>
						<tr class="bg-muted/30">
							<th class="px-2 py-1.5 font-normal">
								<Input
									placeholder="Cari kode..."
									bind:value={filterTypeCode}
									oninput={() => (pageTypes = 1)}
									class="h-8 text-xs bg-background"
								/>
							</th>
							<th class="px-2 py-1.5 font-normal">
								<Input
									placeholder="Cari nama..."
									bind:value={filterTypeName}
									oninput={() => (pageTypes = 1)}
									class="h-8 text-xs bg-background"
								/>
							</th>
							<th class="px-2 py-1.5 font-normal">
								<select
									bind:value={filterTypeCategory}
									onchange={() => (pageTypes = 1)}
									class="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
								>
									<option value="">Semua</option>
									<option value="ringan">Ringan</option>
									<option value="sedang">Sedang</option>
									<option value="berat">Berat</option>
								</select>
							</th>
							<th class="px-2 py-1.5 font-normal"></th>
							<th class="px-2 py-1.5 font-normal"></th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#if paginatedTypes.length === 0}
							<tr>
								<td colspan="5" class="py-12 text-center text-muted-foreground text-sm">
									Tidak ada jenis pelanggaran yang sesuai filter.
								</td>
							</tr>
						{:else}
							{#each paginatedTypes as vt (vt.id)}
								<tr class="hover:bg-muted/50 transition-colors">
									<td class="px-4 py-3 font-mono text-xs text-muted-foreground">{vt.code}</td>
									<td class="px-4 py-3 font-medium text-foreground">
										{vt.name}
										{#if vt.description}<p class="text-xs text-muted-foreground">{vt.description}</p>{/if}
									</td>
									<td class="px-4 py-3">
										<span class="inline-flex text-xs font-medium px-2 py-0.5 rounded-full border {categoryColor[vt.category] ?? ''}">
											{categoryLabel[vt.category] ?? vt.category}
										</span>
									</td>
									<td class="px-4 py-3 text-center font-bold text-destructive">{vt.points}</td>
									<td class="px-4 py-3">
										{#if vt.is_active}
											<span class="inline-flex items-center gap-1 text-xs font-medium text-success-foreground bg-success/10 border border-border px-2 py-0.5 rounded-full">
												<span class="w-1.5 h-1.5 rounded-full bg-success/100"></span>Aktif
											</span>
										{:else}
											<span class="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-full">
												<span class="w-1.5 h-1.5 rounded-full bg-muted"></span>Nonaktif
											</span>
										{/if}
									</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>

				<div class="p-4 border-t border-border">
					<Pagination
						bind:page={pageTypes}
						bind:pageSize={pageSizeTypes}
						totalItems={filteredTypes.length}
					/>
				</div>
			{/if}
		</div>
	{/if}

	<!-- TAB: Rekap Poin (admin) -->
	{#if activeTab === 'summary' && data.isAdmin}
		<div class="bg-card rounded-xl border border-border overflow-hidden">
			{#if data.pointSummaries.length === 0}
				<div class="py-16 text-center text-muted-foreground text-sm">Belum ada rekap poin.</div>
			{:else}
				<div class="p-3 bg-muted/30 border-b border-border">
					<Input
						placeholder="Cari siswa atau NIS..."
						bind:value={filterSummaryStudent}
						oninput={() => (pageSummary = 1)}
						class="h-8 max-w-xs text-xs bg-background"
					/>
				</div>
				<table class="w-full text-sm">
					<thead class="bg-muted/50 border-b border-border">
						<tr>
							<th class="text-left px-4 py-3 font-medium text-muted-foreground">Peringkat</th>
							<th class="text-left px-4 py-3 font-medium text-muted-foreground">Nama Siswa</th>
							<th class="text-left px-4 py-3 font-medium text-muted-foreground">NIS</th>
							<th class="text-center px-4 py-3 font-medium text-muted-foreground">Total Poin</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#if paginatedSummary.length === 0}
							<tr>
								<td colspan="4" class="py-12 text-center text-muted-foreground text-sm">
									Tidak ada siswa yang sesuai filter.
								</td>
							</tr>
						{:else}
							{#each paginatedSummary as ps, i (ps.student_id)}
								{@const rank = (pageSummary - 1) * pageSizeSummary + i + 1}
								<tr class="hover:bg-muted/50 transition-colors">
									<td class="px-4 py-3 text-muted-foreground">
										{#if rank === 1}
											<span class="text-destructive font-bold">#1</span>
										{:else}
											<span class="text-muted-foreground">#{rank}</span>
										{/if}
									</td>
									<td class="px-4 py-3 font-medium text-foreground">{ps.student_name ?? '—'}</td>
									<td class="px-4 py-3 text-muted-foreground font-mono text-xs">{ps.student_nis ?? '—'}</td>
									<td class="px-4 py-3 text-center">
										<span class="inline-flex items-center justify-center min-w-[3rem] px-2.5 py-1 rounded-lg font-bold text-sm {
											ps.total_points >= 100 ? 'bg-destructive/10 text-destructive' :
											ps.total_points >= 50 ? 'bg-orange-100 text-orange-700' :
											'bg-warning/10 text-warning-foreground'
										}">
											{ps.total_points}
										</span>
									</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>

				<div class="p-4 border-t border-border">
					<Pagination
						bind:page={pageSummary}
						bind:pageSize={pageSizeSummary}
						totalItems={filteredSummary.length}
					/>
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- MODAL CATAT PELANGGARAN -->
{#if showReportModal}
	<div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 sm:p-4">
		<div class="bg-card shadow-xl w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[92vh] flex flex-col">
			<div class="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-6 pb-3 shrink-0">
				<h2 class="text-lg font-bold text-foreground">Catat Pelanggaran Siswa</h2>
				<button onclick={() => (showReportModal = false)} class="min-h-11 min-w-11 -mr-2 text-lg text-muted-foreground hover:text-muted-foreground">✕</button>
			</div>
			<form method="POST" action="?/report" use:vEnhance class="flex flex-col min-h-0 flex-1">
				<div class="overflow-y-auto px-4 sm:px-6 pb-4 space-y-4">
					{#if $vMessage}
						<div class="p-3 rounded-lg bg-destructive/10 border border-border text-destructive text-sm">{$vMessage}</div>
					{/if}
				<div class="relative">
					<label class="block text-sm font-medium text-foreground mb-1">Siswa *</label>
					<input
						type="text"
						autocomplete="off"
						placeholder="Ketik nama atau NIS siswa…"
						bind:value={siswaQuery}
						onfocus={() => (siswaOpen = true)}
						oninput={() => {
							siswaOpen = true;
							$vForm.student_id = 0;
						}}
						onblur={() => setTimeout(() => (siswaOpen = false), 150)}
						class={inputCls($vErrors.student_id)}
					/>
					{#if siswaOpen}
						<div class="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto bg-card border border-border rounded-lg shadow-lg">
							{#if siswaResults.length === 0}
								<p class="px-3 py-2.5 text-sm text-muted-foreground">Siswa tidak ditemukan.</p>
							{:else}
								{#each siswaResults as s (s.id)}
									<button
										type="button"
										onclick={() => pickSiswa(s)}
										class="w-full text-left px-3 py-2.5 hover:bg-primary/10 transition-colors"
									>
										<span class="text-sm font-medium text-foreground">{s.name}</span>
										{#if s.nis}<span class="ml-2 text-xs text-muted-foreground font-mono">NIS {s.nis}</span>{/if}
									</button>
								{/each}
							{/if}
						</div>
					{/if}
					<input type="hidden" name="student_id" value={$vForm.student_id} />
					{#if $vErrors.student_id}<p class="mt-1 text-xs text-destructive">{$vErrors.student_id[0]}</p>{/if}
				</div>

				<div>
					<label class="block text-sm font-medium text-foreground mb-1">Jenis Pelanggaran *</label>
					<select name="violation_type_id" bind:value={$vForm.violation_type_id} class={inputCls($vErrors.violation_type_id)}>
						<option value="">— Pilih Jenis —</option>
						{#each data.violationTypes as vt (vt.id)}
							<option value={vt.id}>[{vt.category.toUpperCase()}] {vt.name} — {vt.points} poin</option>
						{/each}
					</select>
					{#if $vErrors.violation_type_id}<p class="mt-1 text-xs text-destructive">{$vErrors.violation_type_id[0]}</p>{/if}
				</div>

				<div>
					<label class="block text-sm font-medium text-foreground mb-1">Tahun Ajaran *</label>
					<select name="academic_year_id" bind:value={$vForm.academic_year_id} class={inputCls($vErrors.academic_year_id)}>
						<option value="">— Pilih Tahun Ajaran —</option>
						{#each data.tahunAjaran as ta (ta.id)}
							<option value={ta.id}>{ta.name} — Semester {ta.semester}</option>
						{/each}
					</select>
					{#if $vErrors.academic_year_id}<p class="mt-1 text-xs text-destructive">{$vErrors.academic_year_id[0]}</p>{/if}
				</div>

				<div>
					<label class="block text-sm font-medium text-foreground mb-1">Tanggal Kejadian *</label>
					<input name="date" bind:value={$vForm.date} type="date" class={inputCls($vErrors.date)} />
					{#if $vErrors.date}<p class="mt-1 text-xs text-destructive">{$vErrors.date[0]}</p>{/if}
				</div>

				<div>
					<label class="block text-sm font-medium text-foreground mb-1">Keterangan</label>
					<textarea name="description" bind:value={$vForm.description} rows="3" placeholder="Deskripsi singkat kejadian..." class="{inputCls()} resize-none"></textarea>
				</div>

				</div>
				<div class="shrink-0 border-t border-border px-4 sm:px-6 py-3 flex gap-3 sm:justify-end">
					<button type="button" onclick={() => (showReportModal = false)} class="flex-1 sm:flex-none min-h-11 px-4 py-2 text-sm text-muted-foreground border border-border hover:bg-muted/50 rounded-lg transition-colors">Batal</button>
					<button type="submit" disabled={$vSubmitting} class="flex-1 sm:flex-none min-h-11 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50 rounded-lg transition-colors">
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
		<div class="bg-card rounded-2xl shadow-xl w-full max-w-full sm:max-w-lg p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between mb-5">
				<h2 class="text-lg font-bold text-foreground">Tambah Jenis Pelanggaran</h2>
				<button onclick={() => (showVtypeModal = false)} class="text-muted-foreground hover:text-muted-foreground">✕</button>
			</div>
			{#if $vtMessage}
				<div class="mb-4 p-3 rounded-lg bg-destructive/10 border border-border text-destructive text-sm">{$vtMessage}</div>
			{/if}
			<form method="POST" action="?/createViolationType" use:vtEnhance class="space-y-4">
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-foreground mb-1">Kode *</label>
						<input name="code" bind:value={$vtForm.code} type="text" placeholder="Mis: P001" class={inputCls($vtErrors.code)} />
						{#if $vtErrors.code}<p class="mt-1 text-xs text-destructive">{$vtErrors.code[0]}</p>{/if}
					</div>
					<div>
						<label class="block text-sm font-medium text-foreground mb-1">Kategori *</label>
						<select name="category" bind:value={$vtForm.category} class={inputCls($vtErrors.category)}>
							<option value="ringan">Ringan</option>
							<option value="sedang">Sedang</option>
							<option value="berat">Berat</option>
						</select>
					</div>
				</div>
				<div>
					<label class="block text-sm font-medium text-foreground mb-1">Nama Pelanggaran *</label>
					<input name="name" bind:value={$vtForm.name} type="text" placeholder="Mis: Terlambat masuk kelas" class={inputCls($vtErrors.name)} />
					{#if $vtErrors.name}<p class="mt-1 text-xs text-destructive">{$vtErrors.name[0]}</p>{/if}
				</div>
				<div>
					<label class="block text-sm font-medium text-foreground mb-1">Poin *</label>
					<input name="points" bind:value={$vtForm.points} type="number" min="0" placeholder="0" class={inputCls($vtErrors.points)} />
					{#if $vtErrors.points}<p class="mt-1 text-xs text-destructive">{$vtErrors.points[0]}</p>{/if}
				</div>
				<div>
					<label class="block text-sm font-medium text-foreground mb-1">Deskripsi</label>
					<textarea name="description" bind:value={$vtForm.description} rows="2" class="{inputCls()} resize-none"></textarea>
				</div>
				<div>
					<label class="block text-sm font-medium text-foreground mb-1">Status</label>
					<select name="is_active" bind:value={$vtForm.is_active} class={inputCls()}>
						<option value={1}>Aktif</option>
						<option value={0}>Nonaktif</option>
					</select>
				</div>
				<div class="flex justify-end gap-3 pt-2">
					<button type="button" onclick={() => (showVtypeModal = false)} class="px-4 py-2 text-sm text-muted-foreground border border-border hover:bg-muted/50 rounded-lg transition-colors">Batal</button>
					<button type="submit" disabled={$vtSubmitting} class="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50 rounded-lg transition-colors">
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
		<div class="bg-card rounded-2xl shadow-xl w-full max-w-full sm:max-w-sm p-4 sm:p-6">
			<h2 class="text-lg font-bold text-foreground mb-2">Hapus Catatan Pelanggaran?</h2>
			<p class="text-sm text-muted-foreground mb-6">Catatan pelanggaran ini akan dihapus secara permanen.</p>
			<div class="flex justify-end gap-3">
				<button onclick={() => (deleteTarget = null)} class="px-4 py-2 text-sm text-muted-foreground border border-border hover:bg-muted/50 rounded-lg transition-colors">Batal</button>
				<form method="POST" action="?/delete">
					<input type="hidden" name="id" value={deleteTarget.id} />
					<button type="submit" class="px-4 py-2 text-sm font-medium text-destructive-foreground bg-destructive hover:bg-destructive/90 rounded-lg transition-colors">Ya, Hapus</button>
				</form>
			</div>
		</div>
	</div>
{/if}
