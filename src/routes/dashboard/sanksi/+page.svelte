<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { fieldError, hasError } from '$lib/form-helpers';
	import { zodClient } from 'sveltekit-superforms/adapters/zod4';
	import { sanctionSchema } from '$lib/validation/sanction';
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
		validators: zodClient(sanctionSchema),
		onUpdated({ form: f }) {
			if (String(f.message).includes('berhasil')) {
				showAddModal = false;
				editSanction = null;
				reset();
			}
		}
	});

	let showAddModal = $state(false);
	let showEditModal = $state(false);
	let showDeleteModal = $state(false);
	let editSanction: (typeof data.sanctions)[0] | null = $state(null);
	let deleteTarget: { id: number; name: string } | null = $state(null);

	function inputCls(err?: unknown) {
		const hasErr = Array.isArray(err) ? err.length > 0 : (err != null && typeof err === 'object' && '_errors' in err ? !!(err as any)._errors?.length : !!err);
		return `w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-colors ${
			hasErr ? 'border-destructive focus:ring-destructive' : 'border-input focus:ring-ring'
		}`;
	}
</script>

<svelte:head>
	<title>Sanksi — SIS</title>
</svelte:head>

<div class="max-w-5xl">
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-xl font-bold text-foreground">Sanksi</h1>
			<p class="text-sm text-muted-foreground mt-0.5">Kelola tingkatan sanksi pelanggaran siswa</p>
		</div>
		<Button onclick={() => (showAddModal = true)}>+ Tambah Sanksi</Button>
	</div>

	<Card>
		{#if data.sanctions.length === 0}
			<div class="py-16 text-center text-muted-foreground text-sm">Belum ada sanksi terdaftar.</div>
		{:else}
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead class="px-5 py-3 font-medium text-muted-foreground">Nama Sanksi</TableHead>
						<TableHead class="px-5 py-3 font-medium text-muted-foreground">Poin Min</TableHead>
						<TableHead class="px-5 py-3 font-medium text-muted-foreground">Poin Max</TableHead>
						<TableHead class="px-5 py-3 font-medium text-muted-foreground">Tindakan</TableHead>
						<TableHead class="text-right px-5 py-3 font-medium text-muted-foreground">Aksi</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody class="divide-y divide-border">
					{#each data.sanctions as s (s.id)}
						<TableRow class="hover:bg-accent transition-colors">
							<TableCell class="px-5 py-3.5 font-medium text-foreground">{s.name}</TableCell>
							<TableCell class="px-5 py-3.5 text-muted-foreground">{s.min_points}</TableCell>
							<TableCell class="px-5 py-3.5 text-muted-foreground">{s.max_points}</TableCell>
							<TableCell class="px-5 py-3.5 text-muted-foreground text-sm">{s.action}</TableCell>
							<TableCell class="px-5 py-3.5 text-right space-x-3">
								<Button variant="ghost" size="sm" onclick={() => { editSanction = s; showEditModal = true; }}>Edit</Button>
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
				<DialogTitle class="text-lg font-bold text-foreground">Tambah Sanksi</DialogTitle>
				<Button variant="ghost" size="sm" class="h-6 w-6 p-0" onclick={() => (showAddModal = false)}>✕</Button>
			</DialogHeader>
			{#if $message}
				<Alert variant="destructive" class="mb-4">
					<AlertDescription>{$message}</AlertDescription>
				</Alert>
			{/if}
			<form method="POST" action="?/create" use:enhance class="space-y-4">
				<div>
					<Label for="create-name-input">Nama Sanksi *</Label>
					<Input id="create-name-input" name="name" bind:value={$form.name} type="text" placeholder="Contoh: Panggilan Orang Tua" class={inputCls(hasError($errors.name) ? ['e'] : undefined)} />
					{#if $errors.name}<p class="mt-1 text-xs text-destructive">{fieldError($errors.name)}</p>{/if}
				</div>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<Label for="create-min-input">Poin Minimal *</Label>
						<Input id="create-min-input" name="min_points" bind:value={$form.min_points} type="number" min="0" placeholder="0" class={inputCls(hasError($errors.min_points) ? ['e'] : undefined)} />
						{#if $errors.min_points}<p class="mt-1 text-xs text-destructive">{fieldError($errors.min_points)}</p>{/if}
					</div>
					<div>
						<Label for="create-max-input">Poin Maksimal *</Label>
						<Input id="create-max-input" name="max_points" bind:value={$form.max_points} type="number" min="0" placeholder="100" class={inputCls(hasError($errors.max_points) ? ['e'] : undefined)} />
						{#if $errors.max_points}<p class="mt-1 text-xs text-destructive">{fieldError($errors.max_points)}</p>{/if}
					</div>
				</div>
				<div>
					<Label for="create-action-input">Tindakan *</Label>
					<Input id="create-action-input" name="action" bind:value={$form.action} type="text" placeholder="Contoh: Panggilan wali murid ke sekolah" class={inputCls(hasError($errors.action) ? ['e'] : undefined)} />
					{#if $errors.action}<p class="mt-1 text-xs text-destructive">{fieldError($errors.action)}</p>{/if}
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
{#if editSanction}
	{@const s = editSanction as any}
	<Dialog bind:open={showEditModal}>
		<DialogContent class="sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
			<DialogHeader class="flex items-center justify-between mb-5">
				<DialogTitle class="text-lg font-bold text-foreground">Edit Sanksi</DialogTitle>
				<Button variant="ghost" size="sm" class="h-6 w-6 p-0" onclick={() => { editSanction = null; showEditModal = false; }}>✕</Button>
			</DialogHeader>
			<form method="POST" action="?/update" class="space-y-4">
				<input type="hidden" name="id" value={s.id} />
				<div>
					<Label for="edit-name-input">Nama Sanksi *</Label>
					<Input id="edit-name-input" name="name" bind:value={$form.name} type="text" class={inputCls()} />
				</div>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<Label for="edit-min-input">Poin Minimal *</Label>
						<Input id="edit-min-input" name="min_points" bind:value={$form.min_points} type="number" min="0" class={inputCls()} />
					</div>
					<div>
						<Label for="edit-max-input">Poin Maksimal *</Label>
						<Input id="edit-max-input" name="max_points" bind:value={$form.max_points} type="number" min="0" class={inputCls()} />
					</div>
				</div>
				<div>
					<Label for="edit-action-input">Tindakan *</Label>
					<Input id="edit-action-input" name="action" bind:value={$form.action} type="text" class={inputCls()} />
				</div>
				<div class="flex justify-end gap-3 pt-2">
					<Button type="button" variant="outline" onclick={() => { editSanction = null; showEditModal = false; }}>Batal</Button>
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
				<DialogTitle class="text-lg font-bold text-foreground">Hapus Sanksi?</DialogTitle>
				<DialogDescription class="text-sm text-muted-foreground">
					Sanksi <strong>{deleteTarget.name}</strong> akan dihapus. Tindakan ini tidak dapat dibatalkan.
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
