<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const { user, stats } = data;

	const roleLabels: Record<string, string> = {
		superadmin: 'Superadmin',
		admin_sekolah: 'Admin Sekolah',
		guru: 'Guru',
		siswa: 'Siswa'
	};
</script>

<svelte:head>
	<title>Dashboard — Sistem Informasi Sekolah</title>
</svelte:head>

<div class="max-w-5xl">
	<!-- Sambutan -->
	<div class="mb-8">
		<h1 class="text-2xl font-bold text-gray-900">
			Selamat datang, {user.name} 👋
		</h1>
		<p class="text-gray-500 mt-1">
			Anda masuk sebagai <span class="font-medium text-blue-600">{roleLabels[user.role]}</span>
		</p>
	</div>

	<!-- SUPERADMIN -->
	{#if user.role === 'superadmin'}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
			<a href="/dashboard/sekolah" class="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
				<p class="text-sm font-medium text-gray-500">Total Sekolah</p>
				<p class="text-3xl font-bold text-gray-900 mt-1">{stats?.totalSekolah ?? 0}</p>
				<p class="text-xs text-gray-400 mt-1">Tenant terdaftar</p>
			</a>
			<a href="/dashboard/admin-sekolah" class="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
				<p class="text-sm font-medium text-gray-500">Admin Sekolah</p>
				<p class="text-3xl font-bold text-gray-900 mt-1">{stats?.totalAdminSekolah ?? 0}</p>
				<p class="text-xs text-gray-400 mt-1">Akun admin aktif</p>
			</a>
		</div>
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<a href="/dashboard/sekolah" class="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 transition-all group">
				<div class="flex items-center gap-3">
					<div class="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
						<svg class="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
						</svg>
					</div>
					<span class="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors">Tambah Sekolah Baru</span>
				</div>
			</a>
			<a href="/dashboard/admin-sekolah" class="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 transition-all group">
				<div class="flex items-center gap-3">
					<div class="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
						<svg class="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
						</svg>
					</div>
					<span class="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors">Kelola Admin Sekolah</span>
				</div>
			</a>
		</div>

	<!-- ADMIN SEKOLAH -->
	{:else if user.role === 'admin_sekolah'}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
			<a href="/dashboard/guru" class="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
				<p class="text-sm font-medium text-gray-500">Total Guru</p>
				<p class="text-3xl font-bold text-gray-900 mt-1">{stats?.totalGuru ?? 0}</p>
				<p class="text-xs text-gray-400 mt-1">Guru aktif di sekolah ini</p>
			</a>
			<a href="/dashboard/siswa" class="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
				<p class="text-sm font-medium text-gray-500">Total Siswa</p>
				<p class="text-3xl font-bold text-gray-900 mt-1">{stats?.totalSiswa ?? 0}</p>
				<p class="text-xs text-gray-400 mt-1">Siswa terdaftar</p>
			</a>
		</div>
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<a href="/dashboard/guru" class="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 transition-all group">
				<div class="flex items-center gap-3">
					<div class="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
						<svg class="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
						</svg>
					</div>
					<span class="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors">Tambah Guru Baru</span>
				</div>
			</a>
			<a href="/dashboard/siswa" class="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 transition-all group">
				<div class="flex items-center gap-3">
					<div class="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
						<svg class="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
						</svg>
					</div>
					<span class="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors">Tambah Siswa Baru</span>
				</div>
			</a>
		</div>

	<!-- GURU -->
	{:else if user.role === 'guru'}
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<a href="/dashboard/jurnal" class="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 transition-all group">
				<div class="flex items-center gap-3">
					<div class="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
						<svg class="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
						</svg>
					</div>
					<span class="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors">Isi Jurnal Mengajar</span>
				</div>
			</a>
			<a href="/dashboard/jadwal" class="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 transition-all group">
				<div class="flex items-center gap-3">
					<div class="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
						<svg class="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
						</svg>
					</div>
					<span class="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors">Lihat Jadwal Mengajar</span>
				</div>
			</a>
		</div>

	<!-- SISWA -->
	{:else if user.role === 'siswa'}
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<a href="/dashboard/jadwal" class="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 transition-all group">
				<div class="flex items-center gap-3">
					<div class="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
						<svg class="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
						</svg>
					</div>
					<span class="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors">Lihat Jadwal Pelajaran</span>
				</div>
			</a>
			<a href="/dashboard/pelanggaran" class="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 transition-all group">
				<div class="flex items-center gap-3">
					<div class="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
						<svg class="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
						</svg>
					</div>
					<span class="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors">Lihat Poin Pelanggaran</span>
				</div>
			</a>
		</div>
	{/if}
</div>
