<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	function formatRupiah(num: number): string {
		return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
	}

	let showAddModal = $state(false);
	let editSetting = $state<any>(null);

	let inputLevel = $state('X');
	let inputAmount = $state<number>(200000);
	let inputDescription = $state('');

	function openAddModal() {
		editSetting = null;
		inputLevel = 'X';
		inputAmount = 200000;
		inputDescription = '';
		showAddModal = true;
	}

	function openEditModal(setting: any) {
		editSetting = setting;
		inputLevel = setting.level;
		inputAmount = setting.amount;
		inputDescription = setting.description || '';
		showAddModal = true;
	}
</script>

<svelte:head>
	<title>Tarif & Tagihan SPP — Sistem Informasi Sekolah</title>
</svelte:head>

<div class="space-y-6">
	<!-- Flash message -->
	{#if form?.message}
		<div
			class="p-4 rounded-xl text-sm flex items-center justify-between {form?.success
				? 'bg-success/10 text-success-foreground border border-success/20'
				: 'bg-destructive/10 text-destructive border border-border'}"
		>
			<span>{form.message}</span>
		</div>
	{/if}

	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold text-foreground">Tarif & Tagihan SPP</h1>
			<p class="text-sm text-muted-foreground mt-1">
				Atur besaran tarif SPP per tingkat dan generate tagihan massal untuk siswa
			</p>
		</div>
		<div class="flex items-center gap-3">
			<a
				href="/dashboard/keuangan"
				class="px-4 py-2 bg-card border border-input hover:bg-muted/50 text-foreground text-sm font-medium rounded-xl transition-colors shadow-sm"
			>
				← Ke Transaksi
			</a>
			<button
				onclick={openAddModal}
				class="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm rounded-xl transition-colors shadow-sm"
			>
				+ Tambah Tarif SPP
			</button>
		</div>
	</div>

	<!-- Nav Tabs -->
	<div class="border-b border-border">
		<nav class="flex gap-4">
			<a
				href="/dashboard/keuangan"
				class="py-3 px-1 border-b-2 font-medium text-sm border-transparent text-muted-foreground hover:text-foreground hover:border-input"
			>
				Transaksi Pembayaran
			</a>
			<a
				href="/dashboard/keuangan/tarif"
				class="py-3 px-1 border-b-2 font-medium text-sm border-primary text-primary-foreground"
			>
				Pengaturan Tarif & Tagihan
			</a>
			<a
				href="/dashboard/keuangan/laporan"
				class="py-3 px-1 border-b-2 font-medium text-sm border-transparent text-muted-foreground hover:text-foreground hover:border-input"
			>
				Laporan & Rekapitulasi
			</a>
		</nav>
	</div>

	<!-- Year Selector & Stats -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border">
		<form method="GET" class="flex items-center gap-3">
			<label class="text-sm font-medium text-foreground whitespace-nowrap">Tahun Ajaran:</label>
			<select
				name="year_id"
				onchange={(e) => (e.target as HTMLSelectElement).form?.submit()}
				class="text-sm border border-input rounded-lg px-3 py-1.5 focus:ring-ring focus:border-ring"
			>
				{#each data.allYears as y}
					<option value={y.id} selected={data.selectedYearId === y.id}>
						{y.name} ({y.semester}) {y.isActive ? '★ Aktif' : ''}
					</option>
				{/each}
			</select>
		</form>
		<div class="text-sm text-muted-foreground">
			Total tagihan tercatat di tahun ini: <strong class="text-foreground">{data.totalBillsGenerated} item</strong>
		</div>
	</div>

	<!-- Grid Tarif dan Generate Massal -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Kolom 1 & 2: Daftar Tarif -->
		<div class="lg:col-span-2 bg-card rounded-xl border border-border overflow-hidden shadow-sm">
			<div class="px-6 py-4 border-b border-border bg-muted/50 flex items-center justify-between">
				<h2 class="text-base font-semibold text-foreground">Tarif SPP Per Tingkat</h2>
				<span class="text-xs text-muted-foreground">{data.settings.length} Tingkat Dikonfigurasi</span>
			</div>
			<div class="overflow-x-auto">
				<table class="w-full text-left text-sm text-muted-foreground">
					<thead class="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground border-b border-border">
						<tr>
							<th class="px-6 py-3">Tingkat Kelas</th>
							<th class="px-6 py-3">Tarif SPP / Bulan</th>
							<th class="px-6 py-3">Keterangan</th>
							<th class="px-6 py-3 text-right">Aksi</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#if data.settings && data.settings.length > 0}
							{#each data.settings as s}
								<tr class="hover:bg-muted/50">
									<td class="px-6 py-4 font-bold text-foreground">
										Kelas {s.level}
									</td>
									<td class="px-6 py-4 font-semibold text-success-foreground text-base">
										{formatRupiah(s.amount)}
									</td>
									<td class="px-6 py-4 text-muted-foreground text-xs">
										{s.description || '-'}
									</td>
									<td class="px-6 py-4 text-right">
										<div class="inline-flex items-center gap-2">
											<button
												onclick={() => openEditModal(s)}
												class="px-2.5 py-1 text-xs font-medium text-primary-foreground bg-primary/10 hover:bg-primary/20 rounded-lg"
											>
												Edit
											</button>
											<form method="POST" action="?/deleteTarif" use:enhance>
												<input type="hidden" name="setting_id" value={s.id} />
												<button
													type="submit"
													onclick={(e) => {
														if (!confirm(`Hapus tarif tingkat ${s.level}?`)) e.preventDefault();
													}}
													class="px-2.5 py-1 text-xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/10 rounded-lg"
												>
													Hapus
												</button>
											</form>
										</div>
									</td>
								</tr>
							{/each}
						{:else}
							<tr>
								<td colspan="4" class="px-6 py-10 text-center text-muted-foreground text-sm">
									Belum ada tarif SPP yang diatur untuk tahun ajaran ini.
								</td>
							</tr>
						{/if}
					</tbody>
				</table>
			</div>
		</div>

		<!-- Kolom 3: Generate Tagihan Massal -->
		<div class="bg-card rounded-xl border border-border p-6 shadow-sm space-y-5">
			<div>
				<h2 class="text-base font-bold text-foreground">Buat Tagihan SPP Massal</h2>
				<p class="text-xs text-muted-foreground mt-1">
					Generate tagihan SPP untuk semua siswa aktif secara otomatis sesuai tarif per tingkat.
				</p>
			</div>

			<div class="bg-primary/10 border border-border rounded-xl p-3 text-xs text-primary-foreground space-y-1">
				<p class="font-semibold">💡 Info Pembuatan Tagihan:</p>
				<p>• Tagihan yang sudah pernah dibuat tidak akan terduplikasi.</p>
				<p>• Besar nominal otomatis mengambil tarif tingkat kelas siswa.</p>
			</div>

			<form method="POST" action="?/generateBills" use:enhance class="space-y-4">
				<input type="hidden" name="academic_year_id" value={data.selectedYearId} />

				<div>
					<label class="block text-xs font-medium text-foreground mb-1">Dari Bulan *</label>
					<select
						name="start_month"
						class="w-full text-sm border border-input rounded-lg px-3 py-2 focus:ring-ring focus:border-ring"
					>
						<option value="7" selected>Juli (Awal Semester Ganjil)</option>
						<option value="8">Agustus</option>
						<option value="9">September</option>
						<option value="10">Oktober</option>
						<option value="11">November</option>
						<option value="12">Desember</option>
						<option value="1">Januari (Awal Semester Genap)</option>
						<option value="2">Februari</option>
						<option value="3">Maret</option>
						<option value="4">April</option>
						<option value="5">Mei</option>
						<option value="6">Juni</option>
					</select>
				</div>

				<div>
					<label class="block text-xs font-medium text-foreground mb-1">Sampai Bulan *</label>
					<select
						name="end_month"
						class="w-full text-sm border border-input rounded-lg px-3 py-2 focus:ring-ring focus:border-ring"
					>
						<option value="12" selected>Desember (Akhir Semester Ganjil)</option>
						<option value="6">Juni (Akhir Tahun Ajaran)</option>
						<option value="7">Juli</option>
						<option value="8">Agustus</option>
						<option value="9">September</option>
						<option value="10">Oktober</option>
						<option value="11">November</option>
					</select>
				</div>

				<div>
					<label class="block text-xs font-medium text-foreground mb-1">Tahun Kalender *</label>
					<input
						type="number"
						name="year"
						value={new Date().getFullYear()}
						class="w-full text-sm border border-input rounded-lg px-3 py-2 focus:ring-ring focus:border-ring"
						required
					/>
				</div>

				<button
					type="submit"
					onclick={(e) => {
						if (!confirm('Generate tagihan SPP massal untuk semua siswa? Tagihan baru akan berstatus Belum Lunas.')) {
							e.preventDefault();
						}
					}}
					class="w-full py-2.5 bg-success hover:bg-success/90 text-success-foreground font-semibold text-sm rounded-xl shadow-sm transition-colors"
				>
					Generate Tagihan Siswa
				</button>
			</form>
		</div>
	</div>
</div>

<!-- ============================================================== -->
<!-- MODAL TAMBAH / EDIT TARIF                                      -->
<!-- ============================================================== -->
{#if showAddModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
		<div class="bg-card rounded-2xl max-w-md w-full p-6 shadow-xl border border-border">
			<div class="flex items-center justify-between pb-3 border-b bg-muted mb-4">
				<h3 class="text-lg font-bold text-foreground">
					{editSetting ? 'Edit Tarif SPP' : 'Tambah Tarif SPP Tingkat'}
				</h3>
				<button
					onclick={() => (showAddModal = false)}
					class="text-muted-foreground hover:text-muted-foreground text-xl font-bold"
				>
					✕
				</button>
			</div>

			<form method="POST" action="?/saveTarif" use:enhance={() => {
				return async ({ update }) => {
					await update();
					showAddModal = false;
				};
			}}>
				<input type="hidden" name="academic_year_id" value={data.selectedYearId} />
				{#if editSetting}
					<input type="hidden" name="setting_id" value={editSetting.id} />
				{/if}

				<div class="space-y-4">
					<div>
						<label class="block text-xs font-semibold text-foreground mb-1">Tingkat Kelas *</label>
						<select
							name="level"
							bind:value={inputLevel}
							class="w-full text-sm border border-input rounded-lg px-3 py-2 focus:ring-ring focus:border-ring"
						>
							<option value="X">Kelas X</option>
							<option value="XI">Kelas XI</option>
							<option value="XII">Kelas XII</option>
							<option value="SEMUA">Semua Tingkat (Umum)</option>
						</select>
					</div>

					<div>
						<label class="block text-xs font-semibold text-foreground mb-1">Besaran Tarif (Rp) *</label>
						<input
							type="number"
							name="amount"
							bind:value={inputAmount}
							min="0"
							step="1000"
							required
							placeholder="Contoh: 200000"
							class="w-full text-sm border border-input rounded-lg px-3 py-2 focus:ring-ring focus:border-ring"
						/>
					</div>

					<div>
						<label class="block text-xs font-semibold text-foreground mb-1">Keterangan</label>
						<input
							type="text"
							name="description"
							bind:value={inputDescription}
							placeholder="Misal: SPP Bulanan Reguler"
							class="w-full text-sm border border-input rounded-lg px-3 py-2 focus:ring-ring focus:border-ring"
						/>
					</div>
				</div>

				<div class="flex items-center justify-end gap-3 mt-6 pt-4 border-t bg-muted">
					<button
						type="button"
						onclick={() => (showAddModal = false)}
						class="px-4 py-2 border border-input rounded-lg text-sm font-medium text-foreground hover:bg-muted/50"
					>
						Batal
					</button>
					<button
						type="submit"
						class="px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-semibold shadow-sm"
					>
						Simpan Tarif
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
