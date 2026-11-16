<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { fieldError, hasError } from '$lib/form-helpers';
	import { zodClient } from 'sveltekit-superforms/adapters/zod4';
	import { classSchema } from '$lib/validation/class';
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
		validators: zodClient(classSchema),
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
	let editKelas: (typeof data.classes)[0] | null = $state(null);
	let deleteTarget: { id: number; name: string } | null = $state(null);

	let page = $state(1);
	let pageSize = $state(10);
	let filterName = $state('');
	let filterLevel = $state('');
	let filterRoom = $state('');
	let filterYear = $state('');
	let filterTeacher = $state('');

	function resetFilters() {
		filterName = '';
		filterLevel = '';
		filterRoom = '';
		filterYear = '';
		filterTeacher = '';
		page = 1;
	}

	let hasActiveFilter = $derived(
		!!(filterName || filterLevel || filterRoom || filterYear || filterTeacher)
	);

	let filteredClasses = $derived(
		data.classes.filter((c) => {
			if (filterName && !c.name.toLowerCase().includes(filterName.toLowerCase())) return false;
			if (filterLevel && c.level !== filterLevel) return false;
			if (filterRoom && !(c.room ?? '').toLowerCase().includes(filterRoom.toLowerCase())) return false;
			if (filterYear && String(c.academic_year_id) !== filterYear) return false;
			if (filterTeacher && !(c.homeroom_teacher_name ?? '').toLowerCase().includes(filterTeacher.toLowerCase())) return false;
			return true;
		})
	);

	let paginatedClasses = $derived(
		filteredClasses.slice((page - 1) * pageSize, page * pageSize)
	);

	function inputCls(err?: unknown) {
		const hasErr = Array.isArray(err) ? err.length > 0 : (err != null && typeof err === 'object' && '_errors' in err ? !!(err as any)._errors?.length : !!err);
		return `w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-colors ${
			hasErr ? 'border-destructive focus:ring-destructive' : 'border-input focus:ring-ring'
		}`;
	}
</script>

<svelte:head>
	<title>Kelas & Mapel — SIS</title>
</svelte:head>

<div class="max-w-5xl">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
		<div>
			<h1 class="text-xl font-bold text-foreground">Kelas</h1>
			<p class="text-sm text-muted-foreground mt-0.5">Kelola data kelas per tahun ajaran</p>
		</div>
		<Button onclick={() => (showAddModal = true)} class="min-h-11 w-full sm:w-auto">+ Tambah Kelas</Button>
	</div>

	<Card>
		{#if data.classes.length === 0}
			<div class="py-16 text-center text-muted-foreground text-sm">Belum ada kelas terdaftar.</div>
		{:else}
			<!-- Mobile filter bar -->
			<div class="md:hidden p-3 border-b border-border bg-muted/20 space-y-2">
				<div class="flex items-center gap-2">
					<Input
						bind:value={filterName}
						oninput={() => (page = 1)}
						placeholder="Cari kelas..."
						class="h-8 text-xs bg-background flex-1"
					/>
					{#if hasActiveFilter}
						<Button variant="ghost" size="sm" class="h-8 px-2 text-xs" onclick={resetFilters}>
							<RotateCcw class="w-3.5 h-3.5" />
						</Button>
					{/if}
				</div>
				<div class="grid grid-cols-2 gap-2">
					<Input
						bind:value={filterLevel}
						oninput={() => (page = 1)}
						placeholder="Tingkat (7, 8, 9...)"
						class="h-8 text-xs bg-background"
					/>
					<select
						bind:value={filterYear}
						onchange={() => (page = 1)}
						class="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
					>
						<option value="">Semua Thn Ajaran</option>
						{#each data.academicYears as y (y.id)}
							<option value={String(y.id)}>{y.name} ({y.semester})</option>
						{/each}
					</select>
				</div>
			</div>

			<!-- Mobile: kartu -->
			<div class="md:hidden divide-y divide-border">
				{#each paginatedClasses as c (c.id)}
					<div class="p-4 space-y-2.5">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0">
								<p class="font-medium text-foreground truncate">{c.name}</p>
								<p class="text-xs text-muted-foreground">Tingkat {c.level}</p>
							</div>
							{#if c.homeroom_teacher_name}
								<Badge class="bg-muted border-border text-xs font-medium text-foreground shrink-0">{c.homeroom_teacher_name}</Badge>
							{/if}
						</div>
						<div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
							<span>Ruangan: {c.room ?? '—'}</span>
							<span>{c.academic_year_name ?? '—'} ({c.academic_year_semester ?? '—'})</span>
						</div>
						<div class="flex gap-2 pt-0.5">
							<Button variant="outline" size="sm" class="flex-1 min-h-10" onclick={() => { editKelas = c; showEditModal = true; }}>
								<PencilIcon data-icon="inline-start" /> Edit
							</Button>
							<Button variant="destructive" size="sm" class="flex-1 min-h-10" onclick={() => { deleteTarget = { id: c.id, name: c.name }; showDeleteModal = true; }}>
								<Trash2Icon data-icon="inline-start" /> Hapus
							</Button>
						</div>
					</div>
				{/each}
				{#if filteredClasses.length === 0}
					<div class="py-12 text-center text-muted-foreground text-sm">Tidak ada data yang cocok dengan filter.</div>
				{/if}
			</div>

			<!-- Desktop: tabel -->
			<div class="hidden md:block">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead class="px-5 py-3 font-medium text-muted-foreground">Nama Kelas</TableHead>
						<TableHead class="px-5 py-3 font-medium text-muted-foreground">Tingkat</TableHead>
						<TableHead class="px-5 py-3 font-medium text-muted-foreground">Ruangan</TableHead>
						<TableHead class="px-5 py-3 font-medium text-muted-foreground">Tahun Ajaran</TableHead>
						<TableHead class="px-5 py-3 font-medium text-muted-foreground">Wali Kelas</TableHead>
						<TableHead class="text-right px-5 py-3 font-medium text-muted-foreground">Aksi</TableHead>
					</TableRow>
					<TableRow class="bg-muted/30">
						<TableHead class="p-2">
							<Input
								bind:value={filterName}
								oninput={() => (page = 1)}
								placeholder="Cari kelas..."
								class="h-8 text-xs bg-background"
							/>
						</TableHead>
						<TableHead class="p-2">
							<Input
								bind:value={filterLevel}
								oninput={() => (page = 1)}
								placeholder="Tingkat..."
								class="h-8 text-xs bg-background"
							/>
						</TableHead>
						<TableHead class="p-2">
							<Input
								bind:value={filterRoom}
								oninput={() => (page = 1)}
								placeholder="Ruangan..."
								class="h-8 text-xs bg-background"
							/>
						</TableHead>
						<TableHead class="p-2">
							<select
								bind:value={filterYear}
								onchange={() => (page = 1)}
								class="h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
							>
								<option value="">Semua</option>
								{#each data.academicYears as y (y.id)}
									<option value={String(y.id)}>{y.name} ({y.semester})</option>
								{/each}
							</select>
						</TableHead>
						<TableHead class="p-2">
							<Input
								bind:value={filterTeacher}
								oninput={() => (page = 1)}
								placeholder="Cari wali kelas..."
								class="h-8 text-xs bg-background"
							/>
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
					{#each paginatedClasses as c (c.id)}
						<TableRow class="hover:bg-accent transition-colors">
							<TableCell class="px-5 py-3.5 font-medium text-foreground">{c.name}</TableCell>
							<TableCell class="px-5 py-3.5 text-muted-foreground">{c.level}</TableCell>
							<TableCell class="px-5 py-3.5 text-muted-foreground">{c.room ?? '—'}</TableCell>
							<TableCell class="px-5 py-3.5 text-muted-foreground text-sm">{c.academic_year_name ?? '—'} ({c.academic_year_semester ?? '—'})</TableCell>
							<TableCell class="px-5 py-3.5 text-muted-foreground">{c.homeroom_teacher_name ?? '—'}</TableCell>
							<TableCell class="px-5 py-3.5 text-right space-x-3">
								<Button variant="ghost" size="sm" class="text-muted-foreground hover:text-foreground" onclick={() => { editKelas = c; showEditModal = true; }}>
									<PencilIcon data-icon="inline-start" />
									Edit
								</Button>
								<Button variant="ghost" size="sm" class="text-destructive hover:text-destructive/90" onclick={() => { deleteTarget = { id: c.id, name: c.name }; showDeleteModal = true; }}>
									<Trash2Icon data-icon="inline-start" />
									Hapus
								</Button>
							</TableCell>
						</TableRow>
					{/each}
					{#if filteredClasses.length === 0}
						<TableRow>
							<TableCell colspan={6} class="py-12 text-center text-muted-foreground text-sm">
								Tidak ada data yang cocok dengan filter.
							</TableCell>
						</TableRow>
					{/if}
				</TableBody>
			</Table>
			</div>

			<Pagination bind:page bind:pageSize totalItems={filteredClasses.length} />
		{/if}
	</Card>
</div>

<!-- MODAL TAMBAH -->
{#if showAddModal}
	<Dialog bind:open={showAddModal}>
		<DialogContent class="sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
			<DialogHeader class="flex items-center justify-between mb-5">
				<DialogTitle class="text-lg font-bold text-foreground">Tambah Kelas</DialogTitle>
				<Button variant="ghost" size="sm" class="h-6 w-6 p-0" onclick={() => (showAddModal = false)}>✕</Button>
			</DialogHeader>
			{#if $message}
				<div class="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
					{$message}
				</div>
			{/if}
			<form method="POST" action="?/create" use:enhance class="space-y-4">
				<div>
					<Label for="create-academic-year-select">Tahun Ajaran *</Label>
					<select id="create-academic-year-select" name="academic_year_id" bind:value={$form.academic_year_id} class={inputCls(hasError($errors.academic_year_id) ? ['e'] : undefined)}>
						<option value="">— Pilih Tahun Ajaran —</option>
						{#each data.academicYears as ay (ay.id)}
							<option value={ay.id}>{ay.name} — Semester {ay.semester}</option>
						{/each}
					</select>
					{#if $errors.academic_year_id}<p class="mt-1 text-xs text-destructive">{fieldError($errors.academic_year_id)}</p>{/if}
				</div>
				<div>
					<Label for="create-name-input">Nama Kelas *</Label>
					<Input id="create-name-input" name="name" bind:value={$form.name} type="text" placeholder="Contoh: X IPA 1" class={inputCls(hasError($errors.name) ? ['e'] : undefined)} />
					{#if $errors.name}<p class="mt-1 text-xs text-destructive">{fieldError($errors.name)}</p>{/if}
				</div>
				<div>
					<Label for="create-level-input">Tingkat *</Label>
					<Input id="create-level-input" name="level" bind:value={$form.level} type="text" placeholder="Contoh: 10" class={inputCls(hasError($errors.level) ? ['e'] : undefined)} />
					{#if $errors.level}<p class="mt-1 text-xs text-destructive">{fieldError($errors.level)}</p>{/if}
				</div>
				<div>
					<Label for="create-room-input">Ruangan</Label>
					<Input id="create-room-input" name="room" bind:value={$form.room} type="text" placeholder="Contoh: Lab IPA / R-101" class={inputCls(hasError($errors.room) ? ['e'] : undefined)} />
					{#if $errors.room}<p class="mt-1 text-xs text-destructive">{fieldError($errors.room)}</p>{/if}
				</div>
				<div>
					<Label for="create-teacher-select">Wali Kelas</Label>
					<select id="create-teacher-select" name="homeroom_teacher_id" bind:value={$form.homeroom_teacher_id} class={inputCls()}>
						<option value="">— Pilih Guru —</option>
						{#each data.teachers as t (t.id)}
							<option value={t.id}>{t.name}</option>
						{/each}
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
{#if editKelas}
	{@const c = editKelas}
	<Dialog bind:open={showEditModal}>
		<DialogContent class="sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
			<DialogHeader class="flex items-center justify-between mb-5">
				<DialogTitle class="text-lg font-bold text-foreground">Edit Kelas</DialogTitle>
				<Button variant="ghost" size="sm" class="h-6 w-6 p-0" onclick={() => (editKelas = null)}>✕</Button>
			</DialogHeader>
			<form method="POST" action="?/update" class="space-y-4">
				<input type="hidden" name="id" value={c.id} />
				<div>
					<Label for="edit-academic-year-select">Tahun Ajaran *</Label>
					<select id="edit-academic-year-select" name="academic_year_id" class={inputCls()}>
						<option value="">— Pilih Tahun Ajaran —</option>
						{#each data.academicYears as ay (ay.id)}
							<option value={ay.id} selected={c.academic_year_id === ay.id}>{ay.name} — Semester {ay.semester}</option>
						{/each}
					</select>
				</div>
				<div>
					<Label for="edit-name-input">Nama Kelas *</Label>
					<Input id="edit-name-input" name="name" value={c.name} type="text" class={inputCls()} />
				</div>
				<div>
					<Label for="edit-level-input">Tingkat *</Label>
					<Input id="edit-level-input" name="level" value={c.level} type="text" class={inputCls()} />
				</div>
				<div>
					<Label for="edit-room-input">Ruangan</Label>
					<Input id="edit-room-input" name="room" value={c.room ?? ''} type="text" class={inputCls()} />
				</div>
				<div>
					<Label for="edit-teacher-select">Wali Kelas</Label>
					<select id="edit-teacher-select" name="homeroom_teacher_id" class={inputCls()}>
						<option value="">— Pilih Guru —</option>
						{#each data.teachers as t (t.id)}
							<option value={t.id} selected={c.homeroom_teacher_id === t.id}>{t.name}</option>
						{/each}
					</select>
				</div>
				<div class="flex justify-end gap-3 pt-2">
					<Button type="button" variant="outline" onclick={() => { editKelas = null; showEditModal = false; }}>Batal</Button>
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
				<DialogTitle class="text-lg font-bold text-foreground">Hapus Kelas?</DialogTitle>
				<DialogDescription class="text-sm text-muted-foreground">
					Kelas <strong>{deleteTarget.name}</strong> akan dihapus. Tindakan ini tidak dapat dibatalkan.
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
