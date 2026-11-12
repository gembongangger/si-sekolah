<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// ── Modal states ─────────────────────────────────────────────
	let showBatchModal = $state(false);
	let showTrackModal = $state(false);
	let showStatusModal = $state(false);
	let showConvertModal = $state(false);
	let showDetailModal = $state(false);
	let showCredentialModal = $state(false);
	let showDeleteConfirm = $state(false);

	let selectedReg = $state<(typeof data.registrations)[number] | null>(null);
	let deleteTarget = $state<{ id: number; name: string } | null>(null);
	let deleteKind = $state<'batch' | 'track'>('batch');
	let convertedCredentials = $state<any>(null);

	// ── Form states ──────────────────────────────────────────────
	let statusValue = $state('verified');
	let scoreValue = $state('');
	let notesValue = $state('');

	let convertClassId = $state<number | string>('');
	let convertNis = $state('');
	let convertEmail = $state('');
	let convertPassword = $state('');

	let trackId = $state<number | string>('');
	let trackCode = $state('');
	let trackName = $state('');
	let trackDescription = $state('');
	let trackIsActive = $state(1);

	// ── Edit batch (periode) states ──────────────────────────────
	let showBatchEditModal = $state(false);
	let editBatchId = $state<number | string>('');
	let editBatchName = $state('');
	let editBatchYearId = $state<number | string>('');
	let editBatchStart = $state('');
	let editBatchEnd = $state('');
	let editBatchQuota = $state<number | string>('');
	let editBatchFee = $state<number | string>('');
	let editBatchDescription = $state('');
	let editBatchIsActive = $state(1);
	let editBatchDocReq = $state('');

	const statusBadge: Record<string, string> = {
		submitted: 'bg-muted text-foreground border-border',
		verified: 'bg-warning/10 text-warning-foreground border-warning/20',
		accepted: 'bg-success/10 text-success-foreground border-success/20',
		rejected: 'bg-destructive/10 text-destructive border-border',
		enrolled: 'bg-primary/10 text-primary-foreground border-border'
	};

	const statusLabel: Record<string, string> = {
		submitted: 'Baru Masuk',
		verified: 'Terverifikasi',
		accepted: 'Lulus',
		rejected: 'Tidak Lulus',
		enrolled: 'Siswa Aktif'
	};

	const trackLabel: Record<string, string> = {
		reguler: 'Reguler',
		prestasi: 'Prestasi',
		zonasi: 'Zonasi',
		afirmasi: 'Afirmasi'
	};

	function formatRupiah(num: number | null | undefined): string {
		if (!num || num === 0) return 'Gratis';
		return 'Rp ' + Number(num).toLocaleString('id-ID');
	}

	function formatDate(value: string | number | null | undefined): string {
		if (!value) return '-';
		const d = typeof value === 'number' ? new Date(value) : new Date(String(value));
		if (isNaN(d.getTime())) return String(value);
		return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
	}

	function formatDateTime(value: string | number | null | undefined): string {
		if (!value) return '-';
		const d = typeof value === 'number' ? new Date(value) : new Date(String(value));
		if (isNaN(d.getTime())) return String(value);
		return d.toLocaleString('id-ID', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function openStatus(reg: (typeof data.registrations)[number]) {
		selectedReg = reg;
		statusValue = ['verified', 'accepted', 'rejected'].includes(reg.status)
			? reg.status
			: 'verified';
		scoreValue = reg.selectionScore != null ? String(reg.selectionScore) : '';
		notesValue = reg.notes ?? '';
		showStatusModal = true;
	}

	function openConvert(reg: (typeof data.registrations)[number]) {
		selectedReg = reg;
		convertClassId = data.classes[0]?.id ?? '';
		convertNis = reg.nisn ?? '';
		convertEmail = reg.email ?? '';
		convertPassword = '';
		showConvertModal = true;
	}

	function openDetail(reg: (typeof data.registrations)[number]) {
		selectedReg = reg;
		showDetailModal = true;
	}

	function openDelete(item: { id: number; name: string }, kind: 'batch' | 'track' = 'batch') {
		deleteTarget = item;
		deleteKind = kind;
		showDeleteConfirm = true;
	}

	function enhanceForm(opts?: { close?: () => void; onSuccess?: (data: any) => void }) {
		return () => async ({ result, update }: any) => {
			await update();
			await invalidateAll();
			if (result.type === 'success') {
				opts?.close?.();
				opts?.onSuccess?.(result.data);
			}
		};
	}

	function resetBatchModal() {
		showBatchModal = false;
	}

	function resetTrackModal() {
		trackId = '';
		trackCode = '';
		trackName = '';
		trackDescription = '';
		trackIsActive = 1;
		showTrackModal = false;
	}

	function openTrackCreate() {
		resetTrackModal();
		showTrackModal = true;
	}

	function openTrackEdit(t: { id: number; code: string; name: string; description: string | null; isActive: number }) {
		trackId = t.id;
		trackCode = t.code;
		trackName = t.name;
		trackDescription = t.description ?? '';
		trackIsActive = t.isActive;
		showTrackModal = true;
	}

	function resetBatchEdit() {
		editBatchId = '';
		editBatchName = '';
		editBatchYearId = '';
		editBatchStart = '';
		editBatchEnd = '';
		editBatchQuota = '';
		editBatchFee = '';
		editBatchDescription = '';
		editBatchIsActive = 1;
		editBatchDocReq = '';
		showBatchEditModal = false;
	}

	function openBatchEdit(b: { id: number; name: string; academicYearId: number | null; startDate: string; endDate: string; quota: number; fee: number; description: string | null; isActive: number; documentRequirements?: { fields: unknown[] } | null }) {
		editBatchId = b.id;
		editBatchName = b.name;
		editBatchYearId = b.academicYearId ?? '';
		editBatchStart = b.startDate;
		editBatchEnd = b.endDate;
		editBatchQuota = String(b.quota);
		editBatchFee = String(b.fee);
		editBatchDescription = b.description ?? '';
		editBatchIsActive = b.isActive;
		editBatchDocReq = b.documentRequirements?.fields
			? JSON.stringify(b.documentRequirements.fields, null, 2)
			: '';
		showBatchEditModal = true;
	}
</script>

<svelte:head>
	<title>PPDB — Sistem Informasi Sekolah</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold text-foreground">Penerimaan Siswa Baru (PPDB)</h1>
			<p class="text-sm text-muted-foreground mt-1">
				Kelola gelombang pendaftaran, verifikasi berkas, kelulusan, dan daftar ulang calon siswa.
			</p>
		</div>
		<a
			href="/ppdb"
			target="_blank"
			rel="noopener"
			class="inline-flex items-center gap-2 px-4 py-2.5 bg-card border border-border text-foreground text-sm font-semibold rounded-xl hover:bg-muted/50 transition-colors"
		>
			🌐 Lihat Portal PPDB
		</a>
	</div>

	<!-- Flash message -->
	{#if form?.message}
		<div
			class="p-4 rounded-xl text-sm flex items-start justify-between gap-3 {form?.success
				? 'bg-success/10 text-success-foreground border border-success/20'
				: 'bg-destructive/10 text-destructive border border-border'}"
		>
			<span class="flex items-start gap-2">
				<span>{form?.success ? '✅' : '⚠️'}</span>
				<span>{form.message}</span>
			</span>
		</div>
	{/if}

	<!-- Statistik -->
	<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
		<div class="bg-card rounded-xl border border-border p-4">
			<p class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Pendaftar</p>
			<p class="text-2xl font-bold text-foreground mt-1">{data.stats.total}</p>
		</div>
		<div class="bg-card rounded-xl border border-border p-4">
			<p class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Baru Masuk</p>
			<p class="text-2xl font-bold text-foreground mt-1">{data.stats.submitted}</p>
		</div>
		<div class="bg-card rounded-xl border border-border p-4">
			<p class="text-[11px] font-semibold uppercase tracking-wider text-warning-foreground">Terverifikasi</p>
			<p class="text-2xl font-bold text-warning-foreground mt-1">{data.stats.verified}</p>
		</div>
		<div class="bg-card rounded-xl border border-border p-4">
			<p class="text-[11px] font-semibold uppercase tracking-wider text-success-foreground">Lulus</p>
			<p class="text-2xl font-bold text-success-foreground mt-1">{data.stats.accepted}</p>
		</div>
		<div class="bg-card rounded-xl border border-border p-4">
			<p class="text-[11px] font-semibold uppercase tracking-wider text-primary-foreground">Siswa Aktif</p>
			<p class="text-2xl font-bold text-primary-foreground mt-1">{data.stats.enrolled}</p>
		</div>
	</div>

	<!-- Gelombang PPDB -->
	<div class="bg-card rounded-xl border border-border">
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b bg-muted">
			<div>
				<h2 class="font-bold text-foreground">Gelombang Pendaftaran</h2>
				<p class="text-xs text-muted-foreground mt-0.5">Buka/tutup gelombang dan atur kuota penerimaan.</p>
			</div>
			<button
				type="button"
				onclick={() => (showBatchModal = true)}
				class="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-xl transition-colors"
			>
				＋ Buat Gelombang
			</button>
		</div>

		{#if data.batches.length === 0}
			<div class="p-8 text-center text-sm text-muted-foreground">
				Belum ada gelombang PPDB. Klik "Buat Gelombang" untuk memulai.
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
				{#each data.batches as b (b.id)}
					<div class="border border-border rounded-xl p-4 space-y-3 flex flex-col justify-between">
						<div class="space-y-2">
							<div class="flex items-start justify-between gap-2">
								<h3 class="font-bold text-sm text-foreground leading-snug">{b.name}</h3>
								<span
									class="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border {b.isActive
										? 'bg-success/10 text-success-foreground border-success/20'
										: 'bg-muted text-muted-foreground border-border'}"
								>
									{b.isActive ? '● DIBUKA' : 'DITUTUP'}
								</span>
							</div>
							<p class="text-xs text-muted-foreground">
								TA {b.academicYearName ?? '-'} ({b.academicYearSemester ?? '-'})
							</p>
							<p class="text-xs text-muted-foreground">
								📅 {formatDate(b.startDate)} — {formatDate(b.endDate)}
							</p>
							{#if b.periodStatus === 'open'}
								<span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-success/10 text-success-foreground border border-success/20">
									● Pendaftaran Dibuka
								</span>
							{:else if b.periodStatus === 'upcoming'}
								<span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary-foreground border border-border">
									○ Belum Dibuka
								</span>
							{:else}
								<span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-destructive/10 text-destructive border border-border">
									✕ Pendaftaran Tutup
								</span>
							{/if}
							<div class="grid grid-cols-3 gap-2 pt-1">
								<div class="bg-muted/50 rounded-lg p-2 text-center">
									<p class="text-[10px] text-muted-foreground">Kuota</p>
									<p class="text-sm font-bold text-foreground">{b.quota}</p>
								</div>
								<div class="bg-muted/50 rounded-lg p-2 text-center">
									<p class="text-[10px] text-muted-foreground">Pendaftar</p>
									<p class="text-sm font-bold text-primary-foreground">{b.totalRegistrants}</p>
								</div>
								<div class="bg-muted/50 rounded-lg p-2 text-center">
									<p class="text-[10px] text-muted-foreground">Biaya</p>
									<p class="text-sm font-bold text-success-foreground">{formatRupiah(b.fee)}</p>
								</div>
							</div>
						</div>
						<div class="flex items-center gap-2 pt-2 border-t bg-muted">
							<form
								method="POST"
								action="?/toggleBatch"
								use:enhance={enhanceForm()}
								class="flex-1"
							>
								<input type="hidden" name="batch_id" value={b.id} />
								<button
									type="submit"
									class="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors {b.isActive
										? 'bg-warning/10 text-warning-foreground border-warning/20 hover:bg-warning/10'
										: 'bg-success/10 text-success-foreground border-success/20 hover:bg-success/10'}"
								>
									{b.isActive ? 'Tutup' : 'Buka'}
								</button>
							</form>
							<a
								href="?batch_id={b.id}#pendaftar"
								class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-muted/50 text-foreground border border-border hover:bg-muted"
							>
								Pendaftar
							</a>
							<button
								type="button"
								onclick={() => openBatchEdit(b)}
								class="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-primary/10 text-primary-foreground border border-border hover:bg-primary/20"
								title="Edit gelombang"
							>
								✎
							</button>
							<button
								type="button"
								onclick={() => openDelete(b)}
								class="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-destructive/10 text-destructive border border-border hover:bg-destructive/10"
								title="Hapus gelombang"
							>
								🗑
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Jalur Pendaftaran -->
	<div class="bg-card rounded-xl border border-border">
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b bg-muted">
			<div>
				<h2 class="font-bold text-foreground">Jalur Pendaftaran</h2>
				<p class="text-xs text-muted-foreground mt-0.5">
					Atur jalur pendaftaran yang tersedia untuk sekolah ini (contoh: Reguler, Prestasi, Zonasi, Afirmasi).
				</p>
			</div>
			<button
				type="button"
				onclick={openTrackCreate}
				class="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-xl transition-colors"
			>
				＋ Tambah Jalur
			</button>
		</div>

		{#if data.tracks && data.tracks.length > 0}
			<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
				{#each data.tracks as t (t.id)}
					<div class="border border-border rounded-xl p-4 space-y-3 flex flex-col justify-between">
						<div class="space-y-2">
							<div class="flex items-start justify-between gap-2">
								<h3 class="font-bold text-sm text-foreground leading-snug truncate">{t.name}</h3>
								<span
									class="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border {t.isActive
										? 'bg-success/10 text-success-foreground border-success/20'
										: 'bg-muted text-muted-foreground border-border'}"
								>
									{t.isActive ? '● AKTIF' : 'NONAKTIF'}
								</span>
							</div>
							<div class="grid grid-cols-2 gap-2 pt-1 text-xs">
								<div class="bg-muted/50 rounded-lg p-2 text-center">
									<p class="text-[10px] text-muted-foreground">Kode</p>
									<p class="text-sm font-bold text-foreground break-all">{t.code}</p>
								</div>
							</div>
						</div>
						<div class="flex items-center gap-2 pt-2 border-t bg-muted">
							<button
								type="button"
								onclick={() => openTrackEdit(t)}
								class="flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border text-primary-foreground hover:bg-primary/10"
							>
								✎ Edit
							</button>
							<form
								method="POST"
								action="?/toggleTrack"
								use:enhance={enhanceForm()}
								class="flex-1"
							>
								<input type="hidden" name="track_id" value={t.id} />
								<button
									type="submit"
									class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors {t.isActive
										? 'bg-warning/10 text-warning-foreground border-warning/20 hover:bg-warning/10'
										: 'bg-success/10 text-success-foreground border-success/20 hover:bg-success/10'}"
								>
									{t.isActive ? 'Nonaktifkan' : 'Aktifkan'}
								</button>
							</form>
							<button
								type="button"
								onclick={() => openDelete({ id: t.id, name: t.name }, 'track')}
								class="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-destructive/10 text-destructive border border-border hover:bg-destructive/10"
								title="Hapus jalur"
							>
								🗑
							</button>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="p-8 text-center text-sm text-muted-foreground">
				Belum ada jalur pendaftaran. Klik "Tambah Jalur" untuk memulai.
			</div>
		{/if}
	</div>

	<!-- Daftar Pendaftar -->
	<div id="pendaftar" class="bg-card rounded-xl border border-border">
		<div class="px-5 py-4 border-b bg-muted space-y-3">
			<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
				<div>
					<h2 class="font-bold text-foreground">Data Pendaftar</h2>
					<p class="text-xs text-muted-foreground mt-0.5">
						{data.registrations.length} pendaftar ditampilkan
					</p>
				</div>
			</div>

			<form method="GET" class="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2">
				<input
					type="search"
					name="q"
					value={data.filters.q}
					placeholder="Cari nama / no. registrasi / NISN / asal sekolah"
					class="px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring"
				/>
				<select
					name="batch_id"
					value={data.filters.batchId ?? ''}
					class="px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring"
				>
					<option value="">Semua gelombang</option>
					{#each data.batches as b (b.id)}
						<option value={b.id}>{b.name}</option>
					{/each}
				</select>
				<select
					name="status"
					value={data.filters.status}
					class="px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring"
				>
					<option value="all">Semua status</option>
					<option value="submitted">Baru Masuk</option>
					<option value="verified">Terverifikasi</option>
					<option value="accepted">Lulus</option>
					<option value="rejected">Tidak Lulus</option>
					<option value="enrolled">Siswa Aktif</option>
				</select>
				<button
					type="submit"
					class="px-5 py-2 bg-foreground hover:bg-foreground/90 text-white text-sm font-semibold rounded-lg transition-colors"
				>
					Filter
				</button>
			</form>
		</div>

		{#if data.registrations.length === 0}
			<div class="p-10 text-center text-sm text-muted-foreground">
				Belum ada data pendaftar yang cocok dengan filter.
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm text-left">
					<thead class="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
						<tr>
							<th class="px-4 py-3 font-semibold">No. Registrasi</th>
							<th class="px-4 py-3 font-semibold">Nama / NISN</th>
							<th class="px-4 py-3 font-semibold">Jalur / Jurusan</th>
							<th class="px-4 py-3 font-semibold">Asal Sekolah</th>
							<th class="px-4 py-3 font-semibold">Nilai</th>
							<th class="px-4 py-3 font-semibold">Status</th>
							<th class="px-4 py-3 font-semibold text-right">Aksi</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each data.registrations as r (r.id)}
							<tr class="hover:bg-muted/50/70">
								<td class="px-4 py-3">
									<p class="font-mono text-xs font-semibold text-foreground">{r.registrationNumber}</p>
									<p class="text-[11px] text-muted-foreground mt-0.5">{formatDateTime(r.createdAt)}</p>
								</td>
								<td class="px-4 py-3">
									<p class="font-semibold text-foreground">{r.fullName}</p>
									<p class="text-[11px] text-muted-foreground">{r.nisn || 'NISN -'}</p>
									<p class="text-[11px] text-muted-foreground">{r.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
								</td>
								<td class="px-4 py-3">
									<p class="text-xs font-medium text-foreground">{trackLabel[r.track] ?? r.track}</p>
									<p class="text-[11px] text-muted-foreground">{r.majorChoice}</p>
									<p class="text-[11px] text-muted-foreground truncate max-w-[140px]">{r.batchName ?? '-'}</p>
								</td>
								<td class="px-4 py-3">
									<p class="text-xs text-foreground max-w-[160px] truncate">{r.previousSchool}</p>
									<p class="text-[11px] text-muted-foreground">Lulus {r.graduationYear ?? '-'}</p>
								</td>
								<td class="px-4 py-3">
									{#if r.selectionScore != null}
										<span class="text-sm font-bold text-foreground">{r.selectionScore}</span>
									{:else}
										<span class="text-xs text-muted-foreground">-</span>
									{/if}
								</td>
								<td class="px-4 py-3">
									<span
										class="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border {statusBadge[
											r.status
										] ?? 'bg-muted text-muted-foreground border-border'}"
									>
										{statusLabel[r.status] ?? r.status}
									</span>
									{#if r.status === 'enrolled' && r.enrolledClassName}
										<p class="text-[10px] text-primary-foreground mt-1">{r.enrolledClassName}</p>
									{/if}
								</td>
								<td class="px-4 py-3">
									<div class="flex items-center justify-end gap-1.5">
										<button
											type="button"
											onclick={() => openDetail(r)}
											class="px-2 py-1 text-[11px] font-semibold rounded-md bg-muted text-foreground hover:bg-muted"
										>
											Detail
										</button>
										{#if r.status !== 'enrolled'}
											<button
												type="button"
												onclick={() => openStatus(r)}
												class="px-2 py-1 text-[11px] font-semibold rounded-md bg-primary/10 text-primary-foreground hover:bg-primary/20"
											>
												Ubah Status
											</button>
										{/if}
										{#if r.status === 'accepted' && !r.convertedStudentId}
											<button
												type="button"
												onclick={() => openConvert(r)}
												class="px-2 py-1 text-[11px] font-semibold rounded-md bg-success text-success-foreground hover:bg-success/90"
											>
												Jadikan Siswa
											</button>
										{/if}
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

<!-- ============================================================
     MODAL: Edit Gelombang (Periode Pendaftaran)
     ============================================================ -->
{#if showBatchEditModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
		<div class="bg-card rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between px-5 py-4 border-b bg-muted">
				<h3 class="font-bold text-foreground">Edit Gelombang Pendaftaran</h3>
				<button type="button" onclick={resetBatchEdit} class="text-muted-foreground hover:text-foreground text-xl">×</button>
			</div>
			<form
				method="POST"
				action="?/updateBatch"
				use:enhance={enhanceForm({ close: resetBatchEdit })}
				class="p-5 space-y-4"
			>
				<input type="hidden" name="batch_id" value={editBatchId} />
				<div>
					<label for="edit-batch-name" class="block text-xs font-semibold text-foreground mb-1.5">Nama Gelombang <span class="text-destructive">*</span></label>
					<input id="edit-batch-name" name="name" type="text" required class="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring" value={editBatchName} />
				</div>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div>
						<label for="edit-batch-start" class="block text-xs font-semibold text-foreground mb-1.5">Tanggal Mulai <span class="text-destructive">*</span></label>
						<input id="edit-batch-start" name="start_date" type="date" required class="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring" value={editBatchStart} />
					</div>
					<div>
						<label for="edit-batch-end" class="block text-xs font-semibold text-foreground mb-1.5">Tanggal Selesai <span class="text-destructive">*</span></label>
						<input id="edit-batch-end" name="end_date" type="date" required class="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring" value={editBatchEnd} />
					</div>
				</div>
				<p class="text-[10px] text-muted-foreground -mt-1.5">Pendaftaran hanya bisa dilakukan pada rentang tanggal ini.</p>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div>
						<label for="edit-batch-quota" class="block text-xs font-semibold text-foreground mb-1.5">Kuota <span class="text-destructive">*</span></label>
						<input id="edit-batch-quota" name="quota" type="number" min="1" required class="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring" value={editBatchQuota} />
					</div>
					<div>
						<label for="edit-batch-fee" class="block text-xs font-semibold text-foreground mb-1.5">Biaya Pendaftaran (Rp)</label>
						<input id="edit-batch-fee" name="registration_fee" type="number" min="0" class="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring" value={editBatchFee} />
					</div>
				</div>
				<div>
					<label for="edit-batch-desc" class="block text-xs font-semibold text-foreground mb-1.5">Deskripsi</label>
					<textarea id="edit-batch-desc" name="description" rows="2" class="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring">{editBatchDescription}</textarea>
				</div>
				<div class="mt-3">
					<label for="edit-batch-docreq" class="block text-xs font-semibold text-foreground mb-1.5">Persyaratan Dokumen</label>
					<p class="text-[10px] text-muted-foreground mb-2">Array JSON field persyaratan: key, label, required, formats.</p>
					<textarea id="edit-batch-docreq" name="document_requirements" rows="4" class="w-full px-3 py-3 bg-muted/50 border border-border rounded-lg text-sm font-mono focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Contoh: key, label, required, formats (array JSON)">{editBatchDocReq}</textarea>
				</div>
				<div class="flex items-center gap-2">
					<input id="edit-batch-active" name="is_active" type="checkbox" value="1" checked={editBatchIsActive === 1} class="w-4 h-4 rounded text-primary-foreground border-input" />
					<label for="edit-batch-active" class="text-xs text-foreground font-medium">Buka gelombang ini</label>
				</div>
				<div class="flex items-center justify-end gap-2 pt-2">
					<button type="button" onclick={resetBatchEdit} class="px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted rounded-lg">Batal</button>
					<button type="submit" class="px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-lg">Simpan Perubahan</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- ============================================================
     MODAL: Buat Gelombang
     ============================================================ -->
{#if showBatchModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
		<div class="bg-card rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between px-5 py-4 border-b bg-muted">
				<h3 class="font-bold text-foreground">Buat Gelombang PPDB</h3>
				<button type="button" onclick={() => (showBatchModal = false)} class="text-muted-foreground hover:text-foreground text-xl">×</button>
			</div>
			<form
				method="POST"
				action="?/createBatch"
				use:enhance={enhanceForm({ close: resetBatchModal })}
				class="p-5 space-y-4"
			>
				<div>
					<label for="batch-name" class="block text-xs font-semibold text-foreground mb-1.5">Nama Gelombang <span class="text-destructive">*</span></label>
					<input id="batch-name" name="name" type="text" required placeholder="Contoh: Gelombang 1 - Reguler 2026/2027" class="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring" />
				</div>
				<div>
					<label for="batch-year" class="block text-xs font-semibold text-foreground mb-1.5">Tahun Ajaran <span class="text-destructive">*</span></label>
					<select id="batch-year" name="academic_year_id" required class="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring">
						<option value="">— Pilih tahun ajaran —</option>
						{#each data.years as y (y.id)}
							<option value={y.id}>{y.name} ({y.semester}){y.isActive ? ' · aktif' : ''}</option>
						{/each}
					</select>
				</div>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div>
						<label for="batch-start" class="block text-xs font-semibold text-foreground mb-1.5">Tanggal Mulai <span class="text-destructive">*</span></label>
						<input id="batch-start" name="start_date" type="date" required class="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring" />
					</div>
					<div>
						<label for="batch-end" class="block text-xs font-semibold text-foreground mb-1.5">Tanggal Selesai <span class="text-destructive">*</span></label>
						<input id="batch-end" name="end_date" type="date" required class="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring" />
					</div>
				</div>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div>
						<label for="batch-quota" class="block text-xs font-semibold text-foreground mb-1.5">Kuota <span class="text-destructive">*</span></label>
						<input id="batch-quota" name="quota" type="number" min="1" value="100" required class="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring" />
					</div>
					<div>
						<label for="batch-fee" class="block text-xs font-semibold text-foreground mb-1.5">Biaya Pendaftaran (Rp)</label>
						<input id="batch-fee" name="registration_fee" type="number" min="0" value="0" class="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring" />
					</div>
				</div>
				<div>
					<label for="batch-desc" class="block text-xs font-semibold text-foreground mb-1.5">Deskripsi</label>
					<textarea id="batch-desc" name="description" rows="2" class="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring"></textarea>
				</div>
				<div class="flex items-center gap-2">
					<input id="batch-active" name="is_active" type="checkbox" value="1" checked class="w-4 h-4 rounded text-primary-foreground border-input" />
					<label for="batch-active" class="text-xs text-foreground font-medium">Langsung buka gelombang ini</label>
				</div>
				<div class="flex items-center justify-end gap-2 pt-2">
					<button type="button" onclick={() => (showBatchModal = false)} class="px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted rounded-lg">Batal</button>
					<button type="submit" class="px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-lg">Simpan</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- ============================================================
     MODAL: Tambah / Edit Jalur Pendaftaran
     ============================================================ -->
{#if showTrackModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
		<div class="bg-card rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between px-5 py-4 border-b bg-muted">
				<h3 class="font-bold text-foreground">{trackId ? 'Edit Jalur' : 'Tambah Jalur Pendaftaran'}</h3>
				<button type="button" onclick={resetTrackModal} class="text-muted-foreground hover:text-foreground text-xl">×</button>
			</div>
			<form
				method="POST"
				action={trackId ? '?/updateTrack' : '?/createTrack'}
				use:enhance={enhanceForm({ close: resetTrackModal })}
				class="p-5 space-y-4"
			>
				<input type="hidden" name="track_id" value={trackId} />
				<div>
					<label for="track-code" class="block text-xs font-semibold text-foreground mb-1.5">Kode Jalur <span class="text-destructive">*</span></label>
					<input id="track-code" name="code" type="text" required placeholder="Contoh: reguler, prestasi, zonasi" class="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring" value={trackCode} readonly={!!trackId} />
					<p class="text-[10px] text-muted-foreground mt-0.5">Hanya huruf, angka, strip (-), atau garis bawah (_). Tidak bisa diubah setelah disimpan.</p>
				</div>
				<div>
					<label for="track-name" class="block text-xs font-semibold text-foreground mb-1.5">Nama Jalur <span class="text-destructive">*</span></label>
					<input id="track-name" name="name" type="text" required placeholder="Contoh: Jalur Reguler (Tes CBT & Wawancara)" class="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring" value={trackName} />
				</div>
				<div>
					<label for="track-desc" class="block text-xs font-semibold text-foreground mb-1.5">Deskripsi</label>
					<textarea id="track-desc" name="description" rows="2" class="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring">{trackDescription}</textarea>
				</div>
				<div class="flex items-center gap-2">
					<input id="track-active" name="is_active" type="checkbox" value="1" checked={trackIsActive === 1} class="w-4 h-4 rounded text-primary-foreground border-input" />
					<label for="track-active" class="text-xs text-foreground font-medium">Aktifkan jalur ini</label>
				</div>
				<div class="flex items-center justify-end gap-2 pt-2">
					<button type="button" onclick={resetTrackModal} class="px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted rounded-lg">Batal</button>
					<button type="submit" class="px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-lg">{trackId ? 'Simpan Perubahan' : 'Tambah Jalur'}</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- ============================================================
     MODAL: Ubah Status Pendaftar
     ============================================================ -->
{#if showStatusModal && selectedReg}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
		<div class="bg-card rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between px-5 py-4 border-b bg-muted">
				<h3 class="font-bold text-foreground">Ubah Status Pendaftar</h3>
				<button type="button" onclick={() => (showStatusModal = false)} class="text-muted-foreground hover:text-foreground text-xl">×</button>
			</div>
			<form
				method="POST"
				action="?/updateRegistration"
				use:enhance={enhanceForm({ close: () => (showStatusModal = false) })}
				class="p-5 space-y-4"
			>
				<input type="hidden" name="registration_id" value={selectedReg.id} />
				<div class="bg-muted/50 rounded-lg p-3 text-xs">
					<p class="font-bold text-foreground">{selectedReg.fullName}</p>
					<p class="text-muted-foreground font-mono">{selectedReg.registrationNumber} · {selectedReg.nisn || 'NISN -'}</p>
				</div>
				<div>
					<label for="reg-status" class="block text-xs font-semibold text-foreground mb-1.5">Status <span class="text-destructive">*</span></label>
					<select id="reg-status" name="status" bind:value={statusValue} class="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring">
						<option value="verified">Terverifikasi (berkas lengkap)</option>
						<option value="accepted">Lulus seleksi</option>
						<option value="rejected">Tidak lulus</option>
					</select>
				</div>
				<div>
					<label for="reg-score" class="block text-xs font-semibold text-foreground mb-1.5">Nilai Seleksi (0–100)</label>
					<input id="reg-score" name="selection_score" type="number" min="0" max="100" step="1" bind:value={scoreValue} class="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring" />
				</div>
				<div>
					<label for="reg-notes" class="block text-xs font-semibold text-foreground mb-1.5">Catatan Panitia</label>
					<textarea id="reg-notes" name="notes" rows="3" bind:value={notesValue} placeholder="Catatan untuk pendaftar (opsional)" class="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring"></textarea>
				</div>
				<div class="flex items-center justify-end gap-2 pt-2">
					<button type="button" onclick={() => (showStatusModal = false)} class="px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted rounded-lg">Batal</button>
					<button type="submit" class="px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-lg">Simpan Status</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- ============================================================
     MODAL: Konversi menjadi Siswa
     ============================================================ -->
{#if showConvertModal && selectedReg}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
		<div class="bg-card rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between px-5 py-4 border-b bg-muted">
				<h3 class="font-bold text-foreground">Daftarkan sebagai Siswa</h3>
				<button type="button" onclick={() => (showConvertModal = false)} class="text-muted-foreground hover:text-foreground text-xl">×</button>
			</div>
			<form
				method="POST"
				action="?/convertToStudent"
				use:enhance={enhanceForm({
					close: () => (showConvertModal = false),
					onSuccess: (d) => {
						if (d?.credentials) {
							convertedCredentials = d.credentials;
							showCredentialModal = true;
						}
					}
				})}
				class="p-5 space-y-4"
			>
				<input type="hidden" name="registration_id" value={selectedReg.id} />
				<div class="bg-success/10 border border-success/20 rounded-lg p-3 text-xs">
					<p class="font-bold text-success-foreground">{selectedReg.fullName}</p>
					<p class="text-success-foreground">{selectedReg.registrationNumber} · {selectedReg.nisn || 'NISN -'}</p>
					<p class="text-success-foreground mt-1">Pendaftar akan dibuatkan akun siswa dan dimasukkan ke kelas yang dipilih.</p>
				</div>
				<div>
					<label for="convert-class" class="block text-xs font-semibold text-foreground mb-1.5">Kelas Tujuan <span class="text-destructive">*</span></label>
					<select id="convert-class" name="class_id" required bind:value={convertClassId} class="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring">
						<option value="">— Pilih kelas —</option>
						{#each data.classes as c (c.id)}
							<option value={c.id}>{c.name} ({c.level})</option>
						{/each}
					</select>
					{#if data.classes.length === 0}
						<p class="text-[11px] text-destructive mt-1">Belum ada kelas. Buat kelas terlebih dahulu di menu Kelas.</p>
					{/if}
				</div>
				<div>
					<label for="convert-nis" class="block text-xs font-semibold text-foreground mb-1.5">NIS</label>
					<input id="convert-nis" name="nis" type="text" bind:value={convertNis} placeholder="Kosongkan untuk otomatis" class="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring" />
				</div>
				<div>
					<label for="convert-email" class="block text-xs font-semibold text-foreground mb-1.5">Email Akun</label>
					<input id="convert-email" name="email" type="email" bind:value={convertEmail} placeholder="Kosongkan untuk otomatis" class="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring" />
				</div>
				<div>
					<label for="convert-password" class="block text-xs font-semibold text-foreground mb-1.5">Password Awal</label>
					<input id="convert-password" name="password" type="text" bind:value={convertPassword} placeholder="Kosongkan untuk default: siswa12345" class="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring" />
				</div>
				<div class="flex items-center justify-end gap-2 pt-2">
					<button type="button" onclick={() => (showConvertModal = false)} class="px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted rounded-lg">Batal</button>
					<button type="submit" class="px-5 py-2 bg-success hover:bg-success/90 text-success-foreground text-sm font-semibold rounded-lg">Buat Akun Siswa</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- ============================================================
     MODAL: Detail Pendaftar
     ============================================================ -->
{#if showDetailModal && selectedReg}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
		<div class="bg-card rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between px-5 py-4 border-b bg-muted">
				<div>
					<h3 class="font-bold text-foreground">{selectedReg.fullName}</h3>
					<p class="text-xs text-muted-foreground font-mono">{selectedReg.registrationNumber}</p>
				</div>
				<button type="button" onclick={() => (showDetailModal = false)} class="text-muted-foreground hover:text-foreground text-xl">×</button>
			</div>
			<div class="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
				<div><p class="text-[11px] text-muted-foreground">NISN</p><p class="font-semibold text-foreground">{selectedReg.nisn || '-'}</p></div>
				<div><p class="text-[11px] text-muted-foreground">NIK</p><p class="font-semibold text-foreground">{selectedReg.nik || '-'}</p></div>
				<div><p class="text-[11px] text-muted-foreground">Jenis Kelamin</p><p class="font-semibold text-foreground">{selectedReg.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</p></div>
				<div><p class="text-[11px] text-muted-foreground">Agama</p><p class="font-semibold text-foreground">{selectedReg.religion || '-'}</p></div>
				<div><p class="text-[11px] text-muted-foreground">Tempat, Tanggal Lahir</p><p class="font-semibold text-foreground">{selectedReg.birthPlace || '-'}, {formatDate(selectedReg.birthDate)}</p></div>
				<div><p class="text-[11px] text-muted-foreground">No. HP</p><p class="font-semibold text-foreground">{selectedReg.phone || '-'}</p></div>
				<div class="sm:col-span-2"><p class="text-[11px] text-muted-foreground">Alamat</p><p class="font-semibold text-foreground">{selectedReg.address}</p></div>
				<div><p class="text-[11px] text-muted-foreground">Email</p><p class="font-semibold text-foreground">{selectedReg.email || '-'}</p></div>
				<div><p class="text-[11px] text-muted-foreground">Asal Sekolah</p><p class="font-semibold text-foreground">{selectedReg.previousSchool}</p></div>
				<div><p class="text-[11px] text-muted-foreground">Jalur / Jurusan</p><p class="font-semibold text-foreground">{trackLabel[selectedReg.track] ?? selectedReg.track} · {selectedReg.majorChoice}</p></div>
				<div><p class="text-[11px] text-muted-foreground">Gelombang</p><p class="font-semibold text-foreground">{selectedReg.batchName ?? '-'}</p></div>
				<div><p class="text-[11px] text-muted-foreground">Orang Tua / Wali</p><p class="font-semibold text-foreground">{selectedReg.parentName}</p></div>
				<div><p class="text-[11px] text-muted-foreground">No. HP Orang Tua</p><p class="font-semibold text-foreground">{selectedReg.parentPhone}</p></div>
				<div><p class="text-[11px] text-muted-foreground">Pekerjaan Orang Tua</p><p class="font-semibold text-foreground">{selectedReg.parentJob || '-'}</p></div>
				<div class="sm:col-span-2 border-t bg-muted pt-3">
					<div class="flex flex-wrap items-center gap-3">
						<span class="px-2.5 py-1 rounded-full text-[11px] font-semibold border {statusBadge[selectedReg.status] ?? 'bg-muted text-muted-foreground border-border'}">
							{statusLabel[selectedReg.status] ?? selectedReg.status}
						</span>
						{#if selectedReg.selectionScore != null}
							<span class="text-xs text-muted-foreground">Nilai seleksi: <strong>{selectedReg.selectionScore}</strong></span>
						{/if}
						{#if selectedReg.enrolledClassName}
							<span class="text-xs text-primary-foreground">Kelas: <strong>{selectedReg.enrolledClassName}</strong></span>
						{/if}
					</div>
					{#if selectedReg.notes}
						<p class="text-xs text-muted-foreground mt-2 bg-warning/10 border border-amber-100 rounded-lg p-2.5">{selectedReg.notes}</p>
					{/if}
				</div>

				<!-- Dokumen Upload -->
				{#if selectedReg.documents.length}
					<div class="mt-2 border border-border rounded-xl p-3 text-sm">
						<h4 class="text-xs font-bold text-foreground mb-3">Dokumen yang Di-Upload</h4>
						<table class="w-full text-left text-xs">
							<thead><tr class="border-b bg-muted/50">
								<th class="pb-2">Dokumen</th><th class="pb-2 text-center w-20">Status</th><th class="pb-2 w-44">Aksi</th>
							</tr></thead>
							<tbody>
								{#each selectedReg.documents as doc}
									<tr class="border-b border-border/50 last:border-0">
										<td>{doc.documentLabel}</td>
										<td class="text-center">
											<span class="px-2 py-0.5 rounded text-[10px] font-semibold {doc.status === 'verified' ? 'bg-success/10 text-success-foreground border border-success/20' : doc.status === 'rejected' ? 'bg-destructive/10 text-destructive-foreground border border-destructive/20' : 'bg-warning/10 text-warning-foreground border border-warning/20'}">
												{doc.status === 'verified' ? '✓ Disetujui' : doc.status === 'rejected' ? '✗ Ditolak' : '⏳ Pending'}
											</span>
											{#if doc.rejectedReason}<div class="text-[10px] text-destructive mt-1">{doc.rejectedReason}</div>{/if}
										</td>
										<td>
											<div class="flex flex-wrap items-center gap-1.5">
												<a href={doc.url} target="_blank" rel="noopener" class="text-xs text-primary-foreground underline underline-offset-4">Lihat</a>
												<a href={`${doc.url}?download=1`} download class="text-xs text-muted-foreground underline underline-offset-4">Unduh</a>
												<form method="POST" action="?/verifyDocument" use:enhance={enhanceForm()} class="inline">
													<input type="hidden" name="document_id" value={doc.id} />
													<input type="hidden" name="doc_action" value="verify" />
													<button type="submit" disabled={doc.status === 'verified'} class="px-2 py-1 text-xs rounded bg-success/10 text-success-foreground hover:bg-success/20 disabled:opacity-50">Setujui</button>
												</form>
												<form method="POST" action="?/verifyDocument" use:enhance={enhanceForm()} class="inline-flex items-center gap-1">
													<input type="hidden" name="document_id" value={doc.id} />
													<input type="hidden" name="doc_action" value="reject" />
													<input name="rejected_reason" placeholder="Alasan" class="text-xs w-20 px-1.5 py-1 bg-background border border-border rounded" />
													<button type="submit" disabled={doc.status === 'rejected'} class="px-2 py-1 text-xs rounded bg-destructive/10 text-destructive-foreground hover:bg-destructive/20 disabled:opacity-50">Tolak</button>
												</form>
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<p class="mt-2 text-[11px] text-muted-foreground">Belum ada dokumen yang diunggah.</p>
				{/if}
			</div>
			<div class="px-5 py-4 border-t bg-muted flex justify-end">
				<button type="button" onclick={() => (showDetailModal = false)} class="px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted rounded-lg">Tutup</button>
			</div>		</div>
	</div>
{/if}

<!-- ============================================================
     MODAL: Kredensial Siswa Baru
     ============================================================ -->
{#if showCredentialModal && convertedCredentials}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
		<div class="bg-card rounded-2xl shadow-xl w-full max-w-md">
			<div class="px-5 py-4 border-b bg-muted">
				<h3 class="font-bold text-foreground">Akun Siswa Berhasil Dibuat</h3>
			</div>
			<div class="p-5 space-y-3 text-sm">
				<p class="text-xs text-muted-foreground">
					Berikan kredensial berikut kepada siswa/orang tua untuk masuk ke portal.
				</p>
				<div class="bg-muted/50 border border-border rounded-xl p-4 space-y-2">
					<div class="flex justify-between gap-3"><span class="text-muted-foreground text-xs">Nama</span><span class="font-semibold text-foreground text-right">{convertedCredentials.name}</span></div>
					<div class="flex justify-between gap-3"><span class="text-muted-foreground text-xs">Kelas</span><span class="font-semibold text-foreground">{convertedCredentials.className}</span></div>
					<div class="flex justify-between gap-3"><span class="text-muted-foreground text-xs">NIS</span><span class="font-mono font-semibold text-foreground">{convertedCredentials.nis}</span></div>
					<div class="flex justify-between gap-3"><span class="text-muted-foreground text-xs">Email</span><span class="font-mono font-semibold text-foreground text-right break-all">{convertedCredentials.email}</span></div>
					<div class="flex justify-between gap-3"><span class="text-muted-foreground text-xs">Password</span><span class="font-mono font-semibold text-success-foreground">{convertedCredentials.password}</span></div>
				</div>
				<div class="flex justify-end pt-2">
					<button type="button" onclick={() => (showCredentialModal = false)} class="px-4 py-2 bg-foreground hover:bg-foreground/90 text-white text-sm font-semibold rounded-lg">Selesai</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- ============================================================
     MODAL: Konfirmasi Hapus Gelombang
     ============================================================ -->
{#if showDeleteConfirm && deleteTarget}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
		<div class="bg-card rounded-2xl shadow-xl w-full max-w-sm">
			<div class="p-5 space-y-4">
				<div class="flex items-start gap-3">
					<span class="text-2xl">🗑️</span>
					<div>
						<h3 class="font-bold text-foreground">Hapus {deleteKind === 'track' ? 'jalur' : 'gelombang'}?</h3>
						<p class="text-xs text-muted-foreground mt-1">
							{deleteKind === 'track' ? 'Jalur' : 'Gelombang'} <strong>{deleteTarget.name}</strong> akan dihapus. Tindakan ini tidak dapat dibatalkan.
						</p>
					</div>
				</div>
				<form method="POST" action={deleteKind === 'track' ? '?/deleteTrack' : '?/deleteBatch'} use:enhance={enhanceForm({ close: () => (showDeleteConfirm = false) })} class="flex justify-end gap-2">
					{#if deleteKind === 'track'}
						<input type="hidden" name="track_id" value={deleteTarget.id} />
					{:else}
						<input type="hidden" name="batch_id" value={deleteTarget.id} />
					{/if}
					<button type="button" onclick={() => (showDeleteConfirm = false)} class="px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted rounded-lg">Batal</button>
					<button type="submit" class="px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground text-sm font-semibold rounded-lg">Hapus</button>
				</form>
			</div>
		</div>
	</div>
{/if}
