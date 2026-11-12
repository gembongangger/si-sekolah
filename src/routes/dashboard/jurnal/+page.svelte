<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { fieldError, hasError } from '$lib/form-helpers';
	import { zodClient } from 'sveltekit-superforms/adapters/zod4';
	import { jurnalSchema } from '$lib/validation/jurnal';
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
	import { Textarea } from '$lib/components/ui/textarea/index.js';

	let { data }: { data: PageData } = $props();

	const { form, errors, message, enhance, submitting, reset } = superForm(data.form, {
		validators: zodClient(jurnalSchema),
		onUpdated({ form: f }) {
			if (String(f.message).includes('berhasil')) {
				showAddModal = false;
				editJurnal = null;
				reset();
			}
		}
	});

	let showAddModal = $state(false);
	let showEditModal = $state(false);
	let showDeleteModal = $state(false);
	let editJurnal: (typeof data.jurnals)[0] | null = $state(null);
	let deleteTarget: { id: number; topic: string } | null = $state(null);

	function inputCls(err?: unknown) {
		const hasErr = Array.isArray(err) ? err.length > 0 : (err != null && typeof err === 'object' && '_errors' in err ? !!(err as any)._errors?.length : !!err);
		return `w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-colors ${
			hasErr ? 'border-destructive focus:ring-destructive' : 'border-input focus:ring-ring'
		}`;
	}

	function parseAttendance(summary: string | null) {
		if (!summary) return { hadir: 0, sakit: 0, izin: 0, alfa: 0 };
		try { return JSON.parse(summary); }
		catch { return { hadir: 0, sakit: 0, izin: 0, alfa: 0 }; }
	}

	const today = new Date().toISOString().slice(0, 10);

	// Filter mapel berdasarkan kelas yang dipilih, dedupe per subject_id
	const filteredSubjects = $derived(
		[...new Map(
			($form.class_id
				? data.kelasPelajaran.filter(k => k.class_id === Number($form.class_id))
				: data.kelasPelajaran
			).map(k => [k.subject_id, k])
		).values()]
	);

	// Deduplicated classes
	const uniqueClasses = $derived(
		[...new Map(data.kelasPelajaran.map(k => [k.class_id, k])).values()]
	);
</script>

<svelte:head>
	<title>Jurnal Mengajar — SIS</title>
</svelte:head>

<div class="max-w-6xl">
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-xl font-bold text-foreground">Jurnal Mengajar</h1>
			<p class="text-sm text-muted-foreground mt-0.5">
				{data.isGuru ? 'Catatan kegiatan mengajar Anda' : 'Rekap jurnal mengajar semua guru'}
			</p>
		</div>
		{#if data.isGuru}
			<Button onclick={() => { showAddModal = true; }} variant="default">+ Isi Jurnal</Button>
		{/if}
	</div>

	{#if data.isGuru && data.kelasPelajaran.length === 0}
		<Card class="bg-warning/10 border border-warning/20 p-4 mb-6 text-sm text-warning-foreground">
			Anda belum ditugaskan ke kelas/mata pelajaran apapun. Hubungi Admin Sekolah untuk pengaturan jadwal mengajar.
		</Card>
	{/if}

	<Card>
		{#if data.jurnals.length === 0}
			<div class="py-16 text-center text-muted-foreground text-sm">Belum ada jurnal mengajar.</div>
		{:else}
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead class="px-4 py-3 font-medium text-muted-foreground">Tanggal</TableHead>
						<TableHead class="px-4 py-3 font-medium text-muted-foreground">Kelas</TableHead>
						<TableHead class="px-4 py-3 font-medium text-muted-foreground">Mata Pelajaran</TableHead>
						{#if !data.isGuru}
							<TableHead class="px-4 py-3 font-medium text-muted-foreground">Guru</TableHead>
						{/if}
						<TableHead class="px-4 py-3 font-medium text-muted-foreground">Topik</TableHead>
						<TableHead class="text-center px-4 py-3 font-medium text-muted-foreground">Ptm</TableHead>
						<TableHead class="px-4 py-3 font-medium text-muted-foreground">Absensi</TableHead>
						{#if data.isGuru}
							<TableHead class="text-right px-4 py-3 font-medium text-muted-foreground">Aksi</TableHead>
						{/if}
					</TableRow>
				</TableHeader>
				<TableBody class="divide-y divide-border">
					{#each data.jurnals as jurnal (jurnal.id)}
						{@const att = parseAttendance(jurnal.attendance_summary)}
						<TableRow class="hover:bg-accent transition-colors">
							<TableCell class="px-4 py-3 text-muted-foreground whitespace-nowrap">{jurnal.date}</TableCell>
							<TableCell class="px-4 py-3 font-medium text-foreground">{jurnal.class_name ?? '—'}</TableCell>
							<TableCell class="px-4 py-3 text-muted-foreground">{jurnal.subject_name ?? '—'}</TableCell>
							{#if !data.isGuru}
								<TableCell class="px-4 py-3 text-muted-foreground">{jurnal.teacher_name ?? '—'}</TableCell>
							{/if}
							<TableCell class="px-4 py-3 text-foreground max-w-xs">
								<p class="truncate">{jurnal.topic}</p>
							</TableCell>
							<TableCell class="px-4 py-3 text-center text-muted-foreground">{jurnal.meeting_number}</TableCell>
							<TableCell class="px-4 py-3 text-xs whitespace-nowrap">
								<span class="text-success-foreground font-medium">H:{att.hadir}</span>
								<span class="mx-1 text-muted-foreground">·</span>
								<span class="text-warning-foreground">S:{att.sakit}</span>
								<span class="mx-1 text-muted-foreground">·</span>
								<span class="text-primary-foreground">I:{att.izin}</span>
								<span class="mx-1 text-muted-foreground">·</span>
								<span class="text-destructive">A:{att.alfa}</span>
							</TableCell>
							{#if data.isGuru}
								<TableCell class="px-4 py-3 text-right space-x-3">
									<Button variant="ghost" size="sm" onclick={() => { editJurnal = jurnal; showEditModal = true; }}>Edit</Button>
									<Button variant="destructive" size="sm" onclick={() => { deleteTarget = { id: jurnal.id, topic: jurnal.topic }; showDeleteModal = true; }}>Hapus</Button>
								</TableCell>
							{/if}
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
		<DialogContent class="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
			<DialogHeader class="flex items-center justify-between mb-5">
				<DialogTitle class="text-lg font-bold text-foreground">Isi Jurnal Mengajar</DialogTitle>
				<Button variant="ghost" size="sm" class="h-6 w-6 p-0" onclick={() => (showAddModal = false)}>✕</Button>
			</DialogHeader>
			{#if $message}
				<Alert variant="destructive" class="mb-4">
					<AlertDescription>{$message}</AlertDescription>
				</Alert>
			{/if}
			<form method="POST" action="?/create" use:enhance class="space-y-4">
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<Label for="create-class-select">Kelas *</Label>
						<select id="create-class-select" name="class_id" bind:value={$form.class_id} class={inputCls(hasError($errors.class_id) ? ['e'] : undefined)}>
							<option value="">— Pilih Kelas —</option>
							{#each uniqueClasses as kp (kp.class_id)}
								<option value={kp.class_id}>{kp.class_name}</option>
							{/each}
						</select>
						{#if $errors.class_id}<p class="mt-1 text-xs text-destructive">{fieldError($errors.class_id)}</p>{/if}
					</div>
					<div>
						<Label for="create-subject-select">Mata Pelajaran *</Label>
						<select id="create-subject-select" name="subject_id" bind:value={$form.subject_id} class={inputCls(hasError($errors.subject_id) ? ['e'] : undefined)}>
							<option value="">— Pilih Mapel —</option>
							{#each filteredSubjects as kp (kp.subject_id)}
								<option value={kp.subject_id}>{kp.subject_name}</option>
							{/each}
						</select>
						{#if $errors.subject_id}<p class="mt-1 text-xs text-destructive">{fieldError($errors.subject_id)}</p>{/if}
					</div>
				</div>

				<div>
					<Label for="create-academic-year-select">Tahun Ajaran *</Label>
					<select id="create-academic-year-select" name="academic_year_id" bind:value={$form.academic_year_id} class={inputCls(hasError($errors.academic_year_id) ? ['e'] : undefined)}>
						<option value="">— Pilih Tahun Ajaran —</option>
						{#each data.tahunAjaran as ta (ta.id)}
							<option value={ta.id}>{ta.name} — Semester {ta.semester}</option>
						{/each}
					</select>
					{#if $errors.academic_year_id}<p class="mt-1 text-xs text-destructive">{fieldError($errors.academic_year_id)}</p>{/if}
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<Label for="create-date-input">Tanggal *</Label>
						<Input id="create-date-input" name="date" bind:value={$form.date} type="date" class={inputCls(hasError($errors.date) ? ['e'] : undefined)} />
						{#if $errors.date}<p class="mt-1 text-xs text-destructive">{fieldError($errors.date)}</p>{/if}
					</div>
					<div>
						<Label for="create-meeting-input">Pertemuan ke- *</Label>
						<Input id="create-meeting-input" name="meeting_number" bind:value={$form.meeting_number} type="number" min="1" class={inputCls(hasError($errors.meeting_number) ? ['e'] : undefined)} />
						{#if $errors.meeting_number}<p class="mt-1 text-xs text-destructive">{fieldError($errors.meeting_number)}</p>{/if}
					</div>
				</div>

				<div>
					<Label for="create-topic-input">Topik / Materi *</Label>
					<Input id="create-topic-input" name="topic" bind:value={$form.topic} type="text" class={inputCls(hasError($errors.topic) ? ['e'] : undefined)} />
					{#if $errors.topic}<p class="mt-1 text-xs text-destructive">{fieldError($errors.topic)}</p>{/if}
				</div>
				<div>
					<Label for="create-objectives-input">Tujuan Pembelajaran</Label>
					<Textarea id="create-objectives-input" name="learning_objectives" bind:value={$form.learning_objectives} rows={2} class="resize-none" />
				</div>
				<div>
					<Label for="create-activities-input">Kegiatan Pembelajaran</Label>
					<Textarea id="create-activities-input" name="activities" bind:value={$form.activities} rows={3} class="resize-none" />
				</div>
				<div>
					<Label for="create-notes-input">Catatan</Label>
					<Textarea id="create-notes-input" name="notes" bind:value={$form.notes} rows={2} class="resize-none" />
				</div>

				<div>
					<Label class="block text-sm font-medium text-muted-foreground mb-2">Absensi Siswa</Label>
					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
						<div>
							<Label class="block text-xs text-success-foreground font-medium mb-1">Hadir</Label>
							<Input name="att_hadir" bind:value={$form.att_hadir} type="number" min="0" class={inputCls()} />
						</div>
						<div>
							<Label class="block text-xs text-warning-foreground font-medium mb-1">Sakit</Label>
							<Input name="att_sakit" bind:value={$form.att_sakit} type="number" min="0" class={inputCls()} />
						</div>
						<div>
							<Label class="block text-xs text-primary-foreground font-medium mb-1">Izin</Label>
							<Input name="att_izin" bind:value={$form.att_izin} type="number" min="0" class={inputCls()} />
						</div>
						<div>
							<Label class="block text-xs text-destructive font-medium mb-1">Alfa</Label>
							<Input name="att_alfa" bind:value={$form.att_alfa} type="number" min="0" class={inputCls()} />
						</div>
					</div>
				</div>

				<div class="flex justify-end gap-3 pt-2">
					<Button type="button" variant="outline" onclick={() => (showAddModal = false)}>Batal</Button>
					<Button type="submit" disabled={$submitting}>
						{$submitting ? 'Menyimpan...' : 'Simpan Jurnal'}
					</Button>
				</div>
			</form>
		</DialogContent>
	</Dialog>
{/if}

<!-- MODAL EDIT -->
{#if editJurnal}
	{@const j = editJurnal as any}
	<Dialog bind:open={showEditModal}>
		<DialogContent class="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
			<DialogHeader class="flex items-center justify-between mb-5">
				<DialogTitle class="text-lg font-bold text-foreground">Edit Jurnal</DialogTitle>
				<Button variant="ghost" size="sm" class="h-6 w-6 p-0" onclick={() => { editJurnal = null; showEditModal = false; }}>✕</Button>
			</DialogHeader>
			<form method="POST" action="?/update" class="space-y-4">
				<input type="hidden" name="id" />
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<Label for="edit-class-select">Kelas *</Label>
						<select id="edit-class-select" name="class_id" class={inputCls()}>
							<option value="">— Pilih Kelas —</option>
							{#each uniqueClasses as kp (kp.class_id)}
								<option value={kp.class_id} selected={j.class_id === kp.class_id}>{kp.class_name}</option>
							{/each}
						</select>
					</div>
					<div>
						<Label for="edit-subject-select">Mata Pelajaran *</Label>
						<select id="edit-subject-select" name="subject_id" class={inputCls()}>
							<option value="">— Pilih Mapel —</option>
							{#each filteredSubjects as kp (kp.subject_id)}
								<option value={kp.subject_id} selected={j.subject_id === kp.subject_id}>{kp.subject_name}</option>
							{/each}
						</select>
					</div>
				</div>
				<div>
					<Label for="edit-academic-year-select">Tahun Ajaran *</Label>
					<select id="edit-academic-year-select" name="academic_year_id" class={inputCls()}>
						<option value="">— Pilih Tahun Ajaran —</option>
						{#each data.tahunAjaran as ta (ta.id)}
							<option value={ta.id} selected={j.academic_year_id === ta.id}>{ta.name} — Semester {ta.semester}</option>
						{/each}
					</select>
				</div>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<Label for="edit-date-input">Tanggal *</Label>
						<Input id="edit-date-input" name="date" bind:value={$form.date} type="date" class={inputCls()} />
					</div>
					<div>
						<Label for="edit-meeting-input">Pertemuan ke- *</Label>
						<Input id="edit-meeting-input" name="meeting_number" bind:value={$form.meeting_number} type="number" min="1" class={inputCls()} />
					</div>
				</div>
				<div>
					<Label for="edit-topic-input">Topik / Materi *</Label>
					<Input id="edit-topic-input" name="topic" bind:value={$form.topic} type="text" class={inputCls()} />
				</div>
				<div>
					<Label for="edit-objectives-input">Tujuan Pembelajaran</Label>
					<Textarea id="edit-objectives-input" name="learning_objectives" bind:value={$form.learning_objectives} rows={2} class="resize-none" />
				</div>
				<div>
					<Label for="edit-activities-input">Kegiatan Pembelajaran</Label>
					<Textarea id="edit-activities-input" name="activities" bind:value={$form.activities} rows={3} class="resize-none" />
				</div>
				<div>
					<Label for="edit-notes-input">Catatan</Label>
					<Textarea id="edit-notes-input" name="notes" bind:value={$form.notes} rows={2} class="resize-none" />
				</div>

				<div>
					<Label class="block text-sm font-medium text-muted-foreground mb-2">Absensi Siswa</Label>
					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
						<div>
							<Label class="block text-xs text-success-foreground font-medium mb-1">Hadir</Label>
							<Input name="att_hadir" bind:value={$form.att_hadir} type="number" min="0" class={inputCls()} />
						</div>
						<div>
							<Label class="block text-xs text-warning-foreground font-medium mb-1">Sakit</Label>
							<Input name="att_sakit" bind:value={$form.att_sakit} type="number" min="0" class={inputCls()} />
						</div>
						<div>
							<Label class="block text-xs text-primary-foreground font-medium mb-1">Izin</Label>
							<Input name="att_izin" bind:value={$form.att_izin} type="number" min="0" class={inputCls()} />
						</div>
						<div>
							<Label class="block text-xs text-destructive font-medium mb-1">Alfa</Label>
							<Input name="att_alfa" bind:value={$form.att_alfa} type="number" min="0" class={inputCls()} />
						</div>
					</div>
				</div>

				<DialogFooter class="gap-2 pt-2">
					<Button type="button" variant="outline" onclick={() => { editJurnal = null; showEditModal = false; }}>Batal</Button>
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
				<DialogTitle class="text-lg font-bold text-foreground">Hapus Jurnal?</DialogTitle>
				<DialogDescription class="text-sm text-muted-foreground">
					Jurnal "<strong>{deleteTarget.topic}</strong>" akan dihapus. Tindakan ini tidak dapat dibatalkan.
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
