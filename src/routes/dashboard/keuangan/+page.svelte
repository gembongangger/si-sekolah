<script lang="ts">
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
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Label } from '$lib/components/ui/label/index.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Formatters
	function formatRupiah(num: number): string {
		return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
	}

	// Modal States
	let showPayModal = $state(false);
	let showReceiptModal = $state(false);
	let showCancelModal = $state(false);
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

	let filterYear = $state<string[]>(data.filters?.yearId ? [String(data.filters.yearId)] : []);
	let filterClass = $state<string[]>(data.filters?.classId ? [String(data.filters.classId)] : []);
	let filterMonth = $state<string[]>(data.filters?.month ? [String(data.filters.month)] : []);
	let filterStatus = $state<string[]>(data.filters?.status ? [data.filters.status] : ['all']);

	function toggleSelectAll(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.checked) {
			selectedTableIds = (data.adminPayments || [])
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
								<TableHead class="px-6 py-3">Bulan</TableHead>
								<TableHead class="px-6 py-3">Tahun Ajaran</TableHead>
								<TableHead class="px-6 py-3">Nominal</TableHead>
								<TableHead class="px-6 py-3">Status</TableHead>
								<TableHead class="px-6 py-3">Tgl Bayar</TableHead>
								<TableHead class="px-6 py-3">No. Kuitansi</TableHead>
								<TableHead class="px-6 py-3 text-right">Aksi</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody class="divide-y divide-border">
							{#if data.siswaPayments && data.siswaPayments.length > 0}
								{#each data.siswaPayments as p}
									<TableRow class="hover:bg-accent">
										<TableCell class="px-6 py-4 font-semibold text-foreground">
											{p.monthName} {p.year}
										</TableCell>
										<TableCell class="px-6 py-4 text-muted-foreground">
											{p.academicYearName} ({p.academicYearSemester})
										</TableCell>
										<TableCell class="px-6 py-4 font-medium text-foreground">
											{formatRupiah(p.amount)}
										</TableCell>
										<TableCell class="px-6 py-4">
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
										<TableCell class="px-6 py-4 text-muted-foreground">
											{p.paymentDate ?? '-'}
										</TableCell>
										<TableCell class="px-6 py-4 font-mono text-xs text-muted-foreground">
											{p.invoiceNumber ?? '-'}
										</TableCell>
										<TableCell class="px-6 py-4 text-right">
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
									<TableCell colspan={7} class="px-6 py-10 text-center text-muted-foreground text-sm">
										Belum ada data tagihan SPP untuk akun Anda.
									</TableCell>
								</TableRow>
							{/if}
						</TableBody>
					</Table>
				</div>
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
			<div class="flex items-center gap-3">
				<Button onclick={openExpense}>
					<span data-icon="inline-start">↓</span> Catat Pengeluaran
				</Button>
				<Button variant="outline" href="/dashboard/keuangan/tarif">
					Tarif & Tagihan
				</Button>
				<Button variant="outline" href="/dashboard/keuangan/laporan">
					Laporan & Rekap
				</Button>
			</div>
		</div>

		<!-- Nav Tabs Keuangan -->
		<Separator />
		<nav class="flex gap-4 py-2">
			<Button variant="outline" href="/dashboard/keuangan" class="border-b-2 border-primary text-primary">
				Transaksi Pembayaran
			</Button>
			<Button variant="outline" href="/dashboard/keuangan/tarif" class="border-transparent hover:border-border hover:text-muted-foreground">
				Pengaturan Tarif & Tagihan
			</Button>
			<Button variant="outline" href="/dashboard/keuangan/laporan" class="border-transparent hover:border-border hover:text-muted-foreground">
				Laporan & Rekapitulasi
			</Button>
		</nav>

		<!-- Summary Statistics Cards -->
		<div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
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

		<!-- Filter & Search Bar -->
		<Card>
			<CardContent class="p-4">
				<form method="GET" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
					<!-- Tahun Ajaran -->
					<div>
						<Label for="filter-year-id">Tahun Ajaran</Label>
						<select id="filter-year-id" name="year_id" class="w-full text-sm border border-input rounded-lg px-3 py-2 focus:ring-ring focus:border-ring">
							<option value="">— Semua Tahun Ajaran —</option>
							{#each data.allYears as y}
								<option value={y.id} selected={filterYear.includes(String(y.id))}>
									{y.name} ({y.semester}) {y.isActive ? '★' : ''}
								</option>
							{/each}
						</select>
					</div>

					<!-- Kelas -->
					<div>
						<Label for="filter-class-id">Kelas</Label>
						<select id="filter-class-id" name="class_id" class="w-full text-sm border border-input rounded-lg px-3 py-2 focus:ring-ring focus:border-ring">
							<option value="">Semua Kelas</option>
							{#each data.allClasses as c}
								<option value={c.id} selected={filterClass.includes(String(c.id))}>
									{c.name}
								</option>
							{/each}
						</select>
					</div>

					<!-- Bulan -->
					<div>
						<Label for="filter-month">Bulan</Label>
						<select id="filter-month" name="month" class="w-full text-sm border border-input rounded-lg px-3 py-2 focus:ring-ring focus:border-ring">
							<option value="">Semua Bulan</option>
							{#each MONTHS as m}
								<option value={m.value} selected={filterMonth.includes(m.value)}>
									{m.label}
								</option>
							{/each}
						</select>
					</div>

					<!-- Status -->
					<div>
						<Label for="filter-status">Status</Label>
						<select id="filter-status" name="status" class="w-full text-sm border border-input rounded-lg px-3 py-2 focus:ring-ring focus:border-ring">
							<option value="all" selected={filterStatus.includes('all')}>Semua Status</option>
							<option value="paid" selected={filterStatus.includes('paid')}>Lunas</option>
							<option value="pending" selected={filterStatus.includes('pending')}>Belum Lunas</option>
						</select>
					</div>

					<!-- Cari & Submit -->
					<div class="flex gap-2">
						<Input
							id="filter-q"
							name="q"
							type="text"
							value={data.filters?.q ?? ''}
							placeholder="Cari siswa / NIS..."
							class="w-full"
						/>
						<Button type="submit">
							Filter
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>

		<!-- Action bar if items selected -->
		{#if selectedTableIds.length > 0}
			<Card class="bg-success/10 border border-success/20 p-4 flex items-center justify-between">
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
			<CardHeader class="border-b border-border py-4 flex items-center justify-between">
				<CardTitle class="text-base font-semibold text-foreground">
					Daftar Tagihan & Pembayaran SPP
				</CardTitle>
				<span class="text-xs text-muted-foreground">
					Menampilkan {data.adminPayments?.length ?? 0} transaksi
				</span>
			</CardHeader>
			<CardContent class="p-0">
				<div class="overflow-x-auto">
					<Table class="text-sm">
						<TableHeader>
							<TableRow>
								<TableHead class="px-4 py-3 text-center w-10">
									<input
										type="checkbox"
										onchange={toggleSelectAll}
										class="rounded border-input text-primary-foreground focus:ring-ring"
									/>
								</TableHead>
								<TableHead class="px-4 py-3">Siswa</TableHead>
								<TableHead class="px-4 py-3">Kelas</TableHead>
								<TableHead class="px-4 py-3">Bulan</TableHead>
								<TableHead class="px-4 py-3">Nominal</TableHead>
								<TableHead class="px-4 py-3">Status</TableHead>
								<TableHead class="px-4 py-3">Tgl Bayar / Kasir</TableHead>
								<TableHead class="px-4 py-3">No. Kuitansi</TableHead>
								<TableHead class="px-4 py-3 text-right">Aksi</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody class="divide-y divide-border">
							{#if data.adminPayments && data.adminPayments.length > 0}
								{#each data.adminPayments as p}
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
										<td class="px-4 py-4 text-muted-foreground font-medium">
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
										<td class="px-4 py-4 text-xs text-muted-foreground">
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
										<td class="px-4 py-4 font-mono text-xs text-muted-foreground">
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
									<td colspan="9" class="px-6 py-12 text-center text-muted-foreground text-sm">
										Tidak ada data tagihan SPP yang sesuai dengan filter.
									</td>
								</TableRow>
							{/if}
						</TableBody>
					</Table>
				</div>
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
								<th class="px-6 py-3 text-left">Tanggal</th>
								<th class="px-6 py-3 text-left">Kategori</th>
								<th class="px-6 py-3 text-left">Keterangan</th>
								<th class="px-6 py-3 text-left">Catatan</th>
								<th class="px-6 py-3 text-left">Dibuat Oleh</th>
								<th class="px-6 py-3 text-right">Nominal</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							{#each data.pengeluaran as tx}
								<tr class="hover:bg-accent">
									<td class="px-6 py-4 text-xs font-medium text-foreground">{tx.date}</td>
									<td class="px-6 py-4">
										<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-destructive/10 text-destructive">
											{tx.category || 'Umum'}
										</span>
									</td>
									<td class="px-6 py-4 font-medium text-foreground">{tx.description}</td>
									<td class="px-6 py-4 text-xs text-muted-foreground">{tx.notes ?? '-'}</td>
									<td class="px-6 py-4 text-xs">{tx.createdByName ?? 'Admin'}</td>
									<td class="px-6 py-4 text-right font-bold text-destructive">
										−{formatRupiah(tx.amount)}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>
	{/if}

</div>

<!-- ============================================================== -->
<!-- MODAL BAYAR SPP                                                -->
<!-- ============================================================== -->
{#if showPayModal}
	<Dialog bind:open={showPayModal}>
		<DialogContent class="max-w-lg w-full p-6 shadow-xl border border-border">
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
							class="w-full text-sm border border-input rounded-lg px-3 py-2 focus:ring-ring focus:border-ring"
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

				<div class="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
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
		<DialogContent class="max-w-md w-full p-6 shadow-xl border border-border">
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
			<DialogFooter class="flex items-center justify-end gap-3 pt-2">
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
		<DialogContent class="max-w-xl w-full p-8 shadow-2xl border border-border my-8 overflow-y-auto max-h-[90vh]">
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
			<div class="flex items-center justify-end gap-3 mt-8 pt-4 border-t border-border">
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
<!-- MODAL CATAT PENGELUARAN / PENARIKAN DANA                       -->
<!-- ============================================================== -->
{#if showExpenseModal}
	<Dialog bind:open={showExpenseModal}>
		<DialogContent class="max-w-md w-full p-6 shadow-xl border border-border">
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
							class="w-full text-sm border border-input rounded-lg px-3 py-2 focus:ring-ring focus:border-ring mt-1" />
					</div>

					<div>
						<label class="text-sm font-medium text-foreground">Nominal (Rp) *</label>
						<input type="number" name="amount" bind:value={expenseAmount} min="1" required placeholder="0"
							class="w-full text-sm border border-input rounded-lg px-3 py-2 focus:ring-ring focus:border-ring mt-1" />
					</div>

					<div>
						<label class="text-sm font-medium text-foreground">Kategori</label>
						<select name="category" bind:value={expenseCategory}
							class="w-full text-sm border border-input rounded-lg px-3 py-2 focus:ring-ring focus:border-ring mt-1">
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
							class="w-full text-sm border border-input rounded-lg px-3 py-2 focus:ring-ring focus:border-ring mt-1 resize-none"></textarea>
					</div>

					<div>
						<label class="text-sm font-medium text-foreground">Catatan (Opsional)</label>
						<input type="text" name="notes" bind:value={expenseNotes} placeholder="Tambahkan catatan..."
							class="w-full text-sm border border-input rounded-lg px-3 py-2 focus:ring-ring focus:border-ring mt-1" />
					</div>
				</div>

				<div class="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
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
