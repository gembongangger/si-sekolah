<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { fieldError, hasError } from '$lib/form-helpers';
	import { zodClient } from 'sveltekit-superforms/adapters/zod4';
	import { guruCreateSchema } from '$lib/validation/guru';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert/index.js';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog/index.js';
	import { Pagination } from '$lib/components/ui/pagination/index.js';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';

	let { data }: { data: PageData } = $props();

	const { form, errors, message, enhance, submitting, reset } = superForm(data.form, {
		validators: zodClient(guruCreateSchema),
		onUpdated({ form: f }) {
			if (String(f.message).includes('berhasil')) {
				showAddModal = false;
				reset();
			}
		}
	});

	let showAddModal = $state(false);
	let showEditModal = $state(false);
	let showDeleteModal = $state(false);
	let editGuru: (typeof data.gurus)[0] | null = $state(null);
	let deleteTarget: { id: number; name: string } | null = $state(null);

	let page = $state(1);
	let pageSize = $state(10);
	let filterName = $state('');
	let filterEmail = $state('');
	let filterNip = $state('');
	let filterGender = $state('');
	let filterStatus = $state('');

	function resetFilters() {
		filterName = '';
		filterEmail = '';
		filterNip = '';
		filterGender = '';
		filterStatus = '';
		page = 1;
	}

	let hasActiveFilter = $derived(!!(filterName || filterEmail || filterNip || filterGender || filterStatus));

	let filteredGurus = $derived(
		data.gurus.filter((g) => {
			if (filterName && !g.name.toLowerCase().includes(filterName.toLowerCase())) return false;
			if (filterEmail && !g.email.toLowerCase().includes(filterEmail.toLowerCase())) return false;
			if (filterNip && !(g.nip ?? '').toLowerCase().includes(filterNip.toLowerCase())) return false;
			if (filterGender && g.gender !== filterGender) return false;
			if (filterStatus !== '') {
				if (g.is_active !== (filterStatus === '1' ? 1 : 0)) return false;
			}
			return true;
		})
	);

	let paginatedGurus = $derived(
		filteredGurus.slice((page - 1) * pageSize, page * pageSize)
	);

	function inputCls(err?: unknown) {
		const hasErr = Array.isArray(err) ? err.length > 0 : (err != null && typeof err === 'object' && '_errors' in err ? !!(err as any)._errors?.length : !!err);
		return `w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-colors ${
			hasErr ? 'border-destructive focus:ring-destructive' : 'border-input focus:ring-ring'
		}`;
	}
</script>

<svelte:head>
	<title>Manajemen Guru — SIS</title>
</svelte:head>

<div class="max-w-5xl">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
		<div>
			<h1 class="text-xl font-bold text-foreground">Manajemen Guru</h1>
			<p class="text-sm text-muted-foreground mt-0.5">Kelola data guru di sekolah Anda</p>
		</div>
		<Button onclick={() => (showAddModal = true)} class="min-h-11 w-full sm:w-auto">+ Tambah Guru</Button>
	</div>

	<Card>
		{#if data.gurus.length === 0}
			<div class="py-16 text-center text-muted-foreground text-sm">Belum ada guru terdaftar.</div>
		{:else}
			<!-- Mobile filter bar -->
			<div class="md:hidden p-3 border-b border-border bg-muted/20 space-y-2">
				<div class="flex items-center gap-2">
					<Input
						bind:value={filterName}
						oninput={() => (page = 1)}
						placeholder="Cari guru..."
						class="h-8 text-xs bg-background flex-1"
					/>
					{#if hasActiveFilter}
						<Button variant="ghost" size="sm" class="h-8 px-2 text-xs" onclick={resetFilters}>
							<RotateCcw class="w-3.5 h-3.5" />
						</Button>
					{/if}
				</div>
				<div class="grid grid-cols-3 gap-2">
					<Input
						bind:value={filterNip}
						oninput={() => (page = 1)}
						placeholder="NIP..."
						class="h-8 text-xs bg-background"
					/>
					<select
						bind:value={filterGender}
						onchange={() => (page = 1)}
						class="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
					>
						<option value="">L/P</option>
						<option value="L">L</option>
						<option value="P">P</option>
					</select>
					<select
						bind:value={filterStatus}
						onchange={() => (page = 1)}
						class="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
					>
						<option value="">Status</option>
						<option value="1">Aktif</option>
						<option value="0">Nonaktif</option>
					</select>
				</div>
			</div>

			<!-- Mobile: kartu -->
			<div class="md:hidden divide-y divide-border">
				{#each paginatedGurus as guru (guru.id)}
					<div class="p-4 space-y-2.5">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0">
								<p class="font-medium text-foreground truncate">{guru.name}</p>
								<p class="text-xs text-muted-foreground break-all">{guru.email}</p>
							</div>
							{#if guru.is_active}
								<Badge class="bg-success/10 text-success-foreground shrink-0">Aktif</Badge>
							{:else}
								<Badge variant="secondary" class="shrink-0">Nonaktif</Badge>
							{/if}
						</div>
						<p class="text-xs text-muted-foreground font-mono">NIP: {guru.nip ?? '—'}{guru.gender ? ` · ${guru.gender}` : ''}</p>
						<div class="flex gap-2 pt-0.5">
							<Button variant="outline" size="sm" class="flex-1 min-h-10" onclick={() => { editGuru = guru; showEditModal = true; }}>
								<PencilIcon data-icon="inline-start" /> Edit
							</Button>
							<Button variant="destructive" size="sm" class="flex-1 min-h-10" onclick={() => { deleteTarget = { id: guru.id, name: guru.name }; showDeleteModal = true; }}>
								<Trash2Icon data-icon="inline-start" /> Hapus
							</Button>
						</div>
					</div>
				{/each}
				{#if filteredGurus.length === 0}
					<div class="py-12 text-center text-muted-foreground text-sm">Tidak ada data yang cocok dengan filter.</div>
				{/if}
			</div>

			<!-- Desktop: tabel -->
			<div class="hidden md:block">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead class="px-5 py-3 font-medium text-muted-foreground">Nama</TableHead>
						<TableHead class="px-5 py-3 font-medium text-muted-foreground">Email</TableHead>
						<TableHead class="px-5 py-3 font-medium text-muted-foreground">NIP</TableHead>
						<TableHead class="px-5 py-3 font-medium text-muted-foreground">L/P</TableHead>
						<TableHead class="px-5 py-3 font-medium text-muted-foreground">Status</TableHead>
						<TableHead class="text-right px-5 py-3 font-medium text-muted-foreground">Aksi</TableHead>
					</TableRow>
					<TableRow class="bg-muted/30">
						<TableHead class="p-2">
							<Input
								bind:value={filterName}
								oninput={() => (page = 1)}
								placeholder="Cari nama..."
								class="h-8 text-xs bg-background"
							/>
						</TableHead>
						<TableHead class="p-2">
							<Input
								bind:value={filterEmail}
								oninput={() => (page = 1)}
								placeholder="Cari email..."
								class="h-8 text-xs bg-background"
							/>
						</TableHead>
						<TableHead class="p-2">
							<Input
								bind:value={filterNip}
								oninput={() => (page = 1)}
								placeholder="Cari NIP..."
								class="h-8 text-xs bg-background"
							/>
						</TableHead>
						<TableHead class="p-2">
							<select
								bind:value={filterGender}
								onchange={() => (page = 1)}
								class="h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
							>
								<option value="">Semua</option>
								<option value="L">L</option>
								<option value="P">P</option>
							</select>
						</TableHead>
						<TableHead class="p-2">
							<select
								bind:value={filterStatus}
								onchange={() => (page = 1)}
								class="h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
							>
								<option value="">Semua</option>
								<option value="1">Aktif</option>
								<option value="0">Nonaktif</option>
							</select>
						</TableHead>
						<TableHead class="p-2 text-right">
							{#if hasActiveFilter}
								<Button variant="ghost" size="sm" class="h-8 px-2 text-xs" onclick={resetFilters} title="Reset filter">
									<RotateCcw class="w-3.5 h-3.5 mr-1" /> Reset
								</Button>
							{/if}
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody class="divide-y divide-border">
					{#each paginatedGurus as guru (guru.id)}
						<TableRow class="hover:bg-accent transition-colors">
							<TableCell class="px-5 py-3.5 font-medium text-foreground">{guru.name}</TableCell>
							<TableCell class="px-5 py-3.5 text-muted-foreground">{guru.email}</TableCell>
							<TableCell class="px-5 py-3.5 text-muted-foreground font-mono text-xs">{guru.nip ?? '—'}</TableCell>
							<TableCell class="px-5 py-3.5 text-muted-foreground">{guru.gender ?? '—'}</TableCell>
							<TableCell class="px-5 py-3.5">
								{#if guru.is_active}
									<Badge class="bg-success/10 text-success-foreground">Aktif</Badge>
								{:else}
									<Badge variant="secondary">Nonaktif</Badge>
								{/if}
							</TableCell>
							<TableCell class="px-5 py-3.5 text-right space-x-3">
								<Button variant="ghost" size="sm" onclick={() => { editGuru = guru; showEditModal = true; }}>
									<PencilIcon data-icon="inline-start" /> Edit
								</Button>
								<Button variant="destructive" size="sm" onclick={() => { deleteTarget = { id: guru.id, name: guru.name }; showDeleteModal = true; }}>
									<Trash2Icon data-icon="inline-start" /> Hapus
								</Button>
							</TableCell>
						</TableRow>
					{/each}
					{#if filteredGurus.length === 0}
						<TableRow>
							<TableCell colspan={6} class="py-12 text-center text-muted-foreground text-sm">
								Tidak ada data yang cocok dengan filter.
							</TableCell>
						</TableRow>
					{/if}
				</TableBody>
			</Table>
			</div>

			<Pagination bind:page bind:pageSize totalItems={filteredGurus.length} />
		{/if}
	</Card>
</div>

<!-- MODAL TAMBAH -->
{#if showAddModal}
	<Dialog bind:open={showAddModal}>
		<DialogContent class="sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
			<DialogHeader class="flex items-center justify-between mb-5">
				<DialogTitle class="text-lg font-bold text-foreground">Tambah Guru</DialogTitle>
				<Button variant="ghost" size="sm" class="h-6 w-6 p-0" onclick={() => (showAddModal = false)}>✕</Button>
			</DialogHeader>
			{#if $message}
				<Alert variant="destructive" class="mb-4">
					<AlertDescription>{$message}</AlertDescription>
				</Alert>
			{/if}
			<form method="POST" action="?/create" use:enhance class="space-y-4">
				<div>
					<Label for="create-name-input">Nama Lengkap *</Label>
					<Input id="create-name-input" name="name" bind:value={$form.name} type="text" class={inputCls(hasError($errors.name) ? ['e'] : undefined)} />
					{#if $errors.name}<p class="mt-1 text-xs text-destructive">{fieldError($errors.name)}</p>{/if}
				</div>
				<div>
					<Label for="create-email-input">Email *</Label>
					<Input id="create-email-input" name="email" bind:value={$form.email} type="email" class={inputCls(hasError($errors.email) ? ['e'] : undefined)} />
					{#if $errors.email}<p class="mt-1 text-xs text-destructive">{fieldError($errors.email)}</p>{/if}
				</div>
				<div>
					<Label for="create-password-input">Password *</Label>
					<Input id="create-password-input" name="password" bind:value={$form.password} type="password" placeholder="Min. 8 karakter" class={inputCls(hasError($errors.password) ? ['e'] : undefined)} />
					{#if $errors.password}<p class="mt-1 text-xs text-destructive">{fieldError($errors.password)}</p>{/if}
				</div>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<Label for="create-nip-input">NIP</Label>
						<Input id="create-nip-input" name="nip" bind:value={$form.nip} type="text" class={inputCls()} />
					</div>
					<div>
						<Label for="create-gender-input">Jenis Kelamin</Label>
						<select id="create-gender-input" name="gender" bind:value={$form.gender} class={inputCls()}>
							<option value="">— Pilih —</option>
							<option value="L">Laki-laki</option>
							<option value="P">Perempuan</option>
						</select>
					</div>
				</div>
				<div>
					<Label for="create-phone-input">Telepon</Label>
					<Input id="create-phone-input" name="phone" bind:value={$form.phone} type="text" class={inputCls()} />
				</div>
				<div>
					<Label for="create-status-input">Status</Label>
					<select id="create-status-input" name="is_active" bind:value={$form.is_active} class={inputCls()}>
						<option value={1}>Aktif</option>
						<option value={0}>Nonaktif</option>
					</select>
				</div>
				<DialogFooter class="gap-2 pt-2">
					<Button type="button" variant="outline" onclick={() => (showAddModal = false)}>Batal</Button>
					<Button type="submit" disabled={$submitting}>
						{$submitting ? 'Menyimpan...' : 'Simpan'}
					</Button>
				</DialogFooter>
			</form>
		</DialogContent>
	</Dialog>
{/if}

<!-- MODAL EDIT -->
{#if editGuru}
	{@const g = editGuru}
	<Dialog bind:open={showEditModal}>
		<DialogContent class="sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
			<DialogHeader class="flex items-center justify-between mb-5">
				<DialogTitle class="text-lg font-bold text-foreground">Edit Guru</DialogTitle>
				<Button variant="ghost" size="sm" class="h-6 w-6 p-0" onclick={() => (editGuru = null)}>✕</Button>
			</DialogHeader>
			<form method="POST" action="?/update" class="space-y-4">
				<input type="hidden" name="id" value={g.id} />
				<div>
					<Label for="edit-name-input">Nama Lengkap *</Label>
					<Input id="edit-name-input" name="name" value={g.name} type="text" class={inputCls()} />
				</div>
				<div>
					<Label for="edit-email-input">Email *</Label>
					<Input id="edit-email-input" name="email" value={g.email} type="email" class={inputCls()} />
				</div>
				<div>
					<Label for="edit-password-input">Password Baru <span class="font-normal text-muted-foreground">(kosongkan jika tidak diubah)</span></Label>
					<Input id="edit-password-input" name="password" type="password" class={inputCls()} />
				</div>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<Label for="edit-nip-input">NIP</Label>
						<Input id="edit-nip-input" name="nip" value={g.nip ?? ''} type="text" class={inputCls()} />
					</div>
					<div>
						<Label for="edit-gender-input">Jenis Kelamin</Label>
						<select id="edit-gender-input" name="gender" class={inputCls()}>
							<option value="">— Pilih —</option>
							<option value="L" selected={g.gender === 'L'}>Laki-laki</option>
							<option value="P" selected={g.gender === 'P'}>Perempuan</option>
						</select>
					</div>
				</div>
				<div>
					<Label for="edit-phone-input">Telepon</Label>
					<Input id="edit-phone-input" name="phone" value={g.phone ?? ''} type="text" class={inputCls()} />
				</div>
				<div>
					<Label for="edit-status-input">Status</Label>
					<select id="edit-status-input" name="is_active" class={inputCls()}>
						<option value={1} selected={g.is_active === 1}>Aktif</option>
						<option value={0} selected={g.is_active === 0}>Nonaktif</option>
					</select>
				</div>
				<DialogFooter class="gap-2 pt-2">
					<Button type="button" variant="outline" onclick={() => { editGuru = null; showEditModal = false; }}>Batal</Button>
					<Button type="submit">Simpan Perubahan</Button>
				</DialogFooter>
			</form>
		</DialogContent>
	</Dialog>
{/if}

<!-- MODAL HAPUS -->
{#if deleteTarget}
	<Dialog bind:open={showDeleteModal}>
		<DialogContent class="sm:max-w-sm p-4 sm:p-6">
			<DialogHeader>
				<DialogTitle class="text-lg font-bold text-foreground">Hapus Guru?</DialogTitle>
				<DialogDescription class="text-sm text-muted-foreground">
					Akun <strong>{deleteTarget.name}</strong> akan dihapus. Tindakan ini tidak dapat dibatalkan.
				</DialogDescription>
			</DialogHeader>
			<DialogFooter class="gap-2 pt-2">
				<Button variant="outline" onclick={() => { deleteTarget = null; showDeleteModal = false; }}>Batal</Button>
				<form method="POST" action="?/delete">
					<input type="hidden" name="id" value={deleteTarget.id} />
					<Button type="submit" variant="destructive">Ya, Hapus</Button>
				</form>
			</DialogFooter>
		</DialogContent>
	</Dialog>
{/if}
