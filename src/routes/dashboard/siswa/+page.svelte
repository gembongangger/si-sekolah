<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { hasError } from '$lib/form-helpers';
	import { zodClient } from 'sveltekit-superforms/adapters/zod4';
	import { siswaCreateSchema } from '$lib/validation/siswa';
	import type { PageData, ActionData } from './$types';
	import * as XLSX from 'xlsx';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import FileUpIcon from '@lucide/svelte/icons/file-up';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import CheckCircle2Icon from '@lucide/svelte/icons/check-circle-2';
	import XCircleIcon from '@lucide/svelte/icons/x-circle';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert/index.js';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import {
		Select,
		SelectContent,
		SelectGroup,
		SelectItem,
		SelectTrigger,
		SelectValue
	} from '$lib/components/ui/select/index.js';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog/index.js';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table/index.js';

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

	// State tambahan untuk form edit (bits-ui Select but value string)
	let editClassId = $state<string | undefined>(undefined);
	let editGender = $state<string | undefined>(undefined);
	let editActive = $state<string>('1');

	function openEdit(s: (typeof data.siswas)[0]) {
		editSiswa = s;
		editClassId = s.class_id != null ? String(s.class_id) : undefined;
		editGender = s.gender ?? undefined;
		editActive = String(s.is_active);
	}

	function errText(e: unknown): string {
		if (Array.isArray(e)) return e[0] ?? '';
		return e == null ? '' : String(e);
	}

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
		<Alert class="border-success/20 bg-success/10 text-success-foreground">
			<CheckCircle2Icon class="size-4 !text-success-foreground" />
			<AlertTitle>
				<div class="flex items-center justify-between gap-2">
					<span>{actionForm.message}</span>
					{#if actionForm.skippedCount > 0}
						<Button
							variant="link"
							size="sm"
							class="text-success-foreground underline"
							onclick={() => (showDetailsErrors = !showDetailsErrors)}
						>
							{showDetailsErrors ? 'Sembunyikan Rincian' : `Lihat ${actionForm.skippedCount} Catatan`}
						</Button>
					{/if}
				</div>
			</AlertTitle>
			<AlertDescription>
				{#if showDetailsErrors && actionForm.errors && actionForm.errors.length > 0}
					<div class="space-y-1 text-xs">
						{#each actionForm.errors as err}
							<div class="text-warning-foreground">
								• Baris {err.row} ({err.name}): {err.message}
							</div>
						{/each}
					</div>
				{/if}
			</AlertDescription>
		</Alert>
	{:else if actionForm?.importError}
		<Alert variant="destructive">
			<XCircleIcon class="size-4" />
			<AlertDescription>{actionForm.importError}</AlertDescription>
		</Alert>
	{/if}

	<!-- Header Halaman -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-xl font-bold text-foreground">Manajemen Siswa</h1>
			<p class="text-sm text-muted-foreground mt-0.5">Kelola data siswa di sekolah Anda</p>
		</div>
		{#if canManage}
			<div class="flex items-center gap-2.5">
				<Button variant="outline" href="/dashboard/siswa/template" title="Unduh Template Excel">
					<DownloadIcon data-icon="inline-start" class="text-success-foreground" />
					Unduh Template
				</Button>

				<Button
					variant="outline"
					class="border-success/20 bg-success/10 text-success-foreground hover:bg-success/20 hover:text-success-foreground/90"
					onclick={() => {
						resetImport();
						showImportModal = true;
					}}
				>
					<FileUpIcon data-icon="inline-start" />
					Impor dari Excel
				</Button>

				<Button onclick={() => (showAddModal = true)}>
					<PlusIcon data-icon="inline-start" />
					Tambah Siswa
				</Button>
			</div>
		{/if}
	</div>

	<!-- Tabel Daftar Siswa -->
	<Card class="gap-0 overflow-hidden py-0">
		<CardHeader class="border-b bg-muted/50 py-3">
			<CardTitle class="text-xs font-semibold uppercase tracking-wider">
				Daftar Siswa Terdaftar
			</CardTitle>
			<CardDescription class="text-xs">
				Total: {data.siswas.length} Siswa
			</CardDescription>
		</CardHeader>
		{#if data.siswas.length === 0}
			<CardContent class="py-16 text-center text-muted-foreground text-sm">
				Belum ada siswa terdaftar. Gunakan tombol di atas untuk menambah atau mengimpor siswa dari
				Excel.
			</CardContent>
		{:else}
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead class="px-5 py-3">Nama</TableHead>
						<TableHead class="px-5 py-3">Email</TableHead>
						<TableHead class="px-5 py-3">NIS</TableHead>
						<TableHead class="px-5 py-3">Kelas</TableHead>
						<TableHead class="px-5 py-3">L/P</TableHead>
						<TableHead class="px-5 py-3">Status</TableHead>
						{#if canManage}<TableHead class="px-5 py-3 text-right">Aksi</TableHead>{/if}
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each data.siswas as siswa (siswa.id)}
						<TableRow>
							<TableCell class="px-5 py-3.5 font-medium">{siswa.name}</TableCell>
							<TableCell class="px-5 py-3.5 text-muted-foreground text-xs font-mono">
								{siswa.email}
							</TableCell>
							<TableCell class="px-5 py-3.5 text-muted-foreground font-mono text-xs">
								{siswa.nis ?? '—'}
							</TableCell>
							<TableCell class="px-5 py-3.5 font-medium">{siswa.class_name ?? '—'}</TableCell>
							<TableCell class="px-5 py-3.5">{siswa.gender ?? '—'}</TableCell>
							<TableCell class="px-5 py-3.5">
								{#if siswa.is_active}
									<Badge class="bg-success/10 text-success-foreground">Aktif</Badge>
								{:else}
									<Badge variant="secondary">Nonaktif</Badge>
								{/if}
							</TableCell>
							{#if canManage}
								<TableCell class="px-5 py-3.5 text-right">
									<Button
										variant="ghost"
										size="sm"
										class="text-muted-foreground hover:text-foreground"
										onclick={() => openEdit(siswa)}
									>
										<PencilIcon data-icon="inline-start" />
										Edit
									</Button>
									<Button
										variant="ghost"
										size="sm"
										class="text-destructive hover:text-destructive/90"
										onclick={() => (deleteTarget = { id: siswa.id, name: siswa.name })}
									>
										<Trash2Icon data-icon="inline-start" />
										Hapus
									</Button>
								</TableCell>
							{/if}
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		{/if}
	</Card>
</div>

<!-- ============================================================== -->
<!-- MODAL IMPOR EXCEL                                              -->
<!-- ============================================================== -->
<Dialog bind:open={showImportModal}>
	<DialogContent class="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
		<DialogHeader>
			<DialogTitle>Impor Siswa dari File Excel</DialogTitle>
			<DialogDescription>
				Tambah banyak siswa sekaligus melalui spreadsheet (.xlsx / .xls / .csv)
			</DialogDescription>
		</DialogHeader>

		<!-- Petunjuk & Unduh Template -->
		<Alert class="border-primary/20 bg-primary/10 text-primary-foreground">
			<AlertTitle class="text-xs">Langkah Impor Siswa:</AlertTitle>
			<AlertDescription class="text-xs">
				<ol class="list-inside list-decimal space-y-1">
					<li>
						Unduh <a class="font-semibold underline" href="/dashboard/siswa/template">template Excel resmi</a>
						yang sudah disesuaikan dengan daftar kelas di sekolah ini.
					</li>
					<li>
						Isi data siswa pada sheet <strong>Data Siswa</strong> (kolom Nama Lengkap & Kelas wajib
						diisi).
					</li>
					<li>Unggah file kembali ke form di bawah untuk memeriksa validasi dan memulai impor.</li>
				</ol>
			</AlertDescription>
		</Alert>

		<form
			method="POST"
			action="?/importExcel"
			enctype="multipart/form-data"
			class="space-y-5"
			onsubmit={() => (isSubmittingImport = true)}
		>
			<!-- Input File -->
			<div>
				<Label for="excel-file-input" class="mb-1">
					Pilih File Excel (.xlsx, .xls, .csv) *
				</Label>
				<Input
					id="excel-file-input"
					type="file"
					name="file"
					accept=".xlsx, .xls, .csv"
					bind:ref={importFileInput}
					onchange={handleFileSelect}
					required
				/>
			</div>

			{#if isProcessingFile}
				<p class="text-xs text-muted-foreground text-center">
					Sedang membaca dan memvalidasi isi file...
				</p>
			{/if}

			<!-- Pratinjau Data yang Terbaca -->
			{#if previewRows.length > 0}
				<div class="space-y-3">
					<!-- Summary Pills -->
					<div class="flex flex-wrap items-center gap-2">
						<Badge variant="secondary">Total Terbaca: <strong class="ml-1">{previewTotal}</strong></Badge>
						<Badge class="bg-success/10 text-success-foreground">Siap Diimpor: <strong class="ml-1">{previewValid}</strong></Badge>
						{#if previewTotal - previewValid > 0}
							<Badge class="bg-warning/10 text-warning-foreground">Perlu Diperbaiki: <strong class="ml-1">{previewTotal - previewValid}</strong></Badge>
						{/if}
					</div>

					<!-- Mini Preview Table -->
					<div class="rounded-lg border">
						<div class="bg-muted px-4 py-2 text-xs font-semibold flex justify-between border-b">
							<span>Pratinjau {previewRows.length} dari {previewTotal} Baris Data:</span>
							<span class="font-normal text-muted-foreground">
								Password otomatis: siswa12345 (jika kosong)
							</span>
						</div>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead class="px-3 py-2">Nama</TableHead>
									<TableHead class="px-3 py-2">NIS</TableHead>
									<TableHead class="px-3 py-2">Kelas</TableHead>
									<TableHead class="px-3 py-2">L/P</TableHead>
									<TableHead class="px-3 py-2">Status Baris</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{#each previewRows as row}
									<TableRow>
										<TableCell class="px-3 py-2 font-medium">{row.name || '—'}</TableCell>
										<TableCell class="px-3 py-2 text-muted-foreground font-mono">{row.nis || '—'}</TableCell>
										<TableCell class="px-3 py-2">
											{#if row.isClassValid}
												<span class="font-medium">{row.kelas}</span>
											{:else}
												<span class="text-destructive font-bold underline" title="Kelas tidak cocok">
													{row.kelas || 'Kosong'}
												</span>
											{/if}
										</TableCell>
										<TableCell class="px-3 py-2 text-muted-foreground">{row.gender || '—'}</TableCell>
										<TableCell class="px-3 py-2">
											{#if row.isValid}
												<Badge class="bg-success/10 text-success-foreground">Valid</Badge>
											{:else}
												<Badge variant="destructive">Ada Kesalahan</Badge>
											{/if}
										</TableCell>
									</TableRow>
								{/each}
							</TableBody>
						</Table>
					</div>

					<!-- Peringatan kesalahan jika ada -->
					{#if previewErrors.length > 0}
						<Alert class="border-warning/20 bg-warning/10 text-warning-foreground">
							<AlertTitle class="text-xs">Catatan Peringatan Baris:</AlertTitle>
							<AlertDescription class="text-xs">
								<div class="space-y-1">
									{#each previewErrors as pe}
										<p>• {pe}</p>
									{/each}
								</div>
								<p class="text-muted-foreground mt-1 italic">
									Baris yang mengalami kesalahan di atas akan dilewati secara otomatis saat impor
									dijalankan.
								</p>
							</AlertDescription>
						</Alert>
					{/if}
				</div>
			{/if}

			<Separator />

			<DialogFooter class="gap-2">
				<Button type="button" variant="outline" onclick={() => (showImportModal = false)}>
					Batal
				</Button>
				<Button
					type="submit"
					class="bg-success hover:bg-success/90"
					disabled={!selectedFile || isSubmittingImport}
				>
					{#if isSubmittingImport}
						<span class="size-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
						Sedang Mengimpor...
					{:else}
						Mulai Impor Siswa
					{/if}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>

<!-- MODAL TAMBAH SATUAN -->
<Dialog bind:open={showAddModal}>
	<DialogContent class="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
		<DialogHeader>
			<DialogTitle>Tambah Siswa Baru</DialogTitle>
		</DialogHeader>
		{#if $message}
			<Alert variant="destructive" class="mb-4">
				<AlertDescription>{$message}</AlertDescription>
			</Alert>
		{/if}
		<form method="POST" action="?/create" use:enhance class="space-y-4">
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div class="col-span-2 space-y-1.5">
					<Label for="create-name-input">Nama Lengkap *</Label>
					<Input
						id="create-name-input"
						name="name"
						bind:value={$form.name}
						type="text"
						aria-invalid={hasError($errors.name) || undefined}
					/>
					{#if hasError($errors.name)}
						<p class="text-xs text-destructive">{errText($errors.name)}</p>
					{/if}
				</div>
				<div class="space-y-1.5">
					<Label for="create-email-input">Email *</Label>
					<Input
						id="create-email-input"
						name="email"
						bind:value={$form.email}
						type="email"
						aria-invalid={hasError($errors.email) || undefined}
					/>
					{#if hasError($errors.email)}
						<p class="text-xs text-destructive">{errText($errors.email)}</p>
					{/if}
				</div>
				<div class="space-y-1.5">
					<Label for="create-password-input">Password *</Label>
					<Input
						id="create-password-input"
						name="password"
						bind:value={$form.password}
						type="password"
						aria-invalid={hasError($errors.password) || undefined}
					/>
					{#if hasError($errors.password)}
						<p class="text-xs text-destructive">{errText($errors.password)}</p>
					{/if}
				</div>
				<div class="space-y-1.5">
					<Label for="create-nis-input">NIS</Label>
					<Input id="create-nis-input" name="nis" bind:value={$form.nis} type="text" />
				</div>
				<div class="space-y-1.5">
					<Label for="create-nisn-input">NISN</Label>
					<Input id="create-nisn-input" name="nisn" bind:value={$form.nisn} type="text" />
				</div>
				<div class="space-y-1.5">
					<Label for="create-class-select">Kelas</Label>
					<Select
						type="single"
						name="class_id"
						value={$form.class_id == null ? undefined : String($form.class_id)}
						onValueChange={(v) => ($form.class_id = v === undefined ? undefined : Number(v))}
					>
						<SelectTrigger id="create-class-select" class="w-full">
							<SelectValue placeholder="— Pilih Kelas —" />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								{#each data.kelas as k (k.id)}
									<SelectItem value={String(k.id)}>{k.name}</SelectItem>
								{/each}
							</SelectGroup>
						</SelectContent>
					</Select>
				</div>
				<div class="space-y-1.5">
					<Label for="create-gender-select">Jenis Kelamin</Label>
					<Select type="single" name="gender" bind:value={$form.gender}>
						<SelectTrigger id="create-gender-select" class="w-full">
							<SelectValue placeholder="— Pilih —" />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								<SelectItem value="L">Laki-laki</SelectItem>
								<SelectItem value="P">Perempuan</SelectItem>
							</SelectGroup>
						</SelectContent>
					</Select>
				</div>
				<div class="space-y-1.5">
					<Label for="create-birth-date-input">Tanggal Lahir</Label>
					<Input id="create-birth-date-input" name="birth_date" bind:value={$form.birth_date} type="date" />
				</div>
				<div class="col-span-2 space-y-1.5">
					<Label for="create-address-input">Alamat</Label>
					<Textarea id="create-address-input" name="address" bind:value={$form.address} rows={2} class="resize-none" />
				</div>
				<div class="space-y-1.5">
					<Label for="create-parent-name-input">Nama Orang Tua</Label>
					<Input id="create-parent-name-input" name="parent_name" bind:value={$form.parent_name} type="text" />
				</div>
				<div class="space-y-1.5">
					<Label for="create-parent-phone-input">Telepon Orang Tua</Label>
					<Input id="create-parent-phone-input" name="parent_phone" bind:value={$form.parent_phone} type="text" />
				</div>
				<div class="space-y-1.5">
					<Label for="create-status-select">Status</Label>
					<Select
						type="single"
						name="is_active"
						value={$form.is_active == null ? '1' : String($form.is_active)}
						onValueChange={(v) => ($form.is_active = v == null ? 1 : Number(v))}
					>
						<SelectTrigger id="create-status-select" class="w-full">
							<SelectValue placeholder="— Pilih —" />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								<SelectItem value="1">Aktif</SelectItem>
								<SelectItem value="0">Nonaktif</SelectItem>
							</SelectGroup>
						</SelectContent>
					</Select>
				</div>
			</div>
			<DialogFooter class="gap-2 pt-2">
				<Button type="button" variant="outline" onclick={() => (showAddModal = false)}>Batal</Button>
				<Button type="submit" disabled={$submitting}>
					{$submitting ? 'Menyimpan...' : 'Simpan Siswa'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>

<!-- MODAL EDIT -->
<Dialog open={editSiswa !== null} onOpenChange={(o) => !o && (editSiswa = null)}>
	<DialogContent class="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
		{#if editSiswa}
			{@const s = editSiswa}
			<DialogHeader>
				<DialogTitle>Edit Data Siswa</DialogTitle>
			</DialogHeader>
			<form method="POST" action="?/update" class="space-y-4">
				<input type="hidden" name="id" value={s.id} />
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div class="col-span-2 space-y-1.5">
						<Label for="edit-name-input">Nama Lengkap *</Label>
						<Input id="edit-name-input" name="name" value={s.name} type="text" />
					</div>
					<div class="space-y-1.5">
						<Label for="edit-email-input">Email *</Label>
						<Input id="edit-email-input" name="email" value={s.email} type="email" />
					</div>
					<div class="space-y-1.5">
						<Label for="edit-password-input">
							Password Baru <span class="font-normal text-muted-foreground">(kosongkan jika tidak diubah)</span>
						</Label>
						<Input id="edit-password-input" name="password" type="password" />
					</div>
					<div class="space-y-1.5">
						<Label for="edit-nis-input">NIS</Label>
						<Input id="edit-nis-input" name="nis" value={s.nis ?? ''} type="text" />
					</div>
					<div class="space-y-1.5">
						<Label for="edit-nisn-input">NISN</Label>
						<Input id="edit-nisn-input" name="nisn" value={s.nisn ?? ''} type="text" />
					</div>
					<div class="space-y-1.5">
						<Label for="edit-class-select">Kelas</Label>
						<Select type="single" name="class_id" bind:value={editClassId}>
							<SelectTrigger id="edit-class-select" class="w-full">
								<SelectValue placeholder="— Pilih Kelas —" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{#each data.kelas as k (k.id)}
										<SelectItem value={String(k.id)}>{k.name}</SelectItem>
									{/each}
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>
					<div class="space-y-1.5">
						<Label for="edit-gender-select">Jenis Kelamin</Label>
						<Select type="single" name="gender" bind:value={editGender}>
							<SelectTrigger id="edit-gender-select" class="w-full">
								<SelectValue placeholder="— Pilih —" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectItem value="L">Laki-laki</SelectItem>
									<SelectItem value="P">Perempuan</SelectItem>
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>
					<div class="space-y-1.5">
						<Label for="edit-birth-date-input">Tanggal Lahir</Label>
						<Input id="edit-birth-date-input" name="birth_date" value={s.birth_date ?? ''} type="date" />
					</div>
					<div class="col-span-2 space-y-1.5">
						<Label for="edit-address-input">Alamat</Label>
						<Textarea id="edit-address-input" name="address" rows={2} class="resize-none" value={s.address ?? ''} />
					</div>
					<div class="space-y-1.5">
						<Label for="edit-parent-name-input">Nama Orang Tua</Label>
						<Input id="edit-parent-name-input" name="parent_name" value={s.parent_name ?? ''} type="text" />
					</div>
					<div class="space-y-1.5">
						<Label for="edit-parent-phone-input">Telepon Orang Tua</Label>
						<Input id="edit-parent-phone-input" name="parent_phone" value={s.parent_phone ?? ''} type="text" />
					</div>
					<div class="space-y-1.5">
						<Label for="edit-status-select">Status</Label>
						<Select type="single" name="is_active" bind:value={editActive}>
							<SelectTrigger id="edit-status-select" class="w-full">
								<SelectValue placeholder="— Pilih —" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectItem value="1">Aktif</SelectItem>
									<SelectItem value="0">Nonaktif</SelectItem>
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>
				</div>
				<DialogFooter class="gap-2 pt-2">
					<Button type="button" variant="outline" onclick={() => (editSiswa = null)}>Batal</Button>
					<Button type="submit">Simpan Perubahan</Button>
				</DialogFooter>
			</form>
		{/if}
	</DialogContent>
</Dialog>

<!-- MODAL HAPUS -->
<Dialog open={deleteTarget !== null} onOpenChange={(o) => !o && (deleteTarget = null)}>
	<DialogContent class="sm:max-w-sm">
		{#if deleteTarget}
			<DialogHeader>
				<DialogTitle>Hapus Siswa?</DialogTitle>
				<DialogDescription>
					Akun <strong>{deleteTarget.name}</strong> akan dihapus. Tindakan ini tidak dapat
					dibatalkan.
				</DialogDescription>
			</DialogHeader>
			<DialogFooter class="gap-2">
				<Button variant="outline" onclick={() => (deleteTarget = null)}>Batal</Button>
				<form method="POST" action="?/delete">
					<input type="hidden" name="id" value={deleteTarget.id} />
				<Button type="submit" variant="destructive">
					Ya, Hapus
				</Button>
				</form>
			</DialogFooter>
		{/if}
	</DialogContent>
</Dialog>
