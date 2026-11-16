<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { fieldError, hasError } from '$lib/form-helpers';
	import { zodClient } from 'sveltekit-superforms/adapters/zod4';
	import { classSubjectSchema } from '$lib/validation/class-subject';
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
		validators: zodClient(classSubjectSchema),
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
	let editRelasi: (typeof data.classSubjects)[0] | null = $state(null);
	let deleteTarget: { id: number; name: string } | null = $state(null);

	let page = $state(1);
	let pageSize = $state(10);
	let filterClass = $state('');
	let filterSubject = $state('');
	let filterTeacher = $state('');
	let filterYear = $state('');

	let hasActiveFilter = $derived(
		Boolean(filterClass || filterSubject || filterTeacher || filterYear)
	);

	function resetFilters() {
		filterClass = '';
		filterSubject = '';
		filterTeacher = '';
		filterYear = '';
		page = 1;
	}

	let filteredClassSubjects = $derived(
		data.classSubjects.filter((cs) => {
			if (filterClass) {
				const full = `${cs.class_name ?? ''} ${cs.class_level ?? ''}`.toLowerCase();
				if (!full.includes(filterClass.toLowerCase())) return false;
			}
			if (filterSubject) {
				const full = `${cs.subject_code ?? ''} ${cs.subject_name ?? ''}`.toLowerCase();
				if (!full.includes(filterSubject.toLowerCase())) return false;
			}
			if (filterTeacher && !(cs.teacher_name ?? '').toLowerCase().includes(filterTeacher.toLowerCase())) {
				return false;
			}
			if (filterYear) {
				const full = `${cs.academic_year_name ?? ''} ${cs.academic_year_semester ?? ''}`.toLowerCase();
				if (!full.includes(filterYear.toLowerCase())) return false;
			}
			return true;
		})
	);

	let paginatedClassSubjects = $derived(
		filteredClassSubjects.slice((page - 1) * pageSize, page * pageSize)
	);

	function inputCls(err?: unknown) {
		const hasErr = Array.isArray(err) ? err.length > 0 : (err != null && typeof err === 'object' && '_errors' in err ? !!(err as any)._errors?.length : !!err);
		return `w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-colors ${
			hasErr ? 'border-destructive focus:ring-destructive' : 'border-input focus:ring-ring'
		}`;
	}
</script>

<svelte:head>
	<title>Kelas & Mata Pelajaran — SIS</title>
</svelte:head>

<div class="max-w-6xl">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
		<div>
			<h1 class="text-xl font-bold text-foreground">Kelas & Mata Pelajaran</h1>
			<p class="text-sm text-muted-foreground mt-0.5">
				Tentukan siapa guru yang mengajar mata pelajaran apa di kelas mana
			</p>
		</div>
		<Button onclick={() => (showAddModal = true)} class="min-h-11 w-full sm:w-auto">+ Tambah Relasi</Button>
	</div>

	<Card>
		{#if data.classSubjects.length === 0}
			<div class="py-16 text-center text-muted-foreground text-sm">Belum ada relasi kelas-mapel-guru.</div>
		{:else}
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead class="px-5 py-3 font-medium text-muted-foreground">Kelas</TableHead>
						<TableHead class="px-5 py-3 font-medium text-muted-foreground">Mata Pelajaran</TableHead>
						<TableHead class="px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">Jam/Minggu</TableHead>
						<TableHead class="px-5 py-3 font-medium text-muted-foreground">Guru</TableHead>
						<TableHead class="px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">Tahun Ajaran</TableHead>
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
								placeholder="Cari kelas..."
								bind:value={filterClass}
								oninput={() => (page = 1)}
								class="h-8 text-xs bg-background"
							/>
						</TableHead>
						<TableHead class="px-2 py-1.5">
							<Input
								placeholder="Cari mapel / kode..."
								bind:value={filterSubject}
								oninput={() => (page = 1)}
								class="h-8 text-xs bg-background"
							/>
						</TableHead>
						<TableHead class="px-2 py-1.5 hidden sm:table-cell"></TableHead>
						<TableHead class="px-2 py-1.5">
							<Input
								placeholder="Cari guru..."
								bind:value={filterTeacher}
								oninput={() => (page = 1)}
								class="h-8 text-xs bg-background"
							/>
						</TableHead>
						<TableHead class="px-2 py-1.5 hidden sm:table-cell">
							<Input
								placeholder="Cari tahun..."
								bind:value={filterYear}
								oninput={() => (page = 1)}
								class="h-8 text-xs bg-background"
							/>
						</TableHead>
						<TableHead class="px-2 py-1.5"></TableHead>
					</TableRow>
				</TableHeader>
				<TableBody class="divide-y divide-border">
					{#if paginatedClassSubjects.length === 0}
						<TableRow>
							<TableCell colspan={6} class="py-12 text-center text-muted-foreground text-sm">
								Tidak ada data yang sesuai filter.
							</TableCell>
						</TableRow>
					{:else}
						{#each paginatedClassSubjects as cs (cs.id)}
							<TableRow class="hover:bg-accent transition-colors">
								<TableCell class="px-5 py-3.5 font-medium text-foreground">
									{cs.class_name} ({cs.class_level})
								</TableCell>
								<TableCell class="px-5 py-3.5 text-muted-foreground">
									[{cs.subject_code}] {cs.subject_name}
								</TableCell>
								<TableCell class="px-5 py-3.5 text-muted-foreground hidden sm:table-cell">
									{cs.hours_per_week ?? cs.subject_hours_per_week} jam
								</TableCell>
								<TableCell class="px-5 py-3.5 text-muted-foreground">{cs.teacher_name}</TableCell>
								<TableCell class="px-5 py-3.5 text-muted-foreground text-sm hidden sm:table-cell">
									{cs.academic_year_name} — Semester {cs.academic_year_semester}
								</TableCell>
								<TableCell class="px-5 py-3.5 text-right space-x-3">
									<Button variant="ghost" size="sm" class="text-muted-foreground hover:text-foreground" onclick={() => { editRelasi = cs; showEditModal = true; }}>
										<PencilIcon data-icon="inline-start" />
										Edit
									</Button>
									<Button variant="ghost" size="sm" class="text-destructive hover:text-destructive/90" onclick={() => { deleteTarget = { id: cs.id, name: cs.class_name ?? '—' }; showDeleteModal = true; }}>
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
					totalItems={filteredClassSubjects.length}
				/>
			</div>
		{/if}
	</Card>
</div>

<!-- MODAL TAMBAH -->
{#if showAddModal}
	<Dialog bind:open={showAddModal}>
		<DialogContent class="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
			<DialogHeader class="flex items-center justify-between mb-5">
				<DialogTitle class="text-lg font-bold text-foreground">Tambah Relasi Kelas–Mapel–Guru</DialogTitle>
				<Button variant="ghost" size="sm" class="h-6 w-6 p-0" onclick={() => (showAddModal = false)}>✕</Button>
			</DialogHeader>
			{#if $message}
				<div class="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
					{$message}
				</div>
			{/if}
			<form method="POST" action="?/create" use:enhance class="space-y-4">
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<Label for="create-class-select">Kelas *</Label>
						<select id="create-class-select" name="class_id" bind:value={$form.class_id} class={inputCls(hasError($errors.class_id) ? ['e'] : undefined)}>
							<option value="">— Pilih Kelas —</option>
							{#each data.classes as c (c.id)}
								<option value={c.id}>{c.name} (Tingkat {c.level})</option>
							{/each}
						</select>
						{#if $errors.class_id}<p class="mt-1 text-xs text-destructive">{fieldError($errors.class_id)}</p>{/if}
					</div>
					<div>
						<Label for="create-subject-select">Mata Pelajaran *</Label>
						<select id="create-subject-select" name="subject_id" bind:value={$form.subject_id} class={inputCls(hasError($errors.subject_id) ? ['e'] : undefined)}>
							<option value="">— Pilih Mata Pelajaran —</option>
							{#each data.subjects as s (s.id)}
								<option value={s.id}>[{s.code}] {s.name}</option>
							{/each}
						</select>
						{#if $errors.subject_id}<p class="mt-1 text-xs text-destructive">{fieldError($errors.subject_id)}</p>{/if}
					</div>
				</div>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<Label for="create-teacher-select">Guru *</Label>
						<select id="create-teacher-select" name="teacher_id" bind:value={$form.teacher_id} class={inputCls(hasError($errors.teacher_id) ? ['e'] : undefined)}>
							<option value="">— Pilih Guru —</option>
							{#each data.teachers as t (t.id)}
								<option value={t.id}>{t.name}</option>
							{/each}
						</select>
						{#if $errors.teacher_id}<p class="mt-1 text-xs text-destructive">{fieldError($errors.teacher_id)}</p>{/if}
					</div>
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
				</div>
				<div>
					<Label for="create-hours-input">Jam per Minggu</Label>
					<Input id="create-hours-input" name="hours_per_week" bind:value={$form.hours_per_week} type="number" min="1" max="40" placeholder="Kosongkan = ikut mapel" class={inputCls(hasError($errors.hours_per_week) ? ['e'] : undefined)} />
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
{#if editRelasi}
	{@const cs = editRelasi}
	<Dialog bind:open={showEditModal}>
		<DialogContent class="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
			<DialogHeader class="flex items-center justify-between mb-5">
				<DialogTitle class="text-lg font-bold text-foreground">Edit Relasi</DialogTitle>
				<Button variant="ghost" size="sm" class="h-6 w-6 p-0" onclick={() => (editRelasi = null)}>✕</Button>
			</DialogHeader>
			<form method="POST" action="?/update" class="space-y-4">
				<input type="hidden" name="id" value={cs.id} />
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<Label for="edit-class-select">Kelas *</Label>
						<select id="edit-class-select" name="class_id" class={inputCls()}>
							<option value="">— Pilih Kelas —</option>
							{#each data.classes as c (c.id)}
								<option value={c.id} selected={cs.class_id === c.id}>{c.name} (Tingkat {c.level})</option>
							{/each}
						</select>
					</div>
					<div>
						<Label for="edit-subject-select">Mata Pelajaran *</Label>
						<select id="edit-subject-select" name="subject_id" class={inputCls()}>
							<option value="">— Pilih Mata Pelajaran —</option>
							{#each data.subjects as s (s.id)}
								<option value={s.id} selected={cs.subject_id === s.id}>[{s.code}] {s.name}</option>
							{/each}
						</select>
					</div>
				</div>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<Label for="edit-teacher-select">Guru *</Label>
						<select id="edit-teacher-select" name="teacher_id" class={inputCls()}>
							<option value="">— Pilih Guru —</option>
							{#each data.teachers as t (t.id)}
								<option value={t.id} selected={cs.teacher_id === t.id}>{t.name}</option>
							{/each}
						</select>
					</div>
					<div>
						<Label for="edit-academic-year-select">Tahun Ajaran *</Label>
						<select id="edit-academic-year-select" name="academic_year_id" class={inputCls()}>
							<option value="">— Pilih Tahun Ajaran —</option>
							{#each data.academicYears as ay (ay.id)}
								<option value={ay.id} selected={cs.academic_year_id === ay.id}>{ay.name} — Semester {ay.semester}</option>
							{/each}
						</select>
					</div>
				</div>
				<div>
					<Label for="edit-hours-input">Jam per Minggu</Label>
					<Input id="edit-hours-input" name="hours_per_week" value={cs.hours_per_week ?? ''} type="number" min="1" max="40" placeholder="Kosongkan = ikut mapel" class={inputCls()} />
				</div>
				<div class="flex justify-end gap-3 pt-2">
					<Button type="button" variant="outline" onclick={() => { editRelasi = null; showEditModal = false; }}>Batal</Button>
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
				<DialogTitle class="text-lg font-bold text-foreground">Hapus Relasi?</DialogTitle>
				<DialogDescription class="text-sm text-muted-foreground">
					Relasi untuk <strong>{deleteTarget.name}</strong> akan dihapus. Tindakan ini tidak dapat dibatalkan.
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
