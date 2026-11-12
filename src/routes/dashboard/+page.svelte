<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const { user, stats, recentPayments } = data;

	const roleLabels: Record<string, string> = {
		superadmin: 'Superadmin',
		admin_sekolah: 'Admin Sekolah',
		admin_keuangan: 'Admin Keuangan',
		guru: 'Guru',
		siswa: 'Siswa'
	};

	function formatRupiah(num: number): string {
		return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
	}
</script>

<svelte:head>
	<title>Dashboard — Sistem Informasi Sekolah</title>
</svelte:head>

<div class="max-w-5xl">
	<!-- Sambutan -->
	<div class="mb-8">
		<h1 class="text-2xl font-bold text-foreground">
			Selamat datang, {user.name} 👋
		</h1>
		<p class="text-muted-foreground mt-1">
			Anda masuk sebagai <span class="font-medium text-primary-foreground">{roleLabels[user.role]}</span>
		</p>
	</div>

	<!-- SUPERADMIN -->
	{#if user.role === 'superadmin'}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
			<a href="/dashboard/sekolah" class="block bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
				<p class="text-sm font-medium text-muted-foreground">Total Sekolah</p>
				<p class="text-3xl font-bold text-foreground mt-1">{stats?.totalSekolah ?? 0}</p>
				<p class="text-xs text-muted-foreground mt-1">Tenant terdaftar</p>
			</a>
			<a href="/dashboard/admin-sekolah" class="block bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
				<p class="text-sm font-medium text-muted-foreground">Admin Sekolah</p>
				<p class="text-3xl font-bold text-foreground mt-1">{stats?.totalAdminSekolah ?? 0}</p>
				<p class="text-xs text-muted-foreground mt-1">Akun admin aktif</p>
			</a>
		</div>
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<a href="/dashboard/sekolah" class="block bg-card rounded-xl border border-border p-5 hover:shadow-md hover:border-primary transition-all group">
				<div class="flex items-center gap-3">
					<div class="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/10 transition-colors">
						<svg class="w-5 h-5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
						</svg>
					</div>
					<span class="text-sm font-medium text-foreground group-hover:text-primary-foreground transition-colors">Tambah Sekolah Baru</span>
				</div>
			</a>
			<a href="/dashboard/admin-sekolah" class="block bg-card rounded-xl border border-border p-5 hover:shadow-md hover:border-primary transition-all group">
				<div class="flex items-center gap-3">
					<div class="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/10 transition-colors">
						<svg class="w-5 h-5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
						</svg>
					</div>
					<span class="text-sm font-medium text-foreground group-hover:text-primary-foreground transition-colors">Kelola Admin Sekolah</span>
				</div>
			</a>
		</div>

	<!-- ADMIN SEKOLAH -->
	{:else if user.role === 'admin_sekolah'}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
			<a href="/dashboard/guru" class="block bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
				<p class="text-sm font-medium text-muted-foreground">Total Guru</p>
				<p class="text-3xl font-bold text-foreground mt-1">{stats?.totalGuru ?? 0}</p>
				<p class="text-xs text-muted-foreground mt-1">Guru aktif di sekolah ini</p>
			</a>
			<a href="/dashboard/siswa" class="block bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
				<p class="text-sm font-medium text-muted-foreground">Total Siswa</p>
				<p class="text-3xl font-bold text-foreground mt-1">{stats?.totalSiswa ?? 0}</p>
				<p class="text-xs text-muted-foreground mt-1">Siswa terdaftar</p>
			</a>
			<a href="/dashboard/keuangan" class="block bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
				<p class="text-sm font-medium text-muted-foreground">Kas SPP Masuk</p>
				<p class="text-2xl font-bold text-success-foreground mt-1">{formatRupiah(stats?.totalKasSPP ?? 0)}</p>
				<p class="text-xs text-muted-foreground mt-1">Total pembayaran SPP diterima</p>
			</a>
		</div>
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
			<a href="/dashboard/guru" class="block bg-card rounded-xl border border-border p-5 hover:shadow-md hover:border-primary transition-all group">
				<div class="flex items-center gap-3">
					<div class="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/10 transition-colors">
						<svg class="w-5 h-5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
						</svg>
					</div>
					<span class="text-sm font-medium text-foreground group-hover:text-primary-foreground transition-colors">Kelola Guru</span>
				</div>
			</a>
			<a href="/dashboard/siswa" class="block bg-card rounded-xl border border-border p-5 hover:shadow-md hover:border-primary transition-all group">
				<div class="flex items-center gap-3">
					<div class="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/10 transition-colors">
						<svg class="w-5 h-5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
						</svg>
					</div>
					<span class="text-sm font-medium text-foreground group-hover:text-primary-foreground transition-colors">Kelola Siswa</span>
				</div>
			</a>
			<a href="/dashboard/keuangan" class="block bg-card rounded-xl border border-border p-5 hover:shadow-md hover:border-primary transition-all group">
				<div class="flex items-center gap-3">
					<div class="w-9 h-9 bg-success/10 rounded-lg flex items-center justify-center group-hover:bg-success/10 transition-colors">
						<svg class="w-5 h-5 text-success-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
						</svg>
					</div>
					<span class="text-sm font-medium text-foreground group-hover:text-success-foreground transition-colors">Pantau Keuangan SPP</span>
				</div>
			</a>
		</div>

	<!-- ADMIN KEUANGAN -->
	{:else if user.role === 'admin_keuangan'}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
			<div class="bg-card rounded-xl border border-border p-5">
				<p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kas SPP Masuk</p>
				<p class="text-2xl font-bold text-success-foreground mt-2">{formatRupiah(stats?.totalKasMasuk ?? 0)}</p>
				<p class="text-xs text-muted-foreground mt-1">Total penerimaan lunas</p>
			</div>
			<div class="bg-card rounded-xl border border-border p-5">
				<p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sisa Tunggakan</p>
				<p class="text-2xl font-bold text-warning-foreground mt-2">{formatRupiah(stats?.totalTunggakan ?? 0)}</p>
				<p class="text-xs text-muted-foreground mt-1">Tagihan belum bayar</p>
			</div>
			<div class="bg-card rounded-xl border border-border p-5">
				<p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Tagihan</p>
				<p class="text-2xl font-bold text-foreground mt-2">{formatRupiah(stats?.totalTagihan ?? 0)}</p>
				<p class="text-xs text-muted-foreground mt-1">Kewajiban seluruh siswa</p>
			</div>
			<div class="bg-card rounded-xl border border-border p-5">
				<p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Siswa Terdaftar</p>
				<p class="text-2xl font-bold text-primary-foreground mt-2">{stats?.totalSiswa ?? 0}</p>
				<p class="text-xs text-muted-foreground mt-1">Tahun ajaran {stats?.activeYearName ?? '-'}</p>
			</div>
		</div>

		<!-- Menu Cepat Admin Keuangan -->
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
			<a href="/dashboard/keuangan" class="block bg-card rounded-xl border border-border p-5 hover:shadow-md hover:border-primary transition-all group">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center group-hover:bg-success/10 transition-colors">
						<svg class="w-5 h-5 text-success-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<div>
						<span class="text-sm font-semibold text-foreground group-hover:text-success-foreground transition-colors block">Transaksi Pembayaran</span>
						<span class="text-xs text-muted-foreground">Input bayar & cetak kuitansi SPP</span>
					</div>
				</div>
			</a>
			<a href="/dashboard/keuangan/tarif" class="block bg-card rounded-xl border border-border p-5 hover:shadow-md hover:border-primary transition-all group">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/10 transition-colors">
						<svg class="w-5 h-5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
						</svg>
					</div>
					<div>
						<span class="text-sm font-semibold text-foreground group-hover:text-primary-foreground transition-colors block">Tarif & Tagihan</span>
						<span class="text-xs text-muted-foreground">Setting tarif & buat tagihan massal</span>
					</div>
				</div>
			</a>
			<a href="/dashboard/keuangan/laporan" class="block bg-card rounded-xl border border-border p-5 hover:shadow-md hover:border-primary transition-all group">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 bg-info/10 rounded-lg flex items-center justify-center group-hover:bg-info/10 transition-colors">
						<svg class="w-5 h-5 text-info-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
						</svg>
					</div>
					<div>
						<span class="text-sm font-semibold text-foreground group-hover:text-info-foreground transition-colors block">Laporan & Rekap SPP</span>
						<span class="text-xs text-muted-foreground">Rekap per kelas & daftar tunggakan</span>
					</div>
				</div>
			</a>
		</div>

		<!-- Transaksi Terkini -->
		<div class="bg-card rounded-xl border border-border overflow-hidden">
			<div class="px-5 py-4 border-b border-border flex items-center justify-between">
				<h2 class="text-base font-semibold text-foreground">Pembayaran SPP Terakhir</h2>
				<a href="/dashboard/keuangan" class="text-xs font-medium text-primary-foreground hover:text-primary-foreground/90">Lihat Semua →</a>
			</div>
			{#if recentPayments && recentPayments.length > 0}
				<div class="divide-y divide-border">
					{#each recentPayments as p}
						<div class="px-5 py-3 flex items-center justify-between text-sm hover:bg-accent">
							<div>
								<p class="font-medium text-foreground">{p.studentName}</p>
								<p class="text-xs text-muted-foreground">
									Kelas {p.className ?? '-'} • Bulan {p.monthName} {p.year}
									{#if p.invoiceNumber}
										• <span class="font-mono text-muted-foreground">{p.invoiceNumber}</span>
									{/if}
								</p>
							</div>
							<div class="text-right">
								<p class="font-semibold text-success-foreground">{formatRupiah(p.amountPaid)}</p>
								<p class="text-xs text-muted-foreground">{p.paymentDate ?? '-'}</p>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="p-6 text-center text-sm text-muted-foreground">
					Belum ada riwayat pembayaran SPP.
				</div>
			{/if}
		</div>

	{:else if user.role === 'guru'}
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<a href="/dashboard/jurnal" class="block bg-card rounded-xl border border-border p-5 hover:shadow-md hover:border-primary transition-all group">
				<div class="flex items-center gap-3">
					<div class="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/10 transition-colors">
						<svg class="w-5 h-5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
						</svg>
					</div>
					<span class="text-sm font-medium text-foreground group-hover:text-primary-foreground transition-colors">Isi Jurnal Mengajar</span>
				</div>
			</a>
			<a href="/dashboard/jadwal" class="block bg-card rounded-xl border border-border p-5 hover:shadow-md hover:border-primary transition-all group">
				<div class="flex items-center gap-3">
					<div class="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/10 transition-colors">
						<svg class="w-5 h-5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
						</svg>
					</div>
					<span class="text-sm font-medium text-foreground group-hover:text-primary-foreground transition-colors">Lihat Jadwal Mengajar</span>
				</div>
			</a>
			<a href="/dashboard/pelanggaran" class="block bg-card rounded-xl border border-border p-5 hover:shadow-md hover:border-primary transition-all group">
				<div class="flex items-center gap-3">
					<div class="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/10 transition-colors">
						<svg class="w-5 h-5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
						</svg>
					</div>
					<span class="text-sm font-medium text-foreground group-hover:text-primary-foreground transition-colors">Catat Pelanggaran Siswa</span>
				</div>
			</a>
		</div>

	{:else if user.role === 'siswa'}
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
			<a href="/dashboard/keuangan" class="block bg-card rounded-xl border border-border p-5 hover:shadow-md hover:border-primary transition-all group">
				<p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status Pembayaran SPP</p>
				<div class="flex items-center gap-4 mt-2">
					<div>
						<p class="text-2xl font-bold text-success-foreground">{stats?.sppLunas ?? 0} Bulan</p>
						<p class="text-xs text-muted-foreground">Sudah lunas</p>
					</div>
					<div class="border-l border-border pl-4">
						<p class="text-2xl font-bold text-warning-foreground">{stats?.sppPending ?? 0} Bulan</p>
						<p class="text-xs text-muted-foreground">Belum dibayar</p>
					</div>
				</div>
			</a>
		</div>
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
			<a href="/dashboard/keuangan" class="block bg-card rounded-xl border border-border p-5 hover:shadow-md hover:border-primary transition-all group">
				<div class="flex items-center gap-3">
					<div class="w-9 h-9 bg-success/10 rounded-lg flex items-center justify-center group-hover:bg-success/10 transition-colors">
						<svg class="w-5 h-5 text-success-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
						</svg>
					</div>
					<span class="text-sm font-medium text-foreground group-hover:text-success-foreground transition-colors">Lihat Kartu SPP Saya</span>
				</div>
			</a>
			<a href="/dashboard/jadwal" class="block bg-card rounded-xl border border-border p-5 hover:shadow-md hover:border-primary transition-all group">
				<div class="flex items-center gap-3">
					<div class="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/10 transition-colors">
						<svg class="w-5 h-5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
						</svg>
					</div>
					<span class="text-sm font-medium text-foreground group-hover:text-primary-foreground transition-colors">Lihat Jadwal Pelajaran</span>
				</div>
			</a>
			<a href="/dashboard/pelanggaran" class="block bg-card rounded-xl border border-border p-5 hover:shadow-md hover:border-primary transition-all group">
				<div class="flex items-center gap-3">
					<div class="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/10 transition-colors">
						<svg class="w-5 h-5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
						</svg>
					</div>
					<span class="text-sm font-medium text-foreground group-hover:text-primary-foreground transition-colors">Lihat Poin Pelanggaran</span>
				</div>
			</a>
		</div>
	{/if}
</div>
