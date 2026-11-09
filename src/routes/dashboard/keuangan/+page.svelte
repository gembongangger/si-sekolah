<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Formatters
	function formatRupiah(num: number): string {
		return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
	}

	// Modal States
	let showPayModal = $state(false);
	let showReceiptModal = $state(false);
	let showCancelModal = $state(false);

	let selectedPaymentForReceipt = $state<any>(null);
	let selectedPaymentForCancel = $state<any>(null);

	// Pay Form States
	let payStudentId = $state<number | null>(null);
	let payPaymentIds = $state<number[]>([]);
	let payPaymentDate = $state(new Date().toISOString().slice(0, 10));
	let payPaymentMethod = $state<'cash' | 'transfer'>('cash');
	let payNotes = $state('');

	// Multi-select in table
	let selectedTableIds = $state<number[]>([]);

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
</script>

<svelte:head>
	<title>Keuangan SPP — Sistem Informasi Sekolah</title>
</svelte:head>

<div class="space-y-6">
	<!-- Flash message -->
	{#if form?.message}
		<div
			class="p-4 rounded-xl text-sm flex items-center justify-between {form?.success
				? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
				: 'bg-red-50 text-red-800 border border-red-200'}"
		>
			<span>{form.message}</span>
		</div>
	{/if}

	{#if data.isSiswa}
		<!-- ========================================== -->
		<!-- VIEW KHUSUS SISWA: KARTU SPP DIGITAL       -->
		<!-- ========================================== -->
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
			<div>
				<h1 class="text-2xl font-bold text-gray-900">Kartu SPP Siswa</h1>
				<p class="text-sm text-gray-500 mt-1">
					Status kewajiban dan riwayat pembayaran SPP Anda
				</p>
			</div>
			{#if data.student}
				<div class="bg-white border border-gray-200 rounded-xl px-4 py-2 text-right">
					<p class="text-xs text-gray-500">Siswa / Kelas</p>
					<p class="text-sm font-bold text-gray-900">
						{data.student.name} ({data.student.className ?? 'Belum ada kelas'})
					</p>
					<p class="text-xs text-gray-400">NIS: {data.student.nis ?? '-'}</p>
				</div>
			{/if}
		</div>

		<!-- Summary Cards Siswa -->
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
			<div class="bg-white rounded-xl border border-gray-200 p-5">
				<p class="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Dibayar</p>
				<p class="text-2xl font-bold text-emerald-600 mt-1">
					{formatRupiah(data.summary?.totalDibayar ?? 0)}
				</p>
				<p class="text-xs text-gray-400 mt-1">Kewajiban terbayar</p>
			</div>
			<div class="bg-white rounded-xl border border-gray-200 p-5">
				<p class="text-xs font-semibold uppercase tracking-wider text-gray-500">Sisa Tunggakan</p>
				<p class="text-2xl font-bold text-amber-600 mt-1">
					{formatRupiah(data.summary?.sisaTunggakan ?? 0)}
				</p>
				<p class="text-xs text-gray-400 mt-1">Belum dilunasi</p>
			</div>
			<div class="bg-white rounded-xl border border-gray-200 p-5">
				<p class="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Tagihan</p>
				<p class="text-2xl font-bold text-gray-900 mt-1">
					{formatRupiah(data.summary?.totalKewajiban ?? 0)}
				</p>
				<p class="text-xs text-gray-400 mt-1">Tahun berjalan</p>
			</div>
		</div>

		<!-- Tabel Kartu SPP Siswa -->
		<div class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
			<div class="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
				<h2 class="text-base font-semibold text-gray-900">Rincian SPP Per Bulan</h2>
				<span class="text-xs text-gray-500">Diperbarui secara realtime</span>
			</div>
			<div class="overflow-x-auto">
				<table class="w-full text-left text-sm text-gray-600">
					<thead class="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
						<tr>
							<th class="px-6 py-3">Bulan</th>
							<th class="px-6 py-3">Tahun Ajaran</th>
							<th class="px-6 py-3">Nominal</th>
							<th class="px-6 py-3">Status</th>
							<th class="px-6 py-3">Tgl Bayar</th>
							<th class="px-6 py-3">No. Kuitansi</th>
							<th class="px-6 py-3 text-right">Aksi</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100">
						{#if data.siswaPayments && data.siswaPayments.length > 0}
							{#each data.siswaPayments as p}
								<tr class="hover:bg-gray-50">
									<td class="px-6 py-4 font-semibold text-gray-900">
										{p.monthName} {p.year}
									</td>
									<td class="px-6 py-4 text-gray-500">
										{p.academicYearName} ({p.academicYearSemester})
									</td>
									<td class="px-6 py-4 font-medium text-gray-900">
										{formatRupiah(p.amount)}
									</td>
									<td class="px-6 py-4">
										{#if p.status === 'paid'}
											<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
												✓ Lunas
											</span>
										{:else}
											<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
												Belum Lunas
											</span>
										{/if}
									</td>
									<td class="px-6 py-4 text-gray-500">
										{p.paymentDate ?? '-'}
									</td>
									<td class="px-6 py-4 font-mono text-xs text-gray-500">
										{p.invoiceNumber ?? '-'}
									</td>
									<td class="px-6 py-4 text-right">
										{#if p.status === 'paid'}
											<button
												onclick={() => openReceipt(p)}
												class="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-medium transition-colors"
											>
												<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
												</svg>
												Kuitansi
											</button>
										{:else}
											<span class="text-xs text-gray-400 italic">Harap bayar di kasir</span>
										{/if}
									</td>
								</tr>
							{/each}
						{:else}
							<tr>
								<td colspan="7" class="px-6 py-10 text-center text-gray-400 text-sm">
									Belum ada data tagihan SPP untuk akun Anda.
								</td>
							</tr>
						{/if}
					</tbody>
				</table>
			</div>
		</div>

	{:else}
		<!-- ========================================== -->
		<!-- VIEW ADMIN KEUANGAN & ADMIN SEKOLAH        -->
		<!-- ========================================== -->
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
			<div>
				<h1 class="text-2xl font-bold text-gray-900">Manajemen Pembayaran SPP</h1>
				<p class="text-sm text-gray-500 mt-1">
					Kelola transaksi pembayaran SPP siswa, kuitansi kasir, dan status tagihan bulanan
				</p>
			</div>
			<div class="flex items-center gap-3">
				<a
					href="/dashboard/keuangan/tarif"
					class="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl transition-colors shadow-sm"
				>
					Tarif & Tagihan
				</a>
				<a
					href="/dashboard/keuangan/laporan"
					class="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl transition-colors shadow-sm"
				>
					Laporan & Rekap
				</a>
			</div>
		</div>

		<!-- Nav Tabs Keuangan -->
		<div class="border-b border-gray-200">
			<nav class="flex gap-4">
				<a
					href="/dashboard/keuangan"
					class="py-3 px-1 border-b-2 font-medium text-sm border-blue-600 text-blue-600"
				>
					Transaksi Pembayaran
				</a>
				<a
					href="/dashboard/keuangan/tarif"
					class="py-3 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
				>
					Pengaturan Tarif & Tagihan
				</a>
				<a
					href="/dashboard/keuangan/laporan"
					class="py-3 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
				>
					Laporan & Rekapitulasi
				</a>
			</nav>
		</div>

		<!-- Summary Statistics Cards -->
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
			<div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
				<div class="flex items-center justify-between">
					<p class="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Kas SPP Masuk</p>
					<span class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">✓</span>
				</div>
				<p class="text-2xl font-bold text-emerald-600 mt-2">
					{formatRupiah(data.stats?.totalKas ?? 0)}
				</p>
				<p class="text-xs text-gray-400 mt-1">Pembayaran berstatus lunas</p>
			</div>

			<div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
				<div class="flex items-center justify-between">
					<p class="text-xs font-semibold uppercase tracking-wider text-gray-500">Sisa Tunggakan</p>
					<span class="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">!</span>
				</div>
				<p class="text-2xl font-bold text-amber-600 mt-2">
					{formatRupiah(data.stats?.totalTunggakan ?? 0)}
				</p>
				<p class="text-xs text-gray-400 mt-1">Tagihan belum dilunasi</p>
			</div>

			<div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
				<div class="flex items-center justify-between">
					<p class="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Kewajiban Tagihan</p>
					<span class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">∑</span>
				</div>
				<p class="text-2xl font-bold text-gray-900 mt-2">
					{formatRupiah(data.stats?.totalKewajiban ?? 0)}
				</p>
				<p class="text-xs text-gray-400 mt-1">Tahun ajaran aktif</p>
			</div>
		</div>

		<!-- Filter & Search Bar -->
		<div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
			<form method="GET" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
				<!-- Tahun Ajaran -->
				<div>
					<label class="block text-xs font-medium text-gray-600 mb-1">Tahun Ajaran</label>
					<select
						name="year_id"
						class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
					>
						{#each data.allYears as y}
							<option value={y.id} selected={data.filters?.yearId === y.id}>
								{y.name} ({y.semester}) {y.isActive ? '★' : ''}
							</option>
						{/each}
					</select>
				</div>

				<!-- Kelas -->
				<div>
					<label class="block text-xs font-medium text-gray-600 mb-1">Kelas</label>
					<select
						name="class_id"
						class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
					>
						<option value="">Semua Kelas</option>
						{#each data.allClasses as c}
							<option value={c.id} selected={data.filters?.classId === c.id}>
								{c.name}
							</option>
						{/each}
					</select>
				</div>

				<!-- Bulan -->
				<div>
					<label class="block text-xs font-medium text-gray-600 mb-1">Bulan</label>
					<select
						name="month"
						class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
					>
						<option value="">Semua Bulan</option>
						<option value="7" selected={data.filters?.month === 7}>Juli</option>
						<option value="8" selected={data.filters?.month === 8}>Agustus</option>
						<option value="9" selected={data.filters?.month === 9}>September</option>
						<option value="10" selected={data.filters?.month === 10}>Oktober</option>
						<option value="11" selected={data.filters?.month === 11}>November</option>
						<option value="12" selected={data.filters?.month === 12}>Desember</option>
						<option value="1" selected={data.filters?.month === 1}>Januari</option>
						<option value="2" selected={data.filters?.month === 2}>Februari</option>
						<option value="3" selected={data.filters?.month === 3}>Maret</option>
						<option value="4" selected={data.filters?.month === 4}>April</option>
						<option value="5" selected={data.filters?.month === 5}>Mei</option>
						<option value="6" selected={data.filters?.month === 6}>Juni</option>
					</select>
				</div>

				<!-- Status -->
				<div>
					<label class="block text-xs font-medium text-gray-600 mb-1">Status</label>
					<select
						name="status"
						class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
					>
						<option value="all" selected={data.filters?.status === 'all'}>Semua Status</option>
						<option value="paid" selected={data.filters?.status === 'paid'}>Lunas</option>
						<option value="pending" selected={data.filters?.status === 'pending'}>Belum Lunas</option>
					</select>
				</div>

				<!-- Cari & Submit -->
				<div class="flex gap-2">
					<input
						type="text"
						name="q"
						value={data.filters?.q ?? ''}
						placeholder="Cari siswa / NIS..."
						class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
					/>
					<button
						type="submit"
						class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors"
					>
						Filter
					</button>
				</div>
			</form>
		</div>

		<!-- Action bar if items selected -->
		{#if selectedTableIds.length > 0}
			<div class="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
				<p class="text-sm font-medium text-blue-900">
					{selectedTableIds.length} tagihan SPP terpilih
				</p>
				<button
					onclick={openBulkPay}
					class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
				>
					Bayar Sekaligus ({selectedTableIds.length} Bulan)
				</button>
			</div>
		{/if}

		<!-- Tabel Transaksi Pembayaran -->
		<div class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
			<div class="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
				<h2 class="text-base font-semibold text-gray-900">Daftar Tagihan & Pembayaran SPP</h2>
				<span class="text-xs text-gray-500">
					Menampilkan {data.adminPayments?.length ?? 0} transaksi
				</span>
			</div>
			<div class="overflow-x-auto">
				<table class="w-full text-left text-sm text-gray-600">
					<thead class="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
						<tr>
							<th class="px-4 py-3 text-center w-10">
								<input
									type="checkbox"
									onchange={toggleSelectAll}
									class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
								/>
							</th>
							<th class="px-4 py-3">Siswa</th>
							<th class="px-4 py-3">Kelas</th>
							<th class="px-4 py-3">Bulan</th>
							<th class="px-4 py-3">Nominal</th>
							<th class="px-4 py-3">Status</th>
							<th class="px-4 py-3">Tgl Bayar / Kasir</th>
							<th class="px-4 py-3">No. Kuitansi</th>
							<th class="px-4 py-3 text-right">Aksi</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100">
						{#if data.adminPayments && data.adminPayments.length > 0}
							{#each data.adminPayments as p}
								<tr class="hover:bg-gray-50">
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
												class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
											/>
										{/if}
									</td>
									<td class="px-4 py-4">
										<p class="font-semibold text-gray-900">{p.studentName}</p>
										<p class="text-xs text-gray-400 font-mono">NIS: {p.studentNis ?? '-'}</p>
									</td>
									<td class="px-4 py-4 text-gray-700 font-medium">
										{p.className ?? '-'}
									</td>
									<td class="px-4 py-4 font-medium text-gray-900">
										{p.monthName} {p.year}
									</td>
									<td class="px-4 py-4 font-semibold text-gray-900">
										{formatRupiah(p.amount)}
									</td>
									<td class="px-4 py-4">
										{#if p.status === 'paid'}
											<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
												✓ Lunas
											</span>
										{:else}
											<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
												Belum Lunas
											</span>
										{/if}
									</td>
									<td class="px-4 py-4 text-xs text-gray-600">
										{#if p.status === 'paid'}
											<p class="font-medium text-gray-900">{p.paymentDate ?? '-'}</p>
											<p class="text-gray-400">Kasir: {p.cashierName ?? 'Admin'}</p>
										{:else}
											<span class="text-gray-400">-</span>
										{/if}
									</td>
									<td class="px-4 py-4 font-mono text-xs text-gray-500">
										{p.invoiceNumber ?? '-'}
									</td>
									<td class="px-4 py-4 text-right">
										{#if p.status === 'pending'}
											<button
												onclick={() => openSinglePay(p)}
												class="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
											>
												Bayar
											</button>
										{:else}
											<div class="inline-flex items-center gap-1.5">
												<button
													onclick={() => openReceipt(p)}
													class="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-medium transition-colors"
													title="Cetak Kuitansi"
												>
													Kuitansi
												</button>
												<button
													onclick={() => openCancelConfirm(p)}
													class="px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-medium transition-colors"
													title="Batalkan Pembayaran"
												>
													Batal
												</button>
											</div>
										{/if}
									</td>
								</tr>
							{/each}
						{:else}
							<tr>
								<td colspan="9" class="px-6 py-12 text-center text-gray-400 text-sm">
									Tidak ada data tagihan SPP yang sesuai dengan filter.
								</td>
							</tr>
						{/if}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>

<!-- ============================================================== -->
<!-- MODAL BAYAR SPP                                                -->
<!-- ============================================================== -->
{#if showPayModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
		<div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-200">
			<div class="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
				<h3 class="text-lg font-bold text-gray-900">Konfirmasi Pembayaran SPP</h3>
				<button
					onclick={() => (showPayModal = false)}
					class="text-gray-400 hover:text-gray-600 text-xl font-bold"
				>
					✕
				</button>
			</div>

			<form method="POST" action="?/pay" use:enhance={() => {
				return async ({ update }) => {
					await update();
					showPayModal = false;
					selectedTableIds = [];
				};
			}}>
				<input type="hidden" name="payment_ids" value={payPaymentIds.join(',')} />

				<div class="space-y-4">
					<div class="bg-gray-50 rounded-xl p-3 text-sm text-gray-700">
						<p class="font-medium">Tagihan Terpilih: {payPaymentIds.length} Bulan</p>
						<p class="text-xs text-gray-500 mt-0.5">
							Sistem akan menandai status tagihan sebagai Lunas dan membuat nomor kuitansi otomatis.
						</p>
					</div>

					<div>
						<label class="block text-xs font-semibold text-gray-700 mb-1">Tanggal Bayar *</label>
						<input
							type="date"
							name="payment_date"
							bind:value={payPaymentDate}
							required
							class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>

					<div>
						<label class="block text-xs font-semibold text-gray-700 mb-1">Metode Pembayaran *</label>
						<select
							name="payment_method"
							bind:value={payPaymentMethod}
							class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
						>
							<option value="cash">Tunai (Cash di Kasir)</option>
							<option value="transfer">Transfer Bank</option>
						</select>
					</div>

					<div>
						<label class="block text-xs font-semibold text-gray-700 mb-1">Catatan (Opsional)</label>
						<input
							type="text"
							name="notes"
							bind:value={payNotes}
							placeholder="Misal: Diterima langsung dari wali murid"
							class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>
				</div>

				<div class="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
					<button
						type="button"
						onclick={() => (showPayModal = false)}
						class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
					>
						Batal
					</button>
					<button
						type="submit"
						class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm"
					>
						Proses & Simpan Pembayaran
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- ============================================================== -->
<!-- MODAL BATALKAN PEMBAYARAN                                      -->
<!-- ============================================================== -->
{#if showCancelModal && selectedPaymentForCancel}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
		<div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200">
			<h3 class="text-lg font-bold text-gray-900 mb-2">Batalkan Pembayaran SPP?</h3>
			<p class="text-sm text-gray-600 mb-4">
				Anda akan membatalkan pembayaran SPP bulan <strong>{selectedPaymentForCancel.monthName} {selectedPaymentForCancel.year}</strong> untuk siswa <strong>{selectedPaymentForCancel.studentName}</strong>.
				Status tagihan akan kembali menjadi <em>Belum Lunas</em>.
			</p>

			<form method="POST" action="?/cancelPayment" use:enhance={() => {
				return async ({ update }) => {
					await update();
					showCancelModal = false;
				};
			}}>
				<input type="hidden" name="payment_id" value={selectedPaymentForCancel.id} />
				<div class="flex items-center justify-end gap-3">
					<button
						type="button"
						onclick={() => (showCancelModal = false)}
						class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
					>
						Kembali
					</button>
					<button
						type="submit"
						class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold"
					>
						Ya, Batalkan Pembayaran
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- ============================================================== -->
<!-- MODAL KUITANSI RESMI (PRINTABLE)                               -->
<!-- ============================================================== -->
{#if showReceiptModal && selectedPaymentForReceipt}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
		<div class="bg-white rounded-2xl max-w-xl w-full p-8 shadow-2xl border border-gray-200 my-8">
			<!-- Bagian Kuitansi Siap Cetak -->
			<div id="printable-receipt" class="space-y-6">
				<!-- Kop Sekolah -->
				<div class="border-b-2 border-gray-900 pb-4 text-center">
					<h2 class="text-xl font-bold uppercase tracking-wider text-gray-900">
						{data.school?.name ?? 'MAN 1 JEMBER'}
					</h2>
					<p class="text-xs text-gray-600 mt-1">
						{data.school?.address ?? 'Jl. Imam Bonjol No. 50, Jember, Jawa Timur'}
						{#if data.school?.phone} • Telp: {data.school.phone}{/if}
						{#if data.school?.npsn} • NPSN: {data.school.npsn}{/if}
					</p>
					<div class="mt-3 inline-block px-4 py-1 bg-gray-100 rounded-md border border-gray-300">
						<span class="text-xs font-bold tracking-widest uppercase text-gray-900">
							BUKTI PEMBAYARAN SPP (KUITANSI)
						</span>
					</div>
				</div>

				<!-- Informasi Kuitansi -->
				<div class="grid grid-cols-2 gap-4 text-xs">
					<div>
						<p class="text-gray-500">No. Kuitansi:</p>
						<p class="font-mono font-bold text-gray-900 text-sm">
							{selectedPaymentForReceipt.invoiceNumber ?? 'INV-SPP-DRAFT'}
						</p>
					</div>
					<div class="text-right">
						<p class="text-gray-500">Tanggal Bayar:</p>
						<p class="font-bold text-gray-900">
							{selectedPaymentForReceipt.paymentDate ?? new Date().toISOString().slice(0, 10)}
						</p>
					</div>
					<div>
						<p class="text-gray-500">Nama Siswa:</p>
						<p class="font-semibold text-gray-900 text-sm">
							{selectedPaymentForReceipt.studentName ?? data.student?.name}
						</p>
						<p class="text-gray-500 font-mono">
							NIS: {selectedPaymentForReceipt.studentNis ?? data.student?.nis ?? '-'}
						</p>
					</div>
					<div class="text-right">
						<p class="text-gray-500">Kelas:</p>
						<p class="font-semibold text-gray-900">
							{selectedPaymentForReceipt.className ?? data.student?.className ?? '-'}
						</p>
						<p class="text-gray-500">
							Metode: {selectedPaymentForReceipt.paymentMethod === 'transfer' ? 'Transfer Bank' : 'Tunai'}
						</p>
					</div>
				</div>

				<!-- Rincian Item Tagihan -->
				<div class="border border-gray-200 rounded-lg overflow-hidden">
					<table class="w-full text-xs">
						<thead class="bg-gray-100 font-semibold text-gray-700 border-b border-gray-200">
							<tr>
								<th class="px-4 py-2 text-left">Deskripsi Pembayaran</th>
								<th class="px-4 py-2 text-center">Bulan / Tahun</th>
								<th class="px-4 py-2 text-right">Jumlah</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-100">
							<tr>
								<td class="px-4 py-3 font-medium text-gray-900">
									Sumbangan Pembinaan Pendidikan (SPP)
								</td>
								<td class="px-4 py-3 text-center text-gray-600">
									{selectedPaymentForReceipt.monthName} {selectedPaymentForReceipt.year}
								</td>
								<td class="px-4 py-3 text-right font-bold text-gray-900">
									{formatRupiah(selectedPaymentForReceipt.amountPaid || selectedPaymentForReceipt.amount)}
								</td>
							</tr>
						</tbody>
						<tfoot class="bg-gray-50 font-bold border-t border-gray-200">
							<tr>
								<td colspan="2" class="px-4 py-2.5 text-right text-gray-700">TOTAL DIBAYAR:</td>
								<td class="px-4 py-2.5 text-right text-emerald-700 text-sm">
									{formatRupiah(selectedPaymentForReceipt.amountPaid || selectedPaymentForReceipt.amount)}
								</td>
							</tr>
						</tfoot>
					</table>
				</div>

				<!-- Status & Tanda Tangan -->
				<div class="pt-2 grid grid-cols-2 gap-6 text-xs">
					<div>
						<p class="text-gray-500">Catatan:</p>
						<p class="text-gray-700 italic">
							{selectedPaymentForReceipt.notes ?? 'Terima kasih telah melakukan pembayaran tepat waktu.'}
						</p>
						<div class="mt-4 p-2 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 font-bold uppercase inline-block">
							✓ LUNAS
						</div>
					</div>
					<div class="text-center">
						<p class="text-gray-500">Petugas Keuangan / Kasir,</p>
						<div class="h-14"></div>
						<p class="font-bold text-gray-900 underline">
							{selectedPaymentForReceipt.cashierName ?? 'Admin Keuangan'}
						</p>
						<p class="text-gray-400 text-[10px]">Dicetak via SIS Keuangan</p>
					</div>
				</div>
			</div>

			<!-- Tombol Kontrol Modal -->
			<div class="flex items-center justify-end gap-3 mt-8 pt-4 border-t border-gray-200">
				<button
					type="button"
					onclick={() => (showReceiptModal = false)}
					class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
				>
					Tutup
				</button>
				<button
					type="button"
					onclick={printReceipt}
					class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm"
				>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
					</svg>
					Cetak Kuitansi
				</button>
			</div>
		</div>
	</div>
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
