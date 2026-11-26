<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '$lib/components/ui/card/index.js';
	import {
		Table, TableBody, TableCell, TableHead, TableHeader, TableRow
	} from '$lib/components/ui/table/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import Calendar from '@lucide/svelte/icons/calendar';
	import FileText from '@lucide/svelte/icons/file-text';
	import CheckCircle from '@lucide/svelte/icons/circle-check';
	import XCircle from '@lucide/svelte/icons/circle-x';
	import Download from '@lucide/svelte/icons/download';

	let { data }: { data: PageData } = $props();
	const { isGuru, requests, slots, dayLabels, pendingCount, classesList, teachersList, manualAbsences } = data;

	function formatDate(d: string) {
		return new Date(`${d}T00:00:00`).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
	}

	const STATUS_VARIANTS: Record<string, 'secondary' | 'default' | 'destructive' | 'outline'> = {
		pending: 'secondary',
		approved: 'default',
		rejected: 'destructive'
	};

	const days = [1,2,3,4,5,6,7];
</script>

<svelte:head>
	<title>Piket KBM | SISKO</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold text-foreground">Piket KBM</h1>
			<p class="text-muted-foreground">Pengajuan izin berhalangan mengajar & catatan ketidakhadiran</p>
		</div>
		{#if isGuru && pendingCount > 0}
			<div class="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-md">
				{pendingCount} pengajuan menunggu persetujuan
			</div>
		{/if}
	</div>

	{#if isGuru}
		<!-- Form Pengajuan Izin -->
		<Card class="bg-card border-border">
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<FileText class="w-5 h-5 text-primary" />
					Pengajuan Izin Tidak Hadir (Diri Sendiri)
				</CardTitle>
				<CardDescription>Isi form untuk mengajukan izin tidak bisa mengajar pada jam tertentu</CardDescription>
			</CardHeader>
			<CardContent>
				<form method="POST" action="?/create" use:enhance>
					<div class="grid gap-4 md:grid-cols-2 mb-6">
						<div>
							<Label for="date">Tanggal <span class="text-destructive">*</span></Label>
							<Input id="date" name="date" type="date" required class="mt-1" />
						</div>
					</div>

					<Label class="block mb-2">Jam Pelajaran <span class="text-destructive">*</span></Label>
					<div class="grid gap-2 md:grid-cols-3 mb-6">
						{#each days as day}
							<div class="border rounded-lg p-3 bg-muted/30">
								<h4 class="font-medium text-sm mb-2 flex items-center gap-1">
									<Calendar class="w-3.5 h-3.5" />
									{dayLabels[day]}
								</h4>
								{#each slots.filter((s) => s.day_of_week === day) as slot}
									<label class="flex items-center gap-2 text-sm cursor-pointer">
										<input type="checkbox" name="slot_ids" value={slot.id} class="rounded border-border text-primary focus:ring-primary" />
										<span>{slot.start_time}–{slot.end_time} <span class="text-muted-foreground">(Jam {slot.slot_number})</span></span>
									</label>
								{/each}
								{#if slots.filter((s) => s.day_of_week === day).length === 0}
									<p class="text-xs text-muted-foreground">Tidak ada jadwal</p>
								{/if}
							</div>
						{/each}
					</div>

					<Separator class="mb-4" />

					<div class="space-y-4">
						<div>
							<Label for="reason">Alasan Berhalangan <span class="text-destructive">*</span></Label>
							<Textarea id="reason" name="reason" rows={3} required placeholder="Jelaskan alasan tidak dapat mengajar (sakit, dinas, izin, dll)" class="mt-1" />
						</div>

						<div>
							<Label for="task_note">Tugas untuk Siswa (opsional)</Label>
							<Textarea id="task_note" name="task_note" rows={2} placeholder="Tulis tugas/aktivitas yang harus dikerjakan siswa saat guru tidak hadir" class="mt-1" />
						</div>

						<div>
							<Label for="attachment">Lampiran Tugas (PDF/Doc/Image, max 10MB) — opsional</Label>
							<Input id="attachment" name="attachment" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" class="mt-1" />
							<p class="text-xs text-muted-foreground mt-1">File akan diunggah ke penyimpanan aman</p>
						</div>
					</div>

					<div class="mt-6 flex gap-3">
						<Button type="submit">Kirim Pengajuan</Button>
					</div>
				</form>
			</CardContent>
			</Card>
	{/if}

	<!-- Form Entri Manual Ketidakhadiran (Guru Piket / Admin) -->
	<Card class="bg-card border-border">
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<FileText class="w-5 h-5 text-primary" />
				Catatan Ketidakhadiran Guru (Entri Manual)
			</CardTitle>
			<CardDescription>Guru piket / admin mencatat guru lain yang tidak hadir pada jam & kelas tertentu</CardDescription>
		</CardHeader>
		<CardContent>
			<form method="POST" action="?/createManual" use:enhance class="grid gap-4 md:grid-cols-5 mb-6">
				<div>
					<Label for="manual_date">Tanggal <span class="text-destructive">*</span></Label>
					<Input id="manual_date" name="date" type="date" required class="mt-1" />
				</div>
				<div>
					<Label for="manual_class">Kelas <span class="text-destructive">*</span></Label>
					<select name="class_id" required class="mt-1 flex h-9 w-full rounded-md border border-border bg-background px-3 text-sm">
						<option value="">Pilih kelas</option>
						{#each classesList as c}
							<option value={c.id}>{c.name}</option>
						{/each}
					</select>
				</div>
				<div>
					<Label for="manual_slot">Jam Pelajaran <span class="text-destructive">*</span></Label>
					<select name="time_slot_id" required class="mt-1 flex h-9 w-full rounded-md border border-border bg-background px-3 text-sm">
						<option value="">Pilih jam</option>
						{#each slots as s}
							<option value={s.id}>{s.start_time}–{s.end_time} (Jam {s.slot_number})</option>
						{/each}
					</select>
				</div>
				<div>
					<Label for="manual_teacher">Guru <span class="text-destructive">*</span></Label>
					<select name="teacher_id" required class="mt-1 flex h-9 w-full rounded-md border border-border bg-background px-3 text-sm">
						<option value="">Pilih guru</option>
						{#each teachersList as t}
							<option value={t.id}>{t.name}</option>
						{/each}
					</select>
				</div>
				<div class="md:col-span-5">
					<Label for="manual_note">Catatan (opsional)</Label>
					<Input id="manual_note" name="note" placeholder="Keterangan tambahan" class="mt-1" />
				</div>
				<div class="md:col-span-5 flex gap-3">
					<Button type="submit">Simpan Catatan</Button>
				</div>
			</form>

			<!-- Daftar Catatan Manual -->
			{#if manualAbsences.length === 0}
				<div class="text-center py-8 text-muted-foreground">
					<FileText class="w-12 h-12 mx-auto mb-3 opacity-30" />
					<p>Belum ada catatan ketidakhadiran</p>
				</div>
			{:else}
				<Table class="w-full">
					<TableHeader>
						<TableRow>
							<TableHead>Tanggal</TableHead>
							<TableHead>Kelas</TableHead>
							<TableHead>Jam</TableHead>
							<TableHead>Guru</TableHead>
							<TableHead>Catatan</TableHead>
							<TableHead class="text-right">Aksi</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each manualAbsences as m}
							<TableRow>
								<TableCell>{formatDate(m.date)}</TableCell>
								<TableCell>{m.class_name}</TableCell>
								<TableCell class="font-mono">{m.start_time}–{m.end_time}</TableCell>
								<TableCell>{m.teacher_name}</TableCell>
								<TableCell class="max-w-[200px] truncate text-muted-foreground">{m.note ?? '-'}</TableCell>
								<TableCell class="text-right">
									<form method="POST" action="?/deleteManual" use:enhance>
										<input type="hidden" name="id" value={m.id} />
										<Button type="submit" variant="ghost" size="icon" class="text-destructive hover:text-destructive hover:bg-destructive/10" title="Hapus">
											<XCircle class="w-4 h-4" />
										</Button>
									</form>
								</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			{/if}
		</CardContent>
	</Card>

	<!-- Daftar Pengajuan Izin -->
	<Card>
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<FileText class="w-5 h-5 text-primary" />
				Daftar Pengajuan Izin
			</CardTitle>
		</CardHeader>
		<CardContent>
			{#if requests.length === 0}
				<div class="text-center py-12 text-muted-foreground">
					<FileText class="w-12 h-12 mx-auto mb-3 opacity-30" />
					<p>Belum ada pengajuan</p>
				</div>
			{:else}
				<Table class="w-full">
					<TableHeader>
						<TableRow>
							<TableHead>Tanggal</TableHead>
							<TableHead>Jam</TableHead>
							<TableHead>Guru</TableHead>
							<TableHead>Alasan</TableHead>
							<TableHead>Tugas</TableHead>
							<TableHead>Lampiran</TableHead>
							<TableHead>Status</TableHead>
							<TableHead class="text-right">Aksi</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each requests as r}
							<TableRow>
								<TableCell>{formatDate(r.date)}</TableCell>
								<TableCell class="font-mono">{r.slot_label}</TableCell>
								<TableCell>{r.teacher_name}</TableCell>
								<TableCell class="max-w-[200px] truncate" title={r.reason}>{r.reason}</TableCell>
								<TableCell class="max-w-[150px] truncate text-muted-foreground" title={r.task_note ?? '-'}>
									{r.task_note ?? '-'}
								</TableCell>
								<TableCell>
									{#if r.attachment_key}
										<a href={`/api/storage/${r.attachment_key}`} target="_blank" rel="noopener" class="inline-flex items-center gap-1 text-primary hover:underline text-sm">
											<Download class="w-3.5 h-3.5" />
											{r.attachment_name}
										</a>
									{:else}
										<span class="text-muted-foreground">-</span>
									{/if}
								</TableCell>
								<TableCell>
									<Badge variant={STATUS_VARIANTS[r.status] ?? 'secondary'} class="capitalize">{r.status}</Badge>
								</TableCell>
								<TableCell class="text-right">
									<div class="flex items-center justify-end gap-2">
										{#if r.status === 'pending'}
											{#if isGuru}
												<form method="POST" action="?/cancel" use:enhance>
													<input type="hidden" name="id" value={r.id} />
													<Button type="submit" variant="ghost" size="icon" class="text-destructive hover:text-destructive hover:bg-destructive/10" title="Batalkan">
														<XCircle class="w-4 h-4" />
													</Button>
												</form>
											{:else}
												<form method="POST" action="?/review" use:enhance>
													<input type="hidden" name="id" value={r.id} />
													<Button type="submit" name="status" value="approved" variant="ghost" size="icon" class="text-success hover:text-success hover:bg-success/10" title="Setujui">
														<CheckCircle class="w-4 h-4" />
													</Button>
													<Button type="submit" name="status" value="rejected" variant="ghost" size="icon" class="text-destructive hover:text-destructive hover:bg-destructive/10" title="Tolak">
														<XCircle class="w-4 h-4" />
													</Button>
												</form>
											{/if}
										{/if}
									</div>
								</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			{/if}
		</CardContent>
	</Card>
</div>