<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { enhance as enhanceForm } from '$app/forms';
	import type { SubmitFunction } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { fieldError, hasError } from '$lib/form-helpers';
	import { zodClient } from 'sveltekit-superforms/adapters/zod4';
	import { scheduleSchema } from '$lib/validation/schedule';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const { form, errors, message, enhance, submitting, reset } = superForm(data.form, {
		validators: zodClient(scheduleSchema),
		onUpdated({ form: f }) {
			if (String(f.message).includes('berhasil')) {
				showAddModal = false;
				reset();
			}
		}
	});

	let showAddModal = $state(false);
	let showGenerateModal = $state(false);
	let generating = $state(false);
	let generateNotice = $state('');
	let generateError = $state('');
	let generateMissing = $state<{ class: string; subject: string; teacher: string; count: number }[]>([]);
	let editSchedule: (typeof data.schedules)[0] | null = $state(null);
	let deleteTarget: { id: number; name: string } | null = $state(null);
	let filterDay = $state<number | null>(null);
	let filterClass = $state<number | null>(null);
	let filterSubject = $state<number | null>(null);
	let filterTeacher = $state<number | null>(null);
	let filterTime = $state<number | null>(null);
	let filterRoom = $state('');

	const dayOptions = $derived(
		[...new Set(data.schedules.map((s) => s.time_slot_day).filter((d): d is number => d != null))].sort(
			(a, b) => a - b
		)
	);
	const classOptions = $derived(
		[
			...new Map(
				data.schedules.map((s) => [
					s.class_id,
					`${s.class_name ?? '—'} (${s.class_level ?? '—'})`
				])
			).entries()
		]
			.map(([id, label]) => ({ id, label }))
			.sort((a, b) => a.label.localeCompare(b.label))
	);
	const subjectOptions = $derived(
		[
			...new Map(
				data.schedules.map((s) => [
					s.subject_id,
					`[${s.subject_code ?? '—'}] ${s.subject_name ?? '—'}`
				])
			).entries()
		]
			.map(([id, label]) => ({ id, label }))
			.sort((a, b) => a.label.localeCompare(b.label))
	);
	const teacherOptions = $derived(
		[...new Map(data.schedules.map((s) => [s.teacher_id, s.teacher_name ?? '—'])).entries()]
			.map(([id, label]) => ({ id, label }))
			.sort((a, b) => a.label.localeCompare(b.label))
	);
	const timeOptions = $derived(
		[
			...new Map(
				data.schedules.map((s) => [
					s.time_slot_id,
					{
						id: s.time_slot_id,
						day: s.time_slot_day ?? 0,
						slot: s.time_slot_slot ?? 0,
						label: `${data.dayLabels[s.time_slot_day ?? -1] ?? '—'} Slot ${s.time_slot_slot ?? '—'} (${s.time_slot_start ?? '—'}–${s.time_slot_end ?? '—'})`
					}
				])
			).values()
		].sort((a, b) => a.day - b.day || a.slot - b.slot)
	);
	const roomOptions = $derived(
		[...new Set(data.schedules.map((s) => s.room ?? s.class_room).filter((r): r is string => !!r))].sort()
	);

	const filteredSchedules = $derived(
		data.schedules.filter(
			(s) =>
				(filterDay === null || s.time_slot_day === filterDay) &&
				(filterClass === null || s.class_id === filterClass) &&
				(filterSubject === null || s.subject_id === filterSubject) &&
				(filterTeacher === null || s.teacher_id === filterTeacher) &&
				(filterTime === null || s.time_slot_id === filterTime) &&
				(filterRoom === '' || (s.room ?? s.class_room ?? '') === filterRoom)
		)
	);

	function resetFilters() {
		filterDay = null;
		filterClass = null;
		filterSubject = null;
		filterTeacher = null;
		filterTime = null;
		filterRoom = '';
	}

	const canManage = data.viewerRole === 'admin_sekolah';
	const headline = $derived(
		canManage
			? 'Atur jadwal mengajar per kelas, mata pelajaran, dan guru'
			: data.viewerRole === 'guru'
				? 'Jadwal mengajar yang Anda ampu'
				: 'Jadwal pelajaran kelas Anda'
	);

	function inputCls(err?: unknown) {
		const hasErr = Array.isArray(err)
			? err.length > 0
			: err != null && typeof err === 'object' && '_errors' in err
				? !!(err as any)._errors?.length
				: !!err;
		return `w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-colors ${
			hasErr ? 'border-destructive focus:ring-destructive' : 'border-input focus:ring-ring focus:border-ring'
		}`;
	}

	function slotLabel(ts: (typeof data.timeSlots)[0]) {
		return `${data.dayLabels[ts.day_of_week] ?? ts.day_of_week} Slot ${ts.slot_number} (${ts.start_time}–${ts.end_time})`;
	}

	const onGenerate: SubmitFunction = () => async ({ result }) => {
		generating = false;
		if (result.type === 'success') {
			generateNotice = (result.data as { message?: string })?.message ?? 'Jadwal berhasil digenerate';
			showGenerateModal = false;
			generateError = '';
			generateMissing = [];
			await invalidateAll();
			return;
		}
		const data =
			result.type === 'failure'
				? (result.data as { error?: string; missing?: typeof generateMissing })
				: undefined;
		generateError =
			data?.error ??
			(result.type === 'error' ? result.error.message : 'Gagal generate jadwal');
		generateMissing = data?.missing ?? [];
	};
</script>

<svelte:head>
	<title>Jadwal Pelajaran — SIS</title>
</svelte:head>

<div class="max-w-6xl">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
		<div>
			<h1 class="text-xl font-bold text-foreground">Jadwal Pelajaran</h1>
		<p class="text-sm text-muted-foreground mt-0.5">
			{headline}
		</p>
	</div>
		{#if canManage}
			<div class="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
				<button
					onclick={() => {
						showGenerateModal = true;
						generateError = '';
						generateMissing = [];
					}}
					class="min-h-11 px-4 py-2 border border-border hover:bg-muted/50 text-foreground text-sm font-medium rounded-lg transition-colors w-full sm:w-auto"
				>
					Generate Otomatis
				</button>
				<button
					onclick={() => (showAddModal = true)}
					class="min-h-11 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors w-full sm:w-auto"
				>
					+ Tambah Jadwal
				</button>
			</div>
		{/if}
	</div>

	{#if generateNotice}
		<div class="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-sm">
			{generateNotice}
		</div>
	{/if}

	{#if data.schedules.length > 0}
		<div class="mb-4 bg-card border border-border rounded-xl p-4">
			<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
				<div>
					<label for="filter-day" class="block text-xs font-medium text-muted-foreground mb-1">Hari</label>
					<select id="filter-day" bind:value={filterDay} class={inputCls()}>
						<option value={null}>Semua Hari</option>
						{#each dayOptions as day (day)}
							<option value={day}>{data.dayLabels[day] ?? `Hari ${day}`}</option>
						{/each}
					</select>
				</div>
				<div>
					<label for="filter-class" class="block text-xs font-medium text-muted-foreground mb-1">Kelas</label>
					<select id="filter-class" bind:value={filterClass} class={inputCls()}>
						<option value={null}>Semua Kelas</option>
						{#each classOptions as c (c.id)}
							<option value={c.id}>{c.label}</option>
						{/each}
					</select>
				</div>
				<div>
					<label for="filter-subject" class="block text-xs font-medium text-muted-foreground mb-1">Mata Pelajaran</label>
					<select id="filter-subject" bind:value={filterSubject} class={inputCls()}>
						<option value={null}>Semua Mapel</option>
						{#each subjectOptions as s (s.id)}
							<option value={s.id}>{s.label}</option>
						{/each}
					</select>
				</div>
				<div>
					<label for="filter-teacher" class="block text-xs font-medium text-muted-foreground mb-1">Guru</label>
					<select id="filter-teacher" bind:value={filterTeacher} class={inputCls()}>
						<option value={null}>Semua Guru</option>
						{#each teacherOptions as t (t.id)}
							<option value={t.id}>{t.label}</option>
						{/each}
					</select>
				</div>
				<div>
					<label for="filter-time" class="block text-xs font-medium text-muted-foreground mb-1">Waktu</label>
					<select id="filter-time" bind:value={filterTime} class={inputCls()}>
						<option value={null}>Semua Waktu</option>
						{#each timeOptions as t (t.id)}
							<option value={t.id}>{t.label}</option>
						{/each}
					</select>
				</div>
				<div>
					<label for="filter-room" class="block text-xs font-medium text-muted-foreground mb-1">Ruangan</label>
					<select id="filter-room" bind:value={filterRoom} class={inputCls()}>
						<option value="">Semua Ruangan</option>
						{#each roomOptions as room (room)}
							<option value={room}>{room}</option>
						{/each}
					</select>
				</div>
			</div>
			<div class="flex items-center justify-between mt-3">
				<p class="text-xs text-muted-foreground">
					Menampilkan {filteredSchedules.length} dari {data.schedules.length} jadwal
				</p>
				<button
					onclick={resetFilters}
					class="text-xs font-medium text-primary hover:text-primary/80"
				>
					Reset Filter
				</button>
			</div>
		</div>
	{/if}

	<div class="bg-card rounded-xl border border-border overflow-hidden">
		{#if data.schedules.length === 0}
			<div class="py-16 text-center text-muted-foreground text-sm">Belum ada jadwal pelajaran.</div>
		{:else if filteredSchedules.length === 0}
			<div class="py-16 text-center text-muted-foreground text-sm">Tidak ada jadwal yang cocok dengan filter.</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead class="bg-muted/50 border-b border-border">
						<tr>
							<th class="text-left px-5 py-3 font-medium text-muted-foreground">Tahun Ajaran</th>
							<th class="text-left px-5 py-3 font-medium text-muted-foreground">Kelas</th>
							<th class="text-left px-5 py-3 font-medium text-muted-foreground">Mata Pelajaran</th>
							<th class="text-left px-5 py-3 font-medium text-muted-foreground">Guru</th>
							<th class="text-left px-5 py-3 font-medium text-muted-foreground">Waktu</th>
							<th class="text-left px-5 py-3 font-medium text-muted-foreground">Ruangan</th>
							<th class="text-right px-5 py-3 font-medium text-muted-foreground">Aksi</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each filteredSchedules as s (s.id)}
							<tr class="hover:bg-muted/50 transition-colors">
								<td class="px-5 py-3.5 text-muted-foreground text-sm">{s.academic_year_name ?? '—'} ({s.academic_year_semester ?? '—'})</td>
								<td class="px-5 py-3.5 font-medium text-foreground">{s.class_name ?? '—'} ({s.class_level ?? '—'})</td>
								<td class="px-5 py-3.5 text-muted-foreground">[{s.subject_code ?? '—'}] {s.subject_name ?? '—'}</td>
								<td class="px-5 py-3.5 text-muted-foreground">{s.teacher_name ?? '—'}</td>
								<td class="px-5 py-3.5 text-muted-foreground text-sm">
									{data.dayLabels[s.time_slot_day ?? -1] ?? s.time_slot_day ?? '—'} Slot {s.time_slot_slot} ({s.time_slot_start ?? '—'}–{s.time_slot_end ?? '—'})
								</td>
							<td class="px-5 py-3.5 text-muted-foreground">{s.room ?? s.class_room ?? '—'}</td>
								{#if canManage}
									<td class="px-5 py-3.5 text-right space-x-3">
										<button
											onclick={() => (editSchedule = s)}
											class="inline-flex items-center gap-1 text-xs text-primary-foreground hover:text-primary-foreground/90 font-medium"
										><PencilIcon class="size-3.5" />Edit</button>
										<button
											onclick={() => (deleteTarget = { id: s.id, name: s.class_name ?? 'Kelas' })}
											class="inline-flex items-center gap-1 text-xs text-destructive hover:text-destructive font-medium"
										><Trash2Icon class="size-3.5" />Hapus</button>
									</td>
								{/if}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>

	<!-- MODAL TAMBAH -->
	{#if showAddModal}
		<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
			<div class="bg-card rounded-2xl shadow-xl w-full max-w-full sm:max-w-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
				<div class="flex items-center justify-between mb-5">
					<h2 class="text-lg font-bold text-foreground">Tambah Jadwal Pelajaran</h2>
					<button onclick={() => (showAddModal = false)} class="text-muted-foreground hover:text-muted-foreground">✕</button>
				</div>

				{#if $message}
					<div class="mb-4 p-3 rounded-lg bg-destructive/10 border border-border text-destructive text-sm">
						{$message}
					</div>
				{/if}

				<form method="POST" action="?/create" use:enhance class="space-y-4">
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-foreground mb-1">Tahun Ajaran *</label>
							<select name="academic_year_id" bind:value={$form.academic_year_id} class={inputCls(hasError($errors.academic_year_id) ? ['e'] : undefined)}>
								<option value="">— Pilih Tahun Ajaran —</option>
								{#each data.academicYears as ay (ay.id)}
									<option value={ay.id}>{ay.name} — Semester {ay.semester}</option>
								{/each}
							</select>
							{#if $errors.academic_year_id}<p class="mt-1 text-xs text-destructive">{fieldError($errors.academic_year_id)}</p>{/if}
						</div>
						<div>
							<label class="block text-sm font-medium text-foreground mb-1">Kelas *</label>
							<select name="class_id" bind:value={$form.class_id} class={inputCls(hasError($errors.class_id) ? ['e'] : undefined)}>
								<option value="">— Pilih Kelas —</option>
								{#each data.classes as c (c.id)}
									<option value={c.id}>{c.name} (Tingkat {c.level})</option>
								{/each}
							</select>
							{#if $errors.class_id}<p class="mt-1 text-xs text-destructive">{fieldError($errors.class_id)}</p>{/if}
						</div>
					</div>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-foreground mb-1">Mata Pelajaran *</label>
							<select name="subject_id" bind:value={$form.subject_id} class={inputCls(hasError($errors.subject_id) ? ['e'] : undefined)}>
								<option value="">— Pilih Mata Pelajaran —</option>
								{#each data.subjects as s (s.id)}
									<option value={s.id}>[{s.code}] {s.name}</option>
								{/each}
							</select>
							{#if $errors.subject_id}<p class="mt-1 text-xs text-destructive">{fieldError($errors.subject_id)}</p>{/if}
						</div>
						<div>
							<label class="block text-sm font-medium text-foreground mb-1">Guru *</label>
							<select name="teacher_id" bind:value={$form.teacher_id} class={inputCls(hasError($errors.teacher_id) ? ['e'] : undefined)}>
								<option value="">— Pilih Guru —</option>
								{#each data.teachers as t (t.id)}
									<option value={t.id}>{t.name}</option>
								{/each}
							</select>
							{#if $errors.teacher_id}<p class="mt-1 text-xs text-destructive">{fieldError($errors.teacher_id)}</p>{/if}
						</div>
					</div>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-foreground mb-1">Slot Waktu *</label>
							<select name="time_slot_id" bind:value={$form.time_slot_id} class={inputCls(hasError($errors.time_slot_id) ? ['e'] : undefined)}>
								<option value="">— Pilih Slot Waktu —</option>
								{#each data.timeSlots as ts (ts.id)}
									<option value={ts.id}>{slotLabel(ts)}</option>
								{/each}
							</select>
							{#if $errors.time_slot_id}<p class="mt-1 text-xs text-destructive">{fieldError($errors.time_slot_id)}</p>{/if}
						</div>
						<div>
							<label class="block text-sm font-medium text-foreground mb-1">Ruangan</label>
							<input name="room" bind:value={$form.room} type="text" placeholder="Contoh: Ruang 101" class={inputCls()} />
						</div>
					</div>
					<div class="flex justify-end gap-3 pt-2">
						<button type="button" onclick={() => (showAddModal = false)} class="px-4 py-2 text-sm text-muted-foreground border border-border hover:bg-muted/50 rounded-lg transition-colors">
							Batal
						</button>
						<button type="submit" disabled={$submitting} class="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50 rounded-lg transition-colors">
							{$submitting ? 'Menyimpan...' : 'Simpan'}
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- MODAL EDIT -->
	{#if editSchedule}
		{@const s = editSchedule}
		<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
			<div class="bg-card rounded-2xl shadow-xl w-full max-w-full sm:max-w-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
				<div class="flex items-center justify-between mb-5">
					<h2 class="text-lg font-bold text-foreground">Edit Jadwal Pelajaran</h2>
					<button onclick={() => (editSchedule = null)} class="text-muted-foreground hover:text-muted-foreground">✕</button>
				</div>

				<form method="POST" action="?/update" class="space-y-4">
					<input type="hidden" name="id" value={s.id} />
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-foreground mb-1">Tahun Ajaran *</label>
							<select name="academic_year_id" class={inputCls()}>
								<option value="">— Pilih Tahun Ajaran —</option>
								{#each data.academicYears as ay (ay.id)}
									<option value={ay.id} selected={s.academic_year_id === ay.id}>{ay.name} — Semester {ay.semester}</option>
								{/each}
							</select>
						</div>
						<div>
							<label class="block text-sm font-medium text-foreground mb-1">Kelas *</label>
							<select name="class_id" class={inputCls()}>
								<option value="">— Pilih Kelas —</option>
								{#each data.classes as c (c.id)}
									<option value={c.id} selected={s.class_id === c.id}>{c.name} (Tingkat {c.level})</option>
								{/each}
							</select>
						</div>
					</div>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-foreground mb-1">Mata Pelajaran *</label>
							<select name="subject_id" class={inputCls()}>
								<option value="">— Pilih Mata Pelajaran —</option>
								{#each data.subjects as sj (sj.id)}
									<option value={sj.id} selected={s.subject_id === sj.id}>[{sj.code}] {sj.name}</option>
								{/each}
							</select>
						</div>
						<div>
							<label class="block text-sm font-medium text-foreground mb-1">Guru *</label>
							<select name="teacher_id" class={inputCls()}>
								<option value="">— Pilih Guru —</option>
								{#each data.teachers as t (t.id)}
									<option value={t.id} selected={s.teacher_id === t.id}>{t.name}</option>
								{/each}
							</select>
						</div>
					</div>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-foreground mb-1">Slot Waktu *</label>
							<select name="time_slot_id" class={inputCls()}>
								<option value="">— Pilih Slot Waktu —</option>
								{#each data.timeSlots as ts (ts.id)}
									<option value={ts.id} selected={s.time_slot_id === ts.id}>{slotLabel(ts)}</option>
								{/each}
							</select>
						</div>
						<div>
							<label class="block text-sm font-medium text-foreground mb-1">Ruangan</label>
							<input name="room" value={s.room ?? ''} type="text" class={inputCls()} />
						</div>
					</div>
					<div class="flex justify-end gap-3 pt-2">
						<button type="button" onclick={() => (editSchedule = null)} class="px-4 py-2 text-sm text-muted-foreground border border-border hover:bg-muted/50 rounded-lg transition-colors">
							Batal
						</button>
						<button type="submit" class="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors">
							Simpan Perubahan
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- MODAL HAPUS -->
	{#if deleteTarget}
		<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
			<div class="bg-card rounded-2xl shadow-xl w-full max-w-sm p-6">
				<h2 class="text-lg font-bold text-foreground mb-2">Hapus Jadwal?</h2>
				<p class="text-sm text-muted-foreground mb-6">
					Jadwal untuk <strong>{deleteTarget.name}</strong> akan dihapus. Tindakan ini tidak dapat dibatalkan.
				</p>
				<div class="flex justify-end gap-3">
					<button onclick={() => (deleteTarget = null)} class="px-4 py-2 text-sm text-muted-foreground border border-border hover:bg-muted/50 rounded-lg transition-colors">
						Batal
					</button>
					<form method="POST" action="?/delete">
						<input type="hidden" name="id" value={deleteTarget.id} />
						<button type="submit" class="px-4 py-2 text-sm font-medium text-destructive-foreground bg-destructive hover:bg-destructive/90 rounded-lg transition-colors">
							Ya, Hapus
						</button>
					</form>
				</div>
			</div>
		</div>
	{/if}

	<!-- MODAL GENERATE -->
	{#if showGenerateModal}
		<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
			<div class="bg-card rounded-2xl shadow-xl w-full max-w-lg p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-lg font-bold text-foreground">Generate Jadwal Otomatis</h2>
					<button onclick={() => (showGenerateModal = false)} class="text-muted-foreground hover:text-foreground">✕</button>
				</div>

				<p class="text-sm text-muted-foreground mb-4">
					Jadwal dibuat dari distribusi di menu <strong>Kelas–Mapel–Guru</strong>. Setiap mapel
					dialokasikan sebanyak <strong>jam per minggu</strong>-nya. Slot istirahat dilewati dan
					benturan kelas/guru dihindari.
				</p>

				{#if generateError}
					<div class="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
						{generateError}
					</div>
				{/if}

				{#if generateMissing.length > 0}
					<ul class="mb-4 max-h-40 overflow-y-auto rounded-lg border border-border divide-y divide-border text-sm">
						{#each generateMissing as item}
							<li class="px-3 py-2 text-muted-foreground">
								<span class="font-medium text-foreground">{item.class}</span> · {item.subject} · {item.teacher}
								<span class="text-destructive">({item.count} sesi)</span>
							</li>
						{/each}
					</ul>
				{/if}

				<form method="POST" action="?/generate" use:enhanceForm={onGenerate} onsubmit={() => (generating = true)} class="space-y-4">
					<div>
						<label for="generate-year" class="block text-sm font-medium text-foreground mb-1">Tahun Ajaran *</label>
						<select id="generate-year" name="academic_year_id" required class={inputCls()}>
							<option value="">— Pilih Tahun Ajaran —</option>
							{#each data.academicYears as ay (ay.id)}
								<option value={ay.id}>{ay.name} — Semester {ay.semester}</option>
							{/each}
						</select>
					</div>

					<fieldset class="border border-border rounded-lg p-3">
						<legend class="px-1 text-sm font-medium text-foreground">Prioritas Waktu Mapel (opsional)</legend>
						<p class="text-xs text-muted-foreground mb-2">
							Centang mapel yang diutamakan pada rentang jam tertentu, misalnya IPA dan Matematika di pagi hari.
						</p>
						<div class="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
							{#each data.subjects as s (s.id)}
								<label class="flex items-center gap-2 text-sm text-foreground">
									<input type="checkbox" name="priority_subject_ids" value={s.id} />
									<span>[{s.code}] {s.name}</span>
								</label>
							{/each}
						</div>
						<div class="grid grid-cols-2 gap-3 mt-3">
							<div>
								<label for="priority-start" class="block text-xs font-medium text-muted-foreground mb-1">Jam Mulai</label>
								<input id="priority-start" type="time" name="priority_start" value="07:00" class={inputCls()} />
							</div>
							<div>
								<label for="priority-end" class="block text-xs font-medium text-muted-foreground mb-1">Jam Selesai</label>
								<input id="priority-end" type="time" name="priority_end" value="12:00" class={inputCls()} />
							</div>
						</div>
						<p class="text-xs text-muted-foreground mt-2">
							Prioritas bersifat lunak: mapel tetap dijadwalkan di luar rentang bila slot yang cocok sudah penuh.
						</p>
					</fieldset>

					<p class="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
						Jadwal tahun ajaran terpilih akan <strong>diganti seluruhnya</strong> bila semua sesi berhasil ditempatkan. Bila ada sesi yang tidak tertampung, jadwal lama tidak diubah.
					</p>

					<div class="flex justify-end gap-3 pt-1">
						<button type="button" onclick={() => (showGenerateModal = false)} class="px-4 py-2 text-sm text-muted-foreground border border-border hover:bg-muted/50 rounded-lg transition-colors">
							Batal
						</button>
						<button type="submit" disabled={generating} class="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-60 rounded-lg transition-colors">
							{generating ? 'Menyusun jadwal...' : 'Generate'}
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}
</div>
