<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Alert } from '$lib/components/ui/alert/index.js';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog/index.js';
	import { Select, SelectItem } from '$lib/components/ui/select/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Pagination } from '$lib/components/ui/pagination/index.js';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Formatters
	function formatRupiah(num: number): string {
		return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
	}

	// Modal States
	let showPayModal = $state(false);
	let showReceiptModal = $state(false);
	let showCancelModal = $state(false);
	let showRecordPayModal = $state(false);
	let showExpenseModal = $state(false);

	let selectedPaymentForReceipt = $state<any>(null);
	let selectedPaymentForCancel = $state<any>(null);

	// Expense / Penarikan Dana Form States
	let expenseDate = $state(new Date().toISOString().slice(0, 10));
	let expenseAmount = $state('');
	let expenseCategory = $state('operasional');
	let expenseDescription = $state('');
	let expenseNotes = $state('');
	let expenseAcademicYearId = $state<number | null>(null);

	// Pay Form States
	let payStudentId = $state<number | null>(null);
	// Record Payment State
	let recordStudentId = $state<number | null>(null);
	let recordStudentQuery = $state('');
	let recordStudentOpen = $state(false);
	const recordSiswaResults = $derived.by(() => {
		const q = recordStudentQuery.trim().toLowerCase();
		return q
			? data.studentOptions ?? [].filter((s: any) =>
					(s.name ?? '').toLowerCase().includes(q) || String(s.nis ?? '').includes(q)
			  ).slice(0, 8)
			: data.studentOptions ?? [].slice(0, 8);
	});
	let recordMonth = $state<string>('');
	let recordYearStr = $state<string>('');
	let recordPaymentDate = $state(new Date().toISOString().slice(0, 10));
	let recordPaymentMethod = $state<'cash' | 'transfer'>('cash');
	let recordNotes = $state('');
	let recordSubmitting = $state(false);
	let payPaymentIds = $state<number[]>([]);
	let payPaymentDate = $state(new Date().toISOString().slice(0, 10));
	let payPaymentMethod = $state<'cash' | 'transfer'>('cash');
	let payNotes = $state('');

	// Multi-select in table
	let selectedTableIds = $state<number[]>([]);

	const MONTHS = [
		{ value: '7', label: 'Juli' },
		{ value: '8', label: 'Agustus' },
		{ value: '9', label: 'September' },
		{ value: '10', label: 'Oktober' },
		{ value: '11', label: 'November' },
		{ value: '12', label: 'Desember' },
		{ value: '1', label: 'Januari' },
		{ value: '2', label: 'Februari' },
		{ value: '3', label: 'Maret' },
		{ value: '4', label: 'April' },
		{ value: '5', label: 'Mei' },
		{ value: '6', label: 'Juni' }
	];

	// Filter States
	let filterQ = $state(data.filters?.q ?? '');
	let filterClass = $state(data.filters?.classId ? String(data.filters.classId) : '');
	let filterMonth = $state(data.filters?.month ? String(data.filters.month) : '');
	let filterStatus = $state(data.filters?.status && data.filters.status !== 'all' ? data.filters.status : '');

	function resetFilters() {
		filterQ = '';
		filterClass = '';
		filterMonth = '';
		filterStatus = '';
		pageAdmin = 1;
	}

	let hasActiveFilter = $derived(!!(filterQ || filterClass || filterMonth || filterStatus));

	let filteredAdminPayments = $derived(
		(data.adminPayments ?? []).filter((p: any) => {
			if (filterQ) {
				const q = filterQ.toLowerCase();
				const matchName = (p.studentName ?? '').toLowerCase().includes(q);
				const matchNis = String(p.studentNis ?? '').toLowerCase().includes(q);
				const matchInv = (p.invoiceNumber ?? '').toLowerCase().includes(q);
				if (!matchName && !matchNis && !matchInv) return false;
			}
			if (filterClass && String(p.classId) !== filterClass) return false;
			if (filterMonth && String(p.month) !== filterMonth) return false;
			if (filterStatus && p.status !== filterStatus) return false;
			return true;
		})
	);

	// Pagination
	let pageAdmin = $state(1);
	let pageSizeAdmin = $state(10);
	let paginatedAdminPayments = $derived(
		filteredAdminPayments.slice((pageAdmin - 1) * pageSizeAdmin, pageAdmin * pageSizeAdmin)
	);

	let pageSiswa = $state(1);
	let pageSizeSiswa = $state(10);
	let paginatedSiswaPayments = $derived(
		(data.siswaPayments ?? []).slice((pageSiswa - 1) * pageSizeSiswa, pageSiswa * pageSizeSiswa)
	);

	let pagePengeluaran = $state(1);
	let pageSizePengeluaran = $state(10);
	let paginatedPengeluaran = $derived(
		(data.pengeluaran ?? []).slice(
			(pagePengeluaran - 1) * pageSizePengeluaran,
			pagePengeluaran * pageSizePengeluaran
		)
	);

	function toggleSelectAll(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.checked) {
			selectedTableIds = (paginatedAdminPayments || [])
				.filter((p: any) => p.status === 'pending')
				.map((p: any) => p.id);
		} else {
			selectedTableIds = [];
		}
	}

	function openSinglePay(payment: any) {
		payPaymentIds = [payment.id];
		payStudentId = payment.studentId;
		payPaymentDate = new Date().toISOString().slice(0, 10);
		payPaymentMethod = 'cash';
		payNotes = '';
		showPayModal = true;
	}

	function openBulkPay() {
		if (selectedTableIds.length === 0) return;
		payPaymentIds = [...selectedTableIds];
		payStudentId = null;
		payPaymentDate = new Date().toISOString().slice(0, 10);
		payPaymentMethod = 'cash';
		payNotes = '';
		showPayModal = true;
	}

	function openReceipt(payment: any) {
		selectedPaymentForReceipt = payment;
		showReceiptModal = true;
	}

	function openCancelConfirm(payment: any) {
		selectedPaymentForCancel = payment;
		showCancelModal = true;
	}

	function printReceipt() {
		window.print();
	}

	function openExpense() {
		expenseDate = new Date().toISOString().slice(0, 10);
		expenseAmount = '';
		expenseCategory = 'operasional';
		expenseDescription = '';
		expenseNotes = '';
		expenseAcademicYearId = data.activeYear?.id ?? null;
		showExpenseModal = true;
	}
</script>

<svelte:head>
	<title>Keuangan SPP — Sistem Informasi Sekolah</title>
</svelte:head>

<div class="space-y-6">
	<!-- Flash message -->
	{#if form?.message}
		<Alert
			variant={form?.success ? 'default' : 'destructive'}
			class="border-border bg-background text-foreground"
		>
			<span>{form.message}</span>
		</Alert>
	{/if}

	{#if data.isSiswa}
		<!-- ========================================== -->
		<!-- VIEW KHUSUS SISWA: KARTU SPP DIGITAL       -->
		<!-- ========================================== -->
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
			<div>
				<h1 class="text-2xl font-bold text-foreground">Kartu SPP Siswa</h1>
				<p class="text-sm text-muted-foreground mt-1">
					Status kewajiban dan riwayat pembayaran SPP Anda
				</p>
			</div>
			{#if data.student}
				<div class="bg-card border border-border rounded-xl px-4 py-2 text-right">
					<p class="text-xs text-muted-foreground">Siswa / Kelas</p>
					<p class="text-sm font-bold text-foreground">
						{data.student.name} ({data.student.className ?? 'Belum ada kelas'})
					</p>
					<p class="text-xs text-muted-foreground">NIS: {data.student.nis ?? '-'}</p>
				</div>
			{/if}
		</div>

		<!-- Summary Cards Siswa -->
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
			<Card>
				<CardContent class="pt-5">
					<p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Total Dibayar
					</p>
					<p class="text-2xl font-bold text-success-foreground mt-1">
						{formatRupiah(data.summary?.totalDibayar ?? 0)}
					</p>
					<p class="text-xs text-muted-foreground mt-1">Kewajiban terbayar</p>
				</CardContent>
			</Card>
			<Card>
				<CardContent class="pt-5">
					<p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Sisa Tunggakan
					</p>
					<p class="text-2xl font-bold text-warning-foreground mt-1">
						{formatRupiah(data.summary?.sisaTunggakan ?? 0)}
					</p>
					<p class="text-xs text-muted-foreground mt-1">Belum dilunasi</p>
				</CardContent>
			</Card>
			<Card>
				<CardContent class="pt-5">
					<p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Total Tagihan
					</p>
					<p class="text-2xl font-bold text-foreground mt-1">
						{formatRupiah(data.summary?.totalKewajiban ?? 0)}
					</p>
					<p class="text-xs text-muted-foreground mt-1">Tahun berjalan</p>
				</CardContent>
			</Card>
		</div>

		<!-- Tabel Kartu SPP Siswa -->
		<Card>
			<CardHeader class="border-b border-border py-4 flex items-center justify-between">
				<CardTitle class="text-base font-semibold text-foreground">
					Rincian SPP Per Bulan
				</CardTitle>
				<span class="text-xs text-muted-foreground">Diperbarui secara realtime</span>
			</CardHeader>
			<CardContent class="p-0">
				<div class="overflow-x-auto">
					<Table class="text-sm">
						<TableHeader>
							<TableRow>
								<TableHead class="px-4 sm:px-6 py-3">Bulan</TableHead>
								<TableHead class="px-4 sm:px-6 py-3 hidden sm:table-cell">Tahun Ajaran</TableHead>
								<TableHead class="px-4 sm:px-6 py-3">Nominal</TableHead>
								<TableHead class="px-4 sm:px-6 py-3">Status</TableHead>
								<TableHead class="px-4 sm:px-6 py-3">Tgl Bayar</TableHead>
								<TableHead class="px-4 sm:px-6 py-3 hidden sm:table-cell">No. Kuitansi</TableHead>
								<TableHead class="px-4 sm:px-6 py-3 text-right">Aksi</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody class="divide-y divide-border">
							{#if data.siswaPayments && data.siswaPayments.length > 0}
								{#each paginatedSiswaPayments as p}
									<TableRow class="hover:bg-accent">
										<TableCell class="px-4 sm:px-6 py-4 font-semibold text-foreground">
											{p.monthName} {p.year}
										</TableCell>
										<TableCell class="px-4 sm:px-6 py-4 text-muted-foreground hidden sm:table-cell">
											{p.academicYearName} ({p.academicYearSemester})
										</TableCell>
										<TableCell class="px-4 sm:px-6 py-4 font-medium text-foreground">
											{formatRupiah(p.amount)}
										</TableCell>
										<TableCell class="px-4 sm:px-6 py-4">
											{#if p.status === 'paid'}
												<Badge class="bg-success/10 text-success-foreground">
													✓ Lunas
												</Badge>
											{:else}
												<Badge class="bg-warning/10 text-warning-foreground">
													Belum Lunas
												</Badge>
											{/if}
										</TableCell>
										<TableCell class="px-4 sm:px-6 py-4 text-muted-foreground">
											{p.paymentDate ?? '-'}
										</TableCell>
										<TableCell class="px-4 sm:px-6 py-4 font-mono text-xs text-muted-foreground hidden sm:table-cell">
											{p.invoiceNumber ?? '-'}
										</TableCell>
										<TableCell class="px-4 sm:px-6 py-4 text-right">
											{#if p.status === 'paid'}
												<Button
													variant="outline"
													size="sm"
													class="bg-primary/10 text-primary-foreground hover:bg-primary/20"
													onclick={() => openReceipt(p)}
												>
													Kuitansi
												</Button>
											{:else}
												<span class="text-xs text-muted-foreground italic">
													Harap bayar di kasir
												</span>
											{/if}
										</TableCell>
									</TableRow>
								{/each}
							{:else}
								<TableRow>
									<TableCell colspan={7} class="px-4 sm:px-6 py-10 text-center text-muted-foreground text-sm">
										Belum ada data tagihan SPP untuk akun Anda.
									</TableCell>
								</TableRow>
							{/if}
						</TableBody>
					</Table>
				</div>
				<Pagination
					bind:page={pageSiswa}
					bind:pageSize={pageSizeSiswa}
					totalItems={data.siswaPayments?.length ?? 0}
				/>
			</CardContent>
		</Card>

	{:else}
		<!-- ========================================== -->
		<!-- VIEW ADMIN KEUANGAN & ADMIN SEKOLAH        -->
		<!-- ========================================== -->
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
			<div>
				<h1 class="text-2xl font-bold text-foreground">Manajemen Pembayaran SPP</h1>
				<p class="text-sm text-muted-foreground mt-1">
					Kelola transaksi pembayaran SPP siswa, kuitansi kasir, dan status tagihan bulanan
				</p>
			</div>
			<div class="flex flex-wrap gap-2 sm:gap-3">
				<Button onclick={() => (showRecordPayModal = true)}>
					<span data-icon="inline-start">✓</span> Catat Pembayaran
				</Button>
				<Button onclick={openExpense}>
					<span data-icon="inline-start">↓</span> Catat Pengeluaran
				</Button>
			</div>
		</div>

		<!-- Nav Tabs Keuangan -->
		<div class="grid grid-cols-3 gap-1 mb-5 bg-muted p-1 rounded-lg sm:flex sm:w-fit">
			<a href="/dashboard/keuangan" class="min-h-10 px-2 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center justify-center bg-card text-foreground shadow-sm">Transaksi</a>
			<a href="/dashboard/keuangan/tarif" class="min-h-10 px-2 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground">Pengaturan Tarif</a>
			<a href="/dashboard/keuangan/laporan" class="min-h-10 px-2 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground">Laporan &amp; Rekap</a>
		</div>

		<!-- Summary Statistics Cards -->
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
			<Card class="shadow-sm">
				<CardContent class="p-5">
					<div class="flex items-center justify-between">
						<p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							Total Kas SPP Masuk
						</p>
						<span class="w-8 h-8 rounded-lg bg-success/10 text-success-foreground flex items-center justify-center font-bold text-xs">
							✓
						</span>
					</div>
					<p class="text-2xl font-bold text-success-foreground mt-2">
						{formatRupiah(data.stats?.totalKas ?? 0)}
					</p>
					<p class="text-xs text-muted-foreground mt-1">Pembayaran berstatus lunas</p>
				</CardContent>
			</Card>

			<Card class="shadow-sm">
				<CardContent class="p-5">
					<div class="flex items-center justify-between">
						<p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							Sisa Tunggakan
						</p>
						<span class="w-8 h-8 rounded-lg bg-warning/10 text-warning-foreground flex items-center justify-center font-bold text-xs">
							!
						</span>
					</div>
					<p class="text-2xl font-bold text-warning-foreground mt-2">
						{formatRupiah(data.stats?.totalTunggakan ?? 0)}
					</p>
					<p class="text-xs text-muted-foreground mt-1">Tagihan belum dilunasi</p>
				</CardContent>
			</Card>

			<Card class="shadow-sm">
				<CardContent class="p-5">
					<div class="flex items-center justify-between">
						<p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							Total Kewajiban Tagihan
						</p>
						<span class="w-8 h-8 rounded-lg bg-primary/10 text-primary-foreground flex items-center justify-center font-bold text-xs">
							∑
						</span>
					</div>
					<p class="text-2xl font-bold text-foreground mt-2">
						{formatRupiah(data.stats?.totalKewajiban ?? 0)}
					</p>
					<p class="text-xs text-muted-foreground mt-1">Tahun ajaran aktif</p>
				</CardContent>
			</Card>
					<Card class="shadow-sm">
				<CardContent class="p-5">
					<div class="flex items-center justify-between">
						<p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							Total Pengeluaran
						</p>
						<span class="w-8 h-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center font-bold text-xs">
							↓
						</span>
					</div>
					<p class="text-2xl font-bold text-destructive mt-2">
						{formatRupiah(data.stats?.totalPengeluaran ?? 0)}
					</p>
					<p class="text-xs text-muted-foreground mt-1">Penarikan dana tercatat</p>
				</CardContent>
			</Card>

			<Card class="shadow-sm">
				<CardContent class="p-5">
					<div class="flex items-center justify-between">
						<p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							Saldo Kas
						</p>
						<span class="w-8 h-8 rounded-lg bg-primary/10 text-primary-foreground flex items-center justify-center font-bold text-xs">
							$
						</span>
					</div>
					<p class="text-2xl font-bold mt-2" style="color: {((data.stats?.saldoKas ?? 0) >= 0) ? 'var(--success-foreground)' : 'var(--destructive)'}">
						{formatRupiah(data.stats?.saldoKas ?? 0)}
					</p>
					<p class="text-xs text-muted-foreground mt-1">Masuk − Keluar</p>
				</CardContent>
			</Card>

		</div>

		<!-- Action bar if items selected -->
		{#if selectedTableIds.length > 0}
			<Card class="bg-success/10 border border-success/20 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
				<p class="text-sm font-medium text-success-foreground">
					{selectedTableIds.length} tagihan SPP terpilih
				</p>
				<Button onclick={openBulkPay}>
					Bayar Sekaligus ({selectedTableIds.length} Bulan)
				</Button>
			</Card>
		{/if}

		<!-- Tabel Transaksi Pembayaran -->
		<Card>
			<CardHeader class="border-b border-border py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
				<div>
					<CardTitle class="text-base font-semibold text-foreground">
						Daftar Tagihan & Pembayaran SPP
					</CardTitle>
					<p class="text-xs text-muted-foreground mt-0.5">
						Menampilkan {filteredAdminPayments.length} transaksi
					</p>
				</div>
				<div class="flex items-center gap-2">
					<Label for="filter-year-select" class="text-xs text-muted-foreground whitespace-nowrap">Tahun Ajaran:</Label>
					<select
						id="filter-year-select"
						value={data.selectedYearId ? String(data.selectedYearId) : ''}
						onchange={(e) => {
							const val = (e.target as HTMLSelectElement).value;
							const u = new URL(window.location.href);
							if (val) u.searchParams.set('year_id', val);
							else u.searchParams.delete('year_id');
							goto(u.toString());
						}}
						class="h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
					>
						<option value="">— Semua Tahun Ajaran —</option>
						{#each data.allYears as y}
							<option value={String(y.id)}>
								{y.name} ({y.semester}) {y.isActive ? '★' : ''}
							</option>
						{/each}
					</select>
				</div>
			</CardHeader>
			<CardContent class="p-0">
				<!-- Mobile filter bar -->
				<div class="md:hidden p-3 border-b border-border bg-muted/20 space-y-2">
					<div class="flex items-center gap-2">
						<Input
							bind:value={filterQ}
							oninput={() => (pageAdmin = 1)}
							placeholder="Cari siswa / NIS / invoice..."
							class="h-8 text-xs bg-background flex-1"
						/>
						{#if hasActiveFilter}
							<Button variant="ghost" size="sm" class="h-8 px-2 text-xs" onclick={resetFilters}>
								<RotateCcw class="w-3.5 h-3.5" />
							</Button>
						{/if}
					</div>
					<div class="grid grid-cols-3 gap-2">
						<select
							bind:value={filterClass}
							onchange={() => (pageAdmin = 1)}
							class="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
						>
							<option value="">Semua Kelas</option>
							{#each data.allClasses as c}
								<option value={String(c.id)}>{c.name}</option>
							{/each}
						</select>
						<select
							bind:value={filterMonth}
							onchange={() => (pageAdmin = 1)}
							class="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
						>
							<option value="">Semua Bulan</option>
							{#each MONTHS as m}
								<option value={m.value}>{m.label}</option>
							{/each}
						</select>
						<select
							bind:value={filterStatus}
							onchange={() => (pageAdmin = 1)}
							class="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
						>
							<option value="">Semua Status</option>
							<option value="paid">Lunas</option>
							<option value="pending">Belum Lunas</option>
						</select>
					</div>
				</div>

				<div class="overflow-x-auto">
					<Table class="text-sm">
						<TableHeader>
							<TableRow>
								<TableHead class="px-4 py-3 text-center w-10">
									<input
										type="checkbox"
										onchange={toggleSelectAll}
										checked={paginatedAdminPayments.some((p: any) => p.status === 'pending') &&
											paginatedAdminPayments
												.filter((p: any) => p.status === 'pending')
												.every((p: any) => selectedTableIds.includes(p.id))}
										class="rounded border-input text-primary-foreground focus:ring-ring"
									/>
								</TableHead>
								<TableHead class="px-4 py-3">Siswa</TableHead>
								<TableHead class="px-4 py-3 hidden sm:table-cell">Kelas</TableHead>
								<TableHead class="px-4 py-3">Bulan</TableHead>
								<TableHead class="px-4 py-3">Nominal</TableHead>
								<TableHead class="px-4 py-3">Status</TableHead>
								<TableHead class="px-4 py-3 hidden sm:table-cell">Tgl Bayar / Kasir</TableHead>
								<TableHead class="px-4 py-3 hidden sm:table-cell">No. Kuitansi</TableHead>
								<TableHead class="px-4 py-3 text-right">Aksi</TableHead>
							</TableRow>
							<TableRow class="bg-muted/30">
								<TableHead class="p-2"></TableHead>
								<TableHead class="p-2">
									<Input
										bind:value={filterQ}
										oninput={() => (pageAdmin = 1)}
										placeholder="Cari siswa / NIS..."
										class="h-8 text-xs bg-background"
									/>
								</TableHead>
								<TableHead class="p-2 hidden sm:table-cell">
									<select
										bind:value={filterClass}
										onchange={() => (pageAdmin = 1)}
										class="h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
									>
										<option value="">Semua Kelas</option>
										{#each data.allClasses as c}
											<option value={String(c.id)}>{c.name}</option>
										{/each}
									</select>
								</TableHead>
								<TableHead class="p-2">
									<select
										bind:value={filterMonth}
										onchange={() => (pageAdmin = 1)}
										class="h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
									>
										<option value="">Semua Bulan</option>
										{#each MONTHS as m}
											<option value={m.value}>{m.label}</option>
										{/each}
									</select>
								</TableHead>
								<TableHead class="p-2"></TableHead>
								<TableHead class="p-2">
									<select
										bind:value={filterStatus}
										onchange={() => (pageAdmin = 1)}
										class="h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
									>
										<option value="">Semua</option>
										<option value="paid">Lunas</option>
										<option value="pending">Belum Lunas</option>
									</select>
								</TableHead>
								<TableHead class="p-2 hidden sm:table-cell"></TableHead>
								<TableHead class="p-2 hidden sm:table-cell"></TableHead>
								<TableHead class="p-2 text-right">
									{#if hasActiveFilter}
										<Button variant="ghost" size="sm" class="h-8 px-2 text-xs" onclick={resetFilters} title="Reset filter">
											<RotateCcw class="w-3.5 h-3.5 mr-1" /> Reset
										</Button>
									{/if}
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody class="divide-y divide-border">
							{#if data.adminPayments && data.adminPayments.length > 0}
								{#each paginatedAdminPayments as p}
									<TableRow class="hover:bg-accent">
										<td class="px-4 py-4 text-center">
											{#if p.status === 'pending'}
												<input
													type="checkbox"
													value={p.id}
													checked={selectedTableIds.includes(p.id)}
													onchange={(e) => {
														const checked = (e.target as HTMLInputElement).checked;
														if (checked) {
															selectedTableIds = [...selectedTableIds, p.id];
														} else {
															selectedTableIds = selectedTableIds.filter((id) => id !== p.id);
														}
													}}
													class="rounded border-input text-primary-foreground focus:ring-ring"
												/>
											{/if}
										</td>
										<td class="px-4 py-4">
											<p class="font-semibold text-foreground">{p.studentName}</p>
											<p class="text-xs text-muted-foreground font-mono">
												NIS: {p.studentNis ?? '-'}
											</p>
										</td>
										<td class="px-4 py-4 text-muted-foreground font-medium hidden sm:table-cell">
											{p.className ?? '-'}
										</td>
										<td class="px-4 py-4 font-medium text-foreground">
											{p.monthName} {p.year}
										</td>
										<td class="px-4 py-4 font-semibold text-foreground">
											{formatRupiah(p.amount)}
										</td>
										<td class="px-4 py-4">
											{#if p.status === 'paid'}
												<Badge class="bg-success/10 text-success-foreground font-semibold">
													✓ Lunas
												</Badge>
											{:else}
												<Badge class="bg-warning/10 text-warning-foreground">
													Belum Lunas
												</Badge>
											{/if}
										</td>
										<td class="px-4 py-4 text-xs text-muted-foreground hidden sm:table-cell">
											{#if p.status === 'paid'}
												<p class="font-medium text-foreground">
													{p.paymentDate ?? '-'}
												</p>
												<p class="text-xs text-muted-foreground">
													Kasir: {p.cashierName ?? 'Admin'}
												</p>
											{:else}
												<span class="text-muted-foreground">-</span>
											{/if}
										</td>
										<td class="px-4 py-4 font-mono text-xs text-muted-foreground hidden sm:table-cell">
											{p.invoiceNumber ?? '-'}
										</td>
										<td class="px-4 py-4 text-right">
											{#if p.status === 'pending'}
												<Button
													onclick={() => openSinglePay(p)}
													class="px-3 py-1.5 bg-success text-primary-foreground rounded-lg text-xs font-semibold shadow-sm"
												>
													Bayar
												</Button>
											{:else}
												<div class="inline-flex items-center gap-1.5">
													<Button
														onclick={() => openReceipt(p)}
														class="px-2.5 py-1 bg-primary/10 text-primary-foreground rounded-lg text-xs font-medium"
														title="Cetak Kuitansi"
													>
														Kuitansi
													</Button>
													<Button
														onclick={() => openCancelConfirm(p)}
														class="px-2.5 py-1 bg-destructive/10 text-destructive rounded-lg text-xs font-medium"
														title="Batalkan Pembayaran"
													>
														Batal
													</Button>
												</div>
											{/if}
										</td>
									</TableRow>
								{/each}
							{:else}
								<TableRow>
									<td colspan="9" class="px-4 sm:px-6 py-12 text-center text-muted-foreground text-sm">
										Tidak ada data tagihan SPP yang sesuai dengan filter.
									</td>
								</TableRow>
							{/if}
						</TableBody>
					</Table>
				</div>
				<Pagination
					bind:page={pageAdmin}
					bind:pageSize={pageSizeAdmin}
					totalItems={filteredAdminPayments.length}
				/>
			</CardContent>
		</Card>
	{/if}

	<!-- Daftar Pengeluaran Terkini -->
	{#if data.pengeluaran && data.pengeluaran.length > 0}
		<Card>
			<CardHeader class="border-b border-border py-4 flex items-center justify-between">
				<CardTitle class="text-base font-semibold text-foreground">
					Daftar Penarikan Dana / Pengeluaran
				</CardTitle>
				<span class="text-xs text-muted-foreground">
					{data.pengeluaran.length} transaksi tercatat
				</span>
			</CardHeader>
			<CardContent class="p-0">
				<div class="overflow-x-auto">
					<table class="w-full text-sm text-muted-foreground">
						<thead class="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground border-b border-border">
							<tr>
								<th class="px-4 sm:px-6 py-3 text-left">Tanggal</th>
								<th class="px-4 sm:px-6 py-3 text-left">Kategori</th>
								<th class="px-4 sm:px-6 py-3 text-left">Keterangan</th>
								<th class="px-4 sm:px-6 py-3 text-left hidden sm:table-cell">Catatan</th>
								<th class="px-4 sm:px-6 py-3 text-left hidden sm:table-cell">Dibuat Oleh</th>
								<th class="px-4 sm:px-6 py-3 text-right">Nominal</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							{#each paginatedPengeluaran as tx}
								<tr class="hover:bg-accent">
									<td class="px-4 sm:px-6 py-4 text-xs font-medium text-foreground">{tx.date}</td>
									<td class="px-4 sm:px-6 py-4">
										<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-destructive/10 text-destructive">
											{tx.category || 'Umum'}
										</span>
									</td>
									<td class="px-4 sm:px-6 py-4 font-medium text-foreground">{tx.description}</td>
									<td class="px-4 sm:px-6 py-4 text-xs text-muted-foreground hidden sm:table-cell">{tx.notes ?? '-'}</td>
									<td class="px-4 sm:px-6 py-4 text-xs hidden sm:table-cell">{tx.createdByName ?? 'Admin'}</td>
									<td class="px-4 sm:px-6 py-4 text-right font-bold text-destructive">
										−{formatRupiah(tx.amount)}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
				<Pagination
					bind:page={pagePengeluaran}
					bind:pageSize={pageSizePengeluaran}
					totalItems={data.pengeluaran?.length ?? 0}
				/>
			</CardContent>
		</Card>
	{/if}

</div>

<!-- ============================================================== -->
<!-- MODAL BAYAR SPP                                                -->
<!-- ============================================================== -->
{#if showPayModal}
	<Dialog bind:open={showPayModal}>
		<DialogContent class="max-w-lg w-full p-4 sm:p-6 max-h-[92vh] overflow-y-auto shadow-xl border border-border">
			<DialogHeader class="flex items-center justify-between pb-3 border-b border-border mb-4">
				<DialogTitle class="text-lg font-bold text-foreground">
					Konfirmasi Pembayaran SPP
				</DialogTitle>
				<Button variant="ghost" size="sm" class="h-6 w-6 p-0" onclick={() => (showPayModal = false)}>
					✕
				</Button>
			</DialogHeader>

			<form method="POST" action="?/pay" use:enhance={() => {
				return async ({ update }) => {
					await update();
					showPayModal = false;
					selectedTableIds = [];
				};
			}}>
				<input type="hidden" name="payment_ids" value={payPaymentIds.join(',')} />

				<div class="space-y-4">
					<div class="bg-muted rounded-xl p-3 text-sm text-foreground">
						<p class="font-medium">Tagihan Terpilih: {payPaymentIds.length} Bulan</p>
						<p class="text-xs text-muted-foreground mt-0.5">
							Sistem akan menandai status tagihan sebagai Lunas dan membuat nomor kuitansi otomatis.
						</p>
					</div>

					<div>
						<Label>Tanggal Bayar *</Label>
						<Input
							type="date"
							name="payment_date"
							bind:value={payPaymentDate}
							required
						/>
					</div>

					<div>
						<Label>Metode Pembayaran *</Label>
						<select
							name="payment_method"
							bind:value={payPaymentMethod}
							class="w-full text-base sm:text-sm border border-input rounded-lg px-3 py-2 min-h-11 focus:ring-ring focus:border-ring"
						>
							<option value="cash">Tunai (Cash di Kasir)</option>
							<option value="transfer">Transfer Bank</option>
						</select>
					</div>

					<div>
						<Label>Catatan (Opsional)</Label>
						<Input
							type="text"
							name="notes"
							bind:value={payNotes}
							placeholder="Misal: Diterima langsung dari wali murid"
						/>
					</div>
				</div>

				<div class="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end mt-6 pt-4 border-t border-border">
					<Button type="button" variant="outline" onclick={() => (showPayModal = false)}>
						Batal
					</Button>
					<Button type="submit">
						Proses & Simpan Pembayaran
					</Button>
				</div>
			</form>
		</DialogContent>
	</Dialog>
{/if}

<!-- ============================================================== -->
<!-- MODAL BATALKAN PEMBAYARAN                                      -->
<!-- ============================================================== -->
{#if showCancelModal && selectedPaymentForCancel}
	<Dialog bind:open={showCancelModal}>
		<DialogContent class="max-w-md w-full p-4 sm:p-6 max-h-[92vh] overflow-y-auto shadow-xl border border-border">
			<DialogHeader>
				<DialogTitle class="text-lg font-bold text-foreground">
					Batalkan Pembayaran SPP?
				</DialogTitle>
				<DialogDescription class="text-sm text-muted-foreground">
					Anda akan membatalkan pembayaran SPP bulan
					<strong>{selectedPaymentForCancel.monthName} {selectedPaymentForCancel.year}</strong>
					untuk siswa <strong>{selectedPaymentForCancel.studentName}</strong>.
					Status tagihan akan kembali menjadi <em>Belum Lunas</em>.
				</DialogDescription>
			</DialogHeader>
			<DialogFooter class="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end pt-2">
				<Button type="button" variant="outline" onclick={() => (showCancelModal = false)}>
					Kembali
				</Button>
				<form method="POST" action="?/cancelPayment" use:enhance={() => {
					return async ({ update }) => {
						await update();
						showCancelModal = false;
					};
				}}>
					<input type="hidden" name="payment_id" value={selectedPaymentForCancel.id} />
					<Button type="submit" variant="destructive">
						Ya, Batalkan Pembayaran
					</Button>
				</form>
			</DialogFooter>
		</DialogContent>
	</Dialog>
{/if}

<!-- ============================================================== -->
<!-- MODAL KUITANSI RESMI (PRINTABLE)                               -->
<!-- ============================================================== -->
{#if showReceiptModal && selectedPaymentForReceipt}
	<Dialog bind:open={showReceiptModal}>
		<DialogContent class="max-w-xl w-full p-4 sm:p-8 shadow-2xl border border-border my-8 overflow-y-auto max-h-[92vh]">
			<!-- Bagian Kuitansi Siap Cetak -->
			<div id="printable-receipt" class="space-y-6">
				<!-- Kop Sekolah -->
				<div class="border-b-2 border-foreground pb-4 text-center">
					<h2 class="text-xl font-bold uppercase tracking-wider text-foreground">
						{data.school?.name ?? 'MAN 1 JEMBER'}
					</h2>
					<p class="text-xs text-muted-foreground mt-1">
						{data.school?.address ?? 'Jl. Imam Bonjol No. 50, Jember, Jawa Timur'}
						{#if data.school?.phone} • Telp: {data.school.phone}{/if}
						{#if data.school?.npsn} • NPSN: {data.school.npsn}{/if}
					</p>
					<div class="mt-3 inline-block px-4 py-1 bg-muted rounded-md border border-border">
						<span class="text-xs font-bold tracking-widest uppercase text-foreground">
							BUKTI PEMBAYARAN SPP (KUITANSI)
						</span>
					</div>
				</div>

				<!-- Informasi Kuitansi -->
				<div class="grid grid-cols-2 gap-4 text-xs">
					<div>
						<p class="text-muted-foreground">No. Kuitansi:</p>
						<p class="font-mono font-bold text-foreground text-sm">
							{selectedPaymentForReceipt.invoiceNumber ?? 'INV-SPP-DRAFT'}
						</p>
					</div>
					<div class="text-right">
						<p class="text-muted-foreground">Tanggal Bayar:</p>
						<p class="font-bold text-foreground">
							{selectedPaymentForReceipt.paymentDate ?? new Date().toISOString().slice(0, 10)}
						</p>
					</div>
					<div>
						<p class="text-muted-foreground">Nama Siswa:</p>
						<p class="font-semibold text-foreground text-sm">
							{selectedPaymentForReceipt.studentName ?? data.student?.name}
						</p>
						<p class="text-muted-foreground font-mono">
							NIS: {selectedPaymentForReceipt.studentNis ?? data.student?.nis ?? '-'}
						</p>
					</div>
					<div class="text-right">
						<p class="text-muted-foreground">Kelas:</p>
						<p class="font-semibold text-foreground">
							{selectedPaymentForReceipt.className ?? data.student?.className ?? '-'}
						</p>
						<p class="text-muted-foreground">
							Metode: {selectedPaymentForReceipt.paymentMethod === 'transfer' ? 'Transfer Bank' : 'Tunai'}
						</p>
					</div>
				</div>

				<!-- Rincian Item Tagihan -->
				<div class="border border-border rounded-lg overflow-hidden">
					<table class="w-full text-xs">
						<thead class="bg-muted font-semibold text-foreground border-b border-border">
							<tr>
								<th class="px-4 py-2 text-left">Deskripsi Pembayaran</th>
								<th class="px-4 py-2 text-center">Bulan / Tahun</th>
								<th class="px-4 py-2 text-right">Jumlah</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							<tr>
								<td class="px-4 py-3 font-medium text-foreground">
									Sumbangan Pembinaan Pendidikan (SPP)
								</td>
								<td class="px-4 py-3 text-center text-muted-foreground">
									{selectedPaymentForReceipt.monthName} {selectedPaymentForReceipt.year}
								</td>
								<td class="px-4 py-3 text-right font-bold text-foreground">
									{formatRupiah(selectedPaymentForReceipt.amountPaid || selectedPaymentForReceipt.amount)}
								</td>
							</tr>
						</tbody>
						<tfoot class="bg-muted font-bold border-t border-border">
							<tr>
								<td colspan="2" class="px-4 py-2.5 text-right text-foreground">
									TOTAL DIBAYAR:
								</td>
								<td class="px-4 py-2.5 text-right text-success-foreground text-sm">
									{formatRupiah(selectedPaymentForReceipt.amountPaid || selectedPaymentForReceipt.amount)}
								</td>
							</tr>
						</tfoot>
					</table>
				</div>

				<!-- Status & Tanda Tangan -->
				<div class="pt-2 grid grid-cols-2 gap-6 text-xs">
					<div>
						<p class="text-muted-foreground">Catatan:</p>
						<p class="text-foreground italic">
							{selectedPaymentForReceipt.notes ?? 'Terima kasih telah melakukan pembayaran tepat waktu.'}
						</p>
						<div class="mt-4 p-2 bg-success/10 border border-success/20 rounded text-success-foreground font-bold uppercase inline-block">
							✓ LUNAS
						</div>
					</div>
					<div class="text-center">
						<p class="text-muted-foreground">Petugas Keuangan / Kasir,</p>
						<div class="h-14"></div>
						<p class="font-bold text-foreground underline">
							{selectedPaymentForReceipt.cashierName ?? 'Admin Keuangan'}
						</p>
						<p class="text-muted-foreground text-[10px]">Dicetak via SIS Keuangan</p>
					</div>
				</div>
			</div>

			<!-- Tombol Kontrol Modal -->
			<div class="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end mt-8 pt-4 border-t border-border">
				<Button type="button" variant="outline" onclick={() => (showReceiptModal = false)}>
					Tutup
				</Button>
				<Button type="button" onclick={printReceipt}>
					Cetak Kuitansi
				</Button>
			</div>
		</DialogContent>
	</Dialog>
{/if}

<!-- ============================================================== -->

<!-- ============================================================== -->
<!-- MODAL CATAT PEMBAYARAN SPP LANGSUNG                            -->
<!-- ============================================================== -->
{#if showRecordPayModal}
	<Dialog bind:open={showRecordPayModal}>
		<DialogContent class="max-w-lg w-full p-4 sm:p-6 max-h-[92vh] overflow-y-auto shadow-xl border border-border">
			<DialogHeader class="flex items-center justify-between pb-3 border-b border-border mb-4">
				<DialogTitle class="text-lg font-bold text-foreground">Catat Pembayaran SPP</DialogTitle>
				<Button variant="ghost" size="sm" class="h-6 w-6 p-0" onclick={() => (showRecordPayModal = false)}>✕</Button>
			</DialogHeader>
			<form method="POST" action="?/recordPayment" onsubmit={() => (recordSubmitting = true)} use:enhance={() => {
				return async ({ update }) => {
					await update();
					recordSubmitting = false;
					showRecordPayModal = false;
					recordStudentId = null;
					recordStudentQuery = '';
					recordMonth = '';
					recordYearStr = '';
					recordPaymentDate = new Date().toISOString().slice(0, 10);
					recordPaymentMethod = 'cash';
					recordNotes = '';
				};
			}}>
				<div class="space-y-4">
					<!-- Pilih Siswa -->
					<div>
						<label class="text-sm font-medium text-foreground">Siswa *</label>
						<div class="relative mt-1">
							<input
								type="text"
								bind:value={recordStudentQuery}
								onfocus={() => (recordStudentOpen = true)}
								onblur={() => setTimeout(() => (recordStudentOpen = false), 200)}
								placeholder="Cari nama / NIS..."
								class="w-full text-base sm:text-sm border border-input rounded-lg px-3 py-2 min-h-11 focus:ring-ring focus:border-ring"
							/>
							{#if recordStudentOpen && recordSiswaResults.length > 0}
								<ul class="absolute z-50 left-0 right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
									{#each recordSiswaResults as s (s.id)}
										<li
											onclick={() => { recordStudentId = s.id; recordStudentQuery = `${s.name}${s.nis ? ' ('+s.nis+')' : ''}`; recordStudentOpen = false; }}
											class="px-3 py-2 text-sm hover:bg-accent cursor-pointer flex items-center justify-between gap-2"
										>
											<span class="font-medium truncate">{s.name}</span>
											<span class="text-xs text-muted-foreground shrink-0">{s.className ?? '-'}</span>
										</li>
									{/each}
								</ul>
							{/if}
						</div>
						{#if recordStudentId}
							<p class="mt-1 text-xs text-muted-foreground">ID: {recordStudentId}</p>
						{/if}
					</div>

					<!-- Tahun Ajaran -->
					<div>
						<label class="text-sm font-medium text-foreground">Tahun Ajaran *</label>
						<select
							name="academic_year_id"
							bind:value={recordYearStr}
							required
							class="w-full text-base sm:text-sm border border-input rounded-lg px-3 py-2 min-h-11 focus:ring-ring focus:border-ring mt-1"
						>
							<option value="" disabled>Pilih tahun ajaran</option>
							{#each data.allYears as y}
								<option value={y.id}>{y.name} — {y.semester}{y.isActive ? ' ★' : ''}</option>
							{/each}
						</select>
					</div>

					<!-- Bulan -->
					<div>
						<label class="text-sm font-medium text-foreground">Bulan *</label>
						<select
							name="month"
							bind:value={recordMonth}
							required
							class="w-full text-base sm:text-sm border border-input rounded-lg px-3 py-2 min-h-11 focus:ring-ring focus:border-ring mt-1"
						>
							<option value="" disabled>Pilih bulan</option>
							{#each MONTHS as m}
								<option value={m.value}>{m.label}</option>
							{/each}
						</select>
					</div>

					<!-- Tanggal Bayar -->
					<div>
						<label class="text-sm font-medium text-foreground">Tanggal Bayar *</label>
						<input
							type="date"
							name="payment_date"
							bind:value={recordPaymentDate}
							required
							class="w-full text-base sm:text-sm border border-input rounded-lg px-3 py-2 min-h-11 focus:ring-ring focus:border-ring mt-1"
						/>
					</div>

					<!-- Metode Pembayaran -->
					<div>
						<label class="text-sm font-medium text-foreground">Metode Pembayaran *</label>
						<select
							name="payment_method"
							bind:value={recordPaymentMethod}
							class="w-full text-base sm:text-sm border border-input rounded-lg px-3 py-2 min-h-11 focus:ring-ring focus:border-ring mt-1"
						>
							<option value="cash">Tunai (Cash di Kasir)</option>
							<option value="transfer">Transfer Bank</option>
						</select>
					</div>

					<!-- Catatan -->
					<div>
						<label class="text-sm font-medium text-foreground">Catatan (Opsional)</label>
						<textarea
							name="notes"
							bind:value={recordNotes}
							rows="2"
							placeholder="Keterangan tambahan (opsional)"
							class="w-full text-base sm:text-sm border border-input rounded-lg px-3 py-2 min-h-11 focus:ring-ring focus:border-ring mt-1 resize-none"
						></textarea>
					</div>
				</div>

				<div class="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end mt-6 pt-4 border-t border-border">
					<Button type="button" variant="outline" onclick={() => (showRecordPayModal = false)}>
						Batal
					</Button>
					<Button type="submit" disabled={recordSubmitting}>
						{recordSubmitting ? 'Menyimpan...' : 'Simpan Pembayaran'}
					</Button>
				</div>
			</form>
		</DialogContent>
	</Dialog>
{/if}

<!-- MODAL CATAT PENGELUARAN / PENARIKAN DANA                       -->
<!-- ============================================================== -->
{#if showExpenseModal}
	<Dialog bind:open={showExpenseModal}>
		<DialogContent class="max-w-md w-full p-4 sm:p-6 max-h-[92vh] overflow-y-auto shadow-xl border border-border">
			<DialogHeader class="flex items-center justify-between pb-3 border-b border-border mb-4">
				<DialogTitle class="text-lg font-bold text-foreground">
					Catat Penarikan Dana
				</DialogTitle>
				<Button variant="ghost" size="sm" class="h-6 w-6 p-0" onclick={() => (showExpenseModal = false)}>✕</Button>
			</DialogHeader>

			<form method="POST" action="?/addExpense" use:enhance={() => {
				return async ({ update }) => {
					await update();
					showExpenseModal = false;
				};
			}}>
				<div class="space-y-4">
					<div>
						<label class="text-sm font-medium text-foreground">Tanggal *</label>
						<input type="date" name="date" bind:value={expenseDate} required
							class="w-full text-base sm:text-sm border border-input rounded-lg px-3 py-2 min-h-11 focus:ring-ring focus:border-ring mt-1" />
					</div>

					<div>
						<label class="text-sm font-medium text-foreground">Nominal (Rp) *</label>
						<input type="number" name="amount" bind:value={expenseAmount} min="1" required placeholder="0"
							class="w-full text-base sm:text-sm border border-input rounded-lg px-3 py-2 min-h-11 focus:ring-ring focus:border-ring mt-1" />
					</div>

					<div>
						<label class="text-sm font-medium text-foreground">Kategori</label>
						<select name="category" bind:value={expenseCategory}
							class="w-full text-base sm:text-sm border border-input rounded-lg px-3 py-2 min-h-11 focus:ring-ring focus:border-ring mt-1">
							<option value="operasional">Operasional</option>
							<option value="gaji">Gaji & THR Karyawan</option>
							<option value="utilitas">Listrik / Air / Internet</option>
							<option value="maintenace">Pemeliharaan Gedung</option>
							<option value="persediaan">Alat Tulis / Persediaan</option>
							<option value="lainnya">Lainnya</option>
						</select>
					</div>

					<div>
						<label class="text-sm font-medium text-foreground">Keterangan *</label>
						<textarea name="description" bind:value={expenseDescription} required rows="2" placeholder="Contoh: Pembayaran listrik bulan Januari"
							class="w-full text-base sm:text-sm border border-input rounded-lg px-3 py-2 min-h-11 focus:ring-ring focus:border-ring mt-1 resize-none"></textarea>
					</div>

					<div>
						<label class="text-sm font-medium text-foreground">Catatan (Opsional)</label>
						<input type="text" name="notes" bind:value={expenseNotes} placeholder="Tambahkan catatan..."
							class="w-full text-base sm:text-sm border border-input rounded-lg px-3 py-2 min-h-11 focus:ring-ring focus:border-ring mt-1" />
					</div>
				</div>

				<div class="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end mt-6 pt-4 border-t border-border">
					<Button type="button" variant="outline" onclick={() => (showExpenseModal = false)}>Batal</Button>
					<Button type="submit" variant="destructive">Simpan Pengeluaran</Button>
				</div>
			</form>
		</DialogContent>
	</Dialog>
{/if}

<style>
	@media print {
		:global(body *) {
			visibility: hidden;
		}
		#printable-receipt,
		#printable-receipt * {
			visibility: visible;
		}
		#printable-receipt {
			position: absolute;
			left: 0;
			top: 0;
			width: 100%;
			margin: 0;
			padding: 20px;
		}
	}
</style>
