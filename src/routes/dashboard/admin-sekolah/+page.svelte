<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { fieldError, hasError } from '$lib/form-helpers';
	import { zodClient } from 'sveltekit-superforms/adapters/zod4';
	import { adminSekolahCreateSchema } from '$lib/validation/admin-sekolah';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
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

	let { data }: { data: PageData } = $props();

	const { form, errors, message, enhance, submitting, reset } = superForm(data.form, {
		validators: zodClient(adminSekolahCreateSchema),
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
	let editAdmin: (typeof data.admins)[0] | null = $state(null);
	let deleteTarget: { id: number; name: string } | null = $state(null);

	function inputCls(err?: unknown) {
		const hasErr = Array.isArray(err) ? err.length > 0 : (err != null && typeof err === 'object' && '_errors' in err ? !!(err as any)._errors?.length : !!err);
		return `w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-colors ${
			hasErr ? 'border-destructive focus:ring-destructive' : 'border-input focus:ring-ring'
		}`;
	}
</script>

<svelte:head>
	<title>Admin Sekolah — SIS</title>
</svelte:head>

<div class="max-w-5xl">
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-xl font-bold text-foreground">Manajemen Admin Sekolah</h1>
			<p class="text-sm text-muted-foreground mt-0.5">Kelola akun admin untuk setiap sekolah</p>
		</div>
		<Button onclick={() => (showAddModal = true)}>+ Tambah Admin</Button>
	</div>

	<Card>
		{#if data.admins.length === 0}
			<div class="py-16 text-center text-muted-foreground text-sm">Belum ada admin sekolah terdaftar.</div>
		{:else}
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead class="px-5 py-3 font-medium text-muted-foreground">Nama</TableHead>
						<TableHead class="px-5 py-3 font-medium text-muted-foreground">Email</TableHead>
						<TableHead class="px-5 py-3 font-medium text-muted-foreground">Sekolah</TableHead>
						<TableHead class="px-5 py-3 font-medium text-muted-foreground">Status</TableHead>
						<TableHead class="text-right px-5 py-3 font-medium text-muted-foreground">Aksi</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody class="divide-y divide-border">
					{#each data.admins as admin (admin.id)}
						<TableRow class="hover:bg-accent transition-colors">
							<TableCell class="px-5 py-3.5 font-medium text-foreground">{admin.name}</TableCell>
							<TableCell class="px-5 py-3.5 text-muted-foreground">{admin.email}</TableCell>
							<TableCell class="px-5 py-3.5 text-muted-foreground">{admin.school_name ?? '—'}</TableCell>
							<TableCell class="px-5 py-3.5">
								{#if admin.is_active}
									<Badge class="bg-success/10 text-success-foreground">Aktif</Badge>
								{:else}
									<Badge variant="secondary">Nonaktif</Badge>
								{/if}
							</TableCell>
							<TableCell class="px-5 py-3.5 text-right space-x-3">
								<Button variant="ghost" size="sm" onclick={() => { editAdmin = admin; showEditModal = true; }}>Edit</Button>
								<Button variant="destructive" size="sm" onclick={() => { deleteTarget = { id: admin.id, name: admin.name }; showDeleteModal = true; }}>Hapus</Button>
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
				<DialogTitle class="text-lg font-bold text-foreground">Tambah Admin Sekolah</DialogTitle>
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
				<div>
					<Label for="create-school-select">Sekolah *</Label>
					<select id="create-school-select" name="school_id" bind:value={$form.school_id} class={inputCls(hasError($errors.school_id) ? ['e'] : undefined)}>
						<option value="">— Pilih Sekolah —</option>
						{#each data.schools as school (school.id)}
							<option value={school.id}>{school.name} ({school.npsn})</option>
						{/each}
					</select>
					{#if $errors.school_id}<p class="mt-1 text-xs text-destructive">{fieldError($errors.school_id)}</p>{/if}
				</div>
				<div>
					<Label for="create-status-select">Status</Label>
					<select id="create-status-select" name="is_active" bind:value={$form.is_active} class={inputCls()}>
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
{#if editAdmin}
	{@const a = editAdmin}
	<Dialog bind:open={showEditModal}>
		<DialogContent class="sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
			<DialogHeader class="flex items-center justify-between mb-5">
				<DialogTitle class="text-lg font-bold text-foreground">Edit Admin Sekolah</DialogTitle>
				<Button variant="ghost" size="sm" class="h-6 w-6 p-0" onclick={() => (editAdmin = null)}>✕</Button>
			</DialogHeader>
			<form method="POST" action="?/update" class="space-y-4">
				<input type="hidden" name="id" value={a.id} />
				<div>
					<Label for="edit-name-input">Nama Lengkap *</Label>
					<Input id="edit-name-input" name="name" value={a.name} type="text" class={inputCls()} />
				</div>
				<div>
					<Label for="edit-email-input">Email *</Label>
					<Input id="edit-email-input" name="email" value={a.email} type="email" class={inputCls()} />
				</div>
				<div>
					<Label for="edit-password-input">Password Baru <span class="font-normal text-muted-foreground">(kosongkan jika tidak diubah)</span></Label>
					<Input id="edit-password-input" name="password" type="password" placeholder="Min. 8 karakter" class={inputCls()} />
				</div>
				<div>
					<Label for="edit-school-select">Sekolah *</Label>
					<select id="edit-school-select" name="school_id" class={inputCls()}>
						{#each data.schools as school (school.id)}
							<option value={school.id} selected={a.school_id === school.id}>{school.name} ({school.npsn})</option>
						{/each}
					</select>
				</div>
				<div>
					<Label for="edit-status-select">Status</Label>
					<select id="edit-status-select" name="is_active" class={inputCls()}>
						<option value={1} selected={a.is_active === 1}>Aktif</option>
						<option value={0} selected={a.is_active === 0}>Nonaktif</option>
					</select>
				</div>
				<DialogFooter class="gap-2 pt-2">
					<Button type="button" variant="outline" onclick={() => { editAdmin = null; showEditModal = false; }}>Batal</Button>
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
				<DialogTitle class="text-lg font-bold text-foreground">Hapus Admin Sekolah?</DialogTitle>
				<DialogDescription class="text-sm text-muted-foreground">
					Akun <strong>{deleteTarget.name}</strong> akan dihapus. Tindakan ini tidak dapat dibatalkan.
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
