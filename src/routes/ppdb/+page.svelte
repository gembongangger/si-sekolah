<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function formatRupiah(num: number): string {
		if (!num || num === 0) return 'Gratis (Rp 0)';
		return 'Rp ' + Number(num).toLocaleString('id-ID');
	}
</script>

<svelte:head>
	<title>PPDB Online — Penerimaan Peserta Didik Baru</title>
</svelte:head>

<div class="min-h-screen bg-background text-foreground">
	<!-- Navbar Publik -->
	<header class="bg-card border-b border-border sticky top-0 z-40">
		<div class="max-w-6xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between gap-2">
			<a href="/ppdb" class="flex items-center gap-2 sm:gap-3 min-w-0">
				<div class="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-base sm:text-lg shadow-sm">
					🎓
				</div>
				<div class="min-w-0">
					<p class="font-bold text-foreground leading-tight text-sm sm:text-base truncate">PPDB Online</p>
					<p class="text-[10px] sm:text-xs text-muted-foreground truncate">Sistem Informasi Sekolah</p>
				</div>
			</a>
			<div class="flex items-center gap-1.5 sm:gap-3 text-sm shrink-0">
				<a
					href="/ppdb/status"
					class="px-2.5 sm:px-3.5 py-2 text-foreground hover:text-primary-foreground font-medium transition-colors whitespace-nowrap"
				>
					<span class="hidden sm:inline">🔍 Cek Status</span>
					<span class="sm:hidden">🔍 Status</span>
				</a>
				<a
					href="/ppdb/daftar"
					class="px-3 sm:px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-sm transition-colors whitespace-nowrap"
				>
					Daftar
				</a>
				<a
					href="/login"
					class="hidden sm:inline-block px-3.5 py-2 text-muted-foreground hover:text-foreground text-xs font-medium"
				>
					Portal Pegawai →
				</a>
			</div>
		</div>
	</header>

	<!-- Hero Banner -->
	<section class="bg-primary text-primary-foreground py-12 sm:py-16 px-4">
		<div class="max-w-4xl mx-auto text-center space-y-4 sm:space-y-5">
			<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/20 text-primary-foreground border border-primary/30">
				✨ Pendaftaran Peserta Didik Baru Resmi Dibuka
			</span>
			<h1 class="text-2xl sm:text-5xl font-extrabold tracking-tight leading-tight">
				Masa Depan Cerah Dimulai dari Madrasah Unggul
			</h1>
			<p class="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
				Selamat datang di Portal PPDB Online. Daftarkan diri Anda secara online, pilih sekolah dan jurusan impian, serta pantau hasil seleksi secara transparan dan mudah.
			</p>
			<div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-2 sm:pt-3">
				<a
					href="/ppdb/daftar"
					class="w-full sm:w-auto px-6 py-3.5 bg-success hover:bg-success/90 text-primary-foreground font-bold text-sm rounded-xl shadow-lg transition-transform active:scale-95 text-center"
				>
					📝 Formulir Pendaftaran Online
				</a>
				<a
					href="/ppdb/status"
					class="w-full sm:w-auto px-6 py-3.5 bg-background/10 hover:bg-background/20 text-primary-foreground font-bold text-sm rounded-xl backdrop-blur-sm border border-background/20 transition-colors text-center"
				>
					Cek Hasil & Status Pendaftaran
				</a>
			</div>
		</div>
	</section>

	<!-- Jalur Pendaftaran -->
	<section class="max-w-6xl mx-auto px-4 -mt-6 sm:-mt-8">
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
			<div class="bg-card p-4 sm:p-5 rounded-2xl shadow-sm border border-border flex flex-col justify-between">
				<div>
					<div class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-info/10 text-info-foreground flex items-center justify-center font-bold text-base sm:text-lg mb-2.5">
						🏆
					</div>
					<h3 class="font-bold text-foreground text-sm">Jalur Prestasi</h3>
					<p class="text-xs text-muted-foreground mt-1 leading-relaxed">
						Khusus siswa dengan prestasi akademik (rapor unggul) atau non-akademik (olahraga, seni, tahfidz Al-Qur'an).
					</p>
				</div>
				<span class="text-[10px] sm:text-[11px] font-semibold text-info-foreground mt-3 block">Bebas Tes Tulis</span>
			</div>

			<div class="bg-card p-4 sm:p-5 rounded-2xl shadow-sm border border-border flex flex-col justify-between">
				<div>
					<div class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary/10 text-primary-foreground flex items-center justify-center font-bold text-base sm:text-lg mb-2.5">
						📚
					</div>
					<h3 class="font-bold text-foreground text-sm">Jalur Reguler (Tes)</h3>
					<p class="text-xs text-muted-foreground mt-1 leading-relaxed">
						Terbuka untuk seluruh lulusan SD/sederajat maupun SMP/MTs sederajat melalui seleksi Computer Based Test (CBT) & wawancara.
					</p>
				</div>
				<span class="text-[10px] sm:text-[11px] font-semibold text-primary-foreground mt-3 block">Ujian Akademik</span>
			</div>

			<div class="bg-card p-4 sm:p-5 rounded-2xl shadow-sm border border-border flex flex-col justify-between">
				<div>
					<div class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-success/10 text-success-foreground flex items-center justify-center font-bold text-base sm:text-lg mb-2.5">
						📍
					</div>
					<h3 class="font-bold text-foreground text-sm">Jalur Zonasi</h3>
					<p class="text-xs text-muted-foreground mt-1 leading-relaxed">
						Diperuntukkan bagi calon peserta didik yang berdomisili di dalam wilayah radius terdekat dari madrasah.
					</p>
				</div>
				<span class="text-[10px] sm:text-[11px] font-semibold text-success-foreground mt-3 block">Prioritas Jarak Rumah</span>
			</div>

			<div class="bg-card p-4 sm:p-5 rounded-2xl shadow-sm border border-border flex flex-col justify-between">
				<div>
					<div class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-warning/10 text-warning-foreground flex items-center justify-center font-bold text-base sm:text-lg mb-2.5">
						🤝
					</div>
					<h3 class="font-bold text-foreground text-sm">Jalur Afirmasi</h3>
					<p class="text-xs text-muted-foreground mt-1 leading-relaxed">
						Dukungan pendidikan bagi keluarga pra-sejahtera (pemegang KIP, PKH, KKS) dengan kuota khusus.
					</p>
				</div>
				<span class="text-[10px] sm:text-[11px] font-semibold text-warning-foreground mt-3 block">Bantuan Biaya</span>
			</div>
		</div>
	</section>

	<!-- Gelombang Pendaftaran Aktif -->
	<section class="max-w-6xl mx-auto px-4 py-10 sm:py-12 space-y-5 sm:space-y-6">
		<div class="text-center max-w-xl mx-auto">
			<h2 class="text-xl sm:text-2xl font-bold text-foreground">Gelombang Pendaftaran Aktif</h2>
			<p class="text-xs text-muted-foreground mt-1">Pilih sekolah dan gelombang pendaftaran yang sedang dibuka</p>
		</div>

		{#if data.batches && data.batches.length > 0}
			<div class="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
				{#each data.batches as b}
					<div class="bg-card rounded-2xl p-5 sm:p-6 border border-border shadow-sm flex flex-col justify-between space-y-4">
						<div class="space-y-2.5">
							<div class="flex items-center justify-between">
								<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-success/10 text-success-foreground">
									● Pendaftaran Buka
								</span>
								<span class="text-xs text-muted-foreground font-medium">TA {b.academicYearName}</span>
							</div>
							<h3 class="text-base sm:text-lg font-bold text-foreground">{b.name}</h3>
							<p class="text-xs text-muted-foreground">{b.schoolName} — {b.schoolAddress ?? ''}</p>
							{#if b.description}
								<p class="text-xs text-muted-foreground italic bg-background p-2 rounded-lg border border-border">
									{b.description}
								</p>
							{/if}

							<div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
								<div class="bg-background p-2 rounded-xl border border-border">
									<p class="text-muted-foreground text-[10px] sm:text-[11px]">Batas Waktu</p>
									<p class="font-bold text-foreground mt-0.5">{b.endDate}</p>
								</div>
								<div class="bg-background p-2 rounded-xl border border-border">
									<p class="text-muted-foreground text-[10px] sm:text-[11px]">Biaya Pendaftaran</p>
									<p class="font-bold text-success-foreground mt-0.5">{formatRupiah(b.fee)}</p>
								</div>
								<div class="bg-background p-2 rounded-xl border border-border">
									<p class="text-muted-foreground text-[10px] sm:text-[11px]">Kuota / Pendaftar</p>
									<p class="font-bold text-primary-foreground mt-0.5">{b.totalRegistrants} / {b.quota}</p>
								</div>
							</div>
						</div>

						<a
							href="/ppdb/daftar?batch={b.id}"
							class="w-full text-center py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm rounded-xl shadow-sm transition-colors block"
						>
							Pilih Gelombang Ini & Daftar →
						</a>
					</div>
				{/each}
			</div>
		{:else}
			<div class="p-8 sm:p-12 text-center bg-card rounded-2xl border border-border text-muted-foreground">
				Saat ini belum ada gelombang pendaftaran PPDB yang aktif dibuka.
			</div>
		{/if}
	</section>

	<!-- Footer -->
	<footer class="bg-card border-t border-border py-8 px-4 text-center text-xs text-muted-foreground">
		<p class="font-semibold text-foreground">PPDB Online — Sistem Informasi Sekolah</p>
		<p class="mt-1">Portal pendaftaran peserta didik baru untuk sekolah mitra</p>
		<p class="mt-3 text-muted-foreground">© 2026 PPDB Online Terpadu</p>
	</footer>
</div>
