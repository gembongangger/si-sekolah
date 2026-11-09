<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const reg = $derived(data.registrationResult);

	type StatusInfo = {
		label: string;
		badge: string;
		dot: string;
		title: string;
		description: string;
	};

	const statusMap: Record<string, StatusInfo> = {
		submitted: {
			label: 'Pendaftaran Diterima',
			badge: 'bg-slate-100 text-slate-700 border-slate-200',
			dot: 'bg-slate-400',
			title: 'Formulir pendaftaran telah kami terima',
			description:
				'Data pendaftaran Anda sudah masuk ke sistem dan sedang menunggu verifikasi berkas oleh panitia PPDB.'
		},
		verified: {
			label: 'Berkas Terverifikasi',
			badge: 'bg-amber-100 text-amber-800 border-amber-200',
			dot: 'bg-amber-500',
			title: 'Berkas pendaftaran telah diverifikasi',
			description:
				'Berkas Anda dinyatakan lengkap. Silakan menunggu proses seleksi dan pengumuman hasil kelulusan.'
		},
		accepted: {
			label: 'DITERIMA / LULUS',
			badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
			dot: 'bg-emerald-500',
			title: 'Selamat, Anda dinyatakan LULUS seleksi!',
			description:
				'Anda berhak melanjutkan proses daftar ulang. Silakan hubungi panitia PPDB untuk menyelesaikan administrasi pendaftaran siswa baru.'
		},
		rejected: {
			label: 'Tidak Lulus',
			badge: 'bg-red-100 text-red-800 border-red-200',
			dot: 'bg-red-500',
			title: 'Mohon maaf, Anda belum lulus seleksi',
			description:
				'Anda belum lulus pada gelombang ini. Silakan hubungi panitia PPDB untuk informasi lebih lanjut mengenai jalur atau gelombang berikutnya.'
		},
		enrolled: {
			label: 'Siswa Aktif',
			badge: 'bg-blue-100 text-blue-800 border-blue-200',
			dot: 'bg-blue-500',
			title: 'Anda telah resmi terdaftar sebagai siswa',
			description:
				'Proses daftar ulang telah selesai. Akun siswa sudah dibuat oleh panitia. Silakan masuk melalui portal pegawai/siswa menggunakan akun yang diberikan.'
		}
	};

	const statusInfo = $derived(statusMap[reg?.status ?? 'submitted'] ?? statusMap.submitted);

	const timeline = [
		{ key: 'submitted', label: 'Pendaftaran' },
		{ key: 'verified', label: 'Verifikasi' },
		{ key: 'accepted', label: 'Kelulusan' },
		{ key: 'enrolled', label: 'Daftar Ulang' }
	];

	const order: Record<string, number> = {
		submitted: 0,
		verified: 1,
		accepted: 2,
		enrolled: 3
	};

	function stepState(key: string): 'done' | 'current' | 'pending' {
		if (reg?.status === 'rejected') {
			return key === 'submitted' ? 'done' : 'pending';
		}
		const current = order[reg?.status ?? 'submitted'] ?? 0;
		const idx = order[key] ?? 0;
		if (idx < current) return 'done';
		if (idx === current) return 'current';
		return 'pending';
	}

	const trackLabel: Record<string, string> = {
		reguler: 'Reguler',
		prestasi: 'Prestasi',
		zonasi: 'Zonasi',
		afirmasi: 'Afirmasi'
	};

	function formatDate(value: string | number | null | undefined): string {
		if (value === null || value === undefined || value === '') return '-';
		const d = typeof value === 'number' ? new Date(value) : new Date(String(value));
		if (isNaN(d.getTime())) return String(value);
		return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
	}

	function formatRupiah(num: number | null | undefined): string {
		if (!num || num === 0) return 'Gratis (Rp 0)';
		return 'Rp ' + Number(num).toLocaleString('id-ID');
	}

	function printPage() {
		window.print();
	}
</script>

<svelte:head>
	<title>Cek Status Pendaftaran — PPDB Online</title>
</svelte:head>

<div class="min-h-screen bg-slate-50 text-slate-800 pb-16">
	<!-- Top Navigation -->
	<header class="bg-white border-b border-slate-200 sticky top-0 z-40 no-print">
		<div class="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
			<a
				href="/ppdb"
				class="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium"
			>
				<span class="text-lg">←</span> Kembali ke Info PPDB
			</a>
			<a href="/ppdb/daftar" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-sm transition-colors">
				Daftar Sekarang
			</a>
		</div>
	</header>

	<div class="max-w-4xl mx-auto px-4 pt-8 space-y-6">
		<!-- Header -->
		<div class="bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
			<span class="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white mb-3 backdrop-blur-sm">
				🔍 Cek Status Pendaftaran
			</span>
			<h1 class="text-2xl sm:text-3xl font-extrabold">Pantau Status Penerimaan Anda</h1>
			<p class="text-blue-100 text-xs sm:text-sm mt-2 max-w-xl leading-relaxed">
				Masukkan <strong>Nomor Registrasi</strong> atau <strong>NISN</strong> yang Anda gunakan saat mendaftar untuk melihat status dan hasil seleksi.
			</p>
		</div>

		<!-- Banner sukses setelah mendaftar -->
		{#if data.registered && reg}
			<div class="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3 no-print">
				<span class="text-2xl">✅</span>
				<div>
					<p class="font-bold text-sm">Pendaftaran berhasil dikirim!</p>
					<p class="text-xs mt-1">
						Simpan Nomor Registrasi Anda:
						<strong class="font-mono text-base tracking-wide">{reg.registrationNumber}</strong>
					</p>
					<p class="text-xs mt-1 text-emerald-700">
						Gunakan nomor ini untuk memeriksa status kelulusan secara berkala.
					</p>
				</div>
			</div>
		{/if}

		<!-- Form Pencarian -->
		<div class="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm no-print">
			<form method="GET" class="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
				<div>
					<label for="num" class="block text-xs font-semibold text-slate-700 mb-1.5">Nomor Registrasi</label>
					<input
						id="num"
						type="text"
						name="num"
						value={data.numParam}
						placeholder="Contoh: PPDB-2026-1234"
						class="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>
				<div>
					<label for="nisn" class="block text-xs font-semibold text-slate-700 mb-1.5">atau NISN</label>
					<input
						id="nisn"
						type="text"
						name="nisn"
						maxlength="10"
						value={data.nisnParam}
						placeholder="10 digit NISN"
						class="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>
				<button
					type="submit"
					class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors"
				>
					Cek Status
				</button>
			</form>
			<p class="text-[11px] text-slate-400 mt-2">
				Cukup isi salah satu kolom. Nomor registrasi dikirim setelah formulir pendaftaran berhasil disimpan.
			</p>
		</div>

		<!-- Tidak ditemukan -->
		{#if data.searched && !reg}
			<div class="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
				<div class="text-4xl">🔎</div>
				<h2 class="text-lg font-bold text-slate-800">Data pendaftaran tidak ditemukan</h2>
				<p class="text-sm text-slate-500 max-w-md mx-auto">
					Pastikan Nomor Registrasi / NISN yang Anda masukkan sudah benar. Jika masih belum ditemukan, silakan hubungi panitia PPDB madrasah.
				</p>
				<a href="/ppdb/status" class="inline-block px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-xl text-xs hover:bg-slate-200">
					Coba Lagi
				</a>
			</div>
		{/if}

		<!-- Hasil -->
		{#if reg}
			<div class="space-y-5">
				<!-- Kartu Status -->
				<div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
					<div class="p-6 sm:p-7 space-y-4">
						<div class="flex flex-wrap items-start justify-between gap-3">
							<div>
								<p class="text-xs uppercase tracking-wider text-slate-400 font-semibold">Nomor Registrasi</p>
								<p class="font-mono text-lg font-bold text-slate-900">{reg.registrationNumber}</p>
							</div>
							<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border {statusInfo.badge}">
								<span class="w-2 h-2 rounded-full {statusInfo.dot}"></span>
								{statusInfo.label}
							</span>
						</div>

						<div class="border-t border-slate-100 pt-4">
							<h2 class="text-lg font-bold text-slate-900">{statusInfo.title}</h2>
							<p class="text-sm text-slate-600 mt-1 leading-relaxed">{statusInfo.description}</p>
						</div>

						<!-- Timeline -->
						{#if reg.status !== 'rejected'}
							<div class="pt-2">
								<div class="flex items-center">
									{#each timeline as step, i}
										<div class="flex items-center {i < timeline.length - 1 ? 'flex-1' : ''}">
											<div class="flex flex-col items-center">
												<div
													class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2
														{stepState(step.key) === 'done'
														? 'bg-emerald-500 border-emerald-500 text-white'
														: stepState(step.key) === 'current'
															? 'bg-blue-600 border-blue-600 text-white'
															: 'bg-white border-slate-300 text-slate-400'}"
												>
													{stepState(step.key) === 'done' ? '✓' : i + 1}
												</div>
												<span
													class="text-[11px] mt-1.5 font-medium whitespace-nowrap
														{stepState(step.key) === 'pending' ? 'text-slate-400' : 'text-slate-700'}"
												>
													{step.label}
												</span>
											</div>
											{#if i < timeline.length - 1}
												<div
													class="flex-1 h-0.5 mx-1 mb-4 {stepState(timeline[i + 1].key) === 'pending'
														? 'bg-slate-200'
														: 'bg-emerald-400'}"
												></div>
											{/if}
										</div>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				</div>

				<!-- Detail Data -->
				<div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-5">
					<div class="flex items-center justify-between border-b border-slate-100 pb-3">
						<h3 class="font-bold text-slate-900">Data Pendaftaran</h3>
						<button
							type="button"
							onclick={printPage}
							class="no-print px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
						>
							🖨️ Cetak Bukti
						</button>
					</div>

					<dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
						<div>
							<dt class="text-xs text-slate-400">Nama Lengkap</dt>
							<dd class="font-semibold text-slate-800">{reg.fullName}</dd>
						</div>
						<div>
							<dt class="text-xs text-slate-400">NISN</dt>
							<dd class="font-semibold text-slate-800">{reg.nisn || '-'}</dd>
						</div>
						<div>
							<dt class="text-xs text-slate-400">Jenis Kelamin</dt>
							<dd class="font-semibold text-slate-800">{reg.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</dd>
						</div>
						<div>
							<dt class="text-xs text-slate-400">Tempat, Tanggal Lahir</dt>
							<dd class="font-semibold text-slate-800">
								{reg.birthPlace || '-'}, {formatDate(reg.birthDate)}
							</dd>
						</div>
						<div>
							<dt class="text-xs text-slate-400">Asal Sekolah</dt>
							<dd class="font-semibold text-slate-800">{reg.previousSchool}</dd>
						</div>
						<div>
							<dt class="text-xs text-slate-400">Tahun Lulus</dt>
							<dd class="font-semibold text-slate-800">{reg.graduationYear ?? '-'}</dd>
						</div>
						<div>
							<dt class="text-xs text-slate-400">Jalur Pendaftaran</dt>
							<dd class="font-semibold text-slate-800">{trackLabel[reg.track] ?? reg.track}</dd>
						</div>
						<div>
							<dt class="text-xs text-slate-400">Peminatan / Jurusan</dt>
							<dd class="font-semibold text-slate-800">{reg.majorChoice}</dd>
						</div>
						<div class="sm:col-span-2">
							<dt class="text-xs text-slate-400">Alamat</dt>
							<dd class="font-semibold text-slate-800">{reg.address}</dd>
						</div>
						<div>
							<dt class="text-xs text-slate-400">Orang Tua / Wali</dt>
							<dd class="font-semibold text-slate-800">{reg.parentName}</dd>
						</div>
						<div>
							<dt class="text-xs text-slate-400">No. HP Orang Tua</dt>
							<dd class="font-semibold text-slate-800">{reg.parentPhone}</dd>
						</div>
					</dl>

					<div class="border-t border-slate-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
						<div class="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
							<p class="text-xs text-slate-400">Sekolah / Madrasah</p>
							<p class="font-bold text-slate-800 mt-0.5">{reg.schoolName}</p>
							<p class="text-xs text-slate-500">{reg.schoolAddress ?? ''}</p>
							<p class="text-xs text-slate-500 mt-1">
								{reg.schoolPhone ? '☎ ' + reg.schoolPhone : ''}
								{reg.schoolEmail ? ' · ' + reg.schoolEmail : ''}
							</p>
						</div>
						<div class="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
							<p class="text-xs text-slate-400">Gelombang / Tahun Ajaran</p>
							<p class="font-bold text-slate-800 mt-0.5">{reg.batchName}</p>
							<p class="text-xs text-slate-500">
								TA {reg.academicYearName} ({reg.academicYearSemester})
							</p>
							<p class="text-xs text-slate-500 mt-1">Biaya Form: {formatRupiah(reg.batchFee)}</p>
						</div>
					</div>

					{#if reg.selectionScore !== null || reg.notes}
						<div class="border-t border-slate-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
							{#if reg.selectionScore !== null}
								<div class="bg-blue-50 rounded-xl p-3.5 border border-blue-100">
									<p class="text-xs text-blue-500 font-semibold">Nilai Seleksi</p>
									<p class="text-2xl font-extrabold text-blue-700 mt-0.5">{reg.selectionScore}</p>
								</div>
							{/if}
							{#if reg.notes}
								<div class="bg-amber-50 rounded-xl p-3.5 border border-amber-100">
									<p class="text-xs text-amber-600 font-semibold">Catatan Panitia</p>
									<p class="text-slate-700 mt-0.5">{reg.notes}</p>
								</div>
							{/if}
						</div>
					{/if}

					{#if reg.status === 'enrolled'}
						<div class="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">
							<p class="font-bold">Anda sudah terdaftar sebagai siswa aktif.</p>
							<p class="mt-1 text-xs">
								Kelas: <strong>{reg.enrolledClass ?? 'Belum ditentukan'}</strong>. Silakan masuk melalui
								<a href="/login" class="underline font-semibold">portal login</a>.
							</p>
						</div>
					{/if}

					<p class="text-[11px] text-slate-400 text-center pt-2">
						Didukung PPDB Online — Sistem Informasi Sekolah · Dicetak pada {formatDate(Date.now())}
					</p>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	@media print {
		.no-print {
			display: none !important;
		}
	}
</style>
