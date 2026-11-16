<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { fieldError, hasError } from '$lib/form-helpers';
	import { zodClient } from 'sveltekit-superforms/adapters/zod4';
	import { collectionProjectSchema } from '$lib/validation/pengumpulan';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Card } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Alert, AlertDescription } from '$lib/components/ui/alert/index.js';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
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
		validators: zodClient(collectionProjectSchema),
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
	let showReportModal = $state(false);
	let showSubmitModal = $state(false);
	let editProject: any = $state(null);
	let deleteTarget: { id: number; title: string } | null = $state(null);
	let reportProject: any = $state(null);
	let submitProject: any = $state(null);
	let submitFileUrl = $state('');
	let submitNote = $state('');
	let createTargetIds = $state<number[]>([]);
	let editTargetType = $state('all');
	let editTargetIds = $state<number[]>([]);

	function openEdit(p: any) {
		editProject = p;
		editTargetType = p.target_type ?? 'all';
		editTargetIds = [...(p.target_ids ?? [])];
		showEditModal = true;
	}

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

	function fmt(ts: number | null) {
		return ts ? new Date(ts).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
	}

	function pct(submitted: number, total: number) {
		return total ? Math.round((submitted / total) * 100) : 0;
	}
</script>

<svelte:head>
	<title>Pengumpulan Berkas — SIS</title>
</svelte:head>

<div class="max-w-5xl">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
		<div>
			<h1 class="text-xl font-bold text-foreground">Pengumpulan Berkas</h1>
			<p class="text-sm text-muted-foreground mt-0.5">
				{data.isAdmin
					? 'Terbitkan proyek pengumpulan berkas guru dan pantau progresnya'
					: 'Proyek pengumpulan berkas untuk Anda'}
			</p>
		</div>
		{#if data.isAdmin}
			<Button onclick={() => (showAddModal = true)} class="min-h-11 w-full sm:w-auto">
				+ Terbitkan Proyek
			</Button>
		{/if}
	</div>

	{#if data.projects.length === 0}
		<Card class="py-16 text-center text-muted-foreground text-sm">
			{data.isAdmin ? 'Belum ada proyek pengumpulan.' : 'Belum ada proyek yang ditugaskan kepada Anda.'}
		</Card>
	{:else}
		<div class="grid gap-4">
			{#each data.projects as p (p.id)}
				<Card class="p-4 sm:p-5">
					<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2 flex-wrap">
								<h2 class="font-semibold text-foreground">{p.title}</h2>
								<Badge class={p.is_active ? 'bg-success/10 text-success-foreground' : 'bg-muted text-muted-foreground'}>
									{p.is_active ? 'Aktif' : 'Nonaktif'}
								</Badge>
								{#if p.deadline}
									<Badge variant="outline">Tenggat {p.deadline}</Badge>
								{/if}
							</div>
							{#if p.description}
								<p class="text-sm text-muted-foreground mt-1">{p.description}</p>
							{/if}
						</div>

						{#if data.isAdmin}
							<div class="flex items-center gap-2 shrink-0">
								<Button variant="outline" size="sm" onclick={() => { reportProject = p; showReportModal = true; }}>
									Laporan
								</Button>
								<Button variant="ghost" size="sm" onclick={() => openEdit(p)}>
									<PencilIcon data-icon="inline-start" /> Edit
								</Button>
								<Button variant="ghost" size="sm" class="text-destructive" onclick={() => { deleteTarget = { id: p.id, title: p.title }; showDeleteModal = true; }}>
									<Trash2Icon data-icon="inline-start" /> Hapus
								</Button>
							</div>
						{/if}
					</div>

					{#if data.isAdmin}
						<div class="mt-4">
							<div class="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
								<span>Progres pengumpulan guru</span>
								<span>{p.submitted_count}/{p.total} guru ({pct(p.submitted_count, p.total)}%)</span>
							</div>
							<div class="h-2 w-full rounded-full bg-muted overflow-hidden">
								<div class="h-full bg-primary transition-all" style="width: {pct(p.submitted_count, p.total)}%"></div>
							</div>
						</div>
					{:else}
						<div class="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-border pt-4">
							<span class="text-sm">
								{#if p.submitted}
									<Badge class="bg-success/10 text-success-foreground">Sudah dikumpulkan</Badge>
									<span class="text-muted-foreground ml-1">{fmt(p.submitted_at)}</span>
								{:else}
									<Badge class="bg-warning/10 text-warning-foreground">Belum dikumpulkan</Badge>
								{/if}
							</span>
							<Button size="sm" onclick={() => { submitProject = p; submitFileUrl = p.file_url ?? ''; submitNote = p.note ?? ''; showSubmitModal = true; }}>
								{p.submitted ? 'Perbarui Pengumpulan' : 'Kumpulkan Sekarang'}
							</Button>
						</div>
					{/if}
				</Card>
			{/each}
		</div>
	{/if}
</div>

<!-- MODAL TERBITKAN -->
{#if showAddModal}
	<Dialog bind:open={showAddModal}>
		<DialogContent class="sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
			<DialogHeader class="flex items-center justify-between mb-5">
				<DialogTitle class="text-lg font-bold text-foreground">Terbitkan Proyek</DialogTitle>
				<Button variant="ghost" size="sm" class="h-6 w-6 p-0" onclick={() => (showAddModal = false)}>✕</Button>
			</DialogHeader>
			{#if $message}
				<Alert variant="destructive" class="mb-4">
					<AlertDescription>{$message}</AlertDescription>
				</Alert>
			{/if}
			<form method="POST" action="?/create" use:enhance class="space-y-4">
				<div>
					<Label for="add-title">Judul Proyek *</Label>
					<Input id="add-title" name="title" bind:value={$form.title} class={inputCls($errors.title)} />
					{#if $errors.title}<p class="mt-1 text-xs text-destructive">{fieldError($errors.title)}</p>{/if}
				</div>
				<div>
					<Label for="add-desc">Deskripsi</Label>
					<Textarea id="add-desc" name="description" bind:value={$form.description} rows={2} class="resize-none" />
				</div>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<Label for="add-deadline">Tenggat</Label>
						<Input id="add-deadline" name="deadline" type="date" bind:value={$form.deadline} />
					</div>
					<div>
						<Label for="add-target-type">Target Pengumpul *</Label>
						<select
							id="add-target-type"
							name="target_type"
							bind:value={$form.target_type}
							class={inputCls()}
						>
							<option value="all">Semua Guru</option>
							<option value="teacher">Guru Tertentu</option>
						</select>
					</div>
				</div>
				{#if $form.target_type === 'teacher'}
					<div>
						<Label for="add-target-ids">Pilih Guru * <span class="text-xs text-muted-foreground">(bisa lebih dari satu)</span></Label>
						<select
							id="add-target-ids"
							name="target_ids"
							multiple
							bind:value={createTargetIds}
							class="w-full h-40 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
						>
							{#each data.teachers as t (t.id)}
								<option value={t.id}>{t.name}{t.nip ? ` — ${t.nip}` : ''}</option>
							{/each}
						</select>
					</div>
				{/if}
				<div>
					<Label for="add-active">Status Proyek</Label>
					<select id="add-active" name="is_active" bind:value={$form.is_active} class={inputCls()}>
						<option value={1}>Aktif</option>
						<option value={0}>Nonaktif</option>
					</select>
				</div>
				<DialogFooter class="gap-2 pt-2">
					<Button type="button" variant="outline" onclick={() => (showAddModal = false)}>Batal</Button>
					<Button type="submit" disabled={$submitting}>{$submitting ? 'Menyimpan...' : 'Terbitkan'}</Button>
				</DialogFooter>
			</form>
		</DialogContent>
	</Dialog>
{/if}

<!-- MODAL EDIT -->
{#if editProject}
	<Dialog bind:open={showEditModal}>
		<DialogContent class="sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
			<DialogHeader class="flex items-center justify-between mb-5">
				<DialogTitle class="text-lg font-bold text-foreground">Edit Proyek</DialogTitle>
				<Button variant="ghost" size="sm" class="h-6 w-6 p-0" onclick={() => { editProject = null; showEditModal = false; }}>✕</Button>
			</DialogHeader>
			<form method="POST" action="?/update" class="space-y-4">
				<input type="hidden" name="id" value={editProject.id} />
				<div>
					<Label for="edit-title">Judul Proyek *</Label>
					<Input id="edit-title" name="title" value={editProject.title} class={inputCls()} />
				</div>
				<div>
					<Label for="edit-desc">Deskripsi</Label>
					<Textarea id="edit-desc" name="description" value={editProject.description ?? ''} rows={2} class="resize-none" />
				</div>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<Label for="edit-deadline">Tenggat</Label>
						<Input id="edit-deadline" name="deadline" type="date" value={editProject.deadline ?? ''} />
					</div>
					<div>
						<Label for="edit-target-type">Target Pengumpul *</Label>
						<select id="edit-target-type" name="target_type" bind:value={editTargetType} class={inputCls()}>
							<option value="all">Semua Guru</option>
							<option value="teacher">Guru Tertentu</option>
						</select>
					</div>
				</div>
				{#if editTargetType === 'teacher'}
					<div>
						<Label for="edit-target-ids">Pilih Guru * <span class="text-xs text-muted-foreground">(bisa lebih dari satu)</span></Label>
						<select
							id="edit-target-ids"
							name="target_ids"
							multiple
							bind:value={editTargetIds}
							class="w-full h-40 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
						>
							{#each data.teachers as t (t.id)}
								<option value={t.id}>{t.name}{t.nip ? ` — ${t.nip}` : ''}</option>
							{/each}
						</select>
					</div>
				{/if}
				<div>
					<Label for="edit-active">Status Proyek</Label>
					<select id="edit-active" name="is_active" class={inputCls()}>
						<option value={1} selected={editProject.is_active === 1}>Aktif</option>
						<option value={0} selected={editProject.is_active === 0}>Nonaktif</option>
					</select>
				</div>
				<DialogFooter class="gap-2 pt-2">
					<Button type="button" variant="outline" onclick={() => { editProject = null; showEditModal = false; }}>Batal</Button>
					<Button type="submit">Simpan Perubahan</Button>
				</DialogFooter>
			</form>
		</DialogContent>
	</Dialog>
{/if}

<!-- MODAL LAPORAN -->
{#if reportProject}
	<Dialog bind:open={showReportModal}>
		<DialogContent class="sm:max-w-2xl max-h-[85vh] overflow-y-auto p-4 sm:p-6">
			<DialogHeader class="flex items-center justify-between mb-3">
				<DialogTitle class="text-lg font-bold text-foreground">Laporan: {reportProject.title}</DialogTitle>
				<Button variant="ghost" size="sm" class="h-6 w-6 p-0" onclick={() => { reportProject = null; showReportModal = false; }}>✕</Button>
			</DialogHeader>
			<p class="text-sm text-muted-foreground mb-3">
				{reportProject.submitted_count}/{reportProject.total} guru sudah mengumpulkan
				({pct(reportProject.submitted_count, reportProject.total)}%)
			</p>
			<div class="divide-y divide-border">
				{#each reportProject.teachers as t (t.teacher_id)}
					<div class="flex items-center justify-between gap-3 py-2.5">
						<div class="min-w-0">
							<p class="text-sm font-medium text-foreground truncate">{t.name}</p>
							<p class="text-xs text-muted-foreground">{t.nip ? `NIP ${t.nip}` : '—'}</p>
							{#if t.submitted && t.file_url}
								<a href={t.file_url} target="_blank" rel="noopener noreferrer" class="text-xs text-primary hover:underline break-all">{t.file_url}</a>
							{/if}
						</div>
						<div class="text-right shrink-0">
							{#if t.submitted}
								<Badge class="bg-success/10 text-success-foreground">Sudah</Badge>
								<p class="text-[11px] text-muted-foreground mt-1">{fmt(t.submitted_at)}</p>
							{:else}
								<Badge class="bg-warning/10 text-warning-foreground">Belum</Badge>
							{/if}
						</div>
					</div>
				{/each}
			</div>
			<DialogFooter class="pt-3">
				<Button type="button" variant="outline" onclick={() => { reportProject = null; showReportModal = false; }}>Tutup</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>
{/if}

<!-- MODAL KIRIM GURU -->
{#if submitProject}
	<Dialog bind:open={showSubmitModal}>
		<DialogContent class="sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
			<DialogHeader class="flex items-center justify-between mb-4">
				<DialogTitle class="text-lg font-bold text-foreground">Kumpulkan: {submitProject.title}</DialogTitle>
				<Button variant="ghost" size="sm" class="h-6 w-6 p-0" onclick={() => { submitProject = null; showSubmitModal = false; }}>✕</Button>
			</DialogHeader>
			{#if submitProject.description}
				<p class="text-sm text-muted-foreground mb-3">{submitProject.description}</p>
			{/if}
			<form method="POST" action="?/submit" class="space-y-4">
				<input type="hidden" name="project_id" value={submitProject.id} />
				<div>
					<Label for="submit-url">Link Berkas yang Dikumpulkan *</Label>
					<Input id="submit-url" name="file_url" type="url" required placeholder="https://drive.google.com/..." bind:value={submitFileUrl} />
					<p class="mt-1 text-xs text-muted-foreground">Tempel link berkas/dokumen Anda.</p>
				</div>
				<div>
					<Label for="submit-note">Catatan (opsional)</Label>
					<Textarea id="submit-note" name="note" rows={2} bind:value={submitNote} class="resize-none" />
				</div>
				<DialogFooter class="gap-2 pt-2">
					<Button type="button" variant="outline" onclick={() => { submitProject = null; showSubmitModal = false; }}>Batal</Button>
					<Button type="submit">Tandai Sudah Mengumpulkan</Button>
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
				<DialogTitle class="text-lg font-bold text-foreground">Hapus Proyek?</DialogTitle>
				<DialogDescription class="text-sm text-muted-foreground">
					Proyek "<strong>{deleteTarget.title}</strong>" akan dihapus. Tindakan ini tidak dapat dibatalkan.
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
