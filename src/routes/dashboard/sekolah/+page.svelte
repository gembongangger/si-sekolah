<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { fieldError, hasError } from '$lib/form-helpers';
	import { zodClient } from 'sveltekit-superforms/adapters/zod4';
	import { schoolSchema } from '$lib/validation/school';
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
		validators: zodClient(schoolSchema),
		onUpdated({ form: f }) {
			if (String(f.message).includes('berhasil')) {
				showAddModal = false;
				editSchool = null;
				reset();
			}
		}
	});

	let showAddModal = $state(false);
	let showEditModal = $state(false);
	let showDeleteModal = $state(false);
	let editSchool: (typeof data.schools)[0] | null = $state(null);
	let deleteTarget: { id: number; name: string } | null = $state(null);

	function inputCls(err?: unknown) {
		const hasErr = Array.isArray(err) ? err.length > 0 : (err != null && typeof err === 'object' && '_errors' in err ? !!(err as any)._errors?.length : !!err);
		return `w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-colors ${
			hasErr ? 'border-destructive focus:ring-destructive' : 'border-input focus:ring-ring'
		}`;
	}
</script>

<svelte:head>
	<title>Sekolah — SIS</title>
</svelte:head>

<div class="max-w-5xl">
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-xl font-bold text-foreground">Sekolah</h1>
			<p class="text-sm text-muted-foreground mt-0.5">Kelola data sekolah yang terdaftar</p>
		</div>
		<Button onclick={() => (showAddModal = true)}>+ Tambah Sekolah</Button>
	</div>

	<Card>
		{#if data.schools.length === 0}
			<div class="py-16 text-center text-muted-foreground text-sm">Belum ada sekolah terdaftar.</div>
		{:else}
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead class="px-5 py-3 font-medium text-muted-foreground">Nama Sekolah</TableHead>
						<TableHead class="px-5 py-3 font-medium text-muted-foreground">NPSN</TableHead>
						<TableHead class="px-5 py-3 font-medium text-muted-foreground">Telepon</TableHead>
						<TableHead class="px-5 py-3 font-medium text-muted-foreground">Email</TableHead>
						<TableHead class="px-5 py-3 font-medium text-muted-foreground">Status</TableHead>
						<TableHead class="text-right px-5 py-3 font-medium text-muted-foreground">Aksi</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody class="divide-y divide-border">
					{#each data.schools as s (s.id)}
						<TableRow class="hover:bg-accent transition-colors">
							<TableCell class="px-5 py-3.5 font-medium text-foreground">{s.name}</TableCell>
							<TableCell class="px-5 py-3.5 text-muted-foreground">{s.npsn}</TableCell>
							<TableCell class="px-5 py-3.5 text-muted-foreground">{s.phone ?? '—'}</TableCell>
							<TableCell class="px-5 py-3.5 text-muted-foreground">{s.email ?? '—'}</TableCell>
							<TableCell class="px-5 py-3.5">
								<Badge class={s.is_active ? 'bg-success/10 text-success-foreground' : 'bg-muted text-muted-foreground'}>
									{s.is_active ? 'Aktif' : 'Nonaktif'}
								</Badge>
							</TableCell>
							<TableCell class="px-5 py-3.5 text-right space-x-3">
								<Button variant="ghost" size="sm" onclick={() => { editSchool = s; showEditModal = true; }}>Edit</Button>
								<Button variant="destructive" size="sm" onclick={() => { deleteTarget = { id: s.id, name: s.name }; showDeleteModal = true; }}>Hapus</Button>
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
				<DialogTitle class="text-lg font-bold text-foreground">Tambah Sekolah</DialogTitle>
				<Button variant="ghost" size="sm" class="h-6 w-6 p-0" onclick={() => (showAddModal = false)}>✕</Button>
			</DialogHeader>
			{#if $message}
				<Alert variant="destructive" class="mb-4">
					<AlertDescription>{$message}</AlertDescription>
				</Alert>
			{/if}
			<form method="POST" action="?/create" use:enhance class="space-y-4">
				<div>
					<Label for="create-name-input">Nama Sekolah *</Label>
					<Input id="create-name-input" name="name" bind:value={$form.name} type="text" placeholder="SDN / SMP / SMA ..." class={inputCls(hasError($errors.name) ? ['e'] : undefined)} />
					{#if $errors.name}<p class="mt-1 text-xs text-destructive">{fieldError($errors.name)}</p>{/if}
				</div>
				<div>
					<Label for="create-npsn-input">NPSN *</Label>
					<Input id="create-npsn-input" name="npsn" bind:value={$form.npsn} type="text" placeholder="8 digit angka" maxlength={8} class={inputCls(hasError($errors.npsn) ? ['e'] : undefined)} />
					{#if $errors.npsn}<p class="mt-1 text-xs text-destructive">{fieldError($errors.npsn)}</p>{/if}
				</div>
				<div>
					<Label for="create-phone-input">Telepon</Label>
					<Input id="create-phone-input" name="phone" bind:value={$form.phone} type="text" class={inputCls(hasError($errors.phone) ? ['e'] : undefined)} />
					{#if $errors.phone}<p class="mt-1 text-xs text-destructive">{fieldError($errors.phone)}</p>{/if}
				</div>
				<div>
					<Label for="create-email-input">Email</Label>
					<Input id="create-email-input" name="email" bind:value={$form.email} type="email" class={inputCls(hasError($errors.email) ? ['e'] : undefined)} />
					{#if $errors.email}<p class="mt-1 text-xs text-destructive">{fieldError($errors.email)}</p>{/if}
				</div>
				<div>
					<Label for="create-address-input">Alamat</Label>
					<textarea name="address" bind:value={$form.address} rows={2} class="{inputCls()} resize-none" />
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
{#if editSchool}
	{@const s = editSchool as any}
	<Dialog bind:open={showEditModal}>
		<DialogContent class="sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
			<DialogHeader class="flex items-center justify-between mb-5">
				<DialogTitle class="text-lg font-bold text-foreground">Edit Sekolah</DialogTitle>
				<Button variant="ghost" size="sm" class="h-6 w-6 p-0" onclick={() => { editSchool = null; showEditModal = false; }}>✕</Button>
			</DialogHeader>
			<form method="POST" action="?/update" class="space-y-4">
				<input type="hidden" name="id" value={s.id} />
				<div>
					<Label for="edit-name-input">Nama Sekolah *</Label>
					<Input id="edit-name-input" name="name" bind:value={$form.name} type="text" class={inputCls()} />
				</div>
				<div>
					<Label for="edit-npsn-input">NPSN *</Label>
					<Input id="edit-npsn-input" name="npsn" bind:value={$form.npsn} type="text" maxlength={8} class={inputCls()} />
				</div>
				<div>
					<Label for="edit-phone-input">Telepon</Label>
					<Input id="edit-phone-input" name="phone" bind:value={$form.phone} type="text" class={inputCls()} />
				</div>
				<div>
					<Label for="edit-email-input">Email</Label>
					<Input id="edit-email-input" name="email" bind:value={$form.email} type="email" class={inputCls()} />
				</div>
				<div>
					<Label for="edit-address-input">Alamat</Label>
					<textarea name="address" bind:value={$form.address} rows={2} class="{inputCls()} resize-none">{s.address ?? ''}</textarea>
				</div>
				<div>
					<Label for="edit-status-input">Status</Label>
					<select id="edit-status-input" name="is_active" class={inputCls()}>
						<option value={1} selected={s.is_active === 1}>Aktif</option>
						<option value={0} selected={s.is_active === 0}>Nonaktif</option>
					</select>
				</div>
				<div class="flex justify-end gap-3 pt-2">
					<Button type="button" variant="outline" onclick={() => { editSchool = null; showEditModal = false; }}>Batal</Button>
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
				<DialogTitle class="text-lg font-bold text-foreground">Hapus Sekolah?</DialogTitle>
				<DialogDescription class="text-sm text-muted-foreground">
					Sekolah <strong>{deleteTarget.name}</strong> akan dihapus. Tindakan ini tidak dapat dibatalkan.
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
