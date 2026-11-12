<script lang="ts">
	import { untrack } from 'svelte';
	import type { PageData, ActionData } from './$types';
	import { DEFAULT_PPDB_TRACKS } from '$lib/validation/ppdb';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Nilai awal diambil sekali dari URL / nilai form yang dikirim ulang
	const initial = untrack(() => {
		const initialBatchId = form?.values?.batch_id
			? String(form.values.batch_id)
			: data.preselectedBatchId
				? String(data.preselectedBatchId)
				: '';
		const initialBatch = data.activeBatches.find((b) => String(b.id) === initialBatchId);

		const preselectedSchool =
			data.preselectedSchoolId &&
			data.activeBatches.some((b) => b.schoolId === data.preselectedSchoolId)
				? data.preselectedSchoolId
				: null;

		const firstSchool = data.activeSchools.find((s) =>
			data.activeBatches.some((b) => b.schoolId === s.id)
		);

		const selectedSchoolId = form?.values?.school_id
			? String(form.values.school_id)
			: (initialBatch?.schoolId ?? preselectedSchool ?? firstSchool?.id ?? '');

		const batchesForSchool = data.activeBatches.filter(
			(b) => String(b.schoolId) === String(selectedSchoolId)
		);

		const selectedBatchId =
			initialBatch && String(initialBatch.schoolId) === String(selectedSchoolId)
				? initialBatch.id
				: (batchesForSchool[0]?.id ?? '');

		return { selectedSchoolId, selectedBatchId };
	});

	// Sekolah yang memiliki gelombang aktif
	const schoolsWithBatches = $derived(
		data.activeSchools.filter((s) => data.activeBatches.some((b) => b.schoolId === s.id))
	);

	// Pilih sekolah lebih dulu; batch diturunkan dari sekolah terpilih
	let selectedSchoolId = $state<number | string>(initial.selectedSchoolId);

	const schoolBatches = $derived(
		data.activeBatches.filter((b) => String(b.schoolId) === String(selectedSchoolId))
	);

	let selectedBatchId = $state<number | string>(initial.selectedBatchId);

	// Cari batch terpilih untuk mendapatkan info biaya & sekolah
	const currentBatch = $derived(
		data.activeBatches.find((b) => String(b.id) === String(selectedBatchId))
	);

	// Saat sekolah berganti, otomatis pilih gelombang pertama milik sekolah tersebut
	$effect(() => {
		if (!schoolBatches.some((b) => String(b.id) === String(selectedBatchId))) {
			selectedBatchId = schoolBatches[0]?.id ?? '';
		}
	});

	// Jalur pendaftaran sesuai konfigurasi sekolah terpilih (fallback ke default)
	const schoolTracks = $derived.by(() => {
		const list = data.activeTracks.filter((t) => String(t.schoolId) === String(selectedSchoolId));
		if (list.length > 0) return list;
		return DEFAULT_PPDB_TRACKS.map((t, i) => ({
			id: -(i + 1),
			schoolId: 0,
			code: t.code,
			name: t.name,
			description: null as string | null
		}));
	});

	let selectedTrack = $state<string>(form?.values?.track ?? '');

	$effect(() => {
		const codes = schoolTracks.map((t) => t.code);
		if (!codes.includes(selectedTrack)) {
			selectedTrack = codes[0] ?? '';
		}
	});

	function formatRupiah(num: number): string {
		if (!num || num === 0) return 'Gratis (Rp 0)';
		return 'Rp ' + Number(num).toLocaleString('id-ID');
	}

	// ── Foto Pribadi (Kamera) ────────────────────────────────
	let photoBlobUrl: string | null = $state(null);
	let photoFile: File | null = $state(null);
	let showingCamera = $state(false);
	let videoEl: HTMLVideoElement | null = $state(null);
	let canvasRef: HTMLCanvasElement | null = $state(null);
	let mediaStream: MediaStream | null = $state(null);
	let cameraError = $state('');
	let loadingCam = $state(false);

	// Hidden <input type="file"> — di-sync saat ambil foto agar ikut ter-kirim bersama FormData
	let fileInputEl: HTMLInputElement | null = $state(null);

	function onFileInputChange() {
		const f = fileInputEl?.files?.[0];
		if (!f) return;
		photoFile = f;
		photoBlobUrl = URL.createObjectURL(f);
	}

	async function openCamera() {
		showingCamera = true;
		loadingCam = true;
		cameraError = '';
		await sleep(100);
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
			});
			mediaStream = stream;
			if (videoEl) videoEl.srcObject = stream;
		} catch {
			cameraError = 'Akses kamera ditolak. Izinkan akses kamera di pengaturan browser.';
		} finally {
			loadingCam = false;
		}
	}

	function closeCamera() {
		stopCamera();
		showingCamera = false;
	}

	function stopCamera() {
		if (mediaStream) {
			mediaStream.getTracks().forEach((t) => t.stop());
			mediaStream = null;
		}
	}

	function capturePhoto() {
		if (!videoEl || !canvasRef) return;
		canvasRef.width = videoEl.videoWidth;
		canvasRef.height = videoEl.videoHeight;
		canvasRef.getContext('2d')!.drawImage(videoEl, 0, 0);
		canvasRef.toBlob((blob) => {
			if (!blob) return;
			if (photoBlobUrl) URL.revokeObjectURL(photoBlobUrl);
			photoBlobUrl = URL.createObjectURL(blob);
			const name = `foto-${Date.now()}.jpg`;
			photoFile = new File([blob], name, { type: 'image/jpeg' });
			showingCamera = false;
			stopCamera();
		}, 'image/jpeg', 0.85);
		if (fileInputEl && photoFile) {
			const dt = new DataTransfer();
			dt.items.add(photoFile);
			fileInputEl.files = dt.files;
		}
	}

	function removePhoto() {
		if (photoBlobUrl) URL.revokeObjectURL(photoBlobUrl);
		photoBlobUrl = null;
		photoFile = null;
		if (fileInputEl) fileInputEl.value = '';
	}

	// ── Dokumen Upload ────────────────────────────────────────
	let uploadedDocs = $state<Record<string, File | null>>({});

	function onDocFileChange(key: string, e: Event) {
		const input = e.target as HTMLInputElement;
		const f = input.files?.[0] ?? null;
		uploadedDocs = { ...uploadedDocs, [key]: f };
	}

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => setTimeout(r, ms));
	}

	// ── Wizard bertahap ────────────────────────────────────────
	const TOTAL_STEPS = 5;
	let step = $state(1);
	let formEl: HTMLFormElement | null = $state(null);

	const stepMeta = [
		{ n: 1, label: 'Gelombang' },
		{ n: 2, label: 'Pribadi' },
		{ n: 3, label: 'Kontak' },
		{ n: 4, label: 'Sekolah' },
		{ n: 5, label: 'Orang Tua' }
	];

	function stepFields(n: number): Array<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> {
		const container = formEl?.querySelector(`[data-step="${n}"]`);
		if (!container) return [];
		const nodes = Array.from(container.querySelectorAll('input, select, textarea'));
		return nodes.filter(
			(el) =>
				el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement
		) as Array<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;
	}

	function firstInvalidInStep(n: number): (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) | null {
		for (const el of stepFields(n)) {
			if (!el.checkValidity()) return el;
		}
		return null;
	}

	function scrollTop() {
		if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function goNext() {
		const invalid = firstInvalidInStep(step);
		if (invalid) {
			invalid.reportValidity();
			return;
		}
		step = Math.min(step + 1, TOTAL_STEPS);
		scrollTop();
	}

	function goPrev() {
		step = Math.max(step - 1, 1);
		scrollTop();
	}

	function goToStep(n: number) {
		// Hanya boleh mundur ke langkah yang sudah dilalui
		if (n < step) {
			step = n;
			scrollTop();
		}
	}

	function handleSubmit(event: SubmitEvent) {
		// Validasi seluruh langkah sebelum benar-benar mengirim
		for (let n = 1; n <= TOTAL_STEPS; n++) {
			const invalid = firstInvalidInStep(n);
			if (invalid) {
				event.preventDefault();
				step = n;
				scrollTop();
				setTimeout(() => invalid.reportValidity(), 120);
				return;
			}
		}
	}
</script>

<svelte:head>
	<title>{data.lockedSchool ? `Pendaftaran ${data.lockedSchool.name}` : 'Formulir Pendaftaran Online'} — PPDB Online</title>
</svelte:head>

<div class="min-h-screen bg-background text-foreground pb-16">
	<!-- Top Navigation -->
	<header class="bg-card border-b border-border sticky top-0 z-40">
		<div class="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
			<a href="/ppdb" class="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
				<span class="text-lg">←</span> <span class="hidden xs:inline sm:inline">Kembali ke Info PPDB</span><span class="sm:hidden">Info PPDB</span>
			</a>
			<a href="/ppdb/status" class="text-primary-foreground hover:text-primary-foreground font-medium text-sm">
				🔍 Cek Status
			</a>
		</div>
	</header>

	<!-- Header Content -->
	<div class="max-w-4xl mx-auto px-3 sm:px-4 pt-5 sm:pt-8 pb-3">
		<div class="bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-2xl p-5 sm:p-8 shadow-sm">
			<div class="flex items-start gap-4">
				{#if data.lockedSchool?.logo}
					<img src={data.lockedSchool.logo} alt={data.lockedSchool.name} class="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white/90 object-contain p-1 shrink-0" />
				{/if}
				<div>
					<span class="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-card/20 text-white mb-2 sm:mb-3 backdrop-blur-sm">
						📝 Formulir Resmi Calon Siswa
					</span>
					{#if data.lockedSchool}
						<h1 class="text-xl sm:text-3xl font-extrabold leading-tight">{data.lockedSchool.name}</h1>
						<p class="text-blue-100 text-xs sm:text-sm mt-1.5 sm:mt-2 max-w-xl leading-relaxed">
							Pendaftaran Peserta Didik Baru{data.lockedSchool.npsn ? ` · NPSN ${data.lockedSchool.npsn}` : ''}
						</p>
					{:else}
						<h1 class="text-xl sm:text-3xl font-extrabold leading-tight">Formulir Pendaftaran Peserta Didik Baru</h1>
						<p class="text-blue-100 text-xs sm:text-sm mt-1.5 sm:mt-2 max-w-xl leading-relaxed">
							Isi data bertahap dengan teliti sesuai dokumen resmi (Kartu Keluarga, Akta Kelahiran, Rapor).
						</p>
					{/if}
				</div>
			</div>
		</div>

		<!-- Error Alert -->
		{#if form?.error}
			<div class="mt-4 p-4 rounded-xl bg-destructive/10 border border-border text-destructive flex items-start gap-3">
				<span class="text-lg">⚠️</span>
				<div>
					<p class="font-bold text-sm">Pendaftaran Belum Berhasil</p>
					<p class="text-xs mt-0.5">{form.error}</p>
				</div>
			</div>
		{/if}

		{#if data.activeBatches.length === 0}
			<div class="mt-8 p-8 bg-card rounded-2xl border border-border text-center space-y-3">
				<div class="text-4xl">⏳</div>
				<h2 class="text-lg font-bold text-foreground">Pendaftaran Belum Dibuka</h2>
				<p class="text-sm text-muted-foreground max-w-md mx-auto">
					Saat ini belum ada gelombang pendaftaran yang aktif. Silakan hubungi pihak madrasah/sekolah atau pantau informasi secara berkala.
				</p>
				<a href="/ppdb" class="inline-block px-4 py-2 bg-muted text-foreground font-medium rounded-xl text-xs hover:bg-slate-200">
					Kembali ke Beranda
				</a>
			</div>
		{:else}
			<form
				method="POST"
				enctype="multipart/form-data"
				novalidate
				bind:this={formEl}
				onsubmit={handleSubmit}
				class="mt-4 sm:mt-6 space-y-4 sm:space-y-6"
			>
				<!-- Progress Indicator -->
				<div class="bg-card rounded-2xl border border-border shadow-sm p-4 sm:p-5">
					<div class="flex items-center justify-between mb-3">
						<p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Langkah {step} dari {TOTAL_STEPS}</p>
						<p class="text-xs font-bold text-primary-foreground">{stepMeta[step - 1].label}</p>
					</div>
					<div class="flex items-center">
						{#each stepMeta as s, i (s.n)}
							<button
								type="button"
								onclick={() => goToStep(s.n)}
								disabled={s.n >= step}
								class="flex flex-col items-center gap-1.5 disabled:cursor-default"
								class:flex-1={i < stepMeta.length}
							>
								<span
									class="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold border-2 transition-colors
									{s.n < step
										? 'bg-success/100 border-emerald-500 text-success-foreground'
										: s.n === step
											? 'bg-primary border-primary text-primary-foreground'
											: 'bg-card border-slate-300 text-muted-foreground'}"
								>
									{#if s.n < step}✓{:else}{s.n}{/if}
								</span>
								<span
									class="text-[10px] sm:text-xs font-medium {s.n === step ? 'text-primary-foreground' : 'text-muted-foreground'}"
								>{s.label}</span>
							</button>
							{#if i < stepMeta.length - 1}
								<div
									class="h-0.5 flex-1 mx-0.5 sm:mx-1 -mt-5 sm:-mt-[22px] transition-colors
									{s.n < step ? 'bg-success/100' : 'bg-slate-200'}"
								></div>
							{/if}
						{/each}
					</div>
				</div>

				<!-- STEP 1: Pilihan Gelombang & Sekolah -->
				<div data-step="1" class:hidden={step !== 1}>
					<div class="bg-card p-4 sm:p-6 rounded-2xl border border-border shadow-sm space-y-4">
						<div class="border-b border-border pb-3">
							<h2 class="text-base font-bold text-foreground flex items-center gap-2">
								<span class="w-6 h-6 rounded-full bg-primary/10 text-primary-foreground text-xs flex items-center justify-center font-bold">1</span>
								Pilihan Gelombang & Sekolah
							</h2>
							<p class="text-xs text-muted-foreground mt-0.5">Pilih sekolah tujuan terlebih dahulu, lalu gelombang pendaftarannya.</p>
						</div>

						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div>
								<label for="school_id" class="block text-xs font-semibold text-foreground mb-1.5">Sekolah Tujuan <span class="text-destructive">*</span></label>
								{#if data.lockedSchool}
									<input type="hidden" name="school_id" value={data.lockedSchool.id} />
									<div class="w-full px-3 py-3 sm:py-2.5 bg-muted/50 border border-border rounded-xl text-sm font-semibold text-foreground">
										{data.lockedSchool.name}{data.lockedSchool.npsn ? ` (${data.lockedSchool.npsn})` : ''}
									</div>
								{:else}
									<select
										id="school_id"
										name="school_id"
										bind:value={selectedSchoolId}
										required
										class="w-full px-3 py-3 sm:py-2.5 bg-background border border-border rounded-xl text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring"
									>
										{#each schoolsWithBatches as s}
											<option value={s.id}>
												{s.name}{s.npsn ? ` (${s.npsn})` : ''}
											</option>
										{/each}
									</select>
								{/if}
							</div>

							<div>
								<label for="batch_id" class="block text-xs font-semibold text-foreground mb-1.5">Gelombang Pendaftaran <span class="text-destructive">*</span></label>
								<select
									id="batch_id"
									name="batch_id"
									bind:value={selectedBatchId}
									required
									class="w-full px-3 py-3 sm:py-2.5 bg-background border border-border rounded-xl text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring"
								>
									{#each schoolBatches as b}
										<option value={b.id}>
											{b.name} — {b.academicYearName}
										</option>
									{/each}
								</select>
							</div>
						</div>

						{#if currentBatch}
							<div class="bg-primary/10/60 border border-blue-100 rounded-xl p-3 flex flex-col justify-center text-xs space-y-1">
								<p class="text-blue-900 font-semibold">Informasi Gelombang:</p>
								<p class="text-muted-foreground">Sekolah: <strong class="text-foreground">{currentBatch.schoolName}</strong></p>
								<p class="text-muted-foreground">Periode: {currentBatch.startDate} s/d {currentBatch.endDate}</p>
								<p class="text-muted-foreground">Biaya Form: <span class="font-semibold text-success-foreground">{formatRupiah(currentBatch.fee)}</span></p>
							</div>
						{/if}
					</div>
				</div>

				<!-- STEP 2: Data Pribadi -->
				<div data-step="2" class:hidden={step !== 2}>
					<div class="bg-card p-4 sm:p-6 rounded-2xl border border-border shadow-sm space-y-4">
						<div class="border-b border-border pb-3">
							<h2 class="text-base font-bold text-foreground flex items-center gap-2">
								<span class="w-6 h-6 rounded-full bg-primary/10 text-primary-foreground text-xs flex items-center justify-center font-bold">2</span>
								Data Pribadi Calon Peserta Didik
							</h2>
							<p class="text-xs text-muted-foreground mt-0.5">Identitas calon siswa sesuai dokumen resmi.</p>
						</div>

						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div class="sm:col-span-2">
								<label for="full_name" class="block text-xs font-semibold text-foreground mb-1.5">Nama Lengkap <span class="text-destructive">*</span></label>
								<input
									id="full_name"
									type="text"
									name="full_name"
									required
									value={form?.values?.full_name ?? ''}
									placeholder="Contoh: Muhammad Rizky Pratama"
									class="w-full px-3 py-3 sm:py-2.5 bg-background border border-border rounded-xl text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring"
								/>
							</div>

							<div>
								<label for="nisn" class="block text-xs font-semibold text-foreground mb-1.5">NISN (10 Digit Angka)</label>
								<input
									id="nisn"
									type="text"
									name="nisn"
									maxlength="10"
									inputmode="numeric"
									value={form?.values?.nisn ?? ''}
									placeholder="Contoh: 0071234567"
									class="w-full px-3 py-3 sm:py-2.5 bg-background border border-border rounded-xl text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring"
								/>
							</div>

							<div>
								<label for="nik" class="block text-xs font-semibold text-foreground mb-1.5">NIK / No. KTP (16 Digit)</label>
								<input
									id="nik"
									type="text"
									name="nik"
									maxlength="16"
									inputmode="numeric"
									value={form?.values?.nik ?? ''}
									placeholder="Nomor Induk Kependudukan di KK"
									class="w-full px-3 py-3 sm:py-2.5 bg-background border border-border rounded-xl text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring"
								/>
							</div>

							<div>
								<label for="gender" class="block text-xs font-semibold text-foreground mb-1.5">Jenis Kelamin <span class="text-destructive">*</span></label>
								<select
									id="gender"
									name="gender"
									required
									value={form?.values?.gender ?? 'L'}
									class="w-full px-3 py-3 sm:py-2.5 bg-background border border-border rounded-xl text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring"
								>
									<option value="L">Laki-laki</option>
									<option value="P">Perempuan</option>
								</select>
							</div>

							<div>
								<label for="religion" class="block text-xs font-semibold text-foreground mb-1.5">Agama</label>
								<select
									id="religion"
									name="religion"
									value={form?.values?.religion ?? 'Islam'}
									class="w-full px-3 py-3 sm:py-2.5 bg-background border border-border rounded-xl text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring"
								>
									<option value="Islam">Islam</option>
									<option value="Kristen">Kristen</option>
									<option value="Katolik">Katolik</option>
									<option value="Hindu">Hindu</option>
									<option value="Buddha">Buddha</option>
									<option value="Konghucu">Konghucu</option>
								</select>
							</div>

							<div>
								<label for="birth_place" class="block text-xs font-semibold text-foreground mb-1.5">Tempat Lahir</label>
								<input
									id="birth_place"
									type="text"
									name="birth_place"
									value={form?.values?.birth_place ?? ''}
									placeholder="Kota/Kabupaten kelahiran"
									class="w-full px-3 py-3 sm:py-2.5 bg-background border border-border rounded-xl text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring"
								/>
							</div>

						<div>
							<label for="birth_date" class="block text-xs font-semibold text-foreground mb-1.5">Tanggal Lahir <span class="text-destructive">*</span></label>
							<input
								id="birth_date"
								type="date"
								name="birth_date"
								required
								value={form?.values?.birth_date ?? '2010-01-01'}
								class="w-full px-3 py-3 sm:py-2.5 bg-background border border-border rounded-xl text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring"
							/>
						</div>
					</div>

					<!-- Foto Pribadi (Kamera) -->
					<div class="border-t border-border pt-4">
						<input
							type="file"
							name="photo"
							id="photo_input"
							accept="image/jpeg,image/png,image/webp"
							bind:this={fileInputEl}
							onchange={onFileInputChange}
							class="hidden"
						/>

						<div class="flex items-center gap-4 flex-wrap">
							<button
								type="button"
								onclick={openCamera}
								class="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all active:scale-[0.98]"
							>
								<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.127 2.127 0 0 1 9 5h6a2.127 2.127 0 0 1 2.172 1.175M9 5h-.414A4.598 4.598 0 0 0 4.2 8.586V14m15.8 0V8.586A4.598 4.598 0 0 0 18.414 5H18"/>
									<circle cx="12" cy="10.5" r="3.5"/>
									<rect x="4.2" y="6.5" width="15.6" height="9" rx="2"/>
								</svg>
								Foto via Kamera
							</button>

							<button
								type="button"
								onclick={() => fileInputEl?.click()}
								class="inline-flex items-center gap-2 px-5 py-3 bg-muted hover:bg-slate-200 text-foreground text-xs sm:text-sm font-semibold rounded-xl transition-colors"
							>
								<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M4.25 15.75A2.25 2.25 0 0 1 6.5 13.5h11a2.25 2.25 0 0 1 2.25 2.25M4.25 15.75V18a.75.75 0 0 0 .75.75h14.1a.75.75 0 0 0 .75-.75v-2.25M4.25 15.75l1.25-4.5h13l1.25 4.5M12 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/>
								</svg>
								Pilih dari Galeri
							</button>

							{#if photoFile}
								<img
									src={photoBlobUrl ?? undefined}
									alt="Foto preview"
									class="w-16 h-16 object-cover rounded-lg border-2 border-border shadow-sm"
								/>
							{/if}
						</div>

						{#if photoFile}
							<p class="text-[11px] text-success-foreground mt-2 flex items-center gap-1">
								<span>✓</span> Foto sudah siap ({Math.round((photoFile?.size ?? 0) / 1024)} KB)
							</p>
						{:else}
							<p class="text-[11px] text-muted-foreground mt-2">Foto wajah pas, latar polos. Maks 10 MB — JPG, PNG, atau WEBP.</p>
						{/if}

						<!-- Kamera Modal -->
						{#if showingCamera}
							<div class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" role="dialog" aria-modal="true">
								<div class="bg-card rounded-2xl overflow-hidden w-full max-w-sm shadow-2xl">
									<div class="relative w-full">
										<video
											bind:this={videoEl}
											autoplay
											muted
											playsinline
											class="w-full aspect-[4/3] bg-slate-900 rounded-t-2xl"
										></video>
										<canvas class="hidden" bind:this={canvasRef}></canvas>
										{#if loadingCam}
											<div class="absolute inset-0 flex items-center justify-center bg-slate-900/60 rounded-t-2xl">
												<div class="text-white text-sm flex flex-col items-center gap-2">
													<div class="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
													Mengaktifkan kamera…
												</div>
											</div>
										{/if}
									</div>
									<div class="p-4 space-y-3">
										{#if cameraError}
											<p class="text-xs text-destructive">{cameraError}</p>
										{/if}
										<div class="flex items-center gap-3">
											<button
												type="button"
												onclick={capturePhoto}
												disabled={!mediaStream}
												class="flex-1 py-3 bg-success hover:bg-success/90 disabled:bg-slate-300 text-success-foreground text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
											>
												<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
													<path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.127 2.127 0 0 1 9 5h6a2.127 2.127 0 0 1 2.172 1.175M18 12.33V18a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-5.67M12 9.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"/>
												</svg>
												Ambil Foto
											</button>
											<button
												type="button"
												onclick={closeCamera}
												class="px-4 py-3 bg-muted hover:bg-slate-200 text-muted-foreground text-sm font-medium rounded-xl transition-colors"
											>
												Batal
											</button>
										</div>
									</div>
								</div>
							</div>
						{/if}
					</div>

					<!-- Dokumen Persyaratan (dinamis sesuai konfigurasi gelombang) -->
					{#if currentBatch?.documentRequirements?.fields?.length}
						<div class="border-t border-border pt-4 space-y-3">
							<h3 class="text-sm font-bold text-foreground flex items-center gap-2">
								<span>📎</span> Dokumen Persyaratan
							</h3>
							<p class="text-xs text-muted-foreground">Upload dokumen sesuai format. Maks 10 MB per file.</p>
							{#each currentBatch.documentRequirements.fields as doc (doc.key)}
								<div class="space-y-1.5">
									<label for={`doc_${doc.key}`} class="block text-xs font-semibold text-foreground">
										{doc.label}
										{#if doc.required}<span class="text-destructive">*</span>{/if}
									</label>
									<input
										id={`doc_${doc.key}`}
										type="file"
										name={`doc_${doc.key}`}
										accept={(doc.formats || ['jpg', 'png', 'pdf']).map((f) => (f === 'pdf' ? '.pdf,application/pdf' : `.${f},image/${f}`)).join(',')}
										required={doc.required}
										onchange={(e) => onDocFileChange(doc.key, e)}
										class="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary-foreground file:font-semibold file:text-xs hover:file:bg-primary/20"
									/>
									{#if uploadedDocs[doc.key]}
										<p class="text-[11px] text-success-foreground">✓ {uploadedDocs[doc.key]?.name}</p>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>

				<!-- STEP 3: Alamat & Kontak -->
				<div data-step="3" class:hidden={step !== 3}>
					<div class="bg-card p-4 sm:p-6 rounded-2xl border border-border shadow-sm space-y-4">
						<div class="border-b border-border pb-3">
							<h2 class="text-base font-bold text-foreground flex items-center gap-2">
								<span class="w-6 h-6 rounded-full bg-primary/10 text-primary-foreground text-xs flex items-center justify-center font-bold">3</span>
								Alamat & Kontak Calon Siswa
							</h2>
							<p class="text-xs text-muted-foreground mt-0.5">Alamat domisili saat ini dan kontak yang aktif dihubungi.</p>
						</div>

						<div class="space-y-4">
							<div>
								<label for="address" class="block text-xs font-semibold text-foreground mb-1.5">Alamat Lengkap (Jalan, RT/RW, Dusun, Desa/Kelurahan, Kecamatan) <span class="text-destructive">*</span></label>
								<textarea
									id="address"
									name="address"
									rows="3"
									required
									placeholder="Contoh: Jl. Diponegoro No. 45, RT 02 / RW 05, Kaliwates, Jember"
									class="w-full px-3 py-3 sm:py-2.5 bg-background border border-border rounded-xl text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring"
								>{form?.values?.address ?? ''}</textarea>
							</div>

							<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<label for="phone" class="block text-xs font-semibold text-foreground mb-1.5">No. HP / WhatsApp Siswa</label>
									<input
										id="phone"
										type="tel"
										name="phone"
										inputmode="tel"
										value={form?.values?.phone ?? ''}
										placeholder="Contoh: 081234567890"
										class="w-full px-3 py-3 sm:py-2.5 bg-background border border-border rounded-xl text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring"
									/>
								</div>

								<div>
									<label for="email" class="block text-xs font-semibold text-foreground mb-1.5">Email Siswa (Aktif)</label>
									<input
										id="email"
										type="email"
										name="email"
										inputmode="email"
										value={form?.values?.email ?? ''}
										placeholder="nama@gmail.com"
										class="w-full px-3 py-3 sm:py-2.5 bg-background border border-border rounded-xl text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring"
									/>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- STEP 4: Asal Sekolah, Jalur & Pilihan Jurusan -->
				<div data-step="4" class:hidden={step !== 4}>
					<div class="bg-card p-4 sm:p-6 rounded-2xl border border-border shadow-sm space-y-4">
						<div class="border-b border-border pb-3">
							<h2 class="text-base font-bold text-foreground flex items-center gap-2">
								<span class="w-6 h-6 rounded-full bg-primary/10 text-primary-foreground text-xs flex items-center justify-center font-bold">4</span>
								Asal Sekolah, Jalur & Peminatan
							</h2>
							<p class="text-xs text-muted-foreground mt-0.5">Riwayat pendidikan sebelumnya dan jurusan yang diinginkan.</p>
						</div>

						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div>
								<label for="previous_school" class="block text-xs font-semibold text-foreground mb-1.5">Nama Sekolah Asal <span class="text-destructive">*</span></label>
								<input
									id="previous_school"
									type="text"
									name="previous_school"
									required
									value={form?.values?.previous_school ?? ''}
									placeholder="Contoh: SDN 1 Jember / MTsN 1 Jember / SMP 2 Malang"
									class="w-full px-3 py-3 sm:py-2.5 bg-background border border-border rounded-xl text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring"
								/>
							</div>

							<div>
								<label for="graduation_year" class="block text-xs font-semibold text-foreground mb-1.5">Tahun Lulus Sekolah Asal</label>
								<input
									id="graduation_year"
									type="number"
									name="graduation_year"
									inputmode="numeric"
									min="2020"
									max="2030"
									value={form?.values?.graduation_year ?? new Date().getFullYear()}
									class="w-full px-3 py-3 sm:py-2.5 bg-background border border-border rounded-xl text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring"
								/>
							</div>

							<div>
								<label for="track" class="block text-xs font-semibold text-foreground mb-1.5">Jalur Pendaftaran <span class="text-destructive">*</span></label>
								<select
									id="track"
									name="track"
									bind:value={selectedTrack}
									required
									class="w-full px-3 py-3 sm:py-2.5 bg-background border border-border rounded-xl text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring"
								>
									{#each schoolTracks as t (t.code)}
										<option value={t.code}>{t.name}</option>
									{/each}
								</select>
							</div>

							<div>
								<label for="major_choice" class="block text-xs font-semibold text-foreground mb-1.5">Pilihan Jurusan / Peminatan <span class="text-destructive">*</span></label>
								<select
									id="major_choice"
									name="major_choice"
									required
									value={form?.values?.major_choice ?? 'MIPA'}
									class="w-full px-3 py-3 sm:py-2.5 bg-background border border-border rounded-xl text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring"
								>
									<option value="MIPA">MIPA (Matematika & Ilmu Pengetahuan Alam)</option>
									<option value="IPS">IPS (Ilmu Pengetahuan Sosial)</option>
									<option value="Keagamaan">Keagamaan (Ilmu-ilmu Agama Islam)</option>
									<option value="Bahasa">Bahasa & Budaya</option>
								</select>
							</div>
						</div>
					</div>
				</div>

				<!-- STEP 5: Data Orang Tua / Wali + Pernyataan -->
				<div data-step="5" class:hidden={step !== 5}>
					<div class="bg-card p-4 sm:p-6 rounded-2xl border border-border shadow-sm space-y-4">
						<div class="border-b border-border pb-3">
							<h2 class="text-base font-bold text-foreground flex items-center gap-2">
								<span class="w-6 h-6 rounded-full bg-primary/10 text-primary-foreground text-xs flex items-center justify-center font-bold">5</span>
								Data Orang Tua / Wali
							</h2>
							<p class="text-xs text-muted-foreground mt-0.5">Identitas penanggung jawab calon peserta didik.</p>
						</div>

						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div class="sm:col-span-2">
								<label for="parent_name" class="block text-xs font-semibold text-foreground mb-1.5">Nama Ayah / Ibu / Wali <span class="text-destructive">*</span></label>
								<input
									id="parent_name"
									type="text"
									name="parent_name"
									required
									value={form?.values?.parent_name ?? ''}
									placeholder="Contoh: Bambang Sutejo"
									class="w-full px-3 py-3 sm:py-2.5 bg-background border border-border rounded-xl text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring"
								/>
							</div>

							<div>
								<label for="parent_phone" class="block text-xs font-semibold text-foreground mb-1.5">No. HP / WA Orang Tua <span class="text-destructive">*</span></label>
								<input
									id="parent_phone"
									type="tel"
									name="parent_phone"
									inputmode="tel"
									required
									value={form?.values?.parent_phone ?? ''}
									placeholder="Contoh: 085233445566"
									class="w-full px-3 py-3 sm:py-2.5 bg-background border border-border rounded-xl text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring"
								/>
							</div>

							<div>
								<label for="parent_job" class="block text-xs font-semibold text-foreground mb-1.5">Pekerjaan Orang Tua</label>
								<input
									id="parent_job"
									type="text"
									name="parent_job"
									value={form?.values?.parent_job ?? ''}
									placeholder="PNS / Wiraswasta / Petani / dll"
									class="w-full px-3 py-3 sm:py-2.5 bg-background border border-border rounded-xl text-sm focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring"
								/>
							</div>
						</div>

						<label class="flex items-start gap-3 cursor-pointer text-xs text-foreground leading-relaxed bg-primary/10/50 p-4 rounded-xl border border-border">
							<input type="checkbox" required class="w-4 h-4 mt-0.5 rounded text-primary-foreground focus:ring-ring border-slate-300 shrink-0" />
							<span>
								Saya menyatakan bahwa data yang diisikan dalam formulir pendaftaran ini adalah <strong>benar, sah, dan dapat dipertanggungjawabkan</strong>. Apabila di kemudian hari ditemukan ketidakbenaran data, saya bersedia menerima sanksi pembatalan kelulusan.
							</span>
						</label>
					</div>
				</div>

				<!-- Navigasi Wizard -->
				<div class="flex items-center gap-3">
					{#if step > 1}
						<button
							type="button"
							onclick={goPrev}
							class="flex-1 sm:flex-none sm:w-40 py-3.5 px-4 bg-card border border-slate-300 hover:bg-background text-foreground font-semibold text-sm rounded-xl transition-colors"
						>
							← Kembali
						</button>
					{/if}

					{#if step < TOTAL_STEPS}
						<button
							type="button"
							onclick={goNext}
							class="flex-1 py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-[0.98]"
						>
							Lanjut →
						</button>
					{:else}
						<button
							type="submit"
							class="flex-1 py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
						>
							<span>Kirim Pendaftaran</span>
							<span>🚀</span>
						</button>
					{/if}
				</div>

				<p class="text-center text-[11px] text-muted-foreground">
					Langkah {step}/{TOTAL_STEPS} — data tersimpan selama berpindah langkah sebelum dikirim.
				</p>
			</form>
		{/if}
	</div>
</div>
