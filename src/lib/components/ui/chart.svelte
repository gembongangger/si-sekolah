<script lang="ts">
	import { onMount } from 'svelte';
	import { Chart, BarController, DoughnutController, BarElement, ArcElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

	Chart.register(BarController, DoughnutController, BarElement, ArcElement, CategoryScale, LinearScale, Tooltip, Legend);

	type Datum = { label: string; value: number; color?: string };
	let {
		type = 'bar',
		data = [],
		centerValue = '',
		centerLabel = '',
		className = ''
	}: {
		type?: 'bar' | 'doughnut';
		data?: Datum[];
		centerValue?: string;
		centerLabel?: string;
		className?: string;
	} = $props();

	let canvas: HTMLCanvasElement;
	let chart: Chart | undefined;

	const PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

	onMount(() => {
		chart = new Chart(canvas, {
			type: type === 'bar' ? 'bar' : 'doughnut',
			data: {
				labels: data.map((d) => d.label),
				datasets: [
					{
						data: data.map((d) => d.value),
						backgroundColor: data.map((d, i) => d.color ?? PALETTE[i % PALETTE.length]),
						borderRadius: type === 'bar' ? 6 : 0,
						borderWidth: type === 'doughnut' ? 0 : undefined,
						hoverOffset: type === 'doughnut' ? 6 : 0,
						barPercentage: 0.65,
						categoryPercentage: 0.8
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				animation: { duration: 500 },
				plugins: {
					legend: {
						display: type === 'doughnut',
						position: 'bottom',
						labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 8, padding: 12, font: { size: 11 } }
					},
					tooltip: { enabled: true, padding: 10, cornerRadius: 8 }
				},
				scales:
					type === 'bar'
						? {
								y: { beginAtZero: true, grid: { color: 'rgba(128,128,128,0.12)' }, ticks: { precision: 0, font: { size: 10 } } },
								x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 0, autoSkip: true } }
							}
						: undefined,
				cutout: type === 'doughnut' ? '68%' : undefined
			} as any
		});

		return () => chart?.destroy();
	});
</script>

<div class="relative h-full w-full {className}">
	<canvas bind:this={canvas}></canvas>
	{#if type === 'doughnut' && centerValue}
		<div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-8">
			<span class="text-lg font-bold text-foreground">{centerValue}</span>
			{#if centerLabel}<span class="text-[10px] text-muted-foreground">{centerLabel}</span>{/if}
		</div>
	{/if}
</div>