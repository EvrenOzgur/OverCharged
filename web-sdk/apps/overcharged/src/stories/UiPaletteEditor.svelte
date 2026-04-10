<script lang="ts">
	import { uiLayoutConfig, addPalette, removePalette, applyPalette } from '../game/uiLayoutConfig.svelte';
	import { pushSnapshot } from './editorHistory.svelte';

	let newName = $state('');
	let selectedPaletteId = $state<string | null>(null);

	const palettes = $derived(uiLayoutConfig.palettes ?? []);
	const selectedPalette = $derived(selectedPaletteId ? palettes.find((p) => p.id === selectedPaletteId) : null);

	function handleAdd() {
		const name = newName.trim() || `Palette ${palettes.length + 1}`;
		pushSnapshot('add palette');
		const p = addPalette(name);
		selectedPaletteId = p.id;
		newName = '';
	}

	function handleRemove(id: string) {
		pushSnapshot('remove palette');
		if (selectedPaletteId === id) selectedPaletteId = null;
		removePalette(id);
	}

	function handleApply(id: string) {
		pushSnapshot('apply palette');
		applyPalette(id);
	}
</script>

<div class="palette-editor">
	<header>
		<span class="title">Color Palettes</span>
	</header>

	<!-- Add new -->
	<div class="add-row">
		<input type="text" bind:value={newName} placeholder="Palette name..." class="name-input" />
		<button class="add-btn" onclick={handleAdd}>+</button>
	</div>

	<!-- Palette list -->
	{#each palettes as palette (palette.id)}
		<div
			class="palette-item"
			class:selected={selectedPaletteId === palette.id}
			class:active={uiLayoutConfig.activePaletteId === palette.id}
			onclick={() => selectedPaletteId = palette.id}
		>
			<div class="swatches">
				{#each Object.values(palette.colors) as color}
					<span class="swatch" style:background={color}></span>
				{/each}
			</div>
			<span class="palette-name">{palette.name}</span>
			<div class="palette-actions">
				<button class="apply-btn" onclick={(e) => { e.stopPropagation(); handleApply(palette.id); }}>Apply</button>
				<button class="del-btn" onclick={(e) => { e.stopPropagation(); handleRemove(palette.id); }}>&times;</button>
			</div>
		</div>
	{/each}

	<!-- Selected palette editor -->
	{#if selectedPalette}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="palette-detail" oninput={() => pushSnapshot('palette color')}>
			{#each Object.entries(selectedPalette.colors) as [key, color]}
				<div class="color-row">
					<label>{key}</label>
					<input type="color" value={color} onchange={(e) => { (selectedPalette.colors as any)[key] = (e.currentTarget as HTMLInputElement).value; }} />
					<input type="text" value={color} onchange={(e) => { (selectedPalette.colors as any)[key] = (e.currentTarget as HTMLInputElement).value; }} class="hex" />
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.palette-editor {
		position: fixed;
		bottom: 50px;
		left: 8px;
		width: 260px;
		max-height: 350px;
		overflow-y: auto;
		background: rgba(20, 20, 24, 0.96);
		color: #fff;
		border: 1px solid #e040fb;
		border-radius: 6px;
		padding: 10px;
		z-index: 9960;
		font-family: -apple-system, system-ui, sans-serif;
		font-size: 11px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
	}
	header { margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid #333; }
	.title { color: #e040fb; font-weight: 700; font-size: 12px; }
	.add-row { display: flex; gap: 4px; margin-bottom: 6px; }
	.name-input {
		flex: 1; background: #111; border: 1px solid #333; color: #fff;
		padding: 3px 6px; border-radius: 3px; font-size: 10px;
	}
	.add-btn {
		background: #333; color: #e040fb; border: 1px solid #e040fb;
		width: 22px; height: 22px; font-size: 14px; cursor: pointer; border-radius: 3px;
		display: flex; align-items: center; justify-content: center;
	}
	.palette-item {
		display: flex; align-items: center; gap: 4px; padding: 4px 6px;
		background: #1a1a1e; border: 1px solid #2a2a2e; border-radius: 3px;
		cursor: pointer; margin-bottom: 2px; transition: all 0.1s;
	}
	.palette-item:hover { border-color: #555; }
	.palette-item.selected { border-color: #e040fb; }
	.palette-item.active { background: #2a1a2e; }
	.swatches { display: flex; gap: 2px; flex-shrink: 0; }
	.swatch { width: 10px; height: 10px; border-radius: 2px; border: 1px solid #333; display: block; }
	.palette-name { flex: 1; font-size: 10px; color: #ccc; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.palette-actions { display: flex; gap: 2px; }
	.apply-btn {
		background: #2a2a2e; color: #e040fb; border: 1px solid #555;
		padding: 1px 5px; border-radius: 2px; font-size: 9px; cursor: pointer; font-weight: 600;
	}
	.apply-btn:hover { background: #e040fb; color: #111; }
	.del-btn { background: transparent; border: 0; color: #f44; font-size: 14px; cursor: pointer; }
	.palette-detail { border-top: 1px solid #333; padding-top: 6px; margin-top: 6px; display: flex; flex-direction: column; gap: 4px; }
	.color-row { display: grid; grid-template-columns: 70px 28px 1fr; gap: 4px; align-items: center; }
	.color-row label { color: #aaa; font-size: 10px; text-transform: capitalize; }
	.color-row input[type='color'] { width: 28px; height: 20px; border: 1px solid #333; border-radius: 2px; padding: 0; cursor: pointer; background: transparent; }
	.hex { background: #111; border: 1px solid #333; color: #fff; padding: 2px 4px; border-radius: 2px; font-size: 10px; font-family: monospace; }
</style>
