<script lang="ts">
	const features = [
		{
			title: 'Akademik Terintegrasi',
			desc: 'Kelola tahun ajaran, kelas, mapel, jadwal, dan jurnal mengajar dalam satu alur.'
		},
		{
			title: 'PPDB Online & Berkas',
			desc: 'Pendaftaran siswa baru per gelombang, jalur, dan persyaratan dokumen yang fleksibel.'
		},
		{
			title: 'Keuangan & SPP',
			desc: 'Tagihan, pembayaran, dan laporan pemasukan–pengeluaran lebih rapi dan transparan.'
		},
		{
			title: 'Kedisiplinan & Pengumpulan',
			desc: 'Catat pelanggaran/sanksi poin serta kumpulkan berkas guru lewat tautan.'
		},
		{
			title: 'Multi-Sekolah & Peran',
			desc: 'Akses terpisah superadmin, admin sekolah/keuangan, guru, dan siswa.'
		},
		{
			title: 'Akses Mudah',
			desc: 'Berbasis web, ringan, dan dapat diakses dari perangkat apa pun.'
		}
	];
</script>

<svelte:head>
	<title>SISKO — Sistem Informasi Sekolah</title>
	<meta
		name="description"
		content="SISKO (Sistem Informasi Sekolah) — kelola akademik, PPDB, keuangan, dan administrasi sekolah dalam satu platform."
	/>
</svelte:head>

<div class="min-h-screen bg-background text-foreground">
	<!-- Navbar -->
	<header class="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
		<div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
			<a href="/" class="flex items-center gap-2.5">
				<span class="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
					</svg>
				</span>
				<span class="text-sm font-bold tracking-wide">SISKO</span>
			</a>
			<nav class="flex items-center gap-2 sm:gap-3">
				<a href="/ppdb" class="hidden sm:inline-flex px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">PPDB</a>
				<a href="/login" class="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">Masuk</a>
			</nav>
		</div>
	</header>

	<!-- Hero -->
	<section class="relative overflow-hidden border-b border-border/60">
		<div class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
		<div class="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
			<div class="mx-auto max-w-3xl text-center">
				<p class="mb-3 inline-flex items-center rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">Sistem Informasi Sekolah</p>
				<h1 class="text-3xl font-bold tracking-tight sm:text-5xl">
					Kelola sekolah lebih rapi dengan <span class="text-primary">SISKO</span>
				</h1>
				<p class="mt-4 text-base text-muted-foreground sm:text-lg">
					Satu platform untuk akademik, PPDB, keuangan, kedisiplinan, dan administrasi — terstruktur, aman, dan mudah dipakai oleh admin, guru, hingga siswa.
				</p>
				<div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
					<a href="/login" class="inline-flex w-full sm:w-auto items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">Masuk ke Aplikasi</a>
					<a href="/ppdb" class="inline-flex w-full sm:w-auto items-center justify-center rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors">Info & Pendaftaran (PPDB)</a>
				</div>
			</div>
		</div>
	</section>

	<!-- Fitur -->
	<section class="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
		<div class="mx-auto mb-10 max-w-2xl text-center">
			<h2 class="text-2xl font-bold sm:text-3xl">Fitur utama</h2>
			<p class="mt-2 text-sm text-muted-foreground sm:text-base">Modul esensial untuk operasional sekolah harian hingga penerimaan siswa baru.</p>
		</div>
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each features as f}
				<div class="rounded-2xl border border-border bg-card p-5 shadow-sm">
					<h3 class="font-semibold text-foreground">{f.title}</h3>
					<p class="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
				</div>
			{/each}
		</div>
	</section>

	<!-- Kontak -->
	<section class="border-t border-border/60">
		<div class="mx-auto max-w-6xl px-4 py-12 sm:px-6 text-center">
			<h2 class="text-xl font-bold sm:text-2xl">Hubungi Kami</h2>
			<p class="mt-2 text-sm text-muted-foreground">Butuh bantuan atau informasi lebih lanjut? Tim SISKO siap membantu.</p>
			<div class="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
				<a href="https://wa.me/85606143303" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
					<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.86 9.86 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm0 18.09h-.01a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.12.82.83-3.04-.2-.31a8.16 8.16 0 0 1-1.25-4.35c0-4.52 3.68-8.2 8.2-8.2 2.19 0 4.25.85 5.8 2.4a8.15 8.15 0 0 1 2.4 5.8c0 4.52-3.68 8.2-8.17 8.2Zm4.5-6.14c-.25-.13-1.46-.72-1.69-.8-.23-.08-.39-.13-.56.13-.17.25-.64.8-.79.96-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.65-1.23-1.46-1.38-1.71-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.76-1.85-.2-.48-.4-.42-.56-.43-.14-.01-.31-.01-.48-.01-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.44 1.03 2.61c.13.17 1.78 2.71 4.31 3.8.6.26 1.07.42 1.44.54.6.19 1.15.16 1.58.1.48-.07 1.46-.6 1.67-1.17.2-.58.2-1.07.14-1.17-.06-.1-.23-.16-.48-.28Z"/></svg>
					Hubungi via WhatsApp
				</a>
				<a href="mailto:gembongangger.edu@gmail.com" class="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:bg-muted">
					<svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/></svg>
					gembongangger.edu@gmail.com
				</a>
			</div>
		</div>
	</section>

	<!-- CTA -->
	<section class="border-t border-border/60 bg-muted/30">
		<div class="mx-auto max-w-6xl px-4 py-14 sm:px-6 text-center">
			<h2 class="text-xl font-bold sm:text-2xl">Siap menggunakan SISKO?</h2>
			<p class="mt-2 text-sm text-muted-foreground">Masuk dengan akun sekolah Anda atau cek informasi PPDB yang tersedia.</p>
			<div class="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
				<a href="/login" class="inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Masuk</a>
				<a href="/ppdb" class="inline-flex rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:bg-muted">Lihat PPDB</a>
			</div>
		</div>
	</section>

	<footer class="border-t border-border/60">
		<div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:px-6">
			<p>© {new Date().getFullYear()} SISKO — Sistem Informasi Sekolah</p>
			<div class="flex gap-4">
				<a href="/ppdb" class="hover:text-foreground">PPDB</a>
				<a href="/login" class="hover:text-foreground">Masuk</a>
			</div>
		</div>
	</footer>
</div>
