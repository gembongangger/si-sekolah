<script lang="ts">
	type BarDatum = { label: string; value: number };
	let { data = [], height = 100, barWidth = 22, gap = 10, color = 'var(--primary)', showValues = true, showLabels = true }: {
		data?: BarDatum[];
		height?: number;
		barWidth?: number;
		gap?: number;
		color?: string;
		showValues?: boolean;
		showLabels?: boolean;
	} = $props();

	const maxVal = $derived(Math.max(...data.map((d) => d.value), 1));
	const svgWidth = $derived(Math.max(1, data.length * (barWidth + gap) - gap));
</script>

<svg viewBox={`0 0 ${svgWidth} ${height + (showLabels ? 24 : 0)}`} class="w-full h-full" preserveAspectRatio="none" role="img" aria-label="Bar chart">
	{#each data as d, i}
		<rect
			x={i * (barWidth + gap)}
			y={height - (d.value / maxVal) * height}
			width={barWidth}
			height={(d.value / maxVal) * height}
			fill={color}
			rx="2"
		/>
		{#if showValues}
			<text
				x={i * (barWidth + gap) + barWidth / 2}
				y={height - (d.value / maxVal) * height - 6}
				text-anchor="middle"
				font-size="10"
				fill="var(--muted-foreground)"
				font-weight="600"
			>
				{d.value}
			</text>
		{/if}
		{#if showLabels}
			<text
				x={i * (barWidth + gap) + barWidth / 2}
				y={height + 16}
				text-anchor="middle"
				font-size="10"
				fill="var(--muted-foreground)"
			>
				{d.label}
			</text>
		{/if}
	{/each}
</svg>