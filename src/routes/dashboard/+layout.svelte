<script lang="ts">
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: any } = $props();
	const { user } = data;

	// Navigasi sesuai role
	const navItems = $derived(() => {
		switch (user.role) {
			case 'superadmin':
				return [
					{ href: '/dashboard', label: 'Beranda', icon: 'home' },
					{ href: '/dashboard/sekolah', label: 'Kelola Sekolah', icon: 'building' },
					{ href: '/dashboard/admin-sekolah', label: 'Admin Sekolah', icon: 'users' }
				];
			case 'admin_sekolah':
				return [
					{ href: '/dashboard', label: 'Beranda', icon: 'home' },
					{ href: '/dashboard/guru', label: 'Kelola Guru', icon: 'user-tie' },
					{ href: '/dashboard/siswa', label: 'Kelola Siswa', icon: 'user-graduate' },
					{ href: '/dashboard/tahun-ajaran', label: 'Tahun Ajaran', icon: 'calendar' },
					{ href: '/dashboard/mata-pelajaran', label: 'Mata Pelajaran', icon: 'book-open' },
					{ href: '/dashboard/kelas', label: 'Kelas', icon: 'book' },
					{ href: '/dashboard/kelas/mapel', label: 'Kelas–Mapel–Guru', icon: 'share-2' },
					{ href: '/dashboard/jam-pelajaran', label: 'Jam Pelajaran', icon: 'clock' },
					{ href: '/dashboard/jadwal', label: 'Jadwal', icon: 'calendar' },
					{ href: '/dashboard/sanksi', label: 'Sanksi Poin', icon: 'alert-circle' },
					{ href: '/dashboard/pelanggaran', label: 'Pelanggaran', icon: 'exclamation' }
				];
			case 'guru':
				return [
					{ href: '/dashboard', label: 'Beranda', icon: 'home' },
					{ href: '/dashboard/jurnal', label: 'Jurnal Mengajar', icon: 'book-open' },
					{ href: '/dashboard/jadwal', label: 'Jadwal Saya', icon: 'calendar' },
					{ href: '/dashboard/siswa', label: 'Data Siswa', icon: 'users' }
				];
			case 'siswa':
				return [
					{ href: '/dashboard', label: 'Beranda', icon: 'home' },
					{ href: '/dashboard/jadwal', label: 'Jadwal Saya', icon: 'calendar' },
					{ href: '/dashboard/pelanggaran', label: 'Poin Saya', icon: 'exclamation' }
				];
			default:
				return [{ href: '/dashboard', label: 'Beranda', icon: 'home' }];
		}
	});

	const roleLabels: Record<string, string> = {
		superadmin: 'Superadmin',
		admin_sekolah: 'Admin Sekolah',
		guru: 'Guru',
		siswa: 'Siswa'
	};

	let sidebarOpen = $state(false);
</script>

<div class="min-h-screen bg-gray-100 flex">
	<!-- Sidebar -->
	<aside
		class="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200
			{sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-auto"
	>
		<!-- Logo & Nama Aplikasi -->
		<div class="flex items-center gap-3 px-6 py-5 border-b border-gray-200">
			<div class="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
				<svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 14l9-5-9-5-9 5 9 5z"
					/>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
					/>
				</svg>
			</div>
			<div class="min-w-0">
				<p class="text-sm font-bold text-gray-900 truncate">SIS</p>
				<p class="text-xs text-gray-500 truncate">Sistem Informasi Sekolah</p>
			</div>
		</div>

		<!-- Nav Items -->
		<nav class="px-3 py-4 flex-1 space-y-0.5">
			{#each navItems() as item}
				<a
					href={item.href}
					class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600
						hover:bg-gray-100 hover:text-gray-900 transition-colors"
				>
					<span class="w-4 h-4 opacity-60 text-center">•</span>
					{item.label}
				</a>
			{/each}
		</nav>

		<!-- User Footer -->
		<div class="border-t border-gray-200 px-4 py-4">
			<div class="flex items-center gap-3 mb-3">
				<div
					class="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm flex-shrink-0"
				>
					{user.name.charAt(0).toUpperCase()}
				</div>
				<div class="min-w-0 flex-1">
					<p class="text-sm font-medium text-gray-900 truncate">{user.name}</p>
					<p class="text-xs text-gray-500 truncate">{roleLabels[user.role] ?? user.role}</p>
				</div>
			</div>
			<form method="POST" action="/logout">
				<button
					type="submit"
					class="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50
						rounded-lg transition-colors flex items-center gap-2"
				>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
						/>
					</svg>
					Keluar
				</button>
			</form>
		</div>
	</aside>

	<!-- Overlay saat sidebar terbuka di mobile -->
	{#if sidebarOpen}
		<button
			class="fixed inset-0 z-40 bg-black/40 lg:hidden"
			onclick={() => (sidebarOpen = false)}
		/>
	{/if}

	<!-- Main Content -->
	<div class="flex-1 flex flex-col min-w-0">
		<!-- Top bar mobile -->
		<header class="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
			<button
				onclick={() => (sidebarOpen = !sidebarOpen)}
				class="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
			>
				<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
				</svg>
			</button>
			<span class="text-sm font-semibold text-gray-800">SIS</span>
		</header>

		<main class="flex-1 p-6">
			{@render children()}
		</main>
	</div>
</div>
