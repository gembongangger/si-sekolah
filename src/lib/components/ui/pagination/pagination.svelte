<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import ChevronsLeft from '@lucide/svelte/icons/chevrons-left';
	import ChevronsRight from '@lucide/svelte/icons/chevrons-right';

	type Props = {
		page?: number;
		pageSize?: number;
		totalItems: number;
		pageSizeOptions?: number[];
		class?: string;
	};

	let {
		page = $bindable(1),
		pageSize = $bindable(10),
		totalItems,
		pageSizeOptions = [10, 25, 50],
		class: className = ''
	}: Props = $props();

	let totalPages = $derived(Math.max(1, Math.ceil(totalItems / pageSize)));
	let fromItem = $derived(totalItems === 0 ? 0 : (page - 1) * pageSize + 1);
	let toItem = $derived(Math.min(page * pageSize, totalItems));

	$effect(() => {
		if (page > totalPages) {
			page = totalPages;
		} else if (page < 1) {
			page = 1;
		}
	});
</script>

<div class="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border text-sm text-muted-foreground {className}">
	<div class="flex items-center gap-3 text-xs sm:text-sm">
		<span>
			Menampilkan <strong class="font-medium text-foreground">{fromItem}</strong>–<strong class="font-medium text-foreground">{toItem}</strong> dari <strong class="font-medium text-foreground">{totalItems}</strong> data
		</span>
		<div class="flex items-center gap-1.5 ml-2">
			<select
				bind:value={pageSize}
				onchange={() => (page = 1)}
				class="h-8 rounded-md border border-input bg-card px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
			>
				{#each pageSizeOptions as opt}
					<option value={opt}>{opt} / hal</option>
				{/each}
			</select>
		</div>
	</div>

	<div class="flex items-center gap-1.5">
		<Button
			variant="outline"
			size="sm"
			class="h-8 w-8 p-0"
			disabled={page <= 1}
			onclick={() => (page = 1)}
			title="Halaman pertama"
		>
			<ChevronsLeft class="w-4 h-4" />
		</Button>
		<Button
			variant="outline"
			size="sm"
			class="h-8 w-8 p-0"
			disabled={page <= 1}
			onclick={() => (page = Math.max(1, page - 1))}
			title="Sebelumnya"
		>
			<ChevronLeft class="w-4 h-4" />
		</Button>
		<span class="text-xs px-2 min-w-[5rem] text-center">
			Hal. <strong class="font-medium text-foreground">{page}</strong> / {totalPages}
		</span>
		<Button
			variant="outline"
			size="sm"
			class="h-8 w-8 p-0"
			disabled={page >= totalPages}
			onclick={() => (page = Math.min(totalPages, page + 1))}
			title="Selanjutnya"
		>
			<ChevronRight class="w-4 h-4" />
		</Button>
		<Button
			variant="outline"
			size="sm"
			class="h-8 w-8 p-0"
			disabled={page >= totalPages}
			onclick={() => (page = totalPages)}
			title="Halaman terakhir"
		>
			<ChevronsRight class="w-4 h-4" />
		</Button>
	</div>
</div>
