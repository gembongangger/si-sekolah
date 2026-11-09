<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function formatRupiah(num: number): string {
		return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
	}

	let activeReportTab = $state<'kelas' | 'tunggakan' | 'kas'>('kelas');

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
			<h1 class="text-2xl font-bold text-gray-900">Laporan & Rekapitulasi Keuangan SPP</h1>
			<p class="text-sm text-gray-500 mt-1">
				Rekapitulasi penerimaan kas, kelunasan per kelas, dan daftar tunggakan siswa
			</p>
		</div>
		<div class="flex items-center gap-3">
			<a
				href="/dashboard/keuangan"
				class="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl transition-colors shadow-sm"
			>
				← Ke Transaksi
			</a>
			<button
				onclick={printReport}
				class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl flex items-center gap-2 shadow-sm transition-colors"
			>
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
				</svg>
				Cetak Laporan
			</button>
		</div>
	</div>

	<!-- Nav Tabs Top -->
	<div class="border-b border-gray-200">
		<nav class="flex gap-4">
			<a
				href="/dashboard/keuangan"
				class="py-3 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
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
				class="py-3 px-1 border-b-2 font-medium text-sm border-blue-600 text-blue-600"
			>
				Laporan & Rekapitulasi
			</a>
		</nav>
	</div>

	<!-- Year Selector & Overall Stats -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200">
		<form method="GET" class="flex items-center gap-3">
			<label class="text-sm font-medium text-gray-700 whitespace-nowrap">Tahun Ajaran:</label>
			<select
				name="year_id"
				onchange={(e) => (e.target as HTMLSelectElement).form?.submit()}
				class="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-blue-500 focus:border-blue-500"
			>
				{#each data.allYears as y}
					<option value={y.id} selected={data.selectedYearId === y.id}>
						{y.name} ({y.semester}) {y.isActive ? '★ Aktif' : ''}
					</option>
				{/each}
			</select>
		</form>
		<div class="flex items-center gap-6 text-xs text-gray-500">
			<div>
				<span>Kas Masuk:</span>
				<strong class="text-emerald-600 text-sm ml-1">{formatRupiah(data.grandTotal.totalDibayar)}</strong>
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
	<div class="flex items-center gap-2 border-b border-gray-200 pb-2">
		<button
			onclick={() => (activeReportTab = 'kelas')}
			class="px-4 py-2 text-sm font-medium rounded-lg transition-colors {activeReportTab === 'kelas'
				? 'bg-blue-50 text-blue-700 font-semibold'
				: 'text-gray-600 hover:bg-gray-100'}"
		>
			📊 Rekapitulasi Per Kelas
		</button>
		<button
			onclick={() => (activeReportTab = 'tunggakan')}
			class="px-4 py-2 text-sm font-medium rounded-lg transition-colors {activeReportTab === 'tunggakan'
				? 'bg-amber-50 text-amber-800 font-semibold'
				: 'text-gray-600 hover:bg-gray-100'}"
		>
			⚠️ Daftar Siswa Menunggak ({data.arrearsRows.length})
		</button>
		<button
			onclick={() => (activeReportTab = 'kas')}
			class="px-4 py-2 text-sm font-medium rounded-lg transition-colors {activeReportTab === 'kas'
				? 'bg-emerald-50 text-emerald-800 font-semibold'
				: 'text-gray-600 hover:bg-gray-100'}"
		>
			💰 Jurnal Penerimaan Kas ({data.cashReceipts.length})
		</button>
	</div>

	<!-- AREA LAPORAN SIAP CETAK -->
	<div id="printable-report" class="space-y-6">
		<!-- Kop Laporan (Muncul saat print) -->
		<div class="print-only border-b-2 border-gray-900 pb-3 mb-6 text-center">
			<h2 class="text-xl font-bold uppercase tracking-wider text-gray-900">
				{data.school?.name ?? 'MAN 1 JEMBER'}
			</h2>
			<p class="text-xs text-gray-600 mt-0.5">
				{data.school?.address ?? 'Jl. Imam Bonjol No. 50, Jember, Jawa Timur'}
				{#if data.school?.phone} • Telp: {data.school.phone}{/if}
				{#if data.school?.npsn} • NPSN: {data.school.npsn}{/if}
			</p>
			<h3 class="text-sm font-bold uppercase tracking-widest text-gray-800 mt-3 underline">
				{#if activeReportTab === 'kelas'}
					LAPORAN REKAPITULASI PEMBAYARAN SPP PER KELAS
				{:else if activeReportTab === 'tunggakan'}
					LAPORAN DAFTAR TUNGGAKAN SPP SISWA
				{:else}
					BUKU KAS PENERIMAAN PEMBAYARAN SPP
				{/if}
			</h3>
		</div>

		<!-- 1. TAB REKAPITULASI PER KELAS -->
		{#if activeReportTab === 'kelas'}
			<div class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
				<div class="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between no-print">
					<h2 class="text-base font-semibold text-gray-900">Rekapitulasi SPP Per Kelas</h2>
					<span class="text-xs text-gray-500">Tahun Ajaran Aktif</span>
				</div>
				<div class="overflow-x-auto">
					<table class="w-full text-left text-sm text-gray-600">
						<thead class="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
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
						<tbody class="divide-y divide-gray-100">
							{#each data.classSummaries as cs}
								<tr class="hover:bg-gray-50">
									<td class="px-6 py-4 font-bold text-gray-900">{cs.className}</td>
									<td class="px-6 py-4 text-center font-medium text-gray-600">{cs.classLevel}</td>
									<td class="px-6 py-4 text-center font-semibold text-gray-800">{cs.totalSiswa}</td>
									<td class="px-6 py-4 text-right font-medium text-gray-900">{formatRupiah(cs.totalKewajiban)}</td>
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
						<tfoot class="bg-gray-100 font-bold border-t-2 border-gray-300 text-gray-900">
							<tr>
								<td colspan="2" class="px-6 py-4 uppercase tracking-wider">TOTAL KESELURUHAN:</td>
								<td class="px-6 py-4 text-center">{data.grandTotal.totalSiswa} Siswa</td>
								<td class="px-6 py-4 text-right text-gray-900">{formatRupiah(data.grandTotal.totalKewajiban)}</td>
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
			<div class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
				<div class="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between no-print">
					<h2 class="text-base font-semibold text-gray-900">Daftar Tunggakan SPP Siswa</h2>
					<span class="text-xs text-amber-700 font-medium">{data.arrearsRows.length} Siswa Menunggak</span>
				</div>
				<div class="overflow-x-auto">
					<table class="w-full text-left text-sm text-gray-600">
						<thead class="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
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
						<tbody class="divide-y divide-gray-100">
							{#if data.arrearsRows.length > 0}
								{#each data.arrearsRows as ar}
									<tr class="hover:bg-gray-50">
										<td class="px-6 py-4 font-bold text-gray-900">{ar.studentName}</td>
										<td class="px-6 py-4 font-mono text-xs text-gray-500">{ar.nis ?? '-'}</td>
										<td class="px-6 py-4 font-medium text-gray-800">{ar.className ?? '-'}</td>
										<td class="px-6 py-4 text-gray-700">{ar.parentName ?? '-'}</td>
										<td class="px-6 py-4 text-gray-600 text-xs">{ar.parentPhone ?? '-'}</td>
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
			<div class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
				<div class="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between no-print">
					<h2 class="text-base font-semibold text-gray-900">Buku Kas Penerimaan SPP</h2>
					<span class="text-xs text-emerald-700 font-medium">{data.cashReceipts.length} Transaksi Tercatat</span>
				</div>
				<div class="overflow-x-auto">
					<table class="w-full text-left text-sm text-gray-600">
						<thead class="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
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
						<tbody class="divide-y divide-gray-100">
							{#if data.cashReceipts.length > 0}
								{#each data.cashReceipts as cr}
									<tr class="hover:bg-gray-50">
										<td class="px-6 py-4 text-xs font-medium text-gray-900">{cr.paymentDate ?? '-'}</td>
										<td class="px-6 py-4 font-mono text-xs text-gray-500">{cr.invoiceNumber ?? '-'}</td>
										<td class="px-6 py-4 font-bold text-gray-900">{cr.studentName}</td>
										<td class="px-6 py-4 text-gray-700 font-medium">{cr.className ?? '-'}</td>
										<td class="px-6 py-4 text-gray-900">{cr.monthName} {cr.year}</td>
										<td class="px-6 py-4 text-xs font-semibold uppercase text-gray-600">{cr.paymentMethod}</td>
										<td class="px-6 py-4 text-xs text-gray-500">{cr.cashierName ?? 'Admin'}</td>
										<td class="px-6 py-4 text-right font-bold text-emerald-600">{formatRupiah(cr.amountPaid)}</td>
									</tr>
								{/each}
							{:else}
								<tr>
									<td colspan="8" class="px-6 py-10 text-center text-gray-400 text-sm">
										Belum ada catatan penerimaan kas SPP.
									</td>
								</tr>
							{/if}
						</tbody>
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
				<p class="text-gray-500">NIP. .........................................</p>
			</div>
			<div>
				<p>Jember, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
				<p class="font-bold">Bendahara / Admin Keuangan Sekolah</p>
				<div class="h-16"></div>
				<p class="font-bold underline">( ............................................ )</p>
				<p class="text-gray-500">NIP. .........................................</p>
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
