<script lang="ts">
	import { fail } from '@sveltejs/kit';
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';

	let { data }: { data: PageData & { success?: boolean; message?: string } } = $props();

	const school = data.school as Record<string, any>;
</script>

<svelte:head>
	<title>Pengaturan Tema — SIS</title>
</svelte:head>

<div class="max-w-3xl mx-auto px-1">
	{#if data.success}
		<Alert>
			<AlertTitle>Berhasil</AlertTitle>
			<AlertDescription>{data.message}</AlertDescription>
		</Alert>
	{:else if data.message}
		<Alert variant="destructive">
			<AlertTitle>Gagal</AlertTitle>
			<AlertDescription>{data.message}</AlertDescription>
		</Alert>
	{/if}

	<Card>
		<CardHeader>
			<CardTitle>Pengaturan Tema Sekolah</CardTitle>
			<p class="text-sm text-muted-foreground">
				Ubah warna aplikasi untuk sekolah <b>{school.name}</b>. Preview langsung berlaku di seluruh halaman.
			</p>
		</CardHeader>
		<CardContent class="space-y-4">
			<form action="?/updateTheme" method="POST" class="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
				{#each [
					{ key: 'primary_color', label: 'Warna Utama' },
					{ key: 'secondary_color', label: 'Warna Sekunder' },
					{ key: 'accent_success', label: 'Sukses' },
					{ key: 'accent_danger', label: 'Bahaya' },
					{ key: 'accent_warning', label: 'Peringatan' },
					{ key: 'accent_info', label: 'Informasi' }
				] as item}
					<div class="flex flex-col gap-1.5">
						<Label for={item.key} class="text-xs sm:text-sm">{item.label}</Label>
						<div class="flex items-center gap-2">
							<Input
								id={item.key}
								name={item.key}
								type="color"
								class="h-10 w-10 sm:h-12 sm:w-16 shrink-0 rounded-lg border-0 cursor-pointer p-0.5"
								value={school[item.key] ?? '#0f172a'}
							/>
							<input
								id={item.key + '-text'}
								name={item.key + '-text'}
								type="text"
								value={school[item.key]}
								readonly
								class="w-full min-w-0 px-2 py-1.5 rounded-lg border text-xs sm:text-sm bg-input text-foreground"
							/>
						</div>
					</div>
				{/each}
				<div class="col-span-2 sm:col-span-3 pt-2">
					<Separator orientation="horizontal" />
					<Button type="submit" class="w-full mt-3">
						Simpan Perubahan
					</Button>
				</div>
			</form>
		</CardContent>
	</Card>
</div>
