<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { fieldError, hasError } from '$lib/form-helpers';
	import { zodClient } from 'sveltekit-superforms/adapters/zod4';
	import { scheduleSchema } from '$lib/validation/schedule';
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
	let editSchedule: (typeof data.schedules)[0] | null = $state(null);
	let deleteTarget: { id: number; name: string } | null = $state(null);
	let activeDay = $state<number | null>(null);

	const availableDays = $derived(
		[...new Set(data.schedules.map((s) => s.time_slot_day).filter((d): d is number => d != null))].sort((a, b) => a - b)
	);
	const filteredSchedules = $derived(
		activeDay === null ? data.schedules : data.schedules.filter((s) => s.time_slot_day === activeDay)
	);

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
</script>

<svelte:head>
	<title>Jadwal Pelajaran — SIS</title>
</svelte:head>

<div class="max-w-6xl">
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-xl font-bold text-foreground">Jadwal Pelajaran</h1>
		<p class="text-sm text-muted-foreground mt-0.5">
			{headline}
		</p>
	</div>
		{#if canManage}
			<button
				onclick={() => (showAddModal = true)}
				class="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors"
			>
				+ Tambah Jadwal
			</button>
		{/if}
	</div>

	{#if availableDays.length > 1}
		<div class="mb-4 flex items-center gap-2 overflow-x-auto pb-1">
			<button
				onclick={() => (activeDay = null)}
				class="px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors {activeDay === null
					? 'bg-primary text-primary-foreground'
					: 'bg-card border border-border text-muted-foreground hover:bg-muted/50'}"
			>
				Semua Hari
			</button>
			{#each availableDays as day (day)}
				<button
					onclick={() => (activeDay = day)}
					class="px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors {activeDay === day
						? 'bg-primary text-primary-foreground'
						: 'bg-card border border-border text-muted-foreground hover:bg-muted/50'}"
				>
					{data.dayLabels[day] ?? `Hari ${day}`}
				</button>
			{/each}
		</div>
	{/if}

	<div class="bg-card rounded-xl border border-border overflow-hidden">
		{#if data.schedules.length === 0}
			<div class="py-16 text-center text-muted-foreground text-sm">Belum ada jadwal pelajaran.</div>
		{:else if filteredSchedules.length === 0}
			<div class="py-16 text-center text-muted-foreground text-sm">Tidak ada jadwal pada hari {data.dayLabels[activeDay ?? -1] ?? ''}.</div>
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
							<td class="px-5 py-3.5 text-muted-foreground">{s.room ?? '—'}</td>
								{#if canManage}
									<td class="px-5 py-3.5 text-right space-x-3">
										<button
											onclick={() => (editSchedule = s)}
											class="text-xs text-primary-foreground hover:text-primary-foreground/90 font-medium"
										>Edit</button>
										<button
											onclick={() => (deleteTarget = { id: s.id, name: s.class_name ?? 'Kelas' })}
											class="text-xs text-destructive hover:text-destructive font-medium"
										>Hapus</button>
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
</div>
