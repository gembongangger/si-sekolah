<script lang="ts">
	let { data, form }: any = $props();
</script>

{#if data?.hasBucket === false}
	<div class="p-4 bg-destructive text-destructive-foreground rounded">
		<p>STORAGE_BUCKET tidak tersedia di platform.env.</p>
	</div>
{:else}
	<div class="max-w-md p-6 bg-card rounded-xl border shadow-sm">
		<h2 class="text-lg font-bold mb-4">Test Upload R2</h2>

		<form method="POST" enctype="multipart/form-data">
			<label class="block mb-2 text-sm font-medium">File</label>
			<input
				type="file"
				name="file"
				class="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
			/>
			<button
				type="submit"
				class="mt-4 w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90"
			>
				Upload ke R2
			</button>
		</form>

		{#if form?.success}
			<div class="mt-4 p-3 bg-green-500/10 border border-green-500/20 text-green-700 rounded text-sm">
				<p class="font-medium">{form.message}</p>
				<p class="text-xs mt-1 opacity-80">Key: {form.key}</p>
				<p class="text-xs opacity-80">Ukuran: {form.size} bytes</p>
				<p class="text-xs opacity-80">Tipe: {form.type}</p>
				<a href={form.url} target="_blank" rel="noopener noreferrer" class="text-xs text-primary underline underline-offset-4">Buka file</a>
			</div>
		{:else if form?.error}
			<div class="mt-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded text-sm">
				<p class="font-medium">{form.error}</p>
			</div>
		{/if}
	</div>
{/if}