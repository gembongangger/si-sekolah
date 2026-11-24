<script lang="ts">
	type DonutDatum = { label: string; value: number; color?: string };
	let { data = [], size = 140, centerLabel = '', centerValue = '' }: {
		data?: DonutDatum[];
		size?: number;
		centerLabel?: string;
		centerValue?: string;
	} = $props();

	const defaultColors = ['var(--primary)', 'var(--destructive)', 'var(--warning)', 'var(--info)', 'var(--success)'];

	const total = $derived(data.reduce((sum, d) => sum + d.value, 0));
	const arcs: { path: string; color: string; pct: number; label: string }[] = $derived((() => {
		if (total <= 0 || data.length === 0) return [];
		const cx = size / 2;
		const cy = size / 2;
		const rOuter = (size - 16) / 2;
		const rInner = rOuter * 0.55;
		let start = -90;
		const out: typeof arcs = [];
		data.forEach((d, i) => {
			const pct = d.value / total;
			const sweep = pct * 360;
			const end = start + sweep;
			const largeArc = sweep > 180 ? 1 : 0;
			const x1 = cx + rOuter * Math.cos((start * Math.PI) / 180);
			const y1 = cy + rOuter * Math.sin((start * Math.PI) / 180);
			const x2 = cx + rOuter * Math.cos((end * Math.PI) / 180);
			const y2 = cy + rOuter * Math.sin((end * Math.PI) / 180);
			const x3 = cx + rInner * Math.cos((end * Math.PI) / 180);
			const y3 = cy + rInner * Math.sin((end * Math.PI) / 180);
			const x4 = cx + rInner * Math.cos((start * Math.PI) / 180);
			const y4 = cy + rInner * Math.sin((start * Math.PI) / 180);
			const path = `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${largeArc} 0 ${x4} ${y4} Z`;
			out.push({ path, color: d.color ?? defaultColors[i % defaultColors.length], pct: Math.round(pct * 100), label: d.label });
			start = end;
		});
		return out;
	})());
</script>

<svg viewBox={`0 0 ${size} ${size}`} class="w-full h-auto" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Donut chart">
	{#each arcs as arc}
		<path d={arc.path} fill={arc.color} />
	{/each}
	<text x={size / 2} y={size / 2 - 6} text-anchor="middle" font-size="14" font-weight="700" fill="var(--foreground)">{centerValue}</text>
	{#if centerLabel}
		<text x={size / 2} y={size / 2 + 16} text-anchor="middle" font-size="10" fill="var(--muted-foreground)">{centerLabel}</text>
	{/if}
</svg>

{#if data.length > 0 && total > 0}
	<div class="mt-2 flex flex-wrap justify-center gap-4 text-xs">
		{#each arcs as arc}
			<span class="flex items-center gap-1.5">
				<span class="inline-block w-3 h-3 rounded" style="background-color: {arc.color}"></span>
				{arc.label} {arc.pct}%
			</span>
		{/each}
	</div>
{/if}