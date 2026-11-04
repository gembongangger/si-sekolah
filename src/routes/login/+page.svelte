<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters/zod4';
	import { loginSchema } from '$lib/validation/auth';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const { form, errors, message, enhance, submitting } = superForm(data.form, {
		validators: zodClient(loginSchema)
	});
</script>

<svelte:head>
	<title>Login — Sistem Informasi Sekolah</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
	<div class="w-full max-w-md">
		<!-- Header -->
		<div class="text-center mb-8">
			<div class="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
				<svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
			<h1 class="text-2xl font-bold text-gray-900">Sistem Informasi Sekolah</h1>
			<p class="text-sm text-gray-500 mt-1">Masuk untuk melanjutkan</p>
		</div>

		<!-- Card -->
		<div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 sm:p-8 w-full max-w-full sm:max-w-md">
			<!-- Error message dari server -->
			{#if $message}
				<div class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
					{$message}
				</div>
			{/if}

			<form method="POST" use:enhance>
				<!-- Email -->
				<div class="mb-4">
					<label for="email" class="block text-sm font-medium text-gray-700 mb-1.5">
						Email
					</label>
					<input
						id="email"
						name="email"
						type="email"
						autocomplete="email"
						bind:value={$form.email}
						class="w-full px-3.5 py-2.5 rounded-lg border text-sm transition-colors
							{$errors.email
							? 'border-red-400 focus:ring-red-500 focus:border-red-500'
							: 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}
							focus:outline-none focus:ring-2 focus:ring-opacity-20"
						placeholder="nama@sekolah.sch.id"
					/>
					{#if $errors.email}
						<p class="mt-1 text-xs text-red-600">{$errors.email}</p>
					{/if}
				</div>

				<!-- Password -->
				<div class="mb-6">
					<label for="password" class="block text-sm font-medium text-gray-700 mb-1.5">
						Password
					</label>
					<input
						id="password"
						name="password"
						type="password"
						autocomplete="current-password"
						bind:value={$form.password}
						class="w-full px-3.5 py-2.5 rounded-lg border text-sm transition-colors
							{$errors.password
							? 'border-red-400 focus:ring-red-500 focus:border-red-500'
							: 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}
							focus:outline-none focus:ring-2 focus:ring-opacity-20"
						placeholder="••••••••"
					/>
					{#if $errors.password}
						<p class="mt-1 text-xs text-red-600">{$errors.password}</p>
					{/if}
				</div>

				<!-- Submit -->
				<button
					type="submit"
					disabled={$submitting}
					class="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
						text-white text-sm font-medium rounded-lg transition-colors
						focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
				>
					{#if $submitting}
						<span class="inline-flex items-center gap-2">
							<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								/>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
								/>
							</svg>
							Memproses...
						</span>
					{:else}
						Masuk
					{/if}
				</button>
			</form>
		</div>
	</div>
</div>
