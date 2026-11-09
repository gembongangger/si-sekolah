<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { hasError } from '$lib/form-helpers';
	import { zodClient } from 'sveltekit-superforms/adapters/zod4';
	import { siswaCreateSchema } from '$lib/validation/siswa';
	import type { PageData, ActionData } from './$types';
	import * as XLSX from 'xlsx';

	let { data, form: actionForm }: { data: PageData; form: ActionData } = $props();

	const canManage = data.canManage;

	const { form, errors, message, enhance, submitting, reset } = superForm(data.form, {
		validators: zodClient(siswaCreateSchema),
		onUpdated({ form: f }) {
			if (String(f.message).includes('berhasil')) {
				showAddModal = false;
				reset();
			}
		}
	});

	let showAddModal = $state(false);
	let showImportModal = $state(false);
	let editSiswa: (typeof data.siswas)[0] | null = $state(null);
	let deleteTarget: { id: number; name: string } | null = $state(null);

	// Excel Import States
	let importFileInput = $state<HTMLInputElement | null>(null);
	let selectedFile = $state<File | null>(null);
	let isProcessingFile = $state(false);
	let isSubmittingImport = $state(false);
	let previewRows = $state<any[]>([]);
	let previewTotal = $state(0);
	let previewValid = $state(0);
	let previewErrors = $state<string[]>([]);
	let showDetailsErrors = $state(false);

	function inputCls(err?: unknown) {
		const hasErr = Array.isArray(err)
			? err.length > 0
			: err != null && typeof err === 'object' && '_errors' in err
				? !!(err as any)._errors?.length
				: !!err;
		return `w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-colors ${
			hasErr
				? 'border-red-400 focus:ring-red-500'
				: 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
		}`;
	}

	async function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		selectedFile = file;
		isProcessingFile = true;
		previewErrors = [];

		try {
			const buf = await file.arrayBuffer();
			const wb = XLSX.read(new Uint8Array(buf), { type: 'array' });
			const sheetName = wb.SheetNames.includes('Data Siswa') ? 'Data Siswa' : wb.SheetNames[0];
			const ws = wb.Sheets[sheetName];
			if (!ws) {
				previewErrors = ['Sheet data tidak ditemukan di dalam file Excel.'];
				previewRows = [];
				previewTotal = 0;
				isProcessingFile = false;
				return;
			}

			const json = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });
			previewTotal = json.length;

			const validClasses = new Set(data.kelas.map((k) => k.name.trim().toLowerCase()));
			const normKey = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, '');

			let validCount = 0;
			const errs: string[] = [];

			const mapped = json.map((row, i) => {
				const norm: Record<string, any> = {};
				for (const [k, v] of Object.entries(row)) {
					norm[normKey(k)] = v;
				}

				const name = String(
					norm['namalengkap'] ?? norm['nama'] ?? norm['namasiswa'] ?? norm['name'] ?? ''
				).trim();
				const nis = String(norm['nis'] ?? norm['noinduk'] ?? norm['nomorinduk'] ?? '').trim();
				const kelas = String(norm['kelas'] ?? norm['namakelas'] ?? norm['rombel'] ?? '').trim();
				const gender = String(norm['jeniskelamin'] ?? norm['jk'] ?? norm['gender'] ?? '').trim();
				const email = String(norm['email'] ?? '').trim();

				const isClassValid =
					validClasses.has(kelas.toLowerCase()) ||
					validClasses.has(kelas.toLowerCase().replace(/[\s\-_]/g, ''));
				const isValid = name.length >= 3 && isClassValid;

				if (isValid) {
					validCount++;
				} else {
					if (name.length < 3) {
						errs.push(`Baris ${i + 2}: Nama "${name || 'kosong'}" minimal 3 karakter.`);
					}
					if (!isClassValid) {
						errs.push(`Baris ${i + 2}: Kelas "${kelas || 'kosong'}" tidak cocok dengan daftar kelas.`);
					}
				}

				return {
					name,
					nis,
					kelas,
					gender,
					email,
					isValid,
					isClassValid
				};
			});

			previewValid = validCount;
			previewRows = mapped.slice(0, 8);
			previewErrors = errs.slice(0, 10);
		} catch (err: any) {
			previewErrors = ['Gagal membaca file: ' + (err.message || 'Format tidak didukung')];
			previewRows = [];
			previewTotal = 0;
		} finally {
			isProcessingFile = false;
		}
	}

	function resetImport() {
		selectedFile = null;
		previewRows = [];
		previewTotal = 0;
		previewValid = 0;
		previewErrors = [];
		if (importFileInput) importFileInput.value = '';
	}
</script>

<svelte:head>
	<title>Manajemen Siswa — SIS</title>
</svelte:head>

<div class="max-w-6xl space-y-6">
	<!-- Banner Notifikasi Hasil Impor -->
	{#if actionForm?.importSuccess}
		<div class="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm shadow-sm flex flex-col gap-2">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<span class="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">✓</span>
					<strong class="font-semibold">{actionForm.message}</strong>
				</div>
				{#if actionForm.skippedCount > 0}
					<button
						onclick={() => (showDetailsErrors = !showDetailsErrors)}
						class="text-xs font-semibold underline text-emerald-800 hover:text-emerald-900"
					>
						{showDetailsErrors ? 'Sembunyikan Rincian' : `Lihat ${actionForm.skippedCount} Catatan`}
					</button>
				{/if}
			</div>
			{#if showDetailsErrors && actionForm.errors && actionForm.errors.length > 0}
				<div class="mt-2 pt-2 border-t border-emerald-200 space-y-1 text-xs">
					{#each actionForm.errors as err}
						<div class="text-amber-900">
							• Baris {err.row} ({err.name}): {err.message}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{:else if actionForm?.importError}
		<div class="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm shadow-sm flex items-center gap-2">
			<span class="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-xs">✕</span>
			<span>{actionForm.importError}</span>
		</div>
	{/if}

	<!-- Header Halaman -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-xl font-bold text-gray-900">Manajemen Siswa</h1>
			<p class="text-sm text-gray-500 mt-0.5">Kelola data siswa di sekolah Anda</p>
		</div>
		{#if canManage}
			<div class="flex items-center gap-2.5">
				<a
					href="/dashboard/siswa/template"
					class="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
					title="Unduh Template Excel"
				>
					<svg class="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
					</svg>
					Unduh Template
				</a>

				<button
					onclick={() => {
						resetImport();
						showImportModal = true;
					}}
					class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
				>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
					Impor dari Excel
				</button>

				<button
					onclick={() => (showAddModal = true)}
					class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
				>
					+ Tambah Siswa
				</button>
			</div>
		{/if}
	</div>

	<!-- Tabel Daftar Siswa -->
	<div class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
		<div class="px-5 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
			<span class="text-xs font-semibold text-gray-700 uppercase tracking-wider">
				Daftar Siswa Terdaftar
			</span>
			<span class="text-xs text-gray-500 font-medium">
				Total: {data.siswas.length} Siswa
			</span>
		</div>
		{#if data.siswas.length === 0}
			<div class="py-16 text-center text-gray-400 text-sm">
				Belum ada siswa terdaftar. Gunakan tombol di atas untuk menambah atau mengimpor siswa dari Excel.
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead class="bg-gray-50 border-b border-gray-200">
						<tr>
							<th class="text-left px-5 py-3 font-medium text-gray-500">Nama</th>
							<th class="text-left px-5 py-3 font-medium text-gray-500">Email</th>
							<th class="text-left px-5 py-3 font-medium text-gray-500">NIS</th>
							<th class="text-left px-5 py-3 font-medium text-gray-500">Kelas</th>
							<th class="text-left px-5 py-3 font-medium text-gray-500">L/P</th>
							<th class="text-left px-5 py-3 font-medium text-gray-500">Status</th>
							{#if canManage}<th class="text-right px-5 py-3 font-medium text-gray-500">Aksi</th>{/if}
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100">
						{#each data.siswas as siswa (siswa.id)}
							<tr class="hover:bg-gray-50 transition-colors">
								<td class="px-5 py-3.5 font-medium text-gray-900">{siswa.name}</td>
								<td class="px-5 py-3.5 text-gray-500 text-xs font-mono">{siswa.email}</td>
								<td class="px-5 py-3.5 text-gray-500 font-mono text-xs">{siswa.nis ?? '—'}</td>
								<td class="px-5 py-3.5 text-gray-800 font-medium">{siswa.class_name ?? '—'}</td>
								<td class="px-5 py-3.5 text-gray-600">{siswa.gender ?? '—'}</td>
								<td class="px-5 py-3.5">
									{#if siswa.is_active}
										<span class="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
											<span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>Aktif
										</span>
									{:else}
										<span class="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
											<span class="w-1.5 h-1.5 rounded-full bg-gray-400"></span>Nonaktif
										</span>
									{/if}
								</td>
								{#if canManage}
									<td class="px-5 py-3.5 text-right space-x-3">
										<button onclick={() => (editSiswa = siswa)} class="text-xs text-blue-600 hover:text-blue-800 font-medium">Edit</button>
										<button onclick={() => (deleteTarget = { id: siswa.id, name: siswa.name })} class="text-xs text-red-500 hover:text-red-700 font-medium">Hapus</button>
									</td>
								{/if}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

<!-- ============================================================== -->
<!-- MODAL IMPOR EXCEL                                              -->
<!-- ============================================================== -->
{#if showImportModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
		<div class="bg-white rounded-2xl shadow-xl w-full max-w-full sm:max-w-3xl p-6 my-8 max-h-[90vh] overflow-y-auto border border-gray-200">
			<div class="flex items-center justify-between pb-3 border-b border-gray-200 mb-5">
				<div>
					<h2 class="text-lg font-bold text-gray-900">Impor Siswa dari File Excel</h2>
					<p class="text-xs text-gray-500 mt-0.5">Tambah banyak siswa sekaligus melalui spreadsheet (.xlsx / .xls / .csv)</p>
				</div>
				<button onclick={() => (showImportModal = false)} class="text-gray-400 hover:text-gray-600 text-lg font-bold">✕</button>
			</div>

			<!-- Petunjuk & Unduh Template -->
			<div class="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-blue-900">
				<div class="space-y-1">
					<p class="font-bold">Langkah Impor Siswa:</p>
					<p>1. Unduh template Excel resmi yang sudah disesuaikan dengan daftar kelas di sekolah ini.</p>
					<p>2. Isi data siswa pada sheet <strong>Data Siswa</strong> (kolom Nama Lengkap & Kelas wajib diisi).</p>
					<p>3. Unggah file kembali ke form di bawah untuk memeriksa validasi dan memulai impor.</p>
				</div>
				<a
					href="/dashboard/siswa/template"
					class="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg whitespace-nowrap text-center transition-colors shadow-sm"
				>
					Unduh Template (.xlsx)
				</a>
			</div>

			<form
				method="POST"
				action="?/importExcel"
				enctype="multipart/form-data"
				class="space-y-5"
				onsubmit={() => (isSubmittingImport = true)}
			>
				<!-- Input File -->
				<div>
					<label for="excel-file-input" class="block text-xs font-semibold text-gray-700 mb-1">
						Pilih File Excel (.xlsx, .xls, .csv) *
					</label>
					<input
						id="excel-file-input"
						type="file"
						name="file"
						accept=".xlsx, .xls, .csv"
						bind:this={importFileInput}
						onchange={handleFileSelect}
						required
						class="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-gray-300 rounded-xl p-1.5 focus:outline-none"
					/>
				</div>

				{#if isProcessingFile}
					<div class="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center text-xs text-gray-500">
						Sedang membaca dan memvalidasi isi file...
					</div>
				{/if}

				<!-- Pratinjau Data yang Terbaca -->
				{#if previewRows.length > 0}
					<div class="space-y-3">
						<!-- Summary Pills -->
						<div class="flex items-center gap-3 text-xs">
							<span class="px-3 py-1 bg-gray-100 rounded-full font-medium text-gray-700">
								Total Terbaca: <strong>{previewTotal} Siswa</strong>
							</span>
							<span class="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full font-medium">
								Siap Diimpor: <strong>{previewValid}</strong>
							</span>
							{#if previewTotal - previewValid > 0}
								<span class="px-3 py-1 bg-amber-50 text-amber-800 rounded-full font-medium">
									Perlu Diperbaiki: <strong>{previewTotal - previewValid}</strong>
								</span>
							{/if}
						</div>

						<!-- Mini Preview Table -->
						<div class="border border-gray-200 rounded-xl overflow-hidden text-xs">
							<div class="bg-gray-100 px-4 py-2 font-semibold text-gray-700 border-b border-gray-200 flex justify-between">
								<span>Pratinjau {previewRows.length} dari {previewTotal} Baris Data:</span>
								<span class="text-gray-500 font-normal">Password otomatis: siswa12345 (jika kosong)</span>
							</div>
							<div class="overflow-x-auto max-h-48">
								<table class="w-full text-left">
									<thead class="bg-gray-50 text-gray-600 border-b border-gray-200">
										<tr>
											<th class="px-3 py-2">Nama</th>
											<th class="px-3 py-2">NIS</th>
											<th class="px-3 py-2">Kelas</th>
											<th class="px-3 py-2">L/P</th>
											<th class="px-3 py-2">Status Baris</th>
										</tr>
									</thead>
									<tbody class="divide-y divide-gray-100">
										{#each previewRows as row}
											<tr class="hover:bg-gray-50">
												<td class="px-3 py-2 font-medium text-gray-900">{row.name || '—'}</td>
												<td class="px-3 py-2 text-gray-500 font-mono">{row.nis || '—'}</td>
												<td class="px-3 py-2">
													{#if row.isClassValid}
														<span class="text-gray-900 font-medium">{row.kelas}</span>
													{:else}
														<span class="text-red-600 font-bold underline" title="Kelas tidak cocok">{row.kelas || 'Kosong'}</span>
													{/if}
												</td>
												<td class="px-3 py-2 text-gray-500">{row.gender || '—'}</td>
												<td class="px-3 py-2">
													{#if row.isValid}
														<span class="text-emerald-700 font-semibold">✓ Valid</span>
													{:else}
														<span class="text-red-600 font-semibold">✕ Ada Kesalahan</span>
													{/if}
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</div>

						<!-- Peringatan kesalahan jika ada -->
						{#if previewErrors.length > 0}
							<div class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
								<p class="font-bold">Catatan Peringatan Baris:</p>
								{#each previewErrors as pe}
									<p>• {pe}</p>
								{/each}
								<p class="text-gray-500 mt-1 italic">Baris yang mengalami kesalahan di atas akan dilewati secara otomatis saat impor dijalankan.</p>
							</div>
						{/if}
					</div>
				{/if}

				<!-- Tombol Aksi Modal -->
				<div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
					<button
						type="button"
						onclick={() => (showImportModal = false)}
						class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
					>
						Batal
					</button>
					<button
						type="submit"
						disabled={!selectedFile || isSubmittingImport}
						class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center gap-2"
					>
						{#if isSubmittingImport}
							<span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
							Sedang Mengimpor...
						{:else}
							Mulai Impor Siswa
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- MODAL TAMBAH SATUAN -->
{#if showAddModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
		<div class="bg-white rounded-2xl shadow-xl w-full max-w-full sm:max-w-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between mb-5">
				<h2 class="text-lg font-bold text-gray-900">Tambah Siswa Baru</h2>
				<button onclick={() => (showAddModal = false)} class="text-gray-400 hover:text-gray-600">✕</button>
			</div>
			{#if $message}
				<div class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{$message}</div>
			{/if}
			<form method="POST" action="?/create" use:enhance class="space-y-4">
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div class="col-span-2">
						<label for="create-name-input" class="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
						<input id="create-name-input" name="name" bind:value={$form.name} type="text" class={inputCls(hasError($errors.name) ? ['e'] : undefined)} />
					</div>
					<div>
						<label for="create-email-input" class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
						<input id="create-email-input" name="email" bind:value={$form.email} type="email" class={inputCls(hasError($errors.email) ? ['e'] : undefined)} />
					</div>
					<div>
						<label for="create-password-input" class="block text-sm font-medium text-gray-700 mb-1">Password *</label>
						<input id="create-password-input" name="password" bind:value={$form.password} type="password" class={inputCls(hasError($errors.password) ? ['e'] : undefined)} />
					</div>
					<div>
						<label for="create-nis-input" class="block text-sm font-medium text-gray-700 mb-1">NIS</label>
						<input id="create-nis-input" name="nis" bind:value={$form.nis} type="text" class={inputCls()} />
					</div>
					<div>
						<label for="create-nisn-input" class="block text-sm font-medium text-gray-700 mb-1">NISN</label>
						<input id="create-nisn-input" name="nisn" bind:value={$form.nisn} type="text" class={inputCls()} />
					</div>
					<div>
						<label for="create-class-select" class="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
						<select id="create-class-select" name="class_id" bind:value={$form.class_id} class={inputCls()}>
							<option value={undefined}>— Pilih Kelas —</option>
							{#each data.kelas as k (k.id)}
								<option value={k.id}>{k.name}</option>
							{/each}
						</select>
					</div>
					<div>
						<label for="create-gender-select" class="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
						<select id="create-gender-select" name="gender" bind:value={$form.gender} class={inputCls()}>
							<option value={undefined}>— Pilih —</option>
							<option value="L">Laki-laki</option>
							<option value="P">Perempuan</option>
						</select>
					</div>
					<div>
						<label for="create-birth-date-input" class="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label>
						<input id="create-birth-date-input" name="birth_date" bind:value={$form.birth_date} type="date" class={inputCls()} />
					</div>
					<div class="col-span-2">
						<label for="create-address-input" class="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
						<textarea id="create-address-input" name="address" bind:value={$form.address} rows="2" class="{inputCls()} resize-none"></textarea>
					</div>
					<div>
						<label for="create-parent-name-input" class="block text-sm font-medium text-gray-700 mb-1">Nama Orang Tua</label>
						<input id="create-parent-name-input" name="parent_name" bind:value={$form.parent_name} type="text" class={inputCls()} />
					</div>
					<div>
						<label for="create-parent-phone-input" class="block text-sm font-medium text-gray-700 mb-1">Telepon Orang Tua</label>
						<input id="create-parent-phone-input" name="parent_phone" bind:value={$form.parent_phone} type="text" class={inputCls()} />
					</div>
					<div>
						<label for="create-status-select" class="block text-sm font-medium text-gray-700 mb-1">Status</label>
						<select id="create-status-select" name="is_active" bind:value={$form.is_active} class={inputCls()}>
							<option value={1}>Aktif</option>
							<option value={0}>Nonaktif</option>
						</select>
					</div>
				</div>
				<div class="flex justify-end gap-3 pt-2">
					<button type="button" onclick={() => (showAddModal = false)} class="px-4 py-2 text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors">Batal</button>
					<button type="submit" disabled={$submitting} class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors">
						{$submitting ? 'Menyimpan...' : 'Simpan Siswa'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- MODAL EDIT -->
{#if editSiswa}
	{@const s = editSiswa}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
		<div class="bg-white rounded-2xl shadow-xl w-full max-w-full sm:max-w-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between mb-5">
				<h2 class="text-lg font-bold text-gray-900">Edit Data Siswa</h2>
				<button onclick={() => (editSiswa = null)} class="text-gray-400 hover:text-gray-600">✕</button>
			</div>
			<form method="POST" action="?/update" class="space-y-4">
				<input type="hidden" name="id" value={s.id} />
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div class="col-span-2">
						<label for="edit-name-input" class="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
						<input id="edit-name-input" name="name" value={s.name} type="text" class={inputCls()} />
					</div>
					<div>
						<label for="edit-email-input" class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
						<input id="edit-email-input" name="email" value={s.email} type="email" class={inputCls()} />
					</div>
					<div>
						<label for="edit-password-input" class="block text-sm font-medium text-gray-700 mb-1">Password Baru <span class="text-gray-400 font-normal">(kosongkan jika tidak diubah)</span></label>
						<input id="edit-password-input" name="password" type="password" class={inputCls()} />
					</div>
					<div>
						<label for="edit-nis-input" class="block text-sm font-medium text-gray-700 mb-1">NIS</label>
						<input id="edit-nis-input" name="nis" value={s.nis ?? ''} type="text" class={inputCls()} />
					</div>
					<div>
						<label for="edit-nisn-input" class="block text-sm font-medium text-gray-700 mb-1">NISN</label>
						<input id="edit-nisn-input" name="nisn" value={s.nisn ?? ''} type="text" class={inputCls()} />
					</div>
					<div>
						<label for="edit-class-select" class="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
						<select id="edit-class-select" name="class_id" class={inputCls()}>
							<option value="">— Pilih Kelas —</option>
							{#each data.kelas as k (k.id)}
								<option value={k.id} selected={s.class_id === k.id}>{k.name}</option>
							{/each}
						</select>
					</div>
					<div>
						<label for="edit-gender-select" class="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
						<select id="edit-gender-select" name="gender" class={inputCls()}>
							<option value="">— Pilih —</option>
							<option value="L" selected={s.gender === 'L'}>Laki-laki</option>
							<option value="P" selected={s.gender === 'P'}>Perempuan</option>
						</select>
					</div>
					<div>
						<label for="edit-birth-date-input" class="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label>
						<input id="edit-birth-date-input" name="birth_date" value={s.birth_date ?? ''} type="date" class={inputCls()} />
					</div>
					<div class="col-span-2">
						<label for="edit-address-input" class="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
						<textarea id="edit-address-input" name="address" rows="2" class="{inputCls()} resize-none">{s.address ?? ''}</textarea>
					</div>
					<div>
						<label for="edit-parent-name-input" class="block text-sm font-medium text-gray-700 mb-1">Nama Orang Tua</label>
						<input id="edit-parent-name-input" name="parent_name" value={s.parent_name ?? ''} type="text" class={inputCls()} />
					</div>
					<div>
						<label for="edit-parent-phone-input" class="block text-sm font-medium text-gray-700 mb-1">Telepon Orang Tua</label>
						<input id="edit-parent-phone-input" name="parent_phone" value={s.parent_phone ?? ''} type="text" class={inputCls()} />
					</div>
					<div>
						<label for="edit-status-select" class="block text-sm font-medium text-gray-700 mb-1">Status</label>
						<select id="edit-status-select" name="is_active" class={inputCls()}>
							<option value={1} selected={s.is_active === 1}>Aktif</option>
							<option value={0} selected={s.is_active === 0}>Nonaktif</option>
						</select>
					</div>
				</div>
				<div class="flex justify-end gap-3 pt-2">
					<button type="button" onclick={() => (editSiswa = null)} class="px-4 py-2 text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors">Batal</button>
					<button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Simpan Perubahan</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- MODAL HAPUS -->
{#if deleteTarget}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
		<div class="bg-white rounded-2xl shadow-xl w-full max-w-full sm:max-w-sm p-4 sm:p-6">
			<h2 class="text-lg font-bold text-gray-900 mb-2">Hapus Siswa?</h2>
			<p class="text-sm text-gray-500 mb-6">
				Akun <strong>{deleteTarget.name}</strong> akan dihapus. Tindakan ini tidak dapat dibatalkan.
			</p>
			<div class="flex justify-end gap-3">
				<button onclick={() => (deleteTarget = null)} class="px-4 py-2 text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors">Batal</button>
				<form method="POST" action="?/delete">
					<input type="hidden" name="id" value={deleteTarget.id} />
					<button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">Ya, Hapus</button>
				</form>
			</div>
		</div>
	</div>
{/if}
