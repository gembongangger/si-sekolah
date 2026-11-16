<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { enhance as enhanceForm } from '$app/forms';
	import { fieldError, hasError } from '$lib/form-helpers';
	import { zodClient } from 'sveltekit-superforms/adapters/zod4';
	import { subjectSchema } from '$lib/validation/subject';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import UploadIcon from '@lucide/svelte/icons/upload';
	import FileSpreadsheetIcon from '@lucide/svelte/icons/file-spreadsheet';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Card } from '$lib/components/ui/card/index.js';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Alert, AlertDescription } from '$lib/components/ui/alert/index.js';
	import { Pagination } from '$lib/components/ui/pagination/index.js';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog/index.js';

	let { data }: { data: PageData } = $props();

	const { form, errors, message, enhance, submitting, reset } = superForm(data.form, {
		validators: zodClient(subjectSchema),
		onUpdated({ form: f }) {
			if (String(f.message).includes('berhasil')) {
				showAddModal = false;
				editSubject = null;
				reset();
			}
		}
	});

	let showAddModal = $state(false);
	let showImportModal = $state(false);
	let showEditModal = $state(false);
	let showDeleteModal = $state(false);
	let editSubject: (typeof data.subjects)[0] | null = $state(null);
	let deleteTarget: { id: number; name: string } | null = $state(null);
	let importError = $state('');
	let importSuccess = $state('');
	let importing = $state(false);

	let page = $state(1);
	let pageSize = $state(10);
	let filterCode = $state('');
	let filterName = $state('');

	let hasActiveFilter = $derived(Boolean(filterCode || filterName));

	function resetFilters() {
		filterCode = '';
		filterName = '';
		page = 1;
	}

	let filteredSubjects = $derived(
		data.subjects.filter((s) => {
			if (filterCode && !(s.code ?? '').toLowerCase().includes(filterCode.toLowerCase())) {
				return false;
			}
			if (filterName && !(s.name ?? '').toLowerCase().includes(filterName.toLowerCase())) {
				return false;
			}
			return true;
		})
	);

	let paginatedSubjects = $derived(
		filteredSubjects.slice((page - 1) * pageSize, page * pageSize)
	);

	function inputCls(err?: unknown) {
		const hasErr = Array.isArray(err) ? err.length > 0 : (err != null && typeof err === 'object' && '_errors' in err ? !!(err as any)._errors?.length : !!err);
		return `w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-colors ${
			hasErr ? 'border-destructive focus:ring-destructive' : 'border-input focus:ring-ring'
		}`;
	}
</script>

<svelte:head>
	<title>Mata Pelajaran — SIS</title>
</svelte:head>

<div class="max-w-5xl">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
		<div>
			<h1 class="text-xl font-bold text-foreground">Mata Pelajaran</h1>
			<p class="text-sm text-muted-foreground mt-0.5">Kelola data mata pelajaran di sekolah Anda</p>
		</div>
		<div class="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2.5">
			<a href="/dashboard/mata-pelajaran/template" download>
				<Button variant="outline" class="min-h-11 sm:min-h-9 w-full sm:w-auto">
					<DownloadIcon data-icon="inline-start" /> Template
				</Button>
			</a>
			<Button variant="outline" onclick={() => (showImportModal = true)} class="min-h-11 sm:min-h-9 w-full sm:w-auto">
				<UploadIcon data-icon="inline-start" /> Import Excel
			</Button>
			<Button onclick={() => (showAddModal = true)} class="min-h-11 sm:min-h-9 w-full sm:w-auto">+ Tambah Mata Pelajaran</Button>
		</div>
	</div>

	<Card>
		{#if data.subjects.length === 0}
			<div class="py-16 text-center text-muted-foreground text-sm">Belum ada mata pelajaran terdaftar.</div>
		{:else}
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead class="px-5 py-3 font-medium text-muted-foreground">Kode</TableHead>
						<TableHead class="px-5 py-3 font-medium text-muted-foreground">Nama</TableHead>
						<TableHead class="px-5 py-3 font-medium text-muted-foreground text-center">Jam/Minggu</TableHead>
						<TableHead class="text-right px-5 py-3 font-medium text-muted-foreground">
							{#if hasActiveFilter}
								<Button variant="ghost" size="sm" class="h-7 text-xs text-muted-foreground" onclick={resetFilters}>
									<RotateCcw class="size-3 mr-1" /> Reset
								</Button>
							{:else}
								Aksi
							{/if}
						</TableHead>
					</TableRow>
					<TableRow class="bg-muted/30">
						<TableHead class="px-2 py-1.5">
							<Input
								placeholder="Cari kode..."
								bind:value={filterCode}
								oninput={() => (page = 1)}
								class="h-8 text-xs bg-background"
							/>
						</TableHead>
						<TableHead class="px-2 py-1.5">
							<Input
								placeholder="Cari nama mapel..."
								bind:value={filterName}
								oninput={() => (page = 1)}
								class="h-8 text-xs bg-background"
							/>
						</TableHead>
						<TableHead class="px-2 py-1.5"></TableHead>
						<TableHead class="px-2 py-1.5"></TableHead>
					</TableRow>
				</TableHeader>
				<TableBody class="divide-y divide-border">
					{#if paginatedSubjects.length === 0}
						<TableRow>
							<TableCell colspan={4} class="py-12 text-center text-muted-foreground text-sm">
								Tidak ada data yang sesuai filter.
							</TableCell>
						</TableRow>
					{:else}
						{#each paginatedSubjects as s (s.id)}
							<TableRow class="hover:bg-accent transition-colors">
								<TableCell class="px-5 py-3.5 font-medium text-foreground">{s.code}</TableCell>
								<TableCell class="px-5 py-3.5 text-muted-foreground">{s.name}</TableCell>
								<TableCell class="px-5 py-3.5 text-center text-muted-foreground">{s.hours_per_week} jam</TableCell>
								<TableCell class="px-5 py-3.5 text-right space-x-3">
									<Button variant="ghost" size="sm" onclick={() => { editSubject = s; showEditModal = true; $form = { ...$form, code: s.code, name: s.name, hours_per_week: s.hours_per_week }; }}>
										<PencilIcon data-icon="inline-start" /> Edit
									</Button>
									<Button variant="destructive" size="sm" onclick={() => { deleteTarget = { id: s.id, name: s.name }; showDeleteModal = true; }}>
										<Trash2Icon data-icon="inline-start" /> Hapus
									</Button>
								</TableCell>
							</TableRow>
						{/each}
					{/if}
				</TableBody>
			</Table>

			<div class="p-4 border-t border-border">
				<Pagination
					bind:page
					bind:pageSize
					totalItems={filteredSubjects.length}
				/>
			</div>
		{/if}
	</Card>
</div>

{#if importSuccess}
	<div class="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-sm">
		{importSuccess}
	</div>
{/if}
{#if importError}
	<div class="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
		{importError}
	</div>
{/if}

<!-- MODAL IMPORT -->
{#if showImportModal}
	<Dialog bind:open={showImportModal}>
		<DialogContent class="sm:max-w-md p-4 sm:p-6">
			<DialogHeader class="mb-5">
				<DialogTitle class="text-lg font-bold text-foreground">Import Mata Pelajaran</DialogTitle>
				<DialogDescription class="text-sm text-muted-foreground mt-1">
					Unduh template, isi data, lalu upload file .xlsx.
				</DialogDescription>
			</DialogHeader>
			<form method="POST" action="?/import" enctype="multipart/form-data" onsubmit={() => (importing = true)} use:enhanceForm={async () => {
					importing = false;
					return async ({ result }) => {
						if (result.type === 'success') {
							const data = result.data as { message?: string; errors?: Record<string, string[]> } | undefined;
							if (data?.message) {
								importSuccess = data.message;
								showImportModal = false;
								setTimeout(() => (importSuccess = ''), 5000);
							}
							if (data?.errors && Object.keys(data.errors).length > 0) {
								importError = 'Format file tidak sesuai. Pastikan kolom: Kode, Nama, Jam per Minggu.';
							}
						} else if (result.type === 'failure' || result.type === 'error') {
							importError = (result as any)?.data?.error ?? 'Gagal mengimpor file';
						}
					};
				}} class="space-y-4">
				<div>
					<Label for="import-file">Pilih File Excel (.xlsx)</Label>
					<Input id="import-file" name="file" type="file" accept=".xlsx,.xls" class={inputCls()} />
					{#if importError}
						<p class="mt-1 text-xs text-destructive">{importError}</p>
					{/if}
				</div>
				<div class="flex justify-end gap-3 pt-2">
					<Button type="button" variant="outline" onclick={() => { showImportModal = false; importError = ''; importSuccess = ''; }}>Batal</Button>
					<Button type="submit" disabled={importing}>
						{importing ? 'Mengimpor...' : 'Import'}
					</Button>
				</div>
			</form>
		</DialogContent>
	</Dialog>
{/if}

<!-- MODAL TAMBAH -->
{#if showAddModal}
	<Dialog bind:open={showAddModal}>
		<DialogContent class="sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
			<DialogHeader class="flex items-center justify-between mb-5">
				<DialogTitle class="text-lg font-bold text-foreground">Tambah Mata Pelajaran</DialogTitle>
				<Button variant="ghost" size="sm" class="h-6 w-6 p-0" onclick={() => (showAddModal = false)}>✕</Button>
			</DialogHeader>
			{#if $message}
				<Alert variant="destructive" class="mb-4">
					<AlertDescription>{$message}</AlertDescription>
				</Alert>
			{/if}
			<form method="POST" action="?/create" use:enhance class="space-y-4">
				<div>
					<Label for="create-code-input">Kode *</Label>
					<Input id="create-code-input" name="code" bind:value={$form.code} type="text" placeholder="Contoh: MIPA" class={inputCls(hasError($errors.code) ? ['e'] : undefined)} />
					{#if $errors.code}<p class="mt-1 text-xs text-destructive">{fieldError($errors.code)}</p>{/if}
				</div>
				<div>
					<Label for="create-name-input">Nama Mata Pelajaran *</Label>
					<Input id="create-name-input" name="name" bind:value={$form.name} type="text" placeholder="Contoh: Matematika" class={inputCls(hasError($errors.name) ? ['e'] : undefined)} />
					{#if $errors.name}<p class="mt-1 text-xs text-destructive">{fieldError($errors.name)}</p>{/if}
				</div>
				<div>
					<Label for="create-hours-input">Jam per Minggu *</Label>
					<Input id="create-hours-input" name="hours_per_week" bind:value={$form.hours_per_week} type="number" min="1" max="40" placeholder="2" class={inputCls(hasError($errors.hours_per_week) ? ['e'] : undefined)} />
					{#if $errors.hours_per_week}<p class="mt-1 text-xs text-destructive">{fieldError($errors.hours_per_week)}</p>{/if}
				</div>
				<div class="flex justify-end gap-3 pt-2">
					<Button type="button" variant="outline" onclick={() => (showAddModal = false)}>Batal</Button>
					<Button type="submit" disabled={$submitting}>
						{$submitting ? 'Menyimpan...' : 'Simpan'}
					</Button>
				</div>
			</form>
		</DialogContent>
	</Dialog>
{/if}

<!-- MODAL EDIT -->
{#if editSubject}
	{@const s = editSubject as any}
	<Dialog bind:open={showEditModal}>
		<DialogContent class="sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
			<DialogHeader class="flex items-center justify-between mb-5">
				<DialogTitle class="text-lg font-bold text-foreground">Edit Mata Pelajaran</DialogTitle>
				<Button variant="ghost" size="sm" class="h-6 w-6 p-0" onclick={() => { editSubject = null; showEditModal = false; }}>✕</Button>
			</DialogHeader>
			<form method="POST" action="?/update" class="space-y-4">
				<input type="hidden" name="id" value={s.id} />
				<div>
					<Label for="edit-code-input">Kode *</Label>
					<Input id="edit-code-input" name="code" bind:value={$form.code} type="text" class={inputCls()} />
				</div>
				<div>
					<Label for="edit-name-input">Nama Mata Pelajaran *</Label>
					<Input id="edit-name-input" name="name" bind:value={$form.name} type="text" class={inputCls()} />
				</div>
				<div>
					<Label for="edit-hours-input">Jam per Minggu *</Label>
					<Input id="edit-hours-input" name="hours_per_week" bind:value={$form.hours_per_week} type="number" min="1" max="40" class={inputCls()} />
				</div>
				<div class="flex justify-end gap-3 pt-2">
					<Button type="button" variant="outline" onclick={() => { editSubject = null; showEditModal = false; }}>Batal</Button>
					<Button type="submit">Simpan Perubahan</Button>
				</div>
			</form>
		</DialogContent>
	</Dialog>
{/if}

<!-- MODAL HAPUS -->
{#if deleteTarget}
	<Dialog bind:open={showDeleteModal}>
		<DialogContent class="sm:max-w-sm p-4 sm:p-6">
			<DialogHeader>
				<DialogTitle class="text-lg font-bold text-foreground">Hapus Mata Pelajaran?</DialogTitle>
				<DialogDescription class="text-sm text-muted-foreground">
					Mata pelajaran <strong>{deleteTarget.name}</strong> akan dihapus. Tindakan ini tidak dapat dibatalkan.
				</DialogDescription>
			</DialogHeader>
			<DialogFooter class="gap-2 pt-2">
				<Button type="button" variant="outline" onclick={() => { deleteTarget = null; showDeleteModal = false; }}>Batal</Button>
				<form method="POST" action="?/delete">
					<input type="hidden" name="id" value={deleteTarget.id} />
					<Button type="submit" variant="destructive">Ya, Hapus</Button>
				</form>
			</DialogFooter>
		</DialogContent>
	</Dialog>
{/if}
