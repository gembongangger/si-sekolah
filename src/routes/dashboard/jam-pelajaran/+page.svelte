<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { fieldError, hasError } from '$lib/form-helpers';
	import { zodClient } from 'sveltekit-superforms/adapters/zod4';
	import { timeSlotSchema } from '$lib/validation/time-slot';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
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
		validators: zodClient(timeSlotSchema),
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
	let editSlot: (typeof data.timeSlots)[0] | null = $state(null);
	let deleteTarget: { id: number; name: string } | null = $state(null);

	let page = $state(1);
	let pageSize = $state(10);
	let filterDay = $state('');
	let filterSlot = $state('');
	let filterType = $state('');

	let hasActiveFilter = $derived(Boolean(filterDay || filterSlot || filterType));

	function resetFilters() {
		filterDay = '';
		filterSlot = '';
		filterType = '';
		page = 1;
	}

	let filteredTimeSlots = $derived(
		data.timeSlots.filter((ts) => {
			if (filterDay && String(ts.day_of_week) !== filterDay) {
				return false;
			}
			if (filterSlot && !String(ts.slot_number).includes(filterSlot.trim())) {
				return false;
			}
			if (filterType) {
				const isBreak = ts.is_break ? 'istirahat' : 'pelajaran';
				if (isBreak !== filterType) return false;
			}
			return true;
		})
	);

	let paginatedTimeSlots = $derived(
		filteredTimeSlots.slice((page - 1) * pageSize, page * pageSize)
	);

	function inputCls(err?: unknown) {
		const hasErr = Array.isArray(err)
			? err.length > 0
			: err != null && typeof err === 'object' && '_errors' in err
				? !!(err as any)._errors?.length
				: !!err;
		return `w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-colors ${
			hasErr ? 'border-destructive focus:ring-destructive' : 'border-input focus:ring-ring'
		}`;
	}
</script>

<svelte:head>
	<title>Jam Pelajaran — SIS</title>
</svelte:head>

<div class="max-w-5xl">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
		<div>
			<h1 class="text-xl font-bold text-foreground">Jam Pelajaran</h1>
			<p class="text-sm text-muted-foreground mt-0.5">
				Tentukan slot waktu pelajaran per hari dalam seminggu
			</p>
		</div>
		<Button onclick={() => (showAddModal = true)} class="min-h-11 w-full sm:w-auto">+ Tambah Slot Waktu</Button>
	</div>

	<Card>
		{#if data.timeSlots.length === 0}
			<div class="py-16 text-center text-muted-foreground text-sm">Belum ada slot waktu terdaftar.</div>
		{:else}
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead class="px-5 py-3 font-medium text-muted-foreground">Hari</TableHead>
						<TableHead class="px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">Slot ke-</TableHead>
						<TableHead class="px-5 py-3 font-medium text-muted-foreground">Mulai</TableHead>
						<TableHead class="px-5 py-3 font-medium text-muted-foreground">Selesai</TableHead>
						<TableHead class="px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">Jenis</TableHead>
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
							<select
								bind:value={filterDay}
								onchange={() => (page = 1)}
								class="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
							>
								<option value="">Semua Hari</option>
								{#each Object.entries(data.dayLabels) as [dayNum, label]}
									<option value={dayNum}>{label}</option>
								{/each}
							</select>
						</TableHead>
						<TableHead class="px-2 py-1.5 hidden sm:table-cell">
							<Input
								placeholder="Slot..."
								bind:value={filterSlot}
								oninput={() => (page = 1)}
								class="h-8 text-xs bg-background"
							/>
						</TableHead>
						<TableHead class="px-2 py-1.5"></TableHead>
						<TableHead class="px-2 py-1.5"></TableHead>
						<TableHead class="px-2 py-1.5 hidden sm:table-cell">
							<select
								bind:value={filterType}
								onchange={() => (page = 1)}
								class="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
							>
								<option value="">Semua Jenis</option>
								<option value="pelajaran">Pelajaran</option>
								<option value="istirahat">Istirahat</option>
							</select>
						</TableHead>
						<TableHead class="px-2 py-1.5"></TableHead>
					</TableRow>
				</TableHeader>
				<TableBody class="divide-y divide-border">
					{#if paginatedTimeSlots.length === 0}
						<TableRow>
							<TableCell colspan={6} class="py-12 text-center text-muted-foreground text-sm">
								Tidak ada data yang sesuai filter.
							</TableCell>
						</TableRow>
					{:else}
						{#each paginatedTimeSlots as ts (ts.id)}
							<TableRow class="hover:bg-accent transition-colors">
								<TableCell class="px-5 py-3.5 font-medium text-foreground">
									{data.dayLabels[ts.day_of_week] ?? ts.day_of_week}
								</TableCell>
								<TableCell class="px-5 py-3.5 text-muted-foreground hidden sm:table-cell">{ts.slot_number}</TableCell>
								<TableCell class="px-5 py-3.5 text-muted-foreground font-mono text-xs">
									{ts.start_time}
								</TableCell>
								<TableCell class="px-5 py-3.5 text-muted-foreground font-mono text-xs">
									{ts.end_time}
								</TableCell>
								<TableCell class="px-5 py-3.5 hidden sm:table-cell">
									{#if ts.is_break}
										<Badge class="bg-warning/10 text-warning-foreground">Istirahat</Badge>
									{:else}
										<Badge class="bg-success/10 text-success-foreground">Pelajaran</Badge>
									{/if}
								</TableCell>
								<TableCell class="px-5 py-3.5 text-right space-x-3">
									<Button variant="ghost" size="sm" class="text-muted-foreground hover:text-foreground" onclick={() => { editSlot = ts; showEditModal = true; }}>
										<PencilIcon data-icon="inline-start" />
										Edit
									</Button>
									<Button variant="ghost" size="sm" class="text-destructive hover:text-destructive/90"
										onclick={() => {
											deleteTarget = {
												id: ts.id,
												name: `Hari ${data.dayLabels[ts.day_of_week] ?? ts.day_of_week} Slot ${ts.slot_number}`
											};
											showDeleteModal = true;
										}}>
										<Trash2Icon data-icon="inline-start" />
										Hapus
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
					totalItems={filteredTimeSlots.length}
				/>
			</div>
		{/if}
	</Card>
</div>

<!-- MODAL TAMBAH -->
{#if showAddModal}
	<Dialog bind:open={showAddModal}>
		<DialogContent class="sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
			<DialogHeader class="flex items-center justify-between mb-5">
				<DialogTitle class="text-lg font-bold text-foreground">Tambah Slot Waktu</DialogTitle>
				<Button variant="ghost" size="sm" class="h-6 w-6 p-0" onclick={() => (showAddModal = false)}>✕</Button>
			</DialogHeader>
			{#if $message}
				<div class="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
					{$message}
				</div>
			{/if}
			<form method="POST" action="?/create" use:enhance class="space-y-4">
				<div>
					<Label for="create-day-select">Hari *</Label>
					<select id="create-day-select" name="day_of_week" bind:value={$form.day_of_week} class={inputCls(hasError($errors.day_of_week) ? ['e'] : undefined)}>
						<option value="1">Senin</option>
						<option value="2">Selasa</option>
						<option value="3">Rabu</option>
						<option value="4">Kamis</option>
						<option value="5">Jumat</option>
						<option value="6">Sabtu</option>
						<option value="7">Minggu</option>
					</select>
					{#if $errors.day_of_week}<p class="mt-1 text-xs text-destructive">{fieldError($errors.day_of_week)}</p>{/if}
				</div>
				<div>
					<Label for="create-slot-input">Slot ke- *</Label>
					<Input id="create-slot-input" name="slot_number" bind:value={$form.slot_number} type="number" min="1" placeholder="1" class={inputCls(hasError($errors.slot_number) ? ['e'] : undefined)} />
					{#if $errors.slot_number}<p class="mt-1 text-xs text-destructive">{fieldError($errors.slot_number)}</p>{/if}
				</div>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<Label for="create-start-input">Waktu Mulai *</Label>
						<Input id="create-start-input" name="start_time" bind:value={$form.start_time} type="time" class={inputCls(hasError($errors.start_time) ? ['e'] : undefined)} />
						{#if $errors.start_time}<p class="mt-1 text-xs text-destructive">{fieldError($errors.start_time)}</p>{/if}
					</div>
					<div>
						<Label for="create-end-input">Waktu Selesai *</Label>
						<Input id="create-end-input" name="end_time" bind:value={$form.end_time} type="time" class={inputCls(hasError($errors.end_time) ? ['e'] : undefined)} />
						{#if $errors.end_time}<p class="mt-1 text-xs text-destructive">{fieldError($errors.end_time)}</p>{/if}
					</div>
				</div>
				<div>
					<Label for="create-break-select">Jenis</Label>
					<select id="create-break-select" name="is_break" bind:value={$form.is_break} class={inputCls()}>
						<option value={0}>Pelajaran</option>
						<option value={1}>Istirahat</option>
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
{#if editSlot}
	{@const ts = editSlot}
	<Dialog bind:open={showEditModal}>
		<DialogContent class="sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
			<DialogHeader class="flex items-center justify-between mb-5">
				<DialogTitle class="text-lg font-bold text-foreground">Edit Slot Waktu</DialogTitle>
				<Button variant="ghost" size="sm" class="h-6 w-6 p-0" onclick={() => { editSlot = null; showEditModal = false; }}>✕</Button>
			</DialogHeader>
			<form method="POST" action="?/update" class="space-y-4">
				<input type="hidden" name="id" value={ts.id} />
				<div>
					<Label for="edit-day-select">Hari *</Label>
					<select id="edit-day-select" name="day_of_week" class={inputCls()}>
						<option value="1" selected={ts.day_of_week === 1}>Senin</option>
						<option value="2" selected={ts.day_of_week === 2}>Selasa</option>
						<option value="3" selected={ts.day_of_week === 3}>Rabu</option>
						<option value="4" selected={ts.day_of_week === 4}>Kamis</option>
						<option value="5" selected={ts.day_of_week === 5}>Jumat</option>
						<option value="6" selected={ts.day_of_week === 6}>Sabtu</option>
						<option value="7" selected={ts.day_of_week === 7}>Minggu</option>
					</select>
				</div>
				<div>
					<Label for="edit-slot-input">Slot ke- *</Label>
					<Input id="edit-slot-input" name="slot_number" bind:value={$form.slot_number} type="number" min="1" class={inputCls()} />
				</div>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<Label for="edit-start-input">Waktu Mulai *</Label>
						<Input id="edit-start-input" name="start_time" bind:value={$form.start_time} type="time" class={inputCls()} />
					</div>
					<div>
						<Label for="edit-end-input">Waktu Selesai *</Label>
						<Input id="edit-end-input" name="end_time" bind:value={$form.end_time} type="time" class={inputCls()} />
					</div>
				</div>
				<div>
					<Label for="edit-break-select">Jenis</Label>
					<select id="edit-break-select" name="is_break" class={inputCls()}>
						<option value={0} selected={ts.is_break === 0}>Pelajaran</option>
						<option value={1} selected={ts.is_break === 1}>Istirahat</option>
					</select>
				</div>
				<div class="flex justify-end gap-3 pt-2">
					<Button type="button" variant="outline" onclick={() => { editSlot = null; showEditModal = false; }}>Batal</Button>
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
				<DialogTitle class="text-lg font-bold text-foreground">Hapus Slot Waktu?</DialogTitle>
				<DialogDescription class="text-sm text-muted-foreground">
					Slot waktu <strong>{deleteTarget.name}</strong> akan dihapus. Tindakan ini tidak dapat dibatalkan.
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
