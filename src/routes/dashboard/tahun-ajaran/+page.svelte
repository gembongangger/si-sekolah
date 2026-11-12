<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { fieldError, hasError } from '$lib/form-helpers';
	import { zodClient } from 'sveltekit-superforms/adapters/zod4';
	import { academicYearSchema } from '$lib/validation/academic-year';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
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
		validators: zodClient(academicYearSchema),
		onUpdated({ form: f }) {
			if (String(f.message).includes('berhasil')) {
				showAddModal = false;
				editYear = null;
				reset();
			}
		}
	});

	let showAddModal = $state(false);
	let showEditModal = $state(false);
	let showDeleteModal = $state(false);
	let editYear: (typeof data.academicYears)[0] | null = $state(null);
	let deleteTarget: { id: number; name: string } | null = $state(null);

	function inputCls(err?: unknown) {
		const hasErr = Array.isArray(err) ? err.length > 0 : (err != null && typeof err === 'object' && '_errors' in err ? !!(err as any)._errors?.length : !!err);
		return `w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-colors ${
			hasErr ? 'border-destructive focus:ring-destructive' : 'border-input focus:ring-ring'
		}`;
	}
</script>

<svelte:head>
	<title>Tahun Ajaran — SIS</title>
</svelte:head>

<div class="max-w-5xl">
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-xl font-bold text-foreground">Tahun Ajaran</h1>
			<p class="text-sm text-muted-foreground mt-0.5">Kelola data tahun ajaran sekolah</p>
		</div>
		<Button onclick={() => (showAddModal = true)}>+ Tambah Tahun Ajaran</Button>
	</div>

	<Card>
		{#if data.academicYears.length === 0}
			<div class="py-16 text-center text-muted-foreground text-sm">Belum ada tahun ajaran terdaftar.</div>
		{:else}
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead class="px-5 py-3 font-medium text-muted-foreground">Nama</TableHead>
						<TableHead class="px-5 py-3 font-medium text-muted-foreground">Semester</TableHead>
						<TableHead class="px-5 py-3 font-medium text-muted-foreground">Tanggal Mulai</TableHead>
						<TableHead class="px-5 py-3 font-medium text-muted-foreground">Tanggal Selesai</TableHead>
						<TableHead class="px-5 py-3 font-medium text-muted-foreground">Status</TableHead>
						<TableHead class="text-right px-5 py-3 font-medium text-muted-foreground">Aksi</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody class="divide-y divide-border">
					{#each data.academicYears as ay (ay.id)}
						<TableRow class="hover:bg-accent transition-colors">
							<TableCell class="px-5 py-3.5 font-medium text-foreground">{ay.name}</TableCell>
							<TableCell class="px-5 py-3.5 text-muted-foreground">{ay.semester}</TableCell>
							<TableCell class="px-5 py-3.5 text-muted-foreground text-sm">{ay.start_date}</TableCell>
							<TableCell class="px-5 py-3.5 text-muted-foreground text-sm">{ay.end_date}</TableCell>
							<TableCell class="px-5 py-3.5">
								<Badge class={ay.is_active ? 'bg-success/10 text-success-foreground' : 'bg-muted text-muted-foreground'}>
									{ay.is_active ? 'Aktif' : 'Nonaktif'}
								</Badge>
							</TableCell>
							<TableCell class="px-5 py-3.5 text-right space-x-3">
								<Button variant="ghost" size="sm" onclick={() => { editYear = ay; showEditModal = true; }}>Edit</Button>
								<Button variant="destructive" size="sm" onclick={() => { deleteTarget = { id: ay.id, name: ay.name }; showDeleteModal = true; }}>Hapus</Button>
							</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		{/if}
	</Card>
</div>

<!-- MODAL TAMBAH -->
{#if showAddModal}
	<Dialog bind:open={showAddModal}>
		<DialogContent class="sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
			<DialogHeader class="flex items-center justify-between mb-5">
				<DialogTitle class="text-lg font-bold text-foreground">Tambah Tahun Ajaran</DialogTitle>
				<Button variant="ghost" size="sm" class="h-6 w-6 p-0" onclick={() => (showAddModal = false)}>✕</Button>
			</DialogHeader>
			{#if $message}
				<Alert variant="destructive" class="mb-4">
					<AlertDescription>{$message}</AlertDescription>
				</Alert>
			{/if}
			<form method="POST" action="?/create" use:enhance class="space-y-4">
				<div>
					<Label for="create-name-input">Nama Tahun Ajaran *</Label>
					<Input id="create-name-input" name="name" bind:value={$form.name} type="text" placeholder="Contoh: 2024/2025" class={inputCls(hasError($errors.name) ? ['e'] : undefined)} />
					{#if $errors.name}<p class="mt-1 text-xs text-destructive">{fieldError($errors.name)}</p>{/if}
				</div>
				<div>
					<Label for="create-semester-select">Semester *</Label>
					<select id="create-semester-select" name="semester" bind:value={$form.semester} class={inputCls(hasError($errors.semester) ? ['e'] : undefined)}>
						<option value="ganjil">Ganjil</option>
						<option value="genap">Genap</option>
					</select>
					{#if $errors.semester}<p class="mt-1 text-xs text-destructive">{fieldError($errors.semester)}</p>{/if}
				</div>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<Label for="create-start-input">Tanggal Mulai *</Label>
						<Input id="create-start-input" name="start_date" bind:value={$form.start_date} type="date" class={inputCls(hasError($errors.start_date) ? ['e'] : undefined)} />
						{#if $errors.start_date}<p class="mt-1 text-xs text-destructive">{fieldError($errors.start_date)}</p>{/if}
					</div>
					<div>
						<Label for="create-end-input">Tanggal Selesai *</Label>
						<Input id="create-end-input" name="end_date" bind:value={$form.end_date} type="date" class={inputCls(hasError($errors.end_date) ? ['e'] : undefined)} />
						{#if $errors.end_date}<p class="mt-1 text-xs text-destructive">{fieldError($errors.end_date)}</p>{/if}
					</div>
				</div>
				<div>
					<Label for="create-status-input">Status</Label>
					<select id="create-status-input" name="is_active" bind:value={$form.is_active} class={inputCls()}>
						<option value={1}>Aktif</option>
						<option value={0}>Nonaktif</option>
					</select>
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
{#if editYear}
	{@const ay = editYear as any}
	<Dialog bind:open={showEditModal}>
		<DialogContent class="sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
			<DialogHeader class="flex items-center justify-between mb-5">
				<DialogTitle class="text-lg font-bold text-foreground">Edit Tahun Ajaran</DialogTitle>
				<Button variant="ghost" size="sm" class="h-6 w-6 p-0" onclick={() => { editYear = null; showEditModal = false; }}>✕</Button>
			</DialogHeader>
			<form method="POST" action="?/update" class="space-y-4">
				<input type="hidden" name="id" value={ay.id} />
				<div>
					<Label for="edit-name-input">Nama Tahun Ajaran *</Label>
					<Input id="edit-name-input" name="name" bind:value={$form.name} type="text" class={inputCls()} />
				</div>
				<div>
					<Label for="edit-semester-select">Semester *</Label>
					<select id="edit-semester-select" name="semester" class={inputCls()}>
						<option value="ganjil" selected={ay.semester === 'ganjil'}>Ganjil</option>
						<option value="genap" selected={ay.semester === 'genap'}>Genap</option>
					</select>
				</div>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<Label for="edit-start-input">Tanggal Mulai *</Label>
						<Input id="edit-start-input" name="start_date" bind:value={$form.start_date} type="date" class={inputCls()} />
					</div>
					<div>
						<Label for="edit-end-input">Tanggal Selesai *</Label>
						<Input id="edit-end-input" name="end_date" bind:value={$form.end_date} type="date" class={inputCls()} />
					</div>
				</div>
				<div>
					<Label for="edit-status-input">Status</Label>
					<select id="edit-status-input" name="is_active" class={inputCls()}>
						<option value={1} selected={ay.is_active === 1}>Aktif</option>
						<option value={0} selected={ay.is_active === 0}>Nonaktif</option>
					</select>
				</div>
				<div class="flex justify-end gap-3 pt-2">
					<Button type="button" variant="outline" onclick={() => { editYear = null; showEditModal = false; }}>Batal</Button>
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
				<DialogTitle class="text-lg font-bold text-foreground">Hapus Tahun Ajaran?</DialogTitle>
				<DialogDescription class="text-sm text-muted-foreground">
					Tahun ajaran <strong>{deleteTarget.name}</strong> akan dihapus. Tindakan ini tidak dapat dibatalkan.
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
