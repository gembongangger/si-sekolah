<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Select, SelectItem } from '$lib/components/ui/select/index.js';

	let { data }: { data: PageData } = $props();

	function formatRupiah(num: number): string {
		return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
	}

	let activeReportTab = $state<'kelas' | 'tunggakan' | 'kas' | 'pengeluaran'>('kelas');

	function printReport() {
		window.print();
	}
</script>

<svelte:head>
	<title>Laporan Keuangan SPP — Sistem Informasi Sekolah</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold text-foreground">Laporan & Rekapitulasi Keuangan SPP</h1>
			<p class="text-sm text-muted-foreground mt-1">
				Rekapitulasi pemasukan, pengeluaran, kelunasan per kelas, dan daftar tunggakan siswa
			</p>
		</div>
		<div class="flex items-center gap-3">
			<Button variant="outline" href="/dashboard/keuangan">← Ke Transaksi</Button>
			<Button onclick={printReport}>
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
				</svg>
				Cetak Laporan
			</Button>
		</div>
	</div>
	<!-- Nav Tabs Keuangan -->
	<div class="grid grid-cols-3 gap-1 mb-5 bg-muted p-1 rounded-lg sm:flex sm:w-fit">
		<a href="/dashboard/keuangan" class="min-h-10 px-2 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground">Transaksi</a>
		<a href="/dashboard/keuangan/tarif" class="min-h-10 px-2 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground">Pengaturan Tarif</a>
		<a href="/dashboard/keuangan/laporan" class="min-h-10 px-2 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center justify-center bg-card text-foreground shadow-sm">Laporan &amp; Rekap</a>
	</div>

	<!-- Year Selector & Overall Stats -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border">
		<form method="GET" class="flex items-center gap-3">
			<label class="text-sm font-medium text-foreground whitespace-nowrap">Tahun Ajaran:</label>
			<select
				name="year_id"
				onchange={(e) => (e.target as HTMLSelectElement).form?.submit()}
				class="w-full text-base sm:text-sm border border-input rounded-lg px-3 py-2 min-h-11 focus:ring-ring focus:border-ring"
			>
				{#each data.allYears as y}
					<option value={y.id} selected={data.selectedYearId === y.id}>
						{y.name} ({y.semester}) {y.isActive ? '★ Aktif' : ''}
					</option>
				{/each}
			</select>
		</form>
		<div class="flex items-center flex-wrap gap-6 text-xs text-muted-foreground">
			<div>
				<span>Kas Masuk:</span>
				<strong class="text-emerald-600 text-sm ml-1">{formatRupiah(data.grandTotal.totalDibayar)}</strong>
			</div>
			<div>
				<span>Pengeluaran:</span>
				<strong class="text-destructive text-sm ml-1">{formatRupiah(data.totalPengeluaran ?? 0)}</strong>
			</div>
			<div>
				<span>Saldo Kas:</span>
				<strong class="text-foreground text-sm ml-1">{formatRupiah((data.grandTotal.totalDibayar ?? 0) - (data.totalPengeluaran ?? 0))}</strong>
			</div>
			<div>
				<span>Tunggakan:</span>
				<strong class="text-amber-600 text-sm ml-1">{formatRupiah(data.grandTotal.totalTunggakan)}</strong>
			</div>
			<div>
				<span>Kelunasan:</span>
				<strong class="text-blue-600 text-sm ml-1">{data.grandTotal.persenLunas}%</strong>
			</div>
		</div>
	</div>

	<!-- Sub-tabs Laporan -->
	<div class="grid grid-cols-2 gap-1 mb-5 bg-muted p-1 rounded-lg sm:flex sm:w-fit sm:gap-2">
		<button type="button" onclick={() => (activeReportTab = 'kelas')}
			class="min-h-10 px-2 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center justify-center whitespace-nowrap
				{activeReportTab === 'kelas' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}">
			<span class="hidden sm:inline">📊 </span>Rekapitulasi Per Kelas
		</button>
		<button type="button" onclick={() => (activeReportTab = 'tunggakan')}
			class="min-h-10 px-2 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center justify-center whitespace-nowrap
				{activeReportTab === 'tunggakan' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}">
			<span class="hidden sm:inline">⚠️ </span>Daftar Tunggakan
			<span class="ml-1 text-xs opacity-70">{data.arrearsRows.length}</span>
		</button>
		<button type="button" onclick={() => (activeReportTab = 'kas')}
			class="min-h-10 px-2 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center justify-center whitespace-nowrap
				{activeReportTab === 'kas' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}">
			<span class="hidden sm:inline">💰 </span>Jurnal Kas
			<span class="ml-1 text-xs opacity-70">{data.cashReceipts.length}</span>
		</button>
		<button type="button" onclick={() => (activeReportTab = 'pengeluaran')}
			class="min-h-10 px-2 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center justify-center whitespace-nowrap
				{activeReportTab === 'pengeluaran' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}">
			<span class="hidden sm:inline">📤 </span>Pengeluaran
			<span class="ml-1 text-xs opacity-70">{data.expenseRows?.length ?? 0}</span>
		</button>
	</div>

	<!-- AREA LAPORAN SIAP CETAK -->
	<div id="printable-report" class="space-y-6">
		<!-- Kop Laporan (Muncul saat print) -->
		<div class="print-only border-b-2 border-foreground pb-3 mb-6 text-center">
			<h2 class="text-xl font-bold uppercase tracking-wider text-foreground">
				{data.school?.name ?? 'MAN 1 JEMBER'}
			</h2>
			<p class="text-xs text-muted-foreground mt-0.5">
				{data.school?.address ?? 'Jl. Imam Bonjol No. 50, Jember, Jawa Timur'}
				{#if data.school?.phone} • Telp: {data.school.phone}{/if}
				{#if data.school?.npsn} • NPSN: {data.school.npsn}{/if}
			</p>
			<h3 class="text-sm font-bold uppercase tracking-widest text-foreground mt-3 underline">
				{#if activeReportTab === 'kelas'}
					LAPORAN REKAPITULASI PEMBAYARAN SPP PER KELAS
				{:else if activeReportTab === 'tunggakan'}
					LAPORAN DAFTAR TUNGGAKAN SPP SISWA
				{:else if activeReportTab === 'kas'}
					BUKU KAS PENERIMAAN PEMBAYARAN SPP
				{:else if activeReportTab === 'pengeluaran'}
					BUKU KAS PENGELUARAN / PENARIKAN DANA
				{:else}
					BUKU KAS PENERIMAAN PEMBAYARAN SPP
				{/if}
			</h3>
		</div>

		<!-- 1. TAB REKAPITULASI PER KELAS -->
		{#if activeReportTab === 'kelas'}
			<div class="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
				<div class="px-6 py-4 border-b border-border bg-muted/50 flex items-center justify-between no-print">
					<h2 class="text-base font-semibold text-foreground">Rekapitulasi SPP Per Kelas</h2>
					<span class="text-xs text-muted-foreground">Tahun Ajaran Aktif</span>
				</div>
				<div class="overflow-x-auto">
					<table class="w-full text-left text-sm text-muted-foreground">
						<thead class="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground border-b border-border">
							<tr>
								<th class="px-6 py-3">Nama Kelas</th>
								<th class="px-6 py-3 text-center">Tingkat</th>
								<th class="px-6 py-3 text-center">Jml Siswa</th>
								<th class="px-6 py-3 text-right">Total Kewajiban</th>
								<th class="px-6 py-3 text-right">Terbayar (Kas)</th>
								<th class="px-6 py-3 text-right">Sisa Tunggakan</th>
								<th class="px-6 py-3 text-center">% Kelunasan</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							{#each data.classSummaries as cs}
								<tr class="hover:bg-muted/50">
									<td class="px-6 py-4 font-bold text-foreground">{cs.className}</td>
									<td class="px-6 py-4 text-center font-medium text-muted-foreground">{cs.classLevel}</td>
									<td class="px-6 py-4 text-center font-semibold text-foreground">{cs.totalSiswa}</td>
									<td class="px-6 py-4 text-right font-medium text-foreground">{formatRupiah(cs.totalKewajiban)}</td>
									<td class="px-6 py-4 text-right font-semibold text-emerald-600">{formatRupiah(cs.totalDibayar)}</td>
									<td class="px-6 py-4 text-right font-semibold text-amber-600">{formatRupiah(cs.sisaTunggakan)}</td>
									<td class="px-6 py-4 text-center">
										<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold {cs.persenLunas === 100
											? 'bg-emerald-100 text-emerald-800'
											: cs.persenLunas >= 50
											? 'bg-blue-100 text-blue-800'
											: 'bg-amber-100 text-amber-800'}">
											{cs.persenLunas}%
										</span>
									</td>
								</tr>
							{/each}
						</tbody>
						<tfoot class="bg-muted font-bold border-t-2 border-input text-foreground">
							<tr>
								<td colspan="2" class="px-6 py-4 uppercase tracking-wider">TOTAL KESELURUHAN:</td>
								<td class="px-6 py-4 text-center">{data.grandTotal.totalSiswa} Siswa</td>
								<td class="px-6 py-4 text-right text-foreground">{formatRupiah(data.grandTotal.totalKewajiban)}</td>
								<td class="px-6 py-4 text-right text-emerald-700">{formatRupiah(data.grandTotal.totalDibayar)}</td>
								<td class="px-6 py-4 text-right text-amber-700">{formatRupiah(data.grandTotal.totalTunggakan)}</td>
								<td class="px-6 py-4 text-center text-blue-700">{data.grandTotal.persenLunas}%</td>
							</tr>
						</tfoot>
					</table>
				</div>
			</div>

		<!-- 2. TAB DAFTAR SISWA MENUNGGAK -->
		{:else if activeReportTab === 'tunggakan'}
			<div class="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
				<div class="px-6 py-4 border-b border-border bg-muted/50 flex items-center justify-between no-print">
					<h2 class="text-base font-semibold text-foreground">Daftar Tunggakan SPP Siswa</h2>
					<span class="text-xs text-amber-700 font-medium">{data.arrearsRows.length} Siswa Menunggak</span>
				</div>
				<div class="overflow-x-auto">
					<table class="w-full text-left text-sm text-muted-foreground">
						<thead class="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground border-b border-border">
							<tr>
								<th class="px-6 py-3">Nama Siswa</th>
								<th class="px-6 py-3">NIS</th>
								<th class="px-6 py-3">Kelas</th>
								<th class="px-6 py-3">Orang Tua / Wali</th>
								<th class="px-6 py-3">Kontak / Telp</th>
								<th class="px-6 py-3 text-center">Bulan Tertunggak</th>
								<th class="px-6 py-3 text-right">Total Tunggakan</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							{#if data.arrearsRows.length > 0}
								{#each data.arrearsRows as ar}
									<tr class="hover:bg-muted/50">
										<td class="px-6 py-4 font-bold text-foreground">{ar.studentName}</td>
										<td class="px-6 py-4 font-mono text-xs text-muted-foreground">{ar.nis ?? '-'}</td>
										<td class="px-6 py-4 font-medium text-foreground">{ar.className ?? '-'}</td>
										<td class="px-6 py-4 text-foreground">{ar.parentName ?? '-'}</td>
										<td class="px-6 py-4 text-muted-foreground text-xs">{ar.parentPhone ?? '-'}</td>
										<td class="px-6 py-4 text-center font-bold text-amber-700">
											{ar.unpaidMonthsCount} Bulan
										</td>
										<td class="px-6 py-4 text-right font-bold text-red-600">
											{formatRupiah(ar.totalArrears)}
										</td>
									</tr>
								{/each}
							{:else}
								<tr>
									<td colspan="7" class="px-6 py-10 text-center text-emerald-600 text-sm font-semibold">
										🎉 Alhamdulillah, tidak ada siswa yang memiliki tunggakan SPP saat ini.
									</td>
								</tr>
							{/if}
						</tbody>
					</table>
				</div>
			</div>

		<!-- 3. TAB BUKU KAS PENERIMAAN SPP -->
		{:else if activeReportTab === 'kas'}
			<div class="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
				<div class="px-6 py-4 border-b border-border bg-muted/50 flex items-center justify-between no-print">
					<h2 class="text-base font-semibold text-foreground">Buku Kas Penerimaan SPP</h2>
					<span class="text-xs text-emerald-700 font-medium">{data.cashReceipts.length} Transaksi Tercatat</span>
				</div>
				<div class="overflow-x-auto">
					<table class="w-full text-left text-sm text-muted-foreground">
						<thead class="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground border-b border-border">
							<tr>
								<th class="px-6 py-3">Tanggal</th>
								<th class="px-6 py-3">No. Kuitansi</th>
								<th class="px-6 py-3">Siswa</th>
								<th class="px-6 py-3">Kelas</th>
								<th class="px-6 py-3">Bulan SPP</th>
								<th class="px-6 py-3">Metode</th>
								<th class="px-6 py-3">Kasir</th>
								<th class="px-6 py-3 text-right">Nominal Masuk</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							{#if data.cashReceipts.length > 0}
								{#each data.cashReceipts as cr}
									<tr class="hover:bg-muted/50">
										<td class="px-6 py-4 text-xs font-medium text-foreground">{cr.paymentDate ?? '-'}</td>
										<td class="px-6 py-4 font-mono text-xs text-muted-foreground">{cr.invoiceNumber ?? '-'}</td>
										<td class="px-6 py-4 font-bold text-foreground">{cr.studentName}</td>
										<td class="px-6 py-4 text-foreground font-medium">{cr.className ?? '-'}</td>
										<td class="px-6 py-4 text-foreground">{cr.monthName} {cr.year}</td>
										<td class="px-6 py-4 text-xs font-semibold uppercase text-muted-foreground">{cr.paymentMethod}</td>
										<td class="px-6 py-4 text-xs text-muted-foreground">{cr.cashierName ?? 'Admin'}</td>
										<td class="px-6 py-4 text-right font-bold text-emerald-600">{formatRupiah(cr.amountPaid)}</td>
									</tr>
								{/each}
							{:else}
								<tr>
									<td colspan="8" class="px-6 py-10 text-center text-muted-foreground text-sm">
										Belum ada catatan penerimaan kas SPP.
									</td>
								</tr>
							{/if}
						</tbody>
					</table>
				</div>
			</div>
		{:else if activeReportTab === 'pengeluaran'}
			<div class="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
				<div class="px-6 py-4 border-b border-border bg-muted/50 flex items-center justify-between no-print">
					<h2 class="text-base font-semibold text-foreground">Buku Kas Pengeluaran / Penarikan Dana</h2>
					<span class="text-xs text-destructive font-medium">{data.expenseRows?.length ?? 0} Transaksi Tercatat</span>
				</div>
				<div class="overflow-x-auto">
					<table class="w-full text-left text-sm text-muted-foreground">
						<thead class="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground border-b border-border">
							<tr>
								<th class="px-6 py-3">Tanggal</th>
								<th class="px-6 py-3">Kategori</th>
								<th class="px-6 py-3">Keterangan</th>
								<th class="px-6 py-3">Catatan</th>
								<th class="px-6 py-3">Petugas</th>
								<th class="px-6 py-3 text-right">Nominal</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							{#if (data.expenseRows?.length ?? 0) > 0}
								{#each data.expenseRows as tx}
									<tr class="hover:bg-muted/50">
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
							{:else}
								<tr>
									<td colspan="6" class="px-6 py-10 text-center text-muted-foreground text-sm">
										Belum ada catatan pengeluaran.
									</td>
								</tr>
							{/if}
						</tbody>
						<tfoot class="bg-muted font-bold border-t-2 border-input text-foreground">
							<tr>
								<td colspan="5" class="px-6 py-3 text-right uppercase tracking-wider">Total Pengeluaran:</td>
								<td class="px-6 py-3 text-right text-destructive">
									−{formatRupiah(data.totalPengeluaran ?? 0)}
								</td>
						</tr>
						</tfoot>
				</table>
			</div>
		</div>
		{/if}

		<!-- Lembar Tanda Tangan Cetak (Muncul saat print) -->
		<div class="print-only pt-10 grid grid-cols-2 text-center text-xs">
			<div>
				<p>Mengetahui,</p>
				<p class="font-bold">Kepala Sekolah {data.school?.name ?? 'MAN 1 Jember'}</p>
				<div class="h-16"></div>
				<p class="font-bold underline">( ............................................ )</p>
				<p class="text-muted-foreground">NIP. .........................................</p>
			</div>
			<div>
				<p>Jember, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
				<p class="font-bold">Bendahara / Admin Keuangan Sekolah</p>
				<div class="h-16"></div>
				<p class="font-bold underline">( ............................................ )</p>
				<p class="text-muted-foreground">NIP. .........................................</p>
			</div>
		</div>
	</div>
</div>

<style>
	.print-only {
		display: none;
	}
	@media print {
		.no-print {
			display: none !important;
		}
		.print-only {
			display: block !important;
		}
		:global(body *) {
			visibility: hidden;
		}
		#printable-report,
		#printable-report * {
			visibility: visible;
		}
		#printable-report {
			position: absolute;
			left: 0;
			top: 0;
			width: 100%;
			margin: 0;
			padding: 20px;
		}
	}
</style>
